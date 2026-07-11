export type ErrorCode =
  | 'bad_request'
  | 'validation_error'
  | 'not_found'
  | 'upstream_error'
  | 'internal_error';

/**
 * The one error type the app throws on purpose. The error-handling middleware
 * turns it into a consistent response envelope; everything else becomes a 500.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError('bad_request', 400, message, details);
  }
  static validation(message: string, details?: unknown): AppError {
    return new AppError('validation_error', 422, message, details);
  }
  static notFound(message = 'Not found'): AppError {
    return new AppError('not_found', 404, message);
  }
  static upstream(message: string, details?: unknown): AppError {
    return new AppError('upstream_error', 502, message, details);
  }
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}
