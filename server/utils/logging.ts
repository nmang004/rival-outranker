/**
 * Logging utilities for consistent application logging
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
  error?: Error;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  reason?: string;
  message?: string;
  method?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  service: string;
  environment: string;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private static instance: Logger;
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string = 'rival-outranker', environment: string = 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  public static getInstance(serviceName?: string, environment?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(serviceName, environment);
    }
    return Logger.instance;
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: this.serviceName,
      environment: this.environment
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.environment === 'test') {
      return level === LogLevel.ERROR;
    }
    
    if (this.environment === 'production') {
      return [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO].includes(level);
    }
    
    return true; // Log everything in development
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const output = JSON.stringify(entry, null, this.environment === 'development' ? 2 : 0);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  public error(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context);
    this.writeLog(entry);
  }

  public warn(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }

  public info(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  public debug(message: string, context?: LogContext): void {
    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  // Specialized logging methods

  public logRequest(method: string, url: string, context?: LogContext): void {
    this.info(`${method} ${url}`, {
      ...context,
      action: 'request'
    });
  }

  public logResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    const entry = this.formatLogEntry(level, `${method} ${url} ${statusCode} ${duration}ms`, {
      ...context,
      action: 'response',
      statusCode,
      duration
    });
    
    this.writeLog(entry);
  }

  public logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      error,
      metadata: {
        stack: error.stack,
        name: error.name,
        ...context?.metadata
      }
    });
  }

  public logDatabaseOperation(operation: string, table: string, duration?: number, context?: LogContext): void {
    this.debug(`Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`, {
      ...context,
      action: 'database_operation',
      resource: table,
      duration,
      metadata: {
        operation,
        ...context?.metadata
      }
    });
  }

  public logExternalApiCall(service: string, endpoint: string, statusCode?: number, duration?: number, context?: LogContext): void {
    const message = `External API call to ${service}${endpoint}${statusCode ? ` -> ${statusCode}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    
    const level = statusCode && statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    const entry = this.formatLogEntry(level, message, {
      ...context,
      action: 'external_api_call',
      resource: service,
      statusCode,
      duration,
      metadata: {
        service,
        endpoint,
        ...context?.metadata
      }
    });
    
    this.writeLog(entry);
  }

  public logBusinessEvent(event: string, context?: LogContext): void {
    this.info(`Business event: ${event}`, {
      ...context,
      action: 'business_event',
      metadata: {
        event,
        ...context?.metadata
      }
    });
  }

  public logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    const level = severity === 'high' ? LogLevel.ERROR : 
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    const entry = this.formatLogEntry(level, `Security event: ${event}`, {
      ...context,
      action: 'security_event',
      metadata: {
        event,
        severity,
        ...context?.metadata
      }
    });
    
    this.writeLog(entry);
  }

  public logPerformanceMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance metric: ${metric} = ${value}${unit}`, {
      ...context,
      action: 'performance_metric',
      metadata: {
        metric,
        value,
        unit,
        ...context?.metadata
      }
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

/**
 * Create a child logger with default context
 */
export function createChildLogger(defaultContext: LogContext): {
  error: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
} {
  return {
    error: (message: string, context?: LogContext) => 
      logger.error(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...defaultContext, ...context }),
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...defaultContext, ...context })
  };
}

/**
 * Timing utility for measuring operation duration
 */
export class Timer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
  }

  public end(context?: LogContext): number {
    const duration = Date.now() - this.startTime;
    logger.debug(`Timer ${this.label}: ${duration}ms`, {
      ...context,
      duration,
      metadata: {
        timer: this.label,
        ...context?.metadata
      }
    });
    return duration;
  }

  public static start(label: string): Timer {
    return new Timer(label);
  }
}

/**
 * Performance monitoring decorator
 */
export function logPerformance(label?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timerLabel = label || `${target.constructor.name}.${propertyName}`;
      const timer = Timer.start(timerLabel);
      
      try {
        const result = await method.apply(this, args);
        timer.end();
        return result;
      } catch (error) {
        const duration = timer.end();
        logger.error(`Method ${timerLabel} failed after ${duration}ms`, {
          error: error as Error,
          duration
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Request correlation ID generator
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Redact sensitive information from logs
 */
export function redactSensitiveData(data: any, sensitiveFields: string[] = [
  'password', 'token', 'secret', 'key', 'authorization', 'cookie'
]): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, sensitiveFields));
  }

  const redacted = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  // Recursively redact nested objects
  for (const key in redacted) {
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key], sensitiveFields);
    }
  }

  return redacted;
}