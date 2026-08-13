// tests/side-effects.test.js
const request = require('supertest');
const { freshApp, registerAndLogin, createWidget } = require('./helpers');

describe('Safe side effects — email/webhook must never block the main path', () => {
  const app = freshApp();

  afterEach(async () => {
    // Always leave the toggle clean for the next test.
    await request(app).post('/debug/email/toggle').send({ status: 'up' });
  });

  test('submission succeeds and is stored even when the email side effect is forced to fail', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const toggle = await request(app).post('/debug/email/toggle').send({ status: 'down' });
    expect(toggle.status).toBe(200);

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: { email: 'resilient@example.com', name: 'Resilient Lead' } });

    expect(res.status).toBe(201);
    expect(res.body.submission.status).toBe('stored');

    const list = await request(app)
      .get(`/api/dashboard/widgets/${widget.id}/submissions`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.submissions.length).toBe(1);
    expect(list.body.submissions[0].email_sent).toBe(false);
  });

  test('debug endpoints are namespaced under /debug and report current status', async () => {
    const res = await request(app).get('/debug/status');
    expect(res.status).toBe(200);
    expect(res.body.providers).toEqual({ A: true, B: true });
  });
});
