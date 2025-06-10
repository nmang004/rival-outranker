/**
 * Enhanced Security Middleware - Production Grade Security Implementation
 * 
 * Features:
 * - Advanced rate limiting with memory optimization
 * - SQL injection prevention
 * - XSS protection with whitelist validation
 * - CSRF token management
 * - Security event logging
 * - Request fingerprinting
 * - DDoS mitigation
 */

import validator from 'validator';
import xss from 'xss';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Enhanced rate limiting implementation with memory management
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    lastAccess: number;
    violations: number;
  };
}

// Memory cleanup for rate limit store
const cleanupInterval = setInterval(() => {
  Object.keys(rateLimitStores).forEach(storeName => {
    const store = rateLimitStores[storeName];
    const now = Date.now();
    
    Object.keys(store).forEach(key => {
      // Remove expired entries and those not accessed for 1 hour
      if (store[key].resetTime <= now || (now - store[key].lastAccess) > 3600000) {
        delete store[key];
      }
    });
  });
}, 300000); // Clean up every 5 minutes

const rateLimitStores: { [key: string]: RateLimitStore } = {
  general: {},
  api: {},
  auth: {},
  upload: {},
  analysis: {}
};

const createRateLimit = (storeName: string, options: {
  windowMs: number;
  max: number;
  message: any;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: any) => string;
  banThreshold?: number;
  banDuration?: number;
}) => {
  const store = rateLimitStores[storeName] || (rateLimitStores[storeName] = {});
  
  return (req: any, res: any, next: any) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : (req.ip || req.connection.remoteAddress || 'unknown');
    const now = Date.now();
    
    // Check if IP is banned
    if (store[`ban_${key}`] && store[`ban_${key}`].resetTime > now) {
      return res.status(429).json({
        error: 'IP temporarily banned',
        message: 'Too many violations detected',
        retryAfter: store[`ban_${key}`].resetTime
      });
    }
    
    // Initialize or reset counter
    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 0,
        resetTime: now + options.windowMs,
        lastAccess: now,
        violations: store[key]?.violations || 0
      };
    }
    
    store[key].count++;
    store[key].lastAccess = now;
    
    // Check rate limit
    if (store[key].count > options.max) {
      store[key].violations++;
      
      // Ban IP if too many violations
      if (options.banThreshold && store[key].violations >= options.banThreshold) {
        store[`ban_${key}`] = {
          count: 0,
          resetTime: now + (options.banDuration || 3600000), // 1 hour default
          lastAccess: now,
          violations: 0
        };
        
        console.error(`IP banned for excessive violations: ${key}, violations: ${store[key].violations}`);
      }
      
      console.warn(`Rate limit exceeded: ${key}, count: ${store[key].count}, violations: ${store[key].violations}`);
      return res.status(429).json(options.message);
    }
    
    // Set rate limit headers
    if (options.standardHeaders) {
      res.setHeader('RateLimit-Limit', options.max);
      res.setHeader('RateLimit-Remaining', Math.max(0, options.max - store[key].count));
      res.setHeader('RateLimit-Reset', new Date(store[key].resetTime));
      res.setHeader('RateLimit-Policy', `${options.max};w=${Math.floor(options.windowMs / 1000)}`);
    }
    
    next();
  };
};
import { Request, Response, NextFunction } from 'express';

// Declare module augmentation for custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      fingerprintId?: string;
      user?: {
        id: string;
        email: string;
        role?: string;
      };
      session?: {
        csrfToken?: string;
        userId?: string;
      };
    }
  }
}

// Enhanced rate limiting configurations with DDoS protection
export const generalRateLimit = createRateLimit('general', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  banThreshold: 5, // Ban after 5 violations
  banDuration: 3600000 // 1 hour ban
});

export const apiRateLimit = createRateLimit('api', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for API endpoints
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '15 minutes',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  banThreshold: 10,
  banDuration: 1800000 // 30 minutes ban
});

export const authRateLimit = createRateLimit('auth', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Strict limit for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Rate limit by IP + User-Agent for better tracking
    return `${req.ip}_${crypto.createHash('md5').update(req.get('User-Agent') || '').digest('hex')}`;
  },
  banThreshold: 3, // Ban after 3 violations for auth
  banDuration: 7200000 // 2 hour ban for auth violations
});

