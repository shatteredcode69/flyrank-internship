// src/middleware/widgetCors.js
//
// This is the "public API security" heart of the capstone: a request from
// a browser on ANY origin must be able to load config and submit a form,
// UNLESS the widget owner has locked it down to a specific allow-list
// (display_options.allowedOrigins). Handles the preflight OPTIONS request
// manually so both the "allowed" and "disallowed" demo probes are explicit.

const { Widgets } = require('../db/repository');
const { ApiError } = require('./errorHandler');

function widgetCors(req, res, next) {
  const widget = Widgets.findById(req.params.id);
  if (!widget) {
    // Still answer preflight politely; the real request will 404.
    if (req.method === 'OPTIONS') return res.status(404).end();
    return next(new ApiError(404, 'widget_not_found', `No widget with id ${req.params.id}`));
  }

  const origin = req.headers.origin;
  const allowList = widget.display_options?.allowedOrigins;
  const hasAllowList = Array.isArray(allowList) && allowList.length > 0;
  const isAllowed = !hasAllowList || (origin && allowList.includes(origin));

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Idempotency-Key');
  res.setHeader('Access-Control-Max-Age', '86400');

  req.widget = widget;

  if (req.method === 'OPTIONS') {
    return res.status(isAllowed ? 204 : 403).end();
  }

  if (!isAllowed) {
    return res.status(403).json({
      error: 'origin_not_allowed',
      message: `Origin "${origin}" is not on this widget's allow-list`,
    });
  }

  next();
}

module.exports = widgetCors;
