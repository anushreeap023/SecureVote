process.env.NODE_ENV = 'test';
const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Role-Based Authorization Tests', () => {

  it('6. Voter cannot access admin management endpoints (Strict RBAC)', async () => {
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'priya@securevote.demo',
        password: 'VoterPassword@123'
      });

    // Attempting to access admin analytics
    const res1 = await voterAgent.get('/api/admin/analytics/overview');
    assert.strictEqual(res1.status, 403);
    assert.strictEqual(res1.body.success, false);

    // Attempting to access voter approvals
    const res2 = await voterAgent.get('/api/admin/voters');
    assert.strictEqual(res2.status, 403);

    // Attempting to create an election
    const res3 = await voterAgent
      .post('/api/admin/elections')
      .send({ title: 'Illegal Election' });
    assert.strictEqual(res3.status, 403);

    // Attempting to access audit logs
    const res4 = await voterAgent.get('/api/admin/audit-logs');
    assert.strictEqual(res4.status, 403);
  });

  it('7. Admin can access authorized management endpoints', async () => {
    const adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .send({
        identifier: 'admin@securevote.demo',
        password: 'AdminPassword@123'
      });

    const resOverview = await adminAgent.get('/api/admin/analytics/overview');
    assert.strictEqual(resOverview.status, 200);
    assert.strictEqual(resOverview.body.success, true);
    assert.ok(resOverview.body.data.voters);

    const resVoters = await adminAgent.get('/api/admin/voters');
    assert.strictEqual(resVoters.status, 200);
    assert.strictEqual(resVoters.body.success, true);

    const resAudit = await adminAgent.get('/api/admin/audit-logs');
    assert.strictEqual(resAudit.status, 200);
    assert.strictEqual(resAudit.body.success, true);
  });

  it('13. Public unauthenticated users cannot retrieve live monitoring results', async () => {
    const res = await request(app).get('/api/admin/elections/1/monitoring');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('14. Logged-in voters cannot retrieve admin-only live monitoring results', async () => {
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'aarav@securevote.demo',
        password: 'VoterPassword@123'
      });

    const res = await voterAgent.get('/api/admin/elections/1/monitoring');
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

});
