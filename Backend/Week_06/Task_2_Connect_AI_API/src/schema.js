const { z } = require('zod');

const inputSchema = z.object({
  text: z.string().min(1, "Text is required").max(2000, "Text exceeds 2000 characters limit")
});

const outputSchema = z.object({
  category: z.enum(['billing', 'bug', 'feature', 'other']),
  urgency: z.enum(['low', 'normal', 'high']),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1)
});

module.exports = { inputSchema, outputSchema };