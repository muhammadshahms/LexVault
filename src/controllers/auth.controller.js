const { supabase, supabaseAdmin } = require('../config/supabase');

// GET /auth/login
exports.loginPage = (req, res) => {
  res.render('auth/login', {
    title: 'Sign In',
    layout: 'layouts/auth'
  });
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Please provide email and password');
      return res.redirect('/auth/login');
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      req.flash('error', error.message);
      return res.redirect('/auth/login');
    }

    // Fetch user profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      req.flash('error', 'Profile not found. Please contact support.');
      return res.redirect('/auth/login');
    }

    // Set session
    req.session.user = {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
      fullName: profile.full_name,
      firmName: profile.firm_name,
      accessToken: data.session.access_token
    };

    req.flash('success', `Welcome back, ${profile.full_name}!`);
    return res.redirect(`/dashboard/${profile.role}`);
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An unexpected error occurred');
    return res.redirect('/auth/login');
  }
};

// GET /auth/register
exports.registerPage = (req, res) => {
  res.render('auth/register', {
    title: 'Create Account',
    layout: 'layouts/auth'
  });
};

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, password_confirm, role, firm_name } = req.body;

    // Validation
    if (!full_name || !email || !password || !role) {
      req.flash('error', 'All fields are required');
      return res.redirect('/auth/register');
    }

    if (password !== password_confirm) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/auth/register');
    }

    if (!['attorney', 'client'].includes(role)) {
      req.flash('error', 'Invalid role selected');
      return res.redirect('/auth/register');
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role
        }
      }
    });

    if (error) {
      req.flash('error', error.message);
      return res.redirect('/auth/register');
    }

    // Check if this is the first user — make them admin
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const finalRole = count === 0 ? 'admin' : role;

    // Insert profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name,
        role: finalRole,
        firm_name: firm_name || null
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      req.flash('error', 'Account created but profile setup failed. Please contact support.');
      return res.redirect('/auth/login');
    }

    if (finalRole === 'admin') {
      req.flash('success', 'Account created as Admin (first user). Please sign in.');
    } else {
      req.flash('success', 'Account created successfully! Please sign in.');
    }
    return res.redirect('/auth/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'An unexpected error occurred');
    return res.redirect('/auth/register');
  }
};

// POST /auth/logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/auth/login');
  });
};
