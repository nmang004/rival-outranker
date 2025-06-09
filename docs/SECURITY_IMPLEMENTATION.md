# Security Implementation Guide

This document details the comprehensive security measures implemented in Rival Outranker for production-grade security.

## 🛡️ Security Overview

The security implementation follows industry best practices and includes multiple layers of protection:

- **Authentication & Authorization**: JWT with refresh tokens, role-based access
- **Input Security**: SQL injection prevention, XSS protection, input sanitization
- **Network Security**: Rate limiting, DDoS protection, IP reputation management
- **Data Protection**: Password hashing, CSRF protection, secure headers
- **Monitoring**: Security event logging, real-time threat detection
- **Session Management**: Secure session handling, device fingerprinting

## 🔐 Authentication System

### JWT Token Implementation

```typescript
// Enhanced JWT with refresh tokens
interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  type: 'access' | 'refresh';
  deviceId?: string;
  sessionId?: string;
}

// Token configuration
const config = {
  jwt: {
    accessTokenExpiry: '15m',      // Short-lived access tokens
    refreshTokenExpiry: '7d',      // Longer refresh tokens
    issuer: 'rival-outranker',
    audience: 'rival-outranker-users'
  }
};
```

### Password Security

**Password Policy:**
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers, special characters
- Blocks common passwords (password123, admin, etc.)
- Prevents sequential characters (123, abc, qwe)
- No repeating characters (aaa, 111)

**Hashing:**
- bcrypt with 12 salt rounds
- Secure random salt generation
- Protection against rainbow table attacks

```typescript
// Password validation and hashing
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommon: true,
  maxAge: 90 // Password expiry in days
};
```

### Account Lockout Protection

- **Max Attempts**: 5 failed login attempts
- **Lockout Duration**: 30 minutes
- **Tracking**: Per email/IP combination
- **Progressive Penalties**: Increasing lockout duration for repeat offenders

### Two-Factor Authentication

```typescript
// 2FA Implementation
interface TwoFactorAuth {
  userId: string;
  secret: string;
  backupCodes: string[];     // 10 single-use backup codes
  enabled: boolean;
  createdAt: Date;
  lastUsed?: Date;
}
```

## 🚫 Input Validation & Sanitization

### SQL Injection Prevention

**Detection Patterns:**
```typescript
const sqlPatterns = [
  /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/gi,
  /(;|\-\-|\/\*|\*\/|xp_)/gi,
  /(\b(OR|AND)\b.*[=<>].*[\'\"])/gi,
  /(\bUNION\b.*\bSELECT\b)/gi,
  /(\bINSERT\b.*\bINTO\b)/gi
];
```

**Protection Measures:**
- Real-time pattern detection
- Parameterized queries with Drizzle ORM
- Input escaping and validation
- Automatic blocking of malicious inputs

### XSS Protection

**XSS Sanitization:**
```typescript
// Comprehensive XSS protection
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi
];
```

**Whitelist Approach:**
- Only safe HTML tags allowed (p, br, strong, em, b, i, u)
- Strip dangerous attributes
- Content Security Policy enforcement

## 🛑 Rate Limiting & DDoS Protection

### Multi-Tier Rate Limiting

```typescript
// Rate limiting configurations
export const rateLimits = {
  general: {
    windowMs: 15 * 60 * 1000,    // 15 minutes
    max: 100,                     // 100 requests
    banThreshold: 5,              // Ban after 5 violations
    banDuration: 3600000          // 1 hour ban
  },
  
  auth: {
    windowMs: 15 * 60 * 1000,    // 15 minutes
    max: 5,                       // 5 attempts
    banThreshold: 3,              // Ban after 3 violations
    banDuration: 7200000          // 2 hour ban
  },
  
  analysis: {
    windowMs: 60 * 60 * 1000,    // 1 hour
    max: 20,                      // 20 analyses
    keyGenerator: (req) => req.user?.id || req.ip
  }
};
```

### IP Reputation Management

