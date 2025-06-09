/**
 * Custom error classes for standardized error handling
 */

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      isOperational: this.isOperational
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(message: string, public readonly fields?: Record<string, string[]>) {
    super(message, { fields });
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly isOperational = true;

  constructor(message: string = 'Access denied') {
    super(message);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly isOperational = true;

  constructor(message: string = 'Rate limit exceeded', public readonly retryAfter?: number) {
    super(message, { retryAfter });
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
  readonly statusCode = 502;
  readonly isOperational = true;

  constructor(
    service: string, 
    message: string = 'External service unavailable',
    public readonly originalError?: Error
  ) {
    super(`${service}: ${message}`, { service, originalError: originalError?.message });
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = true;

  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Business logic error (422)
 */
export class BusinessLogicError extends AppError {
  readonly statusCode = 422;
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  static validation(message: string, fields?: Record<string, string[]>): ValidationError {
    return new ValidationError(message, fields);
  }

  static authentication(message?: string): AuthenticationError {
    return new AuthenticationError(message);
  }

  static authorization(message?: string): AuthorizationError {
    return new AuthorizationError(message);
  }

  static notFound(resource?: string): NotFoundError {
    return new NotFoundError(resource);
  }

  static conflict(message: string, context?: Record<string, any>): ConflictError {
    return new ConflictError(message, context);
  }

  static rateLimit(message?: string, retryAfter?: number): RateLimitError {
    return new RateLimitError(message, retryAfter);
  }

  static externalService(service: string, message?: string, originalError?: Error): ExternalServiceError {
    return new ExternalServiceError(service, message, originalError);
  }

  static database(message?: string, context?: Record<string, any>): DatabaseError {
    return new DatabaseError(message, context);
  }

  static internal(message?: string, context?: Record<string, any>): InternalServerError {
    return new InternalServerError(message, context);
  }

  static businessLogic(message: string, context?: Record<string, any>): BusinessLogicError {
    return new BusinessLogicError(message, context);
  }
}

/**
 * Check if an error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Extract error details for logging
 */
export function getErrorDetails(error: Error): {
  name: string;
  message: string;
  stack?: string;
  statusCode?: number;
  context?: Record<string, any>;
  isOperational?: boolean;
} {
  const details = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  if (error instanceof AppError) {
    return {
      ...details,
      statusCode: error.statusCode,
      context: error.context,
      isOperational: error.isOperational
    };
  }

  return details;
}

/**
 * Sanitize error for client response (remove sensitive information)
 */
export function sanitizeErrorForClient(error: Error): {
  message: string;
  statusCode: number;
  context?: Record<string, any>;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      context: error.context
    };
  }

  // For unknown errors, return generic message
  return {
    message: 'An unexpected error occurred',
    statusCode: 500
  };
}