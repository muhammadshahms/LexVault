/**
 * LexVault — Database Seed Script
 * Creates fake users, cases, and subscriptions for testing
 * 
 * Run: node src/seed.js
 */

const { supabaseAdmin } = require('./config/supabase');

// ── Fake Users ──────────────────────────────────────────────
const users = [
  { email: 'admin@lexvault.com', password: 'admin123', full_name: 'Sarah Mitchell', role: 'admin', firm_name: 'LexVault HQ' },
  { email: 'attorney1@lexvault.com', password: 'attorney123', full_name: 'James Carter', role: 'attorney', firm_name: 'Carter & Associates' },
  { email: 'attorney2@lexvault.com', password: 'attorney123', full_name: 'Elena Rodriguez', role: 'attorney', firm_name: 'Rodriguez IP Law' },
  { email: 'attorney3@lexvault.com', password: 'attorney123', full_name: 'David Kim', role: 'attorney', firm_name: 'Kim Legal Group' },
  { email: 'client1@lexvault.com', password: 'client123', full_name: 'Michael Johnson', role: 'client', firm_name: 'TechNova Inc.' },
  { email: 'client2@lexvault.com', password: 'client123', full_name: 'Lisa Wang', role: 'client', firm_name: 'Wang Enterprises' },
  { email: 'client3@lexvault.com', password: 'client123', full_name: 'Robert Brown', role: 'client', firm_name: 'Brown Industries' },
  { email: 'client4@lexvault.com', password: 'client123', full_name: 'Aisha Patel', role: 'client', firm_name: 'Patel Pharmaceuticals' },
];

