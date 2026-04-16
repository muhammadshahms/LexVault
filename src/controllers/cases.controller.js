const { supabaseAdmin } = require('../config/supabase');

// GET /cases
exports.listCases = async (req, res) => {
  try {
    const user = req.session.user;
    let query = supabaseAdmin.from('cases').select(`
      *,
      attorney:profiles!cases_attorney_id_fkey(id, full_name),
      client:profiles!cases_client_id_fkey(id, full_name)
    `).order('created_at', { ascending: false });

    // Role-based filtering
    if (user.role === 'attorney') {
      query = query.eq('attorney_id', user.id);
    } else if (user.role === 'client') {
      query = query.eq('client_id', user.id);
    }
    // Admin sees all

    // Apply search filter
    const search = req.query.search || '';
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply status filter
    const statusFilter = req.query.status || '';
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Apply type filter
    const typeFilter = req.query.type || '';
    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    const { data: cases, error } = await query;

    if (error) throw error;

    // Calculate days left for deadlines
    const casesWithDeadline = (cases || []).map(c => {
      if (c.deadline) {
        const now = new Date();
        const deadline = new Date(c.deadline);
        const diffTime = deadline - now;
        c.daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        c.daysLeft = null;
      }
      return c;
    });

    res.render('cases/index', {
      title: 'Cases',
      layout: 'layouts/main',
      cases: casesWithDeadline,
      search,
      statusFilter,
      typeFilter
    });
  } catch (err) {
    console.error('List cases error:', err);
    req.flash('error', 'Failed to load cases');
    res.redirect('/dashboard/' + req.session.user.role);
  }
};

// GET /cases/create
exports.createPage = async (req, res) => {
  try {
    // Fetch clients for assignment dropdown
    const { data: clients } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email:id')
      .eq('role', 'client')
      .order('full_name');

    // Fetch attorneys for admin
    const { data: attorneys } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'attorney')
      .order('full_name');

    res.render('cases/create', {
      title: 'New Case',
      layout: 'layouts/main',
      clients: clients || [],
      attorneys: attorneys || []
    });
  } catch (err) {
    console.error('Create page error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/cases');
  }
};

// POST /cases
exports.createCase = async (req, res) => {
  try {
    const user = req.session.user;
    const { title, type, description, client_id, attorney_id, filing_date, deadline } = req.body;

    if (!title || !type) {
      req.flash('error', 'Title and type are required');
      return res.redirect('/cases/create');
    }

    const caseData = {
      title,
      type,
      description: description || null,
      client_id: client_id || null,
      attorney_id: user.role === 'admin' ? (attorney_id || null) : user.id,
      filing_date: filing_date || null,
      deadline: deadline || null,
      status: 'open'
    };

    const { error } = await supabaseAdmin
      .from('cases')
      .insert(caseData);

    if (error) throw error;

    req.flash('success', 'Case created successfully');
    res.redirect('/cases');
  } catch (err) {
    console.error('Create case error:', err);
    req.flash('error', 'Failed to create case');
    res.redirect('/cases/create');
  }
};

// GET /cases/:id
exports.caseDetail = async (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    const { data: caseData, error } = await supabaseAdmin
      .from('cases')
      .select(`
        *,
        attorney:profiles!cases_attorney_id_fkey(id, full_name, firm_name),
        client:profiles!cases_client_id_fkey(id, full_name)
      `)
      .eq('id', id)
      .single();

    if (error || !caseData) {
      req.flash('error', 'Case not found');
      return res.redirect('/cases');
    }

    // Role-based access check
    if (user.role === 'attorney' && caseData.attorney_id !== user.id) {
      req.flash('error', 'Access denied');
      return res.redirect('/cases');
    }
    if (user.role === 'client' && caseData.client_id !== user.id) {
      req.flash('error', 'Access denied');
      return res.redirect('/cases');
    }

    // Calculate deadline info
    if (caseData.deadline) {
      const now = new Date();
      const deadline = new Date(caseData.deadline);
      caseData.daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    }

    res.render('cases/detail', {
      title: caseData.title,
      layout: 'layouts/main',
      caseData
    });
  } catch (err) {
    console.error('Case detail error:', err);
    req.flash('error', 'Failed to load case');
    res.redirect('/cases');
  }
};

// GET /cases/:id/edit
exports.editPage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const { data: caseData, error } = await supabaseAdmin
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !caseData) {
      req.flash('error', 'Case not found');
      return res.redirect('/cases');
    }

    // Only attorney who owns it or admin can edit
    if (user.role === 'attorney' && caseData.attorney_id !== user.id) {
      req.flash('error', 'Access denied');
      return res.redirect('/cases');
    }
    if (user.role === 'client') {
      req.flash('error', 'Clients cannot edit cases');
      return res.redirect('/cases');
    }

    const { data: clients } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'client')
      .order('full_name');

    const { data: attorneys } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'attorney')
      .order('full_name');

    res.render('cases/edit', {
      title: 'Edit Case',
      layout: 'layouts/main',
      caseData,
      clients: clients || [],
      attorneys: attorneys || []
    });
  } catch (err) {
    console.error('Edit page error:', err);
    req.flash('error', 'Failed to load case');
    res.redirect('/cases');
  }
};

// PUT /cases/:id
exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const { title, type, status, description, client_id, attorney_id, filing_date, deadline } = req.body;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('cases')
      .select('attorney_id')
      .eq('id', id)
      .single();

    if (user.role === 'attorney' && existing?.attorney_id !== user.id) {
      req.flash('error', 'Access denied');
      return res.redirect('/cases');
    }

    const updateData = {
      title,
      type,
      status,
      description: description || null,
      client_id: client_id || null,
      filing_date: filing_date || null,
      deadline: deadline || null,
      updated_at: new Date().toISOString()
    };

    if (user.role === 'admin' && attorney_id) {
      updateData.attorney_id = attorney_id;
    }

    const { error } = await supabaseAdmin
      .from('cases')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    req.flash('success', 'Case updated successfully');
    res.redirect(`/cases/${id}`);
  } catch (err) {
    console.error('Update case error:', err);
    req.flash('error', 'Failed to update case');
    res.redirect('/cases');
  }
};

// DELETE /cases/:id
exports.deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('cases')
      .select('attorney_id')
      .eq('id', id)
      .single();

    if (user.role === 'attorney' && existing?.attorney_id !== user.id) {
      req.flash('error', 'Access denied');
      return res.redirect('/cases');
    }

    const { error } = await supabaseAdmin
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) throw error;

    req.flash('success', 'Case deleted successfully');
    res.redirect('/cases');
  } catch (err) {
    console.error('Delete case error:', err);
    req.flash('error', 'Failed to delete case');
    res.redirect('/cases');
  }
};