export const uploadRateLimit = createRateLimit('upload', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Very strict limit for file uploads
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  banThreshold: 2,
  banDuration: 3600000 // 1 hour ban
});

export const analysisRateLimit = createRateLimit('analysis', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit expensive analysis operations
  message: {
    error: 'Analysis rate limit exceeded',
    message: 'Please wait before requesting another analysis',
    retryAfter: '1 hour',
    code: 'ANALYSIS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.id || req.ip;
  },
  banThreshold: 3,
  banDuration: 7200000 // 2 hour ban
});

// Enhanced input sanitization and validation middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // SQL injection patterns
  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/gi,
    /(;|\-\-|\/\*|\*\/|xp_)/gi,
    /(\b(OR|AND)\b.*[=<>].*[\'\"])/gi,
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\bINSERT\b.*\bINTO\b)/gi,
    /(\bDELETE\b.*\bFROM\b)/gi,
    /(\bUPDATE\b.*\bSET\b)/gi,
    /(\bDROP\b.*\bTABLE\b)/gi
  ];

  // XSS patterns and payloads
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /style\s*=.*expression\s*\(/gi,
    /@import/gi,
    /binding\s*:/gi
  ];

  // Check for malicious patterns
  function containsSqlInjection(value: string): boolean {
    return sqlPatterns.some(pattern => pattern.test(value));
  }

  function containsXSS(value: string): boolean {
    return xssPatterns.some(pattern => pattern.test(value));
  }

  // Enhanced sanitization function
  const sanitizeString = (str: string, context: string = ''): string => {
    if (typeof str !== 'string') return str;
    
    // Check for SQL injection attempts
    if (containsSqlInjection(str)) {
      console.error(`SQL injection attempt blocked: ${str.substring(0, 100)} in ${context}, IP: ${req.ip}`);
      throw new Error('MALICIOUS_INPUT_DETECTED');
    }
    
    // Check for XSS attempts
    if (containsXSS(str)) {
      console.warn(`XSS attempt blocked: ${str.substring(0, 100)} in ${context}, IP: ${req.ip}`);
    }
    
    // Apply XSS sanitization
    let sanitized = xss(str, {
      whiteList: {
        // Allow only safe HTML tags if needed
        p: [],
        br: [],
        strong: [],
        em: [],
        b: [],
        i: [],
        u: []
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
    });
    
    // Additional sanitization
    sanitized = validator.escape(sanitized);
    
    // Remove null bytes and other dangerous characters
    sanitized = sanitized.replace(/\0/g, '').replace(/\x00/g, '');
    
    return sanitized.trim();
  };

  const sanitizeObject = (obj: any, path: string = ''): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj, path);
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeString(key, `${path}.key`);
        sanitized[sanitizedKey] = sanitizeObject(value, `${path}.${sanitizedKey}`);
      }
      return sanitized;
    }
    
    return obj;
  };

  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, 'body');
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query, 'query');
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, 'params');
    }
    
    next();
  } catch (error) {
    if (error instanceof Error && error.message === 'MALICIOUS_INPUT_DETECTED') {
      console.error(`Malicious input detected from IP: ${req.ip}, URL: ${req.originalUrl}`);
      return res.status(400).json({
        error: 'Invalid input data',
        message: 'Request contains potentially harmful content',
        code: 'MALICIOUS_INPUT_DETECTED'
      });
    }
    
    console.error('Input sanitization error:', error);
    return res.status(500).json({
      error: 'Input processing failed',
      message: 'Unable to process request data',
      code: 'SANITIZATION_ERROR'
    });
  }
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
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    
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