// ── Helper: days from now ───────────────────────────────────
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// ── Main Seed Function ──────────────────────────────────────
async function seed() {
  console.log('\n⚖️  LexVault — Seeding Database...\n');

  // Step 1: Create users via Supabase Auth
  console.log('👤 Creating users...');
  const createdUsers = {};

  for (const user of users) {
    // Check if user already exists by trying to create
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: user.full_name, role: user.role }
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        console.log(`   ⚠️  ${user.email} already exists, fetching...`);
        // Fetch existing user
        const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers.find(u => u.email === user.email);
        if (existing) {
          createdUsers[user.role + '_' + user.email] = existing.id;
          // Make sure profile exists
          await supabaseAdmin.from('profiles').upsert({
            id: existing.id,
            full_name: user.full_name,
            role: user.role,
            firm_name: user.firm_name
          });
        }
        continue;
      }
      console.error(`   ❌ Failed to create ${user.email}:`, error.message);
      continue;
    }

    createdUsers[user.role + '_' + user.email] = data.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      full_name: user.full_name,
      role: user.role,
      firm_name: user.firm_name
    });

    if (profileError) {
      console.error(`   ❌ Profile error for ${user.email}:`, profileError.message);
    } else {
      console.log(`   ✅ ${user.role.padEnd(8)} — ${user.full_name} (${user.email})`);
    }
  }

  // Fetch all profiles for reference
  const { data: allProfiles } = await supabaseAdmin.from('profiles').select('*');
  const attorneys = allProfiles.filter(p => p.role === 'attorney');
  const clients = allProfiles.filter(p => p.role === 'client');

  if (attorneys.length === 0) {
    console.error('\n❌ No attorneys found. Cannot create cases.');
    return;
  }

  // Step 2: Create cases
  console.log('\n📁 Creating cases...');

  const cases = [
    // James Carter's cases
    { title: 'Apple Logo Trademark Registration', type: 'trademark', status: 'open', description: 'Filing trademark registration for the new Apple logo design across EU markets. Need to complete Madrid Protocol application and respond to office actions.', attorney_idx: 0, client_idx: 0, filing_date: daysAgo(45), deadline: daysFromNow(5) },
    { title: 'NeuralNet AI Patent Application', type: 'patent', status: 'in_progress', description: 'Utility patent for novel neural network architecture used in autonomous driving. Claims cover the specific layer configuration and training methodology.', attorney_idx: 0, client_idx: 0, filing_date: daysAgo(120), deadline: daysFromNow(12) },
    { title: 'CloudSync Software Copyright', type: 'copyright', status: 'under_review', description: 'Copyright registration for CloudSync enterprise software suite including source code, UI designs, and documentation.', attorney_idx: 0, client_idx: 1, filing_date: daysAgo(30), deadline: daysFromNow(45) },
    { title: 'QuantumChip Trade Secret Protection', type: 'trade_secret', status: 'open', description: 'Establishing trade secret safeguards for proprietary quantum computing chip manufacturing process. NDA framework for all employees and contractors.', attorney_idx: 0, client_idx: 0, filing_date: daysAgo(10), deadline: daysFromNow(90) },

    // Elena Rodriguez's cases
    { title: 'ByteFlow Trademark Opposition', type: 'trademark', status: 'in_progress', description: 'Opposition proceeding against similar trademark "ByteStream" filed by competitor in Class 9. Need to establish priority and likelihood of confusion.', attorney_idx: 1, client_idx: 1, filing_date: daysAgo(60), deadline: daysFromNow(3) },
    { title: 'BioFuel Process Patent', type: 'patent', status: 'open', description: 'International patent application for novel biofuel conversion process. PCT filing with designation in 12 countries.', attorney_idx: 1, client_idx: 2, filing_date: daysAgo(90), deadline: daysFromNow(21) },
    { title: 'MediaVault DRM Copyright', type: 'copyright', status: 'closed', description: 'Copyright registration for digital rights management system. Successfully registered with all supporting materials.', attorney_idx: 1, client_idx: 1, filing_date: daysAgo(180), deadline: daysAgo(30) },
    { title: 'SmartLens AR Patent Filing', type: 'patent', status: 'in_progress', description: 'Design and utility patent applications for augmented reality smart contact lens. Covers optical system and data display methodology.', attorney_idx: 1, client_idx: 3, filing_date: daysAgo(25), deadline: daysFromNow(60) },

    // David Kim's cases
    { title: 'GreenWave Energy Trademark', type: 'trademark', status: 'open', description: 'Federal trademark registration for "GreenWave" brand in energy sector. Comprehensive search completed, no conflicts found.', attorney_idx: 2, client_idx: 2, filing_date: daysAgo(15), deadline: daysFromNow(8) },
    { title: 'CryptoVault Security Patent', type: 'patent', status: 'under_review', description: 'Patent application for novel cryptocurrency cold storage solution with biometric authentication. Office action response pending.', attorney_idx: 2, client_idx: 2, filing_date: daysAgo(200), deadline: daysFromNow(14) },
    { title: 'Harmony Music App Copyright', type: 'copyright', status: 'in_progress', description: 'Copyright registration for AI-powered music composition application including algorithm documentation and user interface designs.', attorney_idx: 2, client_idx: 3, filing_date: daysAgo(40), deadline: daysFromNow(35) },
    { title: 'FlexiBoard Design Patent', type: 'patent', status: 'open', description: 'Design patent for innovative flexible keyboard with haptic feedback. Industrial design drawings and specifications prepared.', attorney_idx: 2, client_idx: 0, filing_date: daysAgo(5), deadline: daysFromNow(120) },

    // Additional cases for more data
    { title: 'RoboServe Trademark Renewal', type: 'trademark', status: 'open', description: 'Section 8 & 9 renewal filing for RoboServe trademark. Declaration of use and supporting specimens required.', attorney_idx: 0, client_idx: 2, filing_date: daysAgo(8), deadline: daysFromNow(2) },
    { title: 'NanoCoat Surface Treatment Patent', type: 'patent', status: 'in_progress', description: 'Continuation patent application for hydrophobic nanocoating technology. Building on parent application with additional claims.', attorney_idx: 1, client_idx: 3, filing_date: daysAgo(150), deadline: daysFromNow(28) },
    { title: 'DataMesh API Trade Secret', type: 'trade_secret', status: 'open', description: 'Trade secret classification and protection plan for proprietary data mesh API architecture. Employee training and access controls.', attorney_idx: 2, client_idx: 1, filing_date: daysAgo(20), deadline: daysFromNow(50) },
  ];

  for (const c of cases) {
    const attorney = attorneys[c.attorney_idx % attorneys.length];
    const client = clients[c.client_idx % clients.length];

    const { error } = await supabaseAdmin.from('cases').insert({
      title: c.title,
      type: c.type,
      status: c.status,
      description: c.description,
      attorney_id: attorney.id,
      client_id: client.id,
      filing_date: c.filing_date,
      deadline: c.deadline
    });

    if (error) {
      console.error(`   ❌ Case "${c.title}":`, error.message);
    } else {
      console.log(`   ✅ ${c.type.padEnd(12)} — ${c.title}`);
    }
  }

  // Step 3: Create subscriptions
  console.log('\n💳 Creating subscriptions...');

  const subscriptions = [
    { user_idx: 0, plan: 'firm', status: 'active' },     // Admin
    { user_idx: 1, plan: 'pro', status: 'active' },      // Attorney 1
    { user_idx: 2, plan: 'pro', status: 'active' },      // Attorney 2
    { user_idx: 3, plan: 'starter', status: 'active' },  // Attorney 3
  ];

  for (const sub of subscriptions) {
    const profile = allProfiles[sub.user_idx % allProfiles.length];
    
    const { error } = await supabaseAdmin.from('subscriptions').upsert({
      user_id: profile.id,
      stripe_customer_id: `cus_fake_${profile.id.substring(0, 8)}`,
      stripe_subscription_id: `sub_fake_${profile.id.substring(0, 8)}`,
      plan: sub.plan,
      status: sub.status,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    if (error) {
      console.error(`   ❌ Subscription for ${profile.full_name}:`, error.message);
    } else {
      console.log(`   ✅ ${sub.plan.padEnd(8)} — ${profile.full_name}`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Seed complete!\n');
  console.log('📧 Test accounts (all emails auto-confirmed):');
  console.log('');
  console.log('   Admin:');
  console.log('   admin@lexvault.com / admin123');
  console.log('');
  console.log('   Attorneys:');
  console.log('   attorney1@lexvault.com / attorney123');
  console.log('   attorney2@lexvault.com / attorney123');
  console.log('   attorney3@lexvault.com / attorney123');
  console.log('');
  console.log('   Clients:');
  console.log('   client1@lexvault.com / client123');
  console.log('   client2@lexvault.com / client123');
  console.log('   client3@lexvault.com / client123');
  console.log('   client4@lexvault.com / client123');
  console.log('═══════════════════════════════════════════════\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
