// src/app.js
//
// Composition root: wires middleware and routers together. No business
// logic lives here — this file's only job is plumbing, so the whole
// request pipeline is readable top to bottom in one place.

require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const widgetsRoutes = require('./modules/widgets/widgets.routes');
const publicRoutes = require('./modules/public/public.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const debugRoutes = require('./modules/debug/debug.routes');

function createApp() {
  const app = express();

  // Needed so req.ip reflects X-Forwarded-For when running behind a proxy
  // (e.g. in Docker/production). Safe here because rate limiting keys off
  // req.ip only — see README "Running behind a proxy".
  app.set('trust proxy', true);

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // 10kb cap enforces the "oversized payload -> clean 4xx" requirement at
  // the transport layer, before any handler code runs.
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // Versioned static bundle: /widget/v1/widget.js. Long, immutable cache —
  // a NEW version means a new URL (v2), never a mutated v1 file.
  app.use(
    '/widget/v1',
    express.static(path.join(__dirname, '..', 'public', 'widget', 'v1'), {
      setHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/widgets', widgetsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/public', publicRoutes);

  // Demo-only chaos toggles — never mounted in production, regardless of
  // how DEBUG_ENDPOINTS_ENABLED is set in the environment.
  const debugEnabled = process.env.NODE_ENV !== 'production' && process.env.DEBUG_ENDPOINTS_ENABLED !== 'false';
  if (debugEnabled) {
    app.use('/debug', debugRoutes);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