// Enhanced security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Generate request ID for tracking
  const requestId = uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Generate fingerprint for device tracking
  const fingerprint = crypto.createHash('sha256')
    .update(`${req.ip}_${req.get('User-Agent')}_${req.get('Accept-Language')}`)
    .digest('hex');
  req.fingerprintId = fingerprint;
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enhanced Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://api.dataforseo.com https://www.googleapis.com wss: ws:",
    "media-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Enhanced Permissions Policy (Feature Policy)
  res.setHeader('Permissions-Policy', [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'autoplay=()',
    'encrypted-media=()',
    'fullscreen=(self)',
    'picture-in-picture=()'
  ].join(', '));
  
  // Cache control for security
  if (req.path.includes('/api/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Remove sensitive server information
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'Rival-Outranker-API');
  
  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests and specific endpoints
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip for API authentication endpoints (they use other protection)
  if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;
  
  if (!token) {
    console.warn(`CSRF token missing for IP: ${req.ip}, path: ${req.path}`);
    return res.status(403).json({
      error: 'CSRF token required',
      message: 'CSRF token must be provided in X-CSRF-Token header',
      code: 'CSRF_TOKEN_MISSING'
    });
  }
  
  if (!sessionToken || token !== sessionToken) {
    console.warn(`CSRF token validation failed for IP: ${req.ip}, path: ${req.path}`);
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or expired CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }
  
  next();
};

// Generate CSRF token utility
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Enhanced request fingerprinting for fraud detection
export const requestFingerprinting = (req: Request, res: Response, next: NextFunction) => {
  const fingerprint = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    dnt: req.get('DNT'),
    timestamp: Date.now(),
    path: req.path,
    method: req.method
  };
  
  // Create hash of fingerprint for identification
  const fingerprintHash = crypto.createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex');
  
  req.fingerprintId = fingerprintHash;
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    { pattern: /bot|crawler|spider|scraper/i, field: 'userAgent' },
    { pattern: /^$/, field: 'userAgent' }, // Empty user agent
    { pattern: /curl|wget|python|java/i, field: 'userAgent' }
  ];
  
  for (const { pattern, field } of suspiciousPatterns) {
    const fieldValue = fingerprint[field as keyof typeof fingerprint];
    if (pattern.test(String(fieldValue || ''))) {
      console.warn(`Suspicious ${field} detected:`, {
        ...fingerprint,
        fingerprintHash
      });
    }
  }
  
  next();
};

// Enhanced security-focused request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data || '', 'utf8');
    
    const logData = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      fingerprintId: req.fingerprintId,
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      size: `${size} bytes`,
      referer: req.get('Referer') || '-',
      origin: req.get('Origin') || '-',
      userId: req.user?.id || 'anonymous',
      contentType: req.get('Content-Type') || '-',
      acceptLanguage: req.get('Accept-Language') || '-'
    };
    
    // Enhanced security logging
    if (res.statusCode >= 400) {
      console.error('Security Event - Error Response:', logData);
    } else if (req.path.includes('/admin') || req.path.includes('/auth')) {
      console.info('Security Event - Sensitive Endpoint:', logData);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Request:', logData);
    }
    
    // Log suspicious activities
    const suspiciousIndicators = [
      req.originalUrl.includes('..'),
      req.originalUrl.includes('/.'),
      req.originalUrl.includes('%2e'),
      req.originalUrl.includes('script'),
      req.originalUrl.includes('union'),
      req.originalUrl.includes('select'),
      req.originalUrl.includes('drop'),
      req.originalUrl.includes('admin') && !req.user?.role?.includes('admin'),
      duration > 30000, // Slow requests
      size > 10 * 1024 * 1024 // Large responses
    ];
    
    if (suspiciousIndicators.some(indicator => indicator)) {
      console.warn('Suspicious Activity Detected:', logData);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Enhanced error boundary middleware with security focus
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorDetails = {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    requestId: req.requestId || 'unknown',
    fingerprintId: req.fingerprintId || 'unknown',
    timestamp: new Date().toISOString(),
    errorCode: err.code || 'UNKNOWN_ERROR'
  };
  
  // Determine error status
  const status = err.status || err.statusCode || 500;
  
  // Enhanced security error logging
  if (status >= 500) {
    console.error('Critical Security Event - Server Error:', errorDetails);
  } else if (status === 403 || status === 401) {
    console.warn('Security Event - Authorization Failed:', errorDetails);
  } else if (status >= 400) {
    console.info('Security Event - Client Error:', errorDetails);
  }
  
  // Check for potential attack patterns in errors
  const attackPatterns = [
    /sql.*injection/i,
    /cross.*site.*scripting/i,
    /xss/i,
    /csrf/i,
    /unauthorized.*access/i,
    /malicious.*input/i
  ];
  
  if (attackPatterns.some(pattern => pattern.test(err.message))) {
    console.error('Potential Security Attack Detected:', errorDetails);
  }
  
  // Don't expose sensitive information in production
  let message = err.message || 'An error occurred';
  if (process.env.NODE_ENV === 'production') {
    if (status === 500) {
      message = 'Internal Server Error';
    } else if (status === 403) {
      message = 'Access Forbidden';
    } else if (status === 401) {
      message = 'Authentication Required';
    }
  }
  
  res.status(status).json({
    error: message,
    code: err.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: req.requestId || 'unknown'
  });
};

