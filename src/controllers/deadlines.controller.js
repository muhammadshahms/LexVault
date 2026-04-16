const { supabaseAdmin } = require('../config/supabase');

// GET /deadlines
exports.listDeadlines = async (req, res) => {
  try {
    const user = req.session.user;

    let query = supabaseAdmin
      .from('cases')
      .select(`
        *,
        attorney:profiles!cases_attorney_id_fkey(id, full_name),
        client:profiles!cases_client_id_fkey(id, full_name)
      `)
      .not('deadline', 'is', null)
      .gte('deadline', new Date().toISOString().split('T')[0])
      .order('deadline', { ascending: true });

    if (user.role === 'attorney') {
      query = query.eq('attorney_id', user.id);
    } else if (user.role === 'client') {
      query = query.eq('client_id', user.id);
    }

    const { data: cases, error } = await query;
    if (error) throw error;

    const deadlines = (cases || []).map(c => {
      const now = new Date();
      const deadline = new Date(c.deadline);
      c.daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      if (c.daysLeft <= 7) c.urgency = 'critical';
      else if (c.daysLeft <= 14) c.urgency = 'warning';
      else if (c.daysLeft <= 30) c.urgency = 'upcoming';
      else c.urgency = 'normal';

      return c;
    });

    res.render('deadlines/index', {
      title: 'Deadlines',
      layout: 'layouts/main',
      deadlines
    });
  } catch (err) {
    console.error('List deadlines error:', err);
    req.flash('error', 'Failed to load deadlines');
    res.redirect('/dashboard/' + req.session.user.role);
  }
};
