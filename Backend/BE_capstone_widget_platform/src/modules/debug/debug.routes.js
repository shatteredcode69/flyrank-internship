// src/modules/debug/debug.routes.js
//
// Exists for exactly one reason: brief §13 ("The final demo") asks you to
// kill a geo provider and break the email side effect LIVE, without editing
// code or restarting the server. These toggles make that a 5-second curl
// instead of a redeploy. Hard-disabled in production regardless of the
// DEBUG_ENDPOINTS_ENABLED flag — see app.js for the guard.

const express = require('express');
const { setProviderStatus, getProviderStatus } = require('../../services/geo.service');
const { setForcedFailure, getForcedFailure } = require('../../services/email.service');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    providers: getProviderStatus(),
    emailForcedFailure: getForcedFailure(),
  });
});

router.post('/providers/:name/toggle', (req, res) => {
  const name = req.params.name.toUpperCase();
  const { status } = req.body; // 'up' | 'down'
  if (!['A', 'B'].includes(name)) {
    return res.status(400).json({ error: 'invalid_provider', message: 'Provider must be A or B' });
  }
  if (!['up', 'down'].includes(status)) {
    return res.status(400).json({ error: 'invalid_status', message: 'status must be "up" or "down"' });
  }
  setProviderStatus(name, status === 'up');
  res.json({ provider: name, status });
});

router.post('/email/toggle', (req, res) => {
  const { status } = req.body; // 'up' | 'down'
  if (!['up', 'down'].includes(status)) {
    return res.status(400).json({ error: 'invalid_status', message: 'status must be "up" or "down"' });
  }
  setForcedFailure(status === 'down');
  res.json({ email: status });
});

module.exports = router;
