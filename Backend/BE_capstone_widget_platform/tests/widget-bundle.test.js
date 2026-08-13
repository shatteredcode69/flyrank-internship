// tests/widget-bundle.test.js
const request = require('supertest');
const { freshApp } = require('./helpers');

describe('Versioned widget.js bundle delivery', () => {
  const app = freshApp();

  test('serves the widget bundle with long, immutable cache headers and open CORS', async () => {
    const res = await request(app).get('/widget/v1/widget.js');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.headers['cache-control']).toMatch(/immutable/);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.text).toContain('data-widget-id');
  });

  test('bundle fetches config and wires a submit handler (structural smoke check)', async () => {
    const res = await request(app).get('/widget/v1/widget.js');
    expect(res.text).toContain('/public/widgets/');
    expect(res.text).toContain('/submissions');
    expect(res.text).toContain("addEventListener('submit'");
  });
});