// Security event emitter for real-time monitoring
export class SecurityEventEmitter {
  private static events: Array<{
    type: string;
    data: any;
    timestamp: Date;
  }> = [];

  static emit(type: string, data: any) {
    this.events.push({
      type,
      data,
      timestamp: new Date()
    });

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log critical events immediately
    if (['MALICIOUS_INPUT', 'IP_BANNED', 'RATE_LIMIT_VIOLATION'].includes(type)) {
      console.error(`Critical Security Event: ${type}`, data);
    }
  }

  static getEvents(since?: Date) {
    if (since) {
      return this.events.filter(event => event.timestamp >= since);
    }
    return this.events.slice(-100); // Return last 100 events
  }

  static getEventStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp >= oneHourAgo);
    
    const stats: { [key: string]: number } = {};
    recentEvents.forEach(event => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });

    return {
      totalEvents: recentEvents.length,
      eventTypes: stats,
      timeRange: '1 hour'
    };
  }
}

// IP reputation and blacklist management
export class IPReputationManager {
  private static blacklistedIPs = new Set<string>();
  private static suspiciousIPs = new Map<string, {
    score: number;
    lastSeen: Date;
    violations: string[];
  }>();

  static addViolation(ip: string, violation: string) {
    const current = this.suspiciousIPs.get(ip) || {
      score: 0,
      lastSeen: new Date(),
      violations: []
    };

    current.score += this.getViolationScore(violation);
    current.lastSeen = new Date();
    current.violations.push(`${violation}:${new Date().toISOString()}`);

    // Keep only last 50 violations per IP
    if (current.violations.length > 50) {
      current.violations = current.violations.slice(-50);
    }

    this.suspiciousIPs.set(ip, current);

    // Blacklist IP if score is too high
    if (current.score >= 100) {
      this.blacklistIP(ip, 'Automatic blacklist due to high violation score');
    }

    SecurityEventEmitter.emit('IP_VIOLATION', { ip, violation, score: current.score });
  }

  private static getViolationScore(violation: string): number {
    const scores: { [key: string]: number } = {
      'MALICIOUS_INPUT_DETECTED': 50,
      'RATE_LIMIT_EXCEEDED': 10,
      'CSRF_TOKEN_INVALID': 25,
      'SUSPICIOUS_USER_AGENT': 15,
      'SQL_INJECTION_ATTEMPT': 75,
      'XSS_ATTEMPT': 40,
      'PATH_TRAVERSAL': 60,
      'UNAUTHORIZED_ACCESS': 30
    };

    return scores[violation] || 5;
  }

  static blacklistIP(ip: string, reason: string) {
    this.blacklistedIPs.add(ip);
    SecurityEventEmitter.emit('IP_BANNED', { ip, reason, timestamp: new Date() });
    console.error(`IP blacklisted: ${ip}, reason: ${reason}`);
  }

  static isBlacklisted(ip: string): boolean {
    return this.blacklistedIPs.has(ip);
  }

  static getIPReputation(ip: string) {
    return {
      isBlacklisted: this.isBlacklisted(ip),
      suspiciousData: this.suspiciousIPs.get(ip),
      riskLevel: this.calculateRiskLevel(ip)
    };
  }

  private static calculateRiskLevel(ip: string): 'low' | 'medium' | 'high' | 'critical' {
    if (this.isBlacklisted(ip)) return 'critical';
    
    const data = this.suspiciousIPs.get(ip);
    if (!data) return 'low';

    if (data.score >= 75) return 'high';
    if (data.score >= 40) return 'medium';
    return 'low';
  }

  static cleanup() {
    // Remove old entries (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.lastSeen < oneDayAgo) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

// Initialize cleanup interval
setInterval(() => {
  IPReputationManager.cleanup();
}, 60 * 60 * 1000); // Every hour

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