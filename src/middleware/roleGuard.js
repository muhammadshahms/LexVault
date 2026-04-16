/**
 * Role-based access control middleware
 * Usage: requireRole('admin', 'attorney')
 */

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in to access this page');
      return res.redirect('/auth/login');
    }

    const userRole = req.session.user.role;

    if (roles.includes(userRole)) {
      return next();
    }

    return res.status(403).render('error', {
      title: 'Access Denied',
      layout: 'layouts/main',
      statusCode: 403,
      message: 'You do not have permission to access this page.'
    });
  };
}

module.exports = { requireRole };
