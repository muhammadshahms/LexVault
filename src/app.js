const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const env = require('./config/env');
const { setLocals } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Security & logging
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Body parsers — skip for Stripe webhook route
app.use((req, res, next) => {
  if (req.originalUrl === '/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use((req, res, next) => {
  if (req.originalUrl === '/billing/webhook') {
    next();
  } else {
    express.urlencoded({ extended: true })(req, res, next);
  }
});

// Method override for PUT/DELETE
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages
app.use(flash());

// Set locals (flash + user)
app.use(setLocals);
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// Routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const casesRoutes = require('./routes/cases.routes');
const clientsRoutes = require('./routes/clients.routes');
const deadlinesRoutes = require('./routes/deadlines.routes');
const billingRoutes = require('./routes/billing.routes');

// Root redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard/' + req.session.user.role);
  }
  res.redirect('/auth/login');
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/cases', casesRoutes);
app.use('/clients', clientsRoutes);
app.use('/deadlines', deadlinesRoutes);
app.use('/billing', billingRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
