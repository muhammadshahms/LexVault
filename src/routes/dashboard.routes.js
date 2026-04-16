const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { supabaseAdmin } = require('../config/supabase');

// Redirect to role-specific dashboard
router.get('/', requireAuth, (req, res) => {
  const role = req.session.user.role;
  res.redirect(`/dashboard/${role}`);
});

// Admin dashboard
router.get('/admin', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    // Fetch stats
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalCases } = await supabaseAdmin
      .from('cases')
      .select('*', { count: 'exact', head: true });

    const { count: activeSubs } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { count: upcomingDeadlines } = await supabaseAdmin
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .not('deadline', 'is', null)
      .gte('deadline', new Date().toISOString().split('T')[0])
      .lte('deadline', thirtyDaysFromNow.toISOString().split('T')[0]);

    // Recent cases
    const { data: recentCases } = await supabaseAdmin
      .from('cases')
      .select(`
        *,
        attorney:profiles!cases_attorney_id_fkey(full_name),
        client:profiles!cases_client_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // All users
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    res.render('dashboard/admin', {
      title: 'Admin Dashboard',
      layout: 'layouts/main',
      stats: {
        totalUsers: totalUsers || 0,
        totalCases: totalCases || 0,
        activeSubs: activeSubs || 0,
        upcomingDeadlines: upcomingDeadlines || 0
      },
      recentCases: recentCases || [],
      users: users || []
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.render('dashboard/admin', {
      title: 'Admin Dashboard',
      layout: 'layouts/main',
      stats: { totalUsers: 0, totalCases: 0, activeSubs: 0, upcomingDeadlines: 0 },
      recentCases: [],
      users: []
    });
  }
});

// Attorney dashboard
router.get('/attorney', requireAuth, requireRole('attorney'), async (req, res) => {
  try {
    const userId = req.session.user.id;

    const { count: myCases } = await supabaseAdmin
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('attorney_id', userId);

    const { count: openCases } = await supabaseAdmin
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('attorney_id', userId)
      .in('status', ['open', 'in_progress']);

    // Unique clients
    const { data: clientCases } = await supabaseAdmin
      .from('cases')
      .select('client_id')
      .eq('attorney_id', userId)
      .not('client_id', 'is', null);

    const activeClients = new Set((clientCases || []).map(c => c.client_id)).size;

    // Upcoming deadlines
    const fourteenDays = new Date();
    fourteenDays.setDate(fourteenDays.getDate() + 14);

    const { data: deadlineCases } = await supabaseAdmin
      .from('cases')
      .select(`*, client:profiles!cases_client_id_fkey(full_name)`)
      .eq('attorney_id', userId)
      .not('deadline', 'is', null)
      .gte('deadline', new Date().toISOString().split('T')[0])
      .lte('deadline', fourteenDays.toISOString().split('T')[0])
      .order('deadline', { ascending: true });

    const deadlines = (deadlineCases || []).map(c => {
      const daysLeft = Math.ceil((new Date(c.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      return { ...c, daysLeft };
    });

    // Recent cases
    const { data: recentCases } = await supabaseAdmin
      .from('cases')
      .select(`*, client:profiles!cases_client_id_fkey(full_name)`)
      .eq('attorney_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    res.render('dashboard/attorney', {
      title: 'Attorney Dashboard',
      layout: 'layouts/main',
      stats: {
        myCases: myCases || 0,
        openCases: openCases || 0,
        activeClients
      },
      deadlines,
      recentCases: recentCases || []
    });
  } catch (err) {
    console.error('Attorney dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.render('dashboard/attorney', {
      title: 'Attorney Dashboard',
      layout: 'layouts/main',
      stats: { myCases: 0, openCases: 0, activeClients: 0 },
      deadlines: [],
      recentCases: []
    });
  }
});

// Client dashboard
router.get('/client', requireAuth, requireRole('client'), async (req, res) => {
  try {
    const userId = req.session.user.id;

    const { data: myCases } = await supabaseAdmin
      .from('cases')
      .select(`
        *,
        attorney:profiles!cases_attorney_id_fkey(full_name, firm_name)
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    const casesWithDeadline = (myCases || []).map(c => {
      if (c.deadline) {
        c.daysLeft = Math.ceil((new Date(c.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      }
      return c;
    });

    const totalCases = casesWithDeadline.length;
    const openCases = casesWithDeadline.filter(c => ['open', 'in_progress'].includes(c.status)).length;
    const upcomingDeadlines = casesWithDeadline.filter(c => c.daysLeft && c.daysLeft <= 30 && c.daysLeft > 0).length;

    res.render('dashboard/client', {
      title: 'My Dashboard',
      layout: 'layouts/main',
      stats: { totalCases, openCases, upcomingDeadlines },
      cases: casesWithDeadline
    });
  } catch (err) {
    console.error('Client dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.render('dashboard/client', {
      title: 'My Dashboard',
      layout: 'layouts/main',
      stats: { totalCases: 0, openCases: 0, upcomingDeadlines: 0 },
      cases: []
    });
  }
});

// Admin — update user role
router.post('/admin/users/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'attorney', 'client'].includes(role)) {
      req.flash('error', 'Invalid role');
      return res.redirect('/dashboard/admin');
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (error) throw error;

    req.flash('success', 'User role updated');
    res.redirect('/dashboard/admin');
  } catch (err) {
    console.error('Update role error:', err);
    req.flash('error', 'Failed to update role');
    res.redirect('/dashboard/admin');
  }
});

module.exports = router;
