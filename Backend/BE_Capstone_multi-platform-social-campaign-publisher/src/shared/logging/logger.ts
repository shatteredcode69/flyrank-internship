import pino from 'pino';
import { env } from '../../config/env.js';

/**
 * Structured logger. NEVER pass raw tokens, encryption keys, or webhook
 * secrets into `logger.*` calls — see docs/security.md. The redact list
 * below is a defense-in-depth backstop, not the only line of defense:
 * call sites must not construct log objects containing secret fields.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'token',
      'accessToken',
      'encryptedToken',
      'encryptionKey',
      'webhookSecret',
      '*.token',
      '*.accessToken',
      '*.encryptedToken',
      'req.headers.authorization',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

export type Logger = typeof logger;
