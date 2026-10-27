process.env.NODE_ENV = 'test';
const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Controlled Results Publication Tests', () => {

  before(async () => {
    await db.query("UPDATE elections SET status = 'CLOSED' WHERE id = 2");
    await db.query("DELETE FROM result_publications WHERE election_id = 2");
  });

  it('15. Results remain unpublished and confidential until approved by administrator', async () => {
    // Election 2 is CLOSED in seed data, but results have NOT been published
    const res = await request(app).get('/api/results/elections/2');

    // Public endpoint MUST reject access to unpublished results
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('not been published'));
    assert.strictEqual(res.body.data, undefined);
  });

  it('16. Results become publicly accessible only after explicit administrator certification and publication', async () => {
    // Admin logs in
    const adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .send({
        identifier: 'admin@securevote.demo',
        password: 'AdminPassword@123'
      });

    // Admin authorizes and publishes results for Election 2
    const publishRes = await adminAgent
      .post('/api/admin/elections/2/publish-results');

    assert.strictEqual(publishRes.status, 200);
    assert.strictEqual(publishRes.body.success, true);
    assert.ok(publishRes.body.data.candidates.length > 0);

    // Now, unauthenticated public user fetches results for Election 2
    const publicRes = await request(app).get('/api/results/elections/2');

    assert.strictEqual(publicRes.status, 200);
    assert.strictEqual(publicRes.body.success, true);
    assert.ok(publicRes.body.data.statistics);
    assert.strictEqual(publicRes.body.data.statistics.totalBallotsCast, 3);
    assert.ok(publicRes.body.data.candidates.length > 0);
    assert.ok(publicRes.body.data.candidates[0].voteSharePercentage >= 0);
    assert.ok(publicRes.body.data.winner !== undefined);
  });

});