**Violation Scoring:**
- MALICIOUS_INPUT_DETECTED: 50 points
- SQL_INJECTION_ATTEMPT: 75 points
- XSS_ATTEMPT: 40 points
- RATE_LIMIT_EXCEEDED: 10 points
- Auto-ban threshold: 100 points

**Risk Levels:**
- **Low**: 0-39 points
- **Medium**: 40-74 points
- **High**: 75-99 points
- **Critical**: 100+ points (auto-banned)

### DDoS Mitigation

- **Memory-efficient rate limiting** with automatic cleanup
- **Progressive penalties** for repeat offenders
- **Adaptive thresholds** based on attack patterns
- **Geographical rate limiting** for suspicious regions

## 🔒 Security Headers

### Content Security Policy

```typescript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://api.openai.com https://api.dataforseo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
];
```

### Security Headers Applied

- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: HSTS for HTTPS enforcement
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricts browser features

## 🛡️ CSRF Protection

### Implementation

```typescript
// CSRF token generation
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF validation middleware
export const csrfProtection = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;
  
  if (!token || token !== sessionToken) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      code: 'CSRF_TOKEN_INVALID'
    });
  }
  
  next();
};
```

### Protection Scope

- All state-changing operations (POST, PUT, DELETE, PATCH)
- Excludes authentication endpoints (separate protection)
- Token rotation on successful authentication
- Secure token storage in HTTP-only cookies

## 📊 Security Monitoring

### Real-Time Event Tracking

```typescript
// Security event types
enum SecurityEvent {
  MALICIOUS_INPUT = 'MALICIOUS_INPUT',
  IP_BANNED = 'IP_BANNED',
  RATE_LIMIT_VIOLATION = 'RATE_LIMIT_VIOLATION',
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}
```

### Logging Features

- **Structured JSON logging** for analysis
- **Request fingerprinting** for fraud detection
- **Suspicious pattern detection** with auto-alerting
- **Performance monitoring** (slow requests, large responses)
- **Geographic tracking** of requests

### Alerting Thresholds

- **Critical**: SQL injection, XSS attempts, account takeover
- **High**: Multiple failed logins, rate limit violations
- **Medium**: Suspicious user agents, unusual patterns
- **Low**: General authentication events

## 🔧 Session Management

### Session Security

```typescript
interface SessionData {
  userId: string;
  deviceId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

const sessionConfig = {
  maxSessions: 5,                    // Max concurrent sessions per user
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  slidingExpiration: true            // Extend on activity
};
```

### Device Fingerprinting

```typescript
// Device identification
const generateDeviceFingerprint = (req) => {
  const fingerprint = {
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    dnt: req.get('DNT')
  };
  
  return crypto.createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex');
};
```

## 🚀 Production Deployment Security

### Environment Variables

```env
# Required security environment variables
JWT_SECRET=<strong-256-bit-secret>
JWT_REFRESH_SECRET=<different-256-bit-secret>
DATABASE_URL=<secure-connection-string>
OPENAI_API_KEY=<api-key>

# Optional security settings
SESSION_SECRET=<session-secret>
CSRF_SECRET=<csrf-secret>
SECURITY_HEADERS_ENABLED=true
RATE_LIMITING_ENABLED=true
```

### HTTPS Configuration

