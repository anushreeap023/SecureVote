const app = require('./app');
const db = require('./config/db');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  console.log('========================================================');
  console.log('  SecureVote — Secure Online Voting Prototype');
  console.log('  Educational Democratic Simulation Architecture');
  console.log('========================================================');

  // Verify DB connection
  const isDbConnected = await db.testConnection();
  if (!isDbConnected) {
    console.error('CRITICAL: Cannot connect to MySQL/MariaDB database.');
    console.error('Please ensure MySQL is running (e.g. XAMPP MySQL) and .env is configured.');
    process.exit(1);
  }

  console.log('Database connection pool established successfully.');

  const server = app.listen(PORT, () => {
    console.log(`Server actively listening at: http://localhost:${PORT}`);
    console.log('Frontend & API routes are ready.');
    console.log('--------------------------------------------------------');
    console.log('Pre-configured Demo Accounts:');
    console.log('1. Admin: admin@securevote.demo (Password: AdminPassword@123)');
    console.log('2. Voter: aarav@securevote.demo (Password: VoterPassword@123)');
    console.log('3. Voter (Tamil): priya@securevote.demo (Password: VoterPassword@123)');
    console.log('--------------------------------------------------------');
    console.log('Strict Disclaimer: Educational Simulation Only.');
    console.log('========================================================');
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down SecureVote server gracefully...');
    server.close(async () => {
      try {
        const pool = db.getPool();
        await pool.end();
        console.log('Database connection pool terminated.');
      } catch (err) {
        console.error('Error closing pool:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start SecureVote server:', err);
  process.exit(1);
});
