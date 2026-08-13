/**
 * Centralized taxonomy of application errors (§18 of the build spec).
 * Each maps to a deliberate HTTP status in the error-handler middleware.
 */
export type ErrorType =
  | 'ValidationError'
  | 'AuthenticationError'
  | 'AuthorizationError'
  | 'NotFoundError'
  | 'ConflictError'
  | 'RateLimitError'
  | 'ExternalServiceError'
  | 'WebhookVerificationError'
  | 'EncryptionError'
  | 'SchedulingError';

export const ERROR_STATUS: Record<ErrorType, number> = {
  ValidationError: 400,
  AuthenticationError: 401,
  AuthorizationError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  RateLimitError: 429,
  ExternalServiceError: 502,
  WebhookVerificationError: 400,
  EncryptionError: 500,
  SchedulingError: 500,
};
