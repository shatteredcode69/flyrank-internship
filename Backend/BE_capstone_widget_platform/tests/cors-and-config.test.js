// tests/cors-and-config.test.js
const request = require('supertest');
const { freshApp, registerAndLogin, createWidget } = require('./helpers');

describe('Public config delivery + CORS', () => {
  const app = freshApp();

  test('serves widget config publicly, no auth required', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const res = await request(app).get(`/public/widgets/${widget.id}/config`);
    expect(res.status).toBe(200);
    expect(res.body.widget.id).toBe(widget.id);
    expect(res.body.widget.fields.length).toBe(2);
  });

  test('config response carries short-lived cache headers', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const res = await request(app).get(`/public/widgets/${widget.id}/config`);
    expect(res.headers['cache-control']).toMatch(/max-age=60/);
    expect(res.headers['etag']).toBeDefined();
  });

  test('404s cleanly for a non-existent widget', async () => {
    const res = await request(app).get('/public/widgets/does-not-exist/config');
    expect(res.status).toBe(404);
  });

  test('handles CORS preflight (OPTIONS) on the submission endpoint', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const res = await request(app)
      .options(`/public/widgets/${widget.id}/submissions`)
      .set('Origin', 'https://acme-bakery.example.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://acme-bakery.example.com');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  test('allows cross-origin submission when no allow-list is configured (default: open)', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .set('Origin', 'https://any-random-site.example.com')
      .send({ data: { email: 'visitor@example.com', name: 'Visitor' } });

    expect(res.status).toBe(201);
    expect(res.headers['access-control-allow-origin']).toBe('https://any-random-site.example.com');
  });

  test('blocks a disallowed origin when the widget has an allow-list', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token, {
      displayOptions: { allowedOrigins: ['https://trusted-partner.example.com'] },
    });

    const preflight = await request(app)
      .options(`/public/widgets/${widget.id}/submissions`)
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'POST');
    expect(preflight.status).toBe(403);

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .set('Origin', 'https://evil.example.com')
      .send({ data: { email: 'visitor@example.com' } });
    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('allows a listed origin when the widget has an allow-list', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token, {
      displayOptions: { allowedOrigins: ['https://trusted-partner.example.com'] },
    });

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .set('Origin', 'https://trusted-partner.example.com')
      .send({ data: { email: 'visitor@example.com' } });
    expect(res.status).toBe(201);
  });
});
