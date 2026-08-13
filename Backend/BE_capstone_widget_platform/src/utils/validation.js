// src/utils/validation.js
//
// Validation at the boundary: every request body is checked here BEFORE it
// touches a service or repository. Nothing downstream should ever need to
// re-check shape. Bad input -> clean 4xx JSON, never a 500.

const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const widgetFieldSchema = Joi.object({
  name: Joi.string().min(1).max(64).required(),
  label: Joi.string().min(1).max(128).required(),
  type: Joi.string().valid('text', 'email', 'tel', 'textarea', 'checkbox').required(),
  required: Joi.boolean().default(false),
});

const widgetSchema = Joi.object({
  type: Joi.string().valid('signup_form', 'cta_popover', 'contact_form').required(),
  title: Joi.string().min(1).max(120).required(),
  description: Joi.string().max(500).allow('', null),
  fields: Joi.array().items(widgetFieldSchema).min(1).max(20).required(),
  buttonText: Joi.string().max(40).default('Submit'),
  displayOptions: Joi.object({
    theme: Joi.string().valid('light', 'dark').default('light'),
    position: Joi.string().valid('bottom-right', 'bottom-left', 'center', 'inline').default('bottom-right'),
    allowedOrigins: Joi.array().items(Joi.string().uri()).default([]),
  }).default({}),
});

const widgetUpdateSchema = widgetSchema.fork(
  ['type', 'title', 'fields'],
  (s) => s.optional()
);

// Submission payload shape is dynamic (depends on the widget's own field
// list), so we validate structurally here — required-ness against the
// widget's actual fields is checked in the route handler, where the widget
// is already loaded.
const submissionSchema = Joi.object({
  data: Joi.object().pattern(Joi.string().max(64), Joi.alternatives(
    Joi.string().max(2000).allow(''),
    Joi.boolean(),
    Joi.number()
  )).required(),
  website: Joi.string().max(200).allow('').optional(), // honeypot field — humans leave it empty
  idempotencyKey: Joi.string().max(128).optional(),
}).required();

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Request body failed validation',
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  widgetSchema,
  widgetUpdateSchema,
  submissionSchema,
  validate,
};
