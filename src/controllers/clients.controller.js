const { supabaseAdmin } = require('../config/supabase');

// GET /clients
exports.listClients = async (req, res) => {
  try {
    const user = req.session.user;

    let clients = [];

    if (user.role === 'admin') {
      // Admin sees all clients
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('full_name');
      if (error) throw error;
      clients = data || [];
    } else if (user.role === 'attorney') {
      // Attorney sees clients from their cases
      const { data: cases } = await supabaseAdmin
        .from('cases')
        .select('client_id')
        .eq('attorney_id', user.id)
        .not('client_id', 'is', null);

      const clientIds = [...new Set((cases || []).map(c => c.client_id))];

      if (clientIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .in('id', clientIds)
          .order('full_name');
        if (error) throw error;
        clients = data || [];
      }
    }

    // Fetch case counts for each client
    for (let client of clients) {
      const { count } = await supabaseAdmin
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id);
      client.caseCount = count || 0;
    }

    res.render('clients/index', {
      title: 'Clients',
      layout: 'layouts/main',
      clients
    });
  } catch (err) {
    console.error('List clients error:', err);
    req.flash('error', 'Failed to load clients');
    res.redirect('/dashboard/' + req.session.user.role);
  }
};

// POST /cases/:id/assign-client
exports.assignClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_id } = req.body;

    const { error } = await supabaseAdmin
      .from('cases')
      .update({ client_id, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    req.flash('success', 'Client assigned to case');
    res.redirect(`/cases/${id}`);
  } catch (err) {
    console.error('Assign client error:', err);
    req.flash('error', 'Failed to assign client');
    res.redirect('/cases');
  }
};
