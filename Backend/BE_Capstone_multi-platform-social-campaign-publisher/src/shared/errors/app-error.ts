import { ERROR_STATUS, type ErrorType } from './error-types.js';

/**
 * Base error class for every deliberate error the application raises.
 * Carries an ErrorType (mapped to an HTTP status by the error-handler
 * middleware) plus optional machine-readable `details` for the client.
 * Never put secrets in `message` or `details` — both may be logged/returned.
 */
export class AppError extends Error {
  readonly type: ErrorType;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(type: ErrorType, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = type;
    this.type = type;
    this.status = ERROR_STATUS[type];
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('ValidationError', message, details);
  }
  static notFound(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('NotFoundError', message, details);
  }
  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('ConflictError', message, details);
  }
  static rateLimited(message: string, retryAfterSeconds: number): AppError {
    return new AppError('RateLimitError', message, { retryAfterSeconds });
  }
  static externalService(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('ExternalServiceError', message, details);
  }
  static webhookVerification(message: string): AppError {
    return new AppError('WebhookVerificationError', message);
  }
  static encryption(message: string): AppError {
    return new AppError('EncryptionError', message);
  }
  static scheduling(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('SchedulingError', message, details);
  }
}
