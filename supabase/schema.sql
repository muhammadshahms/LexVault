-- ═══════════════════════════════════════════════════════════
-- LexVault — Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Profiles Table ─────────────────────────────────────────
-- Extends Supabase auth.users with role and profile info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'attorney', 'client')),
  full_name TEXT NOT NULL,
  firm_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Cases Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trademark', 'patent', 'copyright', 'trade_secret')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'under_review', 'closed')),
  description TEXT,
  attorney_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  filing_date DATE,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Cases policies
CREATE POLICY "Admins can do everything with cases"
  ON cases FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Attorneys can view own cases"
  ON cases FOR SELECT
  USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can insert cases"
  ON cases FOR INSERT
  WITH CHECK (attorney_id = auth.uid());

CREATE POLICY "Attorneys can update own cases"
  ON cases FOR UPDATE
  USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can delete own cases"
  ON cases FOR DELETE
  USING (attorney_id = auth.uid());

CREATE POLICY "Clients can view assigned cases"
  ON cases FOR SELECT
  USING (client_id = auth.uid());

-- ── Subscriptions Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT CHECK (plan IN ('starter', 'pro', 'firm')),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cases_attorney_id ON cases(attorney_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
