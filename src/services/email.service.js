const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

// Initialize transporter if SMTP is configured
if (env.smtp.host && env.smtp.user && env.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });
  console.log('✅ Email service configured');
} else {
  console.warn('⚠️  SMTP not configured — emails will be logged to console');
}

/**
 * Send a deadline alert email
 */
async function sendDeadlineAlert(to, caseName, deadline, daysLeft) {
  const subject = `⚠️ LexVault: Deadline approaching for "${caseName}"`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #534AB7 0%, #3C3489 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">⚖️ LexVault</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Deadline Alert</p>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1a1a2e; margin: 0 0 16px;">Case: ${caseName}</h2>
        <div style="background: ${daysLeft <= 7 ? '#fef2f2' : daysLeft <= 14 ? '#fffbeb' : '#f0fdf4'}; border-left: 4px solid ${daysLeft <= 7 ? '#ef4444' : daysLeft <= 14 ? '#f59e0b' : '#22c55e'}; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: 600; color: ${daysLeft <= 7 ? '#dc2626' : daysLeft <= 14 ? '#d97706' : '#16a34a'};">
            ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining
          </p>
          <p style="margin: 8px 0 0; color: #6b7280;">Deadline: ${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <p style="color: #6b7280; line-height: 1.6;">Please review this case and take any necessary action before the deadline.</p>
        <a href="#" style="display: inline-block; background: #534AB7; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px;">View Case →</a>
      </div>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html
    });
    console.log(`📧 Deadline alert sent to ${to} for case "${caseName}"`);
  } else {
    console.log(`📧 [STUB] Deadline alert for "${caseName}" → ${to} (${daysLeft} days left)`);
  }
}

/**
 * Send a generic notification email
 */
async function sendNotification(to, subject, html) {
  if (transporter) {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html
    });
  } else {
    console.log(`📧 [STUB] Email to ${to}: ${subject}`);
  }
}

module.exports = { sendDeadlineAlert, sendNotification };
