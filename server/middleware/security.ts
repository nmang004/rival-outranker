// Simple rate limiting implementation
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message: any;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
}) => {
  const store: RateLimitStore = {};
  
  return (req: any, res: any, next: any) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 0,
        resetTime: now + options.windowMs
      };
    }
    
    store[key].count++;
    
    if (store[key].count > options.max) {
      return res.status(429).json(options.message);
    }
    
    if (options.standardHeaders) {
      res.setHeader('RateLimit-Limit', options.max);
      res.setHeader('RateLimit-Remaining', Math.max(0, options.max - store[key].count));
      res.setHeader('RateLimit-Reset', new Date(store[key].resetTime));
    }
    
    next();
  };
};
import { Request, Response, NextFunction } from 'express';

// Rate limiting configurations
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for API endpoints
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Strict limit for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Very strict limit for file uploads
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic input sanitization
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS attempts
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitizeString(key)] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

// Request validation middleware
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(400).json({
          error: 'Invalid Content-Type',
          allowed: allowedTypes
        });
      }
    }
    
    next();
  };
};

// Request size validation
export const validateRequestSize = (maxSizeBytes: number = 50 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request too large',
        maxSize: `${Math.round(maxSizeBytes / 1024 / 1024)}MB`
      });
    }
    
    next();
  };
};

// User agent validation
export const validateUserAgent = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent');
  
  // Block suspicious user agents
  const blockedPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /spider/i,
    /wget/i,
    /curl/i
  ];
  
  // Allow health checks and legitimate requests
  const allowedPaths = ['/health', '/api/health'];
  
  if (allowedPaths.includes(req.path)) {
    return next();
  }
  
  if (!userAgent || blockedPatterns.some(pattern => pattern.test(userAgent))) {
    // Log suspicious activity
    console.warn(`Blocked suspicious user agent: ${userAgent} from IP: ${req.ip}`);
    
    return res.status(403).json({
      error: 'Access denied'
    });
  }
  
  next();
};

// IP whitelist/blacklist middleware
export const ipFilter = (options: {
  whitelist?: string[];
  blacklist?: string[];
} = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Check blacklist first
    if (options.blacklist && options.blacklist.includes(clientIP)) {
      console.warn(`Blocked IP from blacklist: ${clientIP}`);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check whitelist if provided
    if (options.whitelist && options.whitelist.length > 0) {
      if (!options.whitelist.includes(clientIP)) {
        console.warn(`IP not in whitelist: ${clientIP}`);
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com https://api.dataforseo.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));
  
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '));
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data || '', 'utf8');
    
    // Log request details
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      size: `${size} bytes`,
      referer: req.get('Referer') || '-'
    }));
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Error boundary middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Determine error status
  const status = err.status || err.statusCode || 500;
  
  // Don't expose sensitive information in production
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Internal Server Error' 
    : err.message || 'An error occurred';
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: req.headers['x-request-id'] || 'unknown'
  });
};

export default {
  generalRateLimit,
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  sanitizeInput,
  validateContentType,
  validateRequestSize,
  validateUserAgent,
  ipFilter,
  securityHeaders,
  requestLogger,
  errorHandler
};