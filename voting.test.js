process.env.NODE_ENV = 'test';
const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Voting & Duplicate-Vote Prevention Tests', () => {

  before(async () => {
    await db.query("UPDATE elections SET status = 'OPEN' WHERE id = 1");
    await db.query("UPDATE elections SET status = 'CLOSED' WHERE id = 2");
    await db.query("UPDATE elections SET status = 'SCHEDULED' WHERE id = 4");
    await db.query("INSERT IGNORE INTO voter_elections (voter_id, election_id, has_voted, voted_at) VALUES (2, 1, 1, NOW())");
  });

  it('8. Should reject duplicate voting attempts by the same voter', async () => {
    // Voter 2 (Aarav) already has a recorded vote for Election 1 in seed data
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'aarav@securevote.demo',
        password: 'VoterPassword@123'
      });

    // Attempt to submit a second vote for Election 1
    const res = await voterAgent
      .post('/api/elections/1/vote')
      .send({ candidateId: 2 });

    // Must be rejected
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'DUPLICATE_VOTE');
  });

  it('9. Should reject voting before election opening (SCHEDULED election)', async () => {
    // Election 4 is SCHEDULED
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'priya@securevote.demo',
        password: 'VoterPassword@123'
      });

    const res = await voterAgent
      .post('/api/elections/4/vote')
      .send({ candidateId: 1 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('not permitted') || res.body.message.includes('status is SCHEDULED'));
  });

  it('10. Should reject voting after election closing (CLOSED election)', async () => {
    // Election 2 is CLOSED
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'priya@securevote.demo',
        password: 'VoterPassword@123'
      });

    const res = await voterAgent
      .post('/api/elections/2/vote')
      .send({ candidateId: 4 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('not permitted') || res.body.message.includes('status is CLOSED'));
  });

  it('11. Should reject invalid candidate selection (Candidate does not belong to election)', async () => {
    // Election 1 has candidates 1, 2, 3. Candidate 6 belongs to Election 3!
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'priya@securevote.demo',
        password: 'VoterPassword@123'
      });

    const res = await voterAgent
      .post('/api/elections/1/vote')
      .send({ candidateId: 6 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Invalid candidate selection'));
  });

  it('12. Should safely process vote submission and block concurrent duplicate submissions', async () => {
    // Register a brand new approved voter for testing concurrent casting
    const uniqueEmail = `concurrent_voter_${Date.now()}@securevote.demo`;
    const uniqueVoterId = `DEMO-CONC-${Date.now().toString().slice(-4)}`;

    const insertResult = await db.query(
      `INSERT INTO users (full_name, demo_voter_id, email, mobile_number, password_hash, role, approval_status, preferred_language, created_at)
       VALUES (?, ?, ?, '+91 99999 11111', '$2a$10$q5rEjIfiABJ9ePpYL.VEsO.nDAjQrnjVBY2VEcDLQS5mCHISHP2qC', 'VOTER', 'approved', 'en', NOW())`,
      ['Concurrent Test Voter', uniqueVoterId, uniqueEmail]
    );

    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: uniqueEmail,
        password: 'VoterPassword@123'
      });

    // Send two simultaneous vote requests
    const [vote1, vote2] = await Promise.all([
      voterAgent.post('/api/elections/1/vote').send({ candidateId: 1 }),
      voterAgent.post('/api/elections/1/vote').send({ candidateId: 2 })
    ]);

    // Exactly one must succeed (201) and the other must be rejected (409 duplicate)
    const statuses = [vote1.status, vote2.status];
    assert.ok(statuses.includes(201), 'One request should succeed');
    assert.ok(statuses.includes(409), 'The duplicate request must be blocked');

    // Verify database: only ONE participation record exists for this voter in this election
    const participations = await db.query(
      'SELECT COUNT(*) AS total FROM voter_elections WHERE voter_id = ? AND election_id = 1',
      [insertResult.insertId]
    );
    assert.strictEqual(participations[0].total, 1);
  });

});
