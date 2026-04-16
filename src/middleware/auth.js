/**
 * Authentication middleware
 * Checks if user has an active session
 */

// Require authentication — redirect to login if not authenticated
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    // Make user available to all views
    res.locals.currentUser = req.session.user;
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  return res.redirect('/auth/login');
}

// Redirect if already authenticated — for login/register pages
function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    return res.redirect(`/dashboard/${role}`);
  }
  return next();
}

// Make user available globally (even if not required)
function setLocals(req, res, next) {
  res.locals.currentUser = req.session ? req.session.user || null : null;
  next();
}

module.exports = { requireAuth, redirectIfAuth, setLocals };