```typescript
// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.get('host')}${req.url}`);
    }
    next();
  });
}
```

### Security Middleware Stack

```typescript
// Production security middleware order
app.use(helmet());                    // Security headers
app.use(cors(corsConfig));           // CORS configuration
app.use(compression());              // Gzip compression
app.use(express.json({ limit: '50mb' })); // Body parser with limits
app.use(securityHeaders);            // Custom security headers
app.use(requestFingerprinting);      // Device fingerprinting
app.use(sanitizeInput);              // Input sanitization
app.use(requestLogger);              // Security logging
app.use(generalRateLimit);           // Rate limiting
```

## 🧪 Security Testing

### Automated Testing

```bash
# Security testing commands
npm run security:audit          # Dependency vulnerability scan
npm run security:test          # Security unit tests
npm run security:penetration   # Automated penetration testing
npm run security:lint          # Security-focused linting
```

### Manual Testing Checklist

**Authentication Testing:**
- [ ] JWT token expiration handling
- [ ] Refresh token rotation
- [ ] Account lockout mechanisms
- [ ] Password strength validation
- [ ] 2FA token verification

**Input Validation Testing:**
- [ ] SQL injection attempts
- [ ] XSS payload injection
- [ ] Path traversal attempts
- [ ] File upload security
- [ ] JSON payload validation

**Rate Limiting Testing:**
- [ ] API rate limit enforcement
- [ ] Authentication rate limiting
- [ ] DDoS protection activation
- [ ] IP ban functionality

**Authorization Testing:**
- [ ] Role-based access control
- [ ] Privilege escalation prevention
- [ ] CSRF token validation
- [ ] Session management

## 📈 Security Metrics

### Key Performance Indicators

```typescript
interface SecurityMetrics {
  // Authentication metrics
  successfulLogins: number;
  failedLogins: number;
  accountLockouts: number;
  
  // Attack prevention
  sqlInjectionBlocked: number;
  xssAttemptsBlocked: number;
  rateLimitViolations: number;
  bannedIPs: number;
  
  // System health
  activeSessions: number;
  tokenRefreshRate: number;
  averageResponseTime: number;
  errorRate: number;
}
```

### Monitoring Dashboard

- **Real-time threat detection** with visual indicators
- **Geographic attack visualization** on world map
- **Attack pattern analysis** with trend graphs
- **Performance impact monitoring** of security measures

## 🚨 Incident Response

### Security Incident Classification

**Level 1 - Critical:**
- Active data breach
- Successful privilege escalation
- Mass account compromise
- System compromise

**Level 2 - High:**
- Failed privilege escalation attempts
- Targeted attacks on admin accounts
- Unusual data access patterns
- Suspected insider threats

**Level 3 - Medium:**
- Repeated failed login attempts
- Suspicious user behavior
- Rate limiting violations
- Failed input validation

**Level 4 - Low:**
- General authentication failures
- Bot detection
- Minor policy violations

### Response Procedures

1. **Immediate Actions:**
   - Block attacking IP addresses
   - Revoke compromised sessions
   - Alert security team
   - Document incident

2. **Investigation:**
   - Analyze security logs
   - Identify attack vectors
   - Assess damage scope
   - Collect evidence

3. **Containment:**
   - Implement additional protections
   - Update security rules
   - Patch vulnerabilities
   - Monitor for reoccurrence

4. **Recovery:**
   - Restore affected services
   - Reset compromised accounts
   - Update security policies
   - Conduct post-incident review

## 🔄 Security Maintenance

### Regular Tasks

**Daily:**
- Review security logs
- Monitor attack attempts
- Check system health
- Update threat intelligence

**Weekly:**
- Analyze security metrics
- Review user access patterns
- Update IP reputation data
- Test backup systems

**Monthly:**
- Security patch updates
- Vulnerability assessments
- Access control review
- Security training updates

**Quarterly:**
- Penetration testing
- Security policy review
- Compliance audits
- Disaster recovery testing

### Continuous Improvement

- **Threat modeling** updates based on new features
- **Security awareness training** for development team
- **Regular security audits** by third parties
- **Incident response drills** and tabletop exercises

## 📚 Security Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Tools & Libraries
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT implementation
- **helmet**: Security headers
- **xss**: XSS sanitization
- **validator**: Input validation

### Compliance
- **GDPR**: Data protection compliance
- **SOC 2**: Security controls framework
- **ISO 27001**: Information security management

---

**Last Updated**: January 2025  
**Security Team**: Rival Outranker Security Team  
**Version**: 1.0.0

For security concerns or reporting vulnerabilities, contact: security@rivaloutranker.com