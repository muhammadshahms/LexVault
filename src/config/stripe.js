const Stripe = require('stripe');
const env = require('./env');

let stripe = null;

if (env.stripe.secretKey) {
  stripe = new Stripe(env.stripe.secretKey, {
    apiVersion: '2024-12-18.acacia'
  });
} else {
  console.warn('⚠️  Stripe secret key not configured — billing features disabled');
}

module.exports = stripe;
