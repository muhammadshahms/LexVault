const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabase');
const { sendDeadlineAlert } = require('./email.service');

/**
 * Start the deadline monitoring cron job
 * Runs daily at 8:00 AM — checks for cases with deadlines within 30/14/7 days
 */
function startDeadlineCron() {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running deadline check...');
    await checkDeadlines();
  });

  console.log('✅ Deadline cron job scheduled (daily at 8:00 AM)');
}

/**
 * Check all upcoming deadlines and send alerts
 */
async function checkDeadlines() {
  try {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    // Fetch cases with upcoming deadlines
    const { data: cases, error } = await supabaseAdmin
      .from('cases')
      .select(`
        *,
        attorney:profiles!cases_attorney_id_fkey(id, full_name, firm_name)
      `)
      .not('deadline', 'is', null)
      .gte('deadline', now.toISOString().split('T')[0])
      .lte('deadline', thirtyDays.toISOString().split('T')[0])
      .in('status', ['open', 'in_progress', 'under_review']);

    if (error) {
      console.error('Deadline check query error:', error);
      return;
    }

    if (!cases || cases.length === 0) {
      console.log('✅ No upcoming deadlines to alert on');
      return;
    }

    const alertThresholds = [30, 14, 7, 3, 1];

    for (const c of cases) {
      const deadline = new Date(c.deadline);
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      // Only send alerts at specific thresholds
      if (alertThresholds.includes(daysLeft)) {
        // Get attorney email via auth (we need to look it up)
        if (c.attorney) {
          // In a production app, you'd fetch the email from auth.users
          // For now, we just log it
          console.log(`📧 Alert: Case "${c.title}" has ${daysLeft} days until deadline (Attorney: ${c.attorney.full_name})`);
          // await sendDeadlineAlert(attorneyEmail, c.title, c.deadline, daysLeft);
        }
      }
    }

    console.log(`✅ Deadline check complete — ${cases.length} cases reviewed`);
  } catch (err) {
    console.error('Deadline check error:', err);
  }
}

module.exports = { startDeadlineCron, checkDeadlines };
