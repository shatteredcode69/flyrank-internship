// src/modules/dashboard/dashboard.routes.js
const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { Widgets, Submissions } = require('../../db/repository');
const { ApiError } = require('../../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

// Cross-widget overview for the logged-in owner.
router.get('/overview', (req, res) => {
  res.json({ widgets: Submissions.overviewForUser(req.user.id) });
});

router.get('/widgets/:id/submissions', (req, res, next) => {
  const widget = Widgets.findByIdForUser(req.params.id, req.user.id);
  if (!widget) return next(new ApiError(404, 'widget_not_found', 'No widget with that id for this account'));

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const submissions = Submissions.listForWidget(widget.id, req.user.id, { limit, offset });
  res.json({ submissions });
});

router.get('/widgets/:id/stats', (req, res, next) => {
  const widget = Widgets.findByIdForUser(req.params.id, req.user.id);
  if (!widget) return next(new ApiError(404, 'widget_not_found', 'No widget with that id for this account'));

  const stats = Submissions.statsForWidget(widget.id, req.user.id);
  res.json({ widgetId: widget.id, ...stats });
});

module.exports = router;
