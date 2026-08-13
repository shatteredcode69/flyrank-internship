// src/modules/widgets/widgets.routes.js
//
// Authenticated admin API. Every read/write is scoped to req.user.id — that
// is the entire multi-tenant isolation guarantee, enforced at the
// repository layer (findByIdForUser / listForUser), not just in the UI.

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { Widgets } = require('../../db/repository');
const { validate, widgetSchema, widgetUpdateSchema } = require('../../utils/validation');
const { ApiError } = require('../../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

function serialize(widget) {
  return {
    id: widget.id,
    type: widget.type,
    title: widget.title,
    description: widget.description,
    fields: widget.fields,
    buttonText: widget.button_text,
    displayOptions: widget.display_options,
    version: widget.version,
    createdAt: widget.created_at,
    updatedAt: widget.updated_at,
  };
}

router.get('/', (req, res) => {
  res.json({ widgets: Widgets.listForUser(req.user.id).map(serialize) });
});

router.post('/', validate(widgetSchema), (req, res) => {
  const widget = Widgets.create({ userId: req.user.id, ...req.body });
  res.status(201).json({ widget: serialize(widget) });
});

router.get('/:id', (req, res, next) => {
  const widget = Widgets.findByIdForUser(req.params.id, req.user.id);
  if (!widget) return next(new ApiError(404, 'widget_not_found', 'No widget with that id for this account'));
  res.json({ widget: serialize(widget) });
});

router.patch('/:id', validate(widgetUpdateSchema), (req, res, next) => {
  const widget = Widgets.update(req.params.id, req.user.id, req.body);
  if (!widget) return next(new ApiError(404, 'widget_not_found', 'No widget with that id for this account'));
  res.json({ widget: serialize(widget) });
});

router.delete('/:id', (req, res, next) => {
  const deleted = Widgets.delete(req.params.id, req.user.id);
  if (!deleted) return next(new ApiError(404, 'widget_not_found', 'No widget with that id for this account'));
  res.status(204).end();
});

// The product's front door: one line the customer pastes into their site.
router.get('/:id/embed', (req, res, next) => {
  const widget = Widgets.findByIdForUser(req.params.id, req.user.id);
  if (!widget) return next(new ApiError(404, 'widget_not_found', 'No widget with that id for this account'));

  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const snippet = `<script src="${base}/widget/v1/widget.js" data-widget-id="${widget.id}" async></script>`;
  res.json({ snippet, widgetId: widget.id, configUrl: `${base}/public/widgets/${widget.id}/config` });
});

module.exports = router;
