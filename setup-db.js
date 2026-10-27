const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { computeAuditHash, GENESIS_PREV_HASH } = require('../src/utils/hashing');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
  console.log('--- Initializing SecureVote Database ---');
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const databaseName = process.env.DB_NAME || 'securevote_db';

  console.log(`Connecting to MySQL server at ${host}:${port} as ${user}...`);
  const rootConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    dateStrings: true,
    timezone: 'Z'
  });

  // Read schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Creating database and executing schema.sql...');
  await rootConn.query(schemaSql);
  console.log('Schema executed successfully.');

  // Read seed.sql
  const seedPath = path.join(__dirname, 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  console.log('Applying seed data...');
  await rootConn.query(seedSql);
  console.log('Base seed applied.');

  // Now verify and compute cryptographic hash chain for initial audit logs
  console.log('Updating cryptographic audit log hashes...');
  const [logs] = await rootConn.query(
    'SELECT id, actor_id, election_id, event_type, event_data, created_at FROM securevote_db.audit_logs ORDER BY id ASC'
  );

  let prevHash = GENESIS_PREV_HASH;
  for (const log of logs) {
    let parsedData = log.event_data;
    try {
      if (typeof parsedData === 'string' && parsedData.trim().startsWith('{')) {
        parsedData = JSON.parse(parsedData);
      }
    } catch {
      // Keep as string
    }

    const currentHash = computeAuditHash(
      prevHash,
      log.actor_id,
      log.election_id,
      log.event_type,
      parsedData,
      log.created_at
    );

    await rootConn.query(
      'UPDATE securevote_db.audit_logs SET previous_hash = ?, current_hash = ? WHERE id = ?',
      [prevHash, currentHash, log.id]
    );

    prevHash = currentHash;
  }

  console.log(`Verified & linked ${logs.length} audit records in tamper-evident chain.`);
  await rootConn.end();
  console.log('--- Database Setup Completed Successfully! ---');
}

if (require.main === module) {
  setupDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database setup failed:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
