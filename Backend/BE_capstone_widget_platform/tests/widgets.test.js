// tests/widgets.test.js
const request = require('supertest');
const { freshApp, registerAndLogin, createWidget } = require('./helpers');

describe('Auth', () => {
  const app = freshApp();

  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@test.dev', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({ email: 'dupe@test.dev', password: 'password123' });
    const res = await request(app).post('/api/auth/register').send({ email: 'dupe@test.dev', password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('rejects malformed registration payload with clean 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  test('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({ email: 'login@test.dev', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.dev', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send({ email: 'wrongpw@test.dev', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'wrongpw@test.dev', password: 'nope12345' });
    expect(res.status).toBe(401);
  });
});

describe('Widget management API', () => {
  const app = freshApp();

  test('rejects unauthenticated widget creation', async () => {
    const res = await request(app).post('/api/widgets').send({ type: 'signup_form', title: 'X', fields: [] });
    expect(res.status).toBe(401);
  });

  test('creates a widget for an authenticated user', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);
    expect(widget.id).toBeDefined();
    expect(widget.title).toBe('Test Widget');
  });

  test('rejects invalid widget payload (missing required fields array)', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app)
      .post('/api/widgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'signup_form', title: 'Bad Widget' }); // missing `fields`
    expect(res.status).toBe(400);
  });

  test('returns the embed snippet for an owned widget', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);
    const res = await request(app).get(`/api/widgets/${widget.id}/embed`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.snippet).toContain('<script');
    expect(res.body.snippet).toContain(widget.id);
  });

  test('multi-tenant isolation: tenant B cannot read tenant A\'s widget', async () => {
    const tenantA = await registerAndLogin(app);
    const tenantB = await registerAndLogin(app);
    const widget = await createWidget(app, tenantA.token);

    const res = await request(app).get(`/api/widgets/${widget.id}`).set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(404); // never leaks existence to the wrong tenant
  });

  test('multi-tenant isolation: tenant B cannot delete tenant A\'s widget', async () => {
    const tenantA = await registerAndLogin(app);
    const tenantB = await registerAndLogin(app);
    const widget = await createWidget(app, tenantA.token);

    const res = await request(app).delete(`/api/widgets/${widget.id}`).set('Authorization', `Bearer ${tenantB.token}`);
    expect(res.status).toBe(404);

    // still visible to the real owner -> proves it wasn't actually deleted
    const check = await request(app).get(`/api/widgets/${widget.id}`).set('Authorization', `Bearer ${tenantA.token}`);
    expect(check.status).toBe(200);
  });

  test('tenant A only ever lists their own widgets', async () => {
    const tenantA = await registerAndLogin(app);
    const tenantB = await registerAndLogin(app);
    await createWidget(app, tenantA.token, { title: 'A1' });
    await createWidget(app, tenantB.token, { title: 'B1' });

    const res = await request(app).get('/api/widgets').set('Authorization', `Bearer ${tenantA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.widgets.length).toBe(1);
    expect(res.body.widgets[0].title).toBe('A1');
  });
});
