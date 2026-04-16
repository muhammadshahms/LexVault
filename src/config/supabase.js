const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Public client — uses anon key, respects RLS
const supabase = createClient(env.supabase.url, env.supabase.anonKey);

// Admin client — uses service role key, bypasses RLS
const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceKey);

module.exports = { supabase, supabaseAdmin };
