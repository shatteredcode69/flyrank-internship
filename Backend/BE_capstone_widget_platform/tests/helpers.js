// tests/helpers.js
const request = require('supertest');
const initDb = require('../src/db/init');
const createApp = require('../src/app');

function freshApp() {
  initDb();
  return createApp();
}

async function registerAndLogin(app, email = `user-${Date.now()}-${Math.random()}@test.dev`) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123' });
  return { token: res.body.token, user: res.body.user };
}

async function createWidget(app, token, overrides = {}) {
  const res = await request(app)
    .post('/api/widgets')
    .set('Authorization', `Bearer ${token}`)
    .send({
      type: 'signup_form',
      title: 'Test Widget',
      fields: [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'name', label: 'Name', type: 'text', required: false },
      ],
      ...overrides,
    });
  return res.body.widget;
}

module.exports = { freshApp, registerAndLogin, createWidget };
