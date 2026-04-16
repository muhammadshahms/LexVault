const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { requireAuth } = require('../middleware/auth');

// Webhook needs raw body — handled separately in app.js
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.webhook);

// Protected routes
router.get('/plans', requireAuth, billingController.plansPage);
router.post('/checkout', requireAuth, billingController.createCheckout);
router.get('/success', requireAuth, billingController.successPage);

module.exports = router;
