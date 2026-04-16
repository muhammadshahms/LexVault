const stripe = require('../config/stripe');
const env = require('../config/env');

/**
 * Create a Stripe checkout session
 */
async function createCheckoutSession({ priceId, userId, email, successUrl, cancelUrl, plan }) {
  if (!stripe) throw new Error('Stripe is not configured');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    customer_email: email,
    metadata: { plan, userId }
  });

  return session;
}

/**
 * Verify a webhook signature
 */
function verifyWebhook(payload, sig) {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.webhooks.constructEvent(payload, sig, env.stripe.webhookSecret);
}

/**
 * Get subscription details for a customer
 */
async function getSubscription(subscriptionId) {
  if (!stripe) return null;
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 */
async function cancelSubscription(subscriptionId) {
  if (!stripe) throw new Error('Stripe is not configured');
  return await stripe.subscriptions.cancel(subscriptionId);
}

module.exports = { createCheckoutSession, verifyWebhook, getSubscription, cancelSubscription };
