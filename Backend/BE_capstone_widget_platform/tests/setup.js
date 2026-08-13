// tests/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DEBUG_ENDPOINTS_ENABLED = 'true';
// Rate limit thresholds are intentionally NOT overridden here (they keep
// the code's real defaults: 20/min per IP, 60/min per widget) so ordinary
// functional tests never trip the limiter by accident. tests/rate-limit.test.js
// sets its own low threshold before requiring the app, since each test
// file gets a fresh, isolated module registry in Jest.
