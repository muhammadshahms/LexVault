const app = require('./app');
const env = require('./config/env');
const { startDeadlineCron } = require('./services/deadline.service');

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   ⚖️  LexVault — IP Case Management          ║
  ║                                              ║
  ║   Server running on http://localhost:${PORT}     ║
  ║   Environment: ${env.nodeEnv.padEnd(28)}║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);

  // Start deadline cron job
  startDeadlineCron();
});
