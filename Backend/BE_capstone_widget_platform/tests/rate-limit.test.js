// tests/rate-limit.test.js
//
// This file gets its own isolated module registry (Jest's default), so
// setting a low limit here before requiring the app does NOT leak into
// other test files — they keep the real production defaults.
process.env.RATE_LIMIT_IP_MAX = '5';
process.env.RATE_LIMIT_IP_WINDOW_MS = '60000';

const request = require('supertest');
const { freshApp, registerAndLogin, createWidget } = require('./helpers');
const { _resetAllBuckets } = require('../src/middleware/rateLimiter');
describe('Rate limiting', () => {
  const app = freshApp();

  beforeEach(() => _resetAllBuckets());

  test('a burst beyond the per-IP limit gets 429s, and legitimate traffic keeps flowing after', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);
    const limit = Number(process.env.RATE_LIMIT_IP_MAX); // 5

    const results = [];
    for (let i = 0; i < limit + 3; i++) {
      const res = await request(app)
        .post(`/public/widgets/${widget.id}/submissions`)
        .send({ data: { email: `burst${i}@example.com` } });
      results.push(res.status);
    }

    const successCount = results.filter((s) => s === 201).length;
    const limitedCount = results.filter((s) => s === 429).length;

    expect(successCount).toBe(limit);
    expect(limitedCount).toBe(3);

    // The service itself must stay up — a follow-up request to a totally
    // different, unrelated route still works fine.
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
  });

  test('429 response includes a Retry-After header', async () => {
    const { token } = await registerAndLogin(app);
    const widget = await createWidget(app, token);
    const limit = Number(process.env.RATE_LIMIT_IP_MAX);

    let last;
    for (let i = 0; i < limit + 1; i++) {
      last = await request(app)
        .post(`/public/widgets/${widget.id}/submissions`)
        .send({ data: { email: `x${i}@example.com` } });
    }
    expect(last.status).toBe(429);
    expect(last.headers['retry-after']).toBeDefined();
  });
});
