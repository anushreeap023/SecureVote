process.env.NODE_ENV = 'test';
const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { comparePassword } = require('../src/utils/hashing');
const db = require('../src/config/db');

describe('Authentication & Registration Tests', () => {

  it('1. Should reject voter registration with missing or invalid fields', async () => {
    // Missing required fields
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Test' });
    assert.strictEqual(res1.status, 400);

    // Invalid email
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Voter',
        demoVoterId: 'DEMO-TEST-1',
        email: 'invalid-email',
        mobileNumber: '+91 98765 00000',
        password: 'Password@123',
        termsAccepted: true
      });
    assert.strictEqual(res2.status, 400);

    // Password too short (< 8 chars)
    const res3 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Voter',
        demoVoterId: 'DEMO-TEST-2',
        email: 'shortpass@securevote.demo',
        mobileNumber: '+91 98765 00000',
        password: 'short',
        termsAccepted: true
      });
    assert.strictEqual(res3.status, 400);

    // Terms not accepted
    const res4 = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Voter',
        demoVoterId: 'DEMO-TEST-3',
        email: 'noterms@securevote.demo',
        mobileNumber: '+91 98765 00000',
        password: 'ValidPassword@123',
        termsAccepted: false
      });
    assert.strictEqual(res4.status, 400);
  });

  it('2. Should hash passwords securely using bcrypt', async () => {
    const rawPassword = 'SecureDemoPassword@2026';
    const uniqueEmail = `test_hash_${Date.now()}@securevote.demo`;
    const uniqueVoterId = `DEMO-HASH-${Date.now().toString().slice(-4)}`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Hash Test Voter',
        demoVoterId: uniqueVoterId,
        email: uniqueEmail,
        mobileNumber: '+91 98765 44332',
        password: rawPassword,
        preferredLanguage: 'en',
        termsAccepted: true
      });

    assert.strictEqual(res.status, 201);

    // Verify in database that plain text is NEVER stored
    const [user] = await db.query('SELECT password_hash FROM users WHERE email = ?', [uniqueEmail]);
    assert.ok(user);
    assert.notStrictEqual(user.password_hash, rawPassword);
    assert.ok(user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'));
    assert.strictEqual(comparePassword(rawPassword, user.password_hash), true);
  });

  it('3. Should authenticate successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'aarav@securevote.demo',
        password: 'VoterPassword@123'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.email, 'aarav@securevote.demo');
    assert.strictEqual(res.body.data.role, 'VOTER');

    // Also supports Demo Voter ID identifier login
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'DEMO-VOTER-101',
        password: 'VoterPassword@123'
      });

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.data.demoVoterId, 'DEMO-VOTER-101');
  });

  it('4. Should fail login with generic error message for invalid credentials', async () => {
    // Bad password
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'aarav@securevote.demo',
        password: 'WrongPassword@999'
      });

    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.body.success, false);
    assert.strictEqual(res1.body.message, 'Invalid email/voter ID or password.');

    // Non-existent user
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'nonexistent_user@securevote.demo',
        password: 'AnyPassword@123'
      });

    assert.strictEqual(res2.status, 400);
    // Generic error: Does not leak user existence!
    assert.strictEqual(res2.body.message, 'Invalid email/voter ID or password.');
  });

  it('5. Should handle session authorization correctly', async () => {
    // Unauthenticated GET /api/auth/me
    const res1 = await request(app).get('/api/auth/me');
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.data.authenticated, false);

    // Logged in session
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({
        identifier: 'admin@securevote.demo',
        password: 'AdminPassword@123'
      });

    const res2 = await agent.get('/api/auth/me');
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.data.authenticated, true);
    assert.strictEqual(res2.body.data.user.role, 'ADMIN');

    // Logout
    const logoutRes = await agent.post('/api/auth/logout');
    assert.strictEqual(logoutRes.status, 200);

    const res3 = await agent.get('/api/auth/me');
    assert.strictEqual(res3.body.data.authenticated, false);
  });

});
