/**
 * Global error handler middleware
 */

function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again later.'
    : err.message;

  res.status(statusCode).render('error', {
    title: 'Error',
    layout: req.session && req.session.user ? 'layouts/main' : 'layouts/auth',
    statusCode,
    message
  });
}

// 404 handler
function notFoundHandler(req, res, next) {
  res.status(404).render('error', {
    title: 'Page Not Found',
    layout: req.session && req.session.user ? 'layouts/main' : 'layouts/auth',
    statusCode: 404,
    message: 'The page you are looking for does not exist.'
  });
}

module.exports = { errorHandler, notFoundHandler };
