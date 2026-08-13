// tests/submissions.test.js
const request = require('supertest');
const { freshApp, registerAndLogin, createWidget } = require('./helpers');

describe('Public submission endpoint — validation & spam', () => {
  const app = freshApp();

  test('stores a valid submission', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: { email: 'lead@example.com', name: 'Lead' } });

    expect(res.status).toBe(201);
    expect(res.body.submission.status).toBe('stored');
  });

  test('rejects a submission missing a required field with clean 400', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token); // email is required

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: { name: 'No Email Here' } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('missing_required_fields');
    expect(res.body.details.missing).toContain('email');
  });

  test('rejects a malformed payload (data not an object) with clean 400', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: 'this-should-be-an-object' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  test('rejects an oversized payload with 413, never a 500', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const hugeString = 'x'.repeat(20_000); // > the 10kb body limit
    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: { email: 'lead@example.com', name: hugeString } });

    expect(res.status).toBe(413);
    expect(res.body.error).toBe('payload_too_large');
  });

  test('silently discards a submission with a filled honeypot field', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);

    const res = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: { email: 'bot@example.com', name: 'Bot' }, website: 'http://spammy-bot-fill.com' });

    // Accepted at the transport level (bot gets no signal it was caught)...
    expect(res.status).toBe(201);
    expect(res.body.submission.status).toBe('discarded');

    // ...but never appears in the owner's real submission list.
    const list = await request(app)
      .get(`/api/dashboard/widgets/${widget.id}/submissions`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.submissions.length).toBe(0);
  });

  test('idempotency key prevents duplicate storage on retry', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);
    const idempotencyKey = 'retry-key-123';

    const first = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: { email: 'retry@example.com' }, idempotencyKey });
    expect(first.status).toBe(201);

    const retry = await request(app)
      .post(`/public/widgets/${widget.id}/submissions`)
      .send({ data: { email: 'retry@example.com' }, idempotencyKey });
    expect(retry.status).toBe(200);
    expect(retry.body.submission.id).toBe(first.body.submission.id);
    expect(retry.body.submission.status).toBe('already_recorded');

    const list = await request(app)
      .get(`/api/dashboard/widgets/${widget.id}/submissions`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.submissions.length).toBe(1); // not 2
  });
});
