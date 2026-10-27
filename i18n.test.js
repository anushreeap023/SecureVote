process.env.NODE_ENV = 'test';
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Bilingual (English & Tamil) and Preference Tests', () => {

  it('18. Should support comprehensive English and Tamil localization files with matching keys', () => {
    const enPath = path.join(__dirname, '../locales/en.json');
    const taPath = path.join(__dirname, '../locales/ta.json');

    assert.ok(fs.existsSync(enPath), 'en.json must exist');
    assert.ok(fs.existsSync(taPath), 'ta.json must exist');

    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const ta = JSON.parse(fs.readFileSync(taPath, 'utf8'));

    // Check top level sections
    const requiredSections = [
      'brand', 'nav', 'home', 'common', 'election_status', 
      'voter_status', 'auth', 'voter', 'ballot', 'results', 
      'admin', 'monitoring', 'audit', 'security', 'analytics', 
      'settings', 'voters_mgmt', 'elections_mgmt', 'candidates_mgmt'
    ];

    requiredSections.forEach(section => {
      assert.ok(en[section], `English dictionary missing section: ${section}`);
      assert.ok(ta[section], `Tamil dictionary missing section: ${section}`);

      const enKeys = Object.keys(en[section]);
      const taKeys = Object.keys(ta[section]);

      // Every English key must have a corresponding Tamil translation key
      enKeys.forEach(k => {
        assert.ok(ta[section][k], `Tamil missing key in [${section}]: ${k}`);
        assert.ok(typeof ta[section][k] === 'string' && ta[section][k].length > 0, `Tamil translation for [${section}.${k}] cannot be empty`);
      });
    });

    // Check Tamil unicode characters are intact (contains Tamil range U+0B80–U+0BFF)
    const hasTamilCharacters = /[\u0B80-\u0BFF]/.test(ta.brand.name);
    assert.strictEqual(hasTamilCharacters, true, 'Tamil dictionary must contain valid UTF-8 Tamil characters');
  });

  it('19. Should persist user preferred language in database and session', async () => {
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'priya@securevote.demo',
        password: 'VoterPassword@123'
      });

    // Switch preferred language to Tamil ('ta')
    const patchRes = await voterAgent
      .patch('/api/auth/language')
      .send({ language: 'ta' });

    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.body.success, true);
    assert.strictEqual(patchRes.body.data.language, 'ta');

    // Verify session
    const meRes = await voterAgent.get('/api/auth/me');
    assert.strictEqual(meRes.body.data.user.preferredLanguage, 'ta');

    // Verify in database
    const [user] = await db.query('SELECT preferred_language FROM users WHERE email = ?', ['priya@securevote.demo']);
    assert.strictEqual(user.preferred_language, 'ta');

    // Switch back to 'en'
    const switchBack = await voterAgent
      .patch('/api/auth/language')
      .send({ language: 'en' });
    assert.strictEqual(switchBack.body.data.language, 'en');
  });

  it('20. Should reject invalid input and malformed language payloads safely', async () => {
    const voterAgent = request.agent(app);
    await voterAgent
      .post('/api/auth/login')
      .send({
        identifier: 'priya@securevote.demo',
        password: 'VoterPassword@123'
      });

    // Attempt invalid language
    const res1 = await voterAgent
      .patch('/api/auth/language')
      .send({ language: 'fr_FR' });

    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.body.success, false);

    // Malformed request
    const res2 = await voterAgent
      .patch('/api/auth/language')
      .send({});
    assert.strictEqual(res2.status, 400);
  });

});
