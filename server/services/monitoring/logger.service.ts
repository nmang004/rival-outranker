import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Configure logger based on environment
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: 'rival-outranker',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    hostname: process.env.HOSTNAME || 'localhost'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
      silent: process.env.NODE_ENV === 'test'
    }),

    // Application logs with rotation
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      createSymlink: true,
      symlinkName: 'application-current.log'
    }),

    // Error logs with longer retention
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      createSymlink: true,
      symlinkName: 'error-current.log'
    }),

    // Combined logs for all levels
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '7d',
      createSymlink: true,
      symlinkName: 'combined-current.log'
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Performance monitoring middleware
export function performanceMonitoring(req: any, res: any, next: any) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Track request start
  req.startTime = startTime;
  req.requestId = generateRequestId();
  
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    const contentLength = Buffer.isBuffer(data) ? data.length : 
                         typeof data === 'string' ? Buffer.byteLength(data) : 0;
    
    // Log all HTTP requests
    logger.info('HTTP Request', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      query: req.query,
      params: req.params
    });
    
    // Track slow requests
    if (duration > 2000) {
      logger.warn('Slow Request Detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration,
        userId: req.user?.id,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Track large responses
    if (contentLength > 1048576) { // 1MB
      logger.warn('Large Response Detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        contentLength,
        userId: req.user?.id
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
}

// Error tracking middleware
export function errorTracking(error: any, req: any, res: any, next: any) {
  const errorId = generateRequestId();
  
  logger.error('Application Error', {
    errorId,
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      userId: req.user?.id,
      body: sanitizeRequestBody(req.body),
      query: req.query,
      params: req.params,
      headers: sanitizeHeaders(req.headers)
    },
    response: {
      statusCode: res.statusCode
    }
  });
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      errorId,
      message: 'An unexpected error occurred'
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      errorId,
      message: error.message,
      stack: error.stack
    });
  }
}

// Business metrics tracking
export class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private hourlyMetrics: Map<string, number> = new Map();
  private dailyMetrics: Map<string, number> = new Map();
  
  constructor() {
    // Reset hourly metrics every hour
    setInterval(() => {
      this.resetHourlyMetrics();
    }, 60 * 60 * 1000);
    
    // Reset daily metrics every day
    setInterval(() => {
      this.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000);
  }
  
  incrementMetric(metric: string, value: number = 1, tags: Record<string, any> = {}) {
    // Update cumulative metrics
    this.metrics.set(metric, (this.metrics.get(metric) || 0) + value);
    this.hourlyMetrics.set(metric, (this.hourlyMetrics.get(metric) || 0) + value);
    this.dailyMetrics.set(metric, (this.dailyMetrics.get(metric) || 0) + value);
    
    logger.info('Metric Updated', {
      metric,
      value: this.metrics.get(metric),
      increment: value,
      tags,
      timestamp: new Date().toISOString()
    });
  }
  
  setGauge(metric: string, value: number, tags: Record<string, any> = {}) {
    this.metrics.set(metric, value);
    
    logger.debug('Gauge Updated', {
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    });
  }
  
  getMetrics() {
    return {
      cumulative: Object.fromEntries(this.metrics),
      hourly: Object.fromEntries(this.hourlyMetrics),
      daily: Object.fromEntries(this.dailyMetrics),
      timestamp: new Date().toISOString()
    };
  }
  
  private resetHourlyMetrics() {
    logger.info('Hourly Metrics Reset', { 
      previousMetrics: Object.fromEntries(this.hourlyMetrics) 
    });
    this.hourlyMetrics.clear();
  }
  
  private resetDailyMetrics() {
    logger.info('Daily Metrics Reset', { 
      previousMetrics: Object.fromEntries(this.dailyMetrics) 
    });
    this.dailyMetrics.clear();
  }
  
  // Track specific business events
  trackUserRegistration(userId: string, method: string = 'email') {
    this.incrementMetric('user.registrations', 1, { method, userId });
  }
  
  trackAnalysisRequest(userId: string, url: string, type: string = 'standard') {
    this.incrementMetric('analysis.requests', 1, { type, userId, url });
  }
  
  trackCrawlJob(jobId: string, type: string, status: string) {
    this.incrementMetric('crawl.jobs', 1, { jobId, type, status });
  }
  
  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number) {
    this.incrementMetric('api.calls', 1, { endpoint, method, statusCode });
    this.setGauge('api.response_time', duration, { endpoint, method });
  }
  
  trackError(errorType: string, severity: string = 'error') {
    this.incrementMetric('errors.total', 1, { errorType, severity });
  }
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeRequestBody(body: any): any {
  if (!body) return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

function sanitizeHeaders(headers: any): any {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitized = { ...headers };
  
  for (const header of sensitiveHeaders) {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Singleton instances
export const metricsCollector = new MetricsCollector();
export { logger };

// Logger helper methods
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // Structured logging for specific events
  userAction: (action: string, userId: string, meta?: any) => 
    logger.info('User Action', { action, userId, ...meta }),
    
  systemEvent: (event: string, meta?: any) => 
    logger.info('System Event', { event, ...meta }),
    
  securityEvent: (event: string, severity: string, meta?: any) => 
    logger.warn('Security Event', { event, severity, ...meta }),
    
  performanceIssue: (issue: string, metric: number, threshold: number, meta?: any) => 
    logger.warn('Performance Issue', { issue, metric, threshold, ...meta })
};