// src/modules/public/public.routes.js
//
// The most-attacked surface in this codebase: requests arrive from browsers
// we don't control, on origins we didn't pick, from IPs that might be
// hostile. Nothing here is trusted until it's validated.
//
// Order of operations on the submission path mirrors the brief's
// architecture diagram exactly:
//   CORS -> validation -> rate limit -> spam check -> enrichment -> store -> side effect

const express = require('express');
const widgetCors = require('../../middleware/widgetCors');
const { perIpLimiter, perWidgetLimiter } = require('../../middleware/rateLimiter');
const { validate, submissionSchema } = require('../../utils/validation');
const { Submissions } = require('../../db/repository');
const { enrichIp } = require('../../services/geo.service');
const { sendConfirmation } = require('../../services/email.service');
const { ApiError } = require('../../middleware/errorHandler');

const router = express.Router();

function serializeConfig(widget) {
  return {
    id: widget.id,
    type: widget.type,
    title: widget.title,
    description: widget.description,
    fields: widget.fields,
    buttonText: widget.button_text,
    displayOptions: {
      theme: widget.display_options.theme,
      position: widget.display_options.position,
      // allowedOrigins deliberately NOT exposed — it's an internal allow-list, not client config.
    },
    version: widget.version,
  };
}

function getClientIp(req) {
  // Trusts X-Forwarded-For only because app.js sets `trust proxy` — see
  // README "Running behind a proxy" for why that's safe in this setup.
  return req.ip;
}

// ── GET /public/widgets/:id/config ──────────────────────────────────────
// Small, cacheable payload — the way a CDN would serve it. Short-lived
// cache because widget owners edit titles/fields and expect it to show up
// reasonably soon (contrast with the long-lived immutable widget.js bundle).
router.get('/widgets/:id/config', widgetCors, (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.setHeader('ETag', `"${req.widget.id}-v${req.widget.version}"`);
  res.json({ widget: serializeConfig(req.widget) });
});

// ── OPTIONS /public/widgets/:id/submissions (CORS preflight) ────────────
// Express auto-generates a bare 200 OPTIONS responder for any path that has
// OTHER method handlers registered, and it runs BEFORE route-specific
// middleware like widgetCors — which would silently skip our origin
// allow-list check on every preflight. Registering our own explicit
// OPTIONS route (using the same widgetCors middleware) overrides that
// default and makes the preflight answer honest.
router.options('/widgets/:id/submissions', widgetCors);

// ── POST /public/widgets/:id/submissions ────────────────────────────────
router.post(
  '/widgets/:id/submissions',
  widgetCors,
  perIpLimiter,
  perWidgetLimiter,
  validate(submissionSchema),
  async (req, res, next) => {
    try {
      const widget = req.widget;
      const { data, website, idempotencyKey } = req.body;

      // Idempotency: a client (or an automatic browser retry) re-sending
      // the exact same key against the same widget gets the ORIGINAL
      // stored result back, not a duplicate row.
      if (idempotencyKey) {
        const existing = Submissions.findByIdempotencyKey(widget.id, idempotencyKey);
        if (existing) {
          return res.status(200).json({ submission: { id: existing.id, status: 'already_recorded' } });
        }
      }

      // Honeypot spam control: a hidden field named "website" that real
      // visitors never see or fill. A bot filling every field fills this
      // one too. We accept the request (so the bot doesn't learn it was
      // caught) but never store it as a real lead and never fire side effects.
      const isSpam = !!(website && website.trim().length > 0);

      // Required-field check against the widget's OWN schema — this is
      // dynamic per widget, so it lives here rather than in the static Joi
      // schema, which only validates shape.
      if (!isSpam) {
        const missing = widget.fields
          .filter((f) => f.required && !String(data[f.name] ?? '').trim())
          .map((f) => f.name);
        if (missing.length > 0) {
          throw new ApiError(400, 'missing_required_fields', 'Required fields are missing', { missing });
        }
      }

      const ip = getClientIp(req);
      const geo = isSpam ? null : await enrichIp(ip);

      const submission = Submissions.create({
        widgetId: widget.id,
        userId: widget.user_id,
        data,
        ip,
        country: geo?.country || null,
        city: geo?.city || null,
        geoProvider: geo?.provider || null,
        isSpam,
        idempotencyKey,
      });

      if (!isSpam) {
        // Safe side effect: awaited so tests can assert on it, but its own
        // try/catch guarantees it can never throw into this handler.
        const sent = await sendConfirmation(submission, widget);
        Submissions.markEmailSent(submission.id, sent);
      }

      res.status(201).json({
        submission: {
          id: submission.id,
          status: isSpam ? 'discarded' : 'stored',
          enriched: !!geo,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
