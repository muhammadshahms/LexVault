require('dotenv').config();

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'SESSION_SECRET'
];

// Validate required environment variables
const missing = requiredVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables:\n   ${missing.join('\n   ')}\n`);
  console.error('   Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET,

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      starter: process.env.STRIPE_STARTER_PRICE_ID || '',
      pro: process.env.STRIPE_PRO_PRICE_ID || '',
      firm: process.env.STRIPE_FIRM_PRICE_ID || ''
    }
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@lexvault.com'
  }
};
