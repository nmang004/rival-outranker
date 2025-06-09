import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { 
  AppError, 
  ValidationError, 
  isOperationalError, 
  getErrorDetails, 
  sanitizeErrorForClient 
} from '../utils/errors';
import { logger } from '../utils/logging';
import { isDevelopment } from '../utils/common';

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error with context
  const errorDetails = getErrorDetails(err);
  const requestContext = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    requestId: (req as any).requestId
  };

  // Log error based on severity
  if (isOperationalError(err)) {
    logger.warn('Operational error occurred', {
      error: err,
      ...requestContext,
      ...errorDetails
    });
  } else {
    logger.error('Unexpected error occurred', {
      error: err,
      ...requestContext,
      ...errorDetails
    });
  }

  // Handle specific error types
  if (err instanceof ZodError) {
    handleZodError(err, res);
    return;
  }

  if (err instanceof AppError) {
    handleAppError(err, res);
    return;
  }

  // Handle database errors
  if (isDatabaseError(err)) {
    handleDatabaseError(err, res);
    return;
  }

  // Handle validation errors from other sources
  if (isValidationError(err)) {
    handleValidationError(err, res);
    return;
  }

  // Handle unexpected errors
  handleUnexpectedError(err, res);
}

/**
 * Handle Zod validation errors
 */
function handleZodError(err: ZodError, res: Response): void {
  const validationError = fromZodError(err);
  
  const fields: Record<string, string[]> = {};
  err.issues.forEach(issue => {
    const path = issue.path.join('.');
    if (!fields[path]) {
      fields[path] = [];
    }
    fields[path].push(issue.message);
  });

  res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: {
      type: 'validation_error',
      message: validationError.message,
      fields
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle application-specific errors
 */
function handleAppError(err: AppError, res: Response): void {
  const sanitized = sanitizeErrorForClient(err);
  
  res.status(sanitized.statusCode).json({
    success: false,
    error: sanitized.message,
    details: {
      type: err.constructor.name.toLowerCase(),
      context: sanitized.context
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle database errors
 */
function handleDatabaseError(err: Error, res: Response): void {
  // Don't expose internal database errors to clients
  res.status(500).json({
    success: false,
    error: 'Database operation failed',
    details: {
      type: 'database_error',
      ...(isDevelopment() && { originalMessage: err.message })
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle validation errors from other sources
 */
function handleValidationError(err: Error, res: Response): void {
  res.status(400).json({
    success: false,
    error: err.message || 'Validation failed',
    details: {
      type: 'validation_error'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle unexpected errors
 */
function handleUnexpectedError(err: Error, res: Response): void {
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    details: {
      type: 'internal_server_error',
      ...(isDevelopment() && { 
        originalMessage: err.message,
        stack: err.stack 
      })
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Check if error is a database error
 */
function isDatabaseError(err: Error): boolean {
  const dbErrorMessages = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'connection terminated',
    'database',
    'relation does not exist',
    'column does not exist',
    'duplicate key value',
    'foreign key constraint',
    'check constraint'
  ];

  const errorMessage = err.message.toLowerCase();
  return dbErrorMessages.some(msg => errorMessage.includes(msg));
}

/**
 * Check if error is a validation error
 */
function isValidationError(err: Error): boolean {
  const validationKeywords = [
    'validation',
    'invalid',
    'required',
    'must be',
    'expected',
    'constraint'
  ];

  const errorMessage = err.message.toLowerCase();
  return validationKeywords.some(keyword => errorMessage.includes(keyword));
}

/**
 * Middleware to handle 404 not found errors
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    details: {
      type: 'not_found_error',
      method: req.method,
      path: req.originalUrl
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Middleware to handle unhandled promise rejections
 */
export function setupUnhandledRejectionHandler(): void {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      metadata: {
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString()
      }
    });

    // In development, exit immediately to catch the issue
    if (isDevelopment()) {
      process.exit(1);
    }
  });
}

/**
 * Middleware to handle uncaught exceptions
 */
export function setupUncaughtExceptionHandler(): void {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', {
      error: err,
      message: err.message,
      metadata: {
        stack: err.stack
      }
    });

    // Always exit on uncaught exceptions
    process.exit(1);
  });
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any): void {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    server.close((err: Error) => {
      if (err) {
        logger.error('Error during server shutdown', { error: err });
        process.exit(1);
      }
      
      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Request timeout middleware
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          method: req.method,
          userId: (req as any).user?.id,
          metadata: {
            url: req.url,
            timeout: timeoutMs
          }
        });

        res.status(408).json({
          success: false,
          error: 'Request timeout',
          details: {
            type: 'timeout_error',
            timeout: timeoutMs
          },
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * Rate limiting error handler
 */
export function rateLimitErrorHandler(
  req: Request,
  res: Response,
  next: NextFunction,
  options: any
): void {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    method: req.method,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    metadata: {
      url: req.url
    }
  });

  res.status(429).json({
    success: false,
    error: 'Rate limit exceeded',
    details: {
      type: 'rate_limit_error',
      retryAfter: Math.round(options.windowMs / 1000),
      limit: options.max
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * CORS error handler
 */
export function corsErrorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err.message.includes('CORS')) {
    logger.warn('CORS error', {
      method: req.method,
      metadata: {
        origin: req.get('Origin'),
        url: req.url
      }
    });

    res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      details: {
        type: 'cors_error',
        origin: req.get('Origin')
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  next(err);
}