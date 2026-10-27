process.env.NODE_ENV = 'test';
const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { verifyAuditChain } = require('../src/services/audit.service');
const db = require('../src/config/db');

describe('Cryptographic Audit Chain Integrity Tests', () => {

  it('17. Should verify SHA-256 audit hash-chain and detect any unauthorized block tampering', async () => {
    // 1. Initial verification must be valid
    const initialCheck = await verifyAuditChain();
    assert.strictEqual(initialCheck.isValid, true);
    assert.strictEqual(initialCheck.brokenAtId, null);
    assert.ok(initialCheck.totalRecords > 0);

    // 2. Simulate tampering with a block's event_data in the database directly
    const [latestLog] = await db.query('SELECT id, event_data FROM audit_logs ORDER BY id DESC LIMIT 1');
    const originalData = latestLog.event_data;
    const tamperedData = '{"TAMPERED_INJECTION": true, "unauthorized_change": 9999}';

    await db.query('UPDATE audit_logs SET event_data = ? WHERE id = ?', [tamperedData, latestLog.id]);

    // 3. Chain verification must now FAIL and pinpoint the exact tampered record ID
    const compromisedCheck = await verifyAuditChain();
    assert.strictEqual(compromisedCheck.isValid, false);
    assert.strictEqual(compromisedCheck.brokenAtId, latestLog.id);
    assert.ok(compromisedCheck.message.includes('Tampering detected') || compromisedCheck.message.includes('mismatch'));

    // 4. Restore original block data to preserve database integrity
    await db.query('UPDATE audit_logs SET event_data = ? WHERE id = ?', [originalData, latestLog.id]);

    // 5. Verification must pass again
    const restoredCheck = await verifyAuditChain();
    assert.strictEqual(restoredCheck.isValid, true);
    assert.strictEqual(restoredCheck.brokenAtId, null);
  });

});
