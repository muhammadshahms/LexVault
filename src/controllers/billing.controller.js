const { supabaseAdmin } = require('../config/supabase');
const stripe = require('../config/stripe');
const env = require('../config/env');

// GET /billing/plans
exports.plansPage = async (req, res) => {
  try {
    const user = req.session.user;

    // Fetch current subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    res.render('billing/plans', {
      title: 'Subscription Plans',
      layout: 'layouts/main',
      currentPlan: subscription ? subscription.plan : null,
      subscription
    });
  } catch (err) {
    console.error('Plans page error:', err);
    req.flash('error', 'Failed to load plans');
    res.redirect('/dashboard/' + req.session.user.role);
  }
};

// POST /billing/checkout
exports.createCheckout = async (req, res) => {
  try {
    if (!stripe) {
      req.flash('error', 'Billing is not configured');
      return res.redirect('/billing/plans');
    }

    const { plan } = req.body;
    const user = req.session.user;

    const priceMap = {
      starter: env.stripe.prices.starter,
      pro: env.stripe.prices.pro,
      firm: env.stripe.prices.firm
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      req.flash('error', 'Invalid plan selected');
      return res.redirect('/billing/plans');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.protocol}://${req.get('host')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/billing/plans`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { plan, userId: user.id }
    });

    res.redirect(session.url);
  } catch (err) {
    console.error('Checkout error:', err);
    req.flash('error', 'Failed to create checkout session');
    res.redirect('/billing/plans');
  }
};

// GET /billing/success
exports.successPage = (req, res) => {
  res.render('billing/success', {
    title: 'Subscription Active',
    layout: 'layouts/main'
  });
};

// POST /billing/webhook
exports.webhook = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, env.stripe.webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const plan = session.metadata.plan;

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          plan,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id' });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 'inactive',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook handler failed');
  }
};
