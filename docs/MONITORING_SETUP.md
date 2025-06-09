# Production Monitoring and Alerting Setup

## Overview

This document describes the comprehensive monitoring, logging, and alerting infrastructure for Rival Outranker. Our monitoring strategy provides real-time visibility into system health, performance, and user experience while enabling proactive issue detection and resolution.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Log Aggregation│───▶│   Alerting      │
│   Metrics       │    │   & Processing   │    │   & Notification│
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Health Checks │    │   Log Storage   │    │   Dashboards    │
│   & Monitoring  │    │   & Search      │    │   & Reporting   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Logging Infrastructure

### Structured Logging
**Implementation**: Winston with JSON format
**Location**: `server/services/monitoring/logger.service.ts`

#### Log Levels and Usage
```typescript
// Error: System errors, exceptions, failures
logger.error('Database connection failed', { 
  error: error.message, 
  stack: error.stack,
  context: 'startup'
});

// Warn: Potential issues, degraded performance
logger.warn('Slow query detected', { 
  query: 'SELECT * FROM users',
  duration: 2500,
  threshold: 1000
});

// Info: Important system events, user actions
logger.info('User registered', { 
  userId: '12345',
  email: 'user@example.com',
  source: 'web'
});

// Debug: Detailed debugging information
logger.debug('Cache hit', { 
  key: 'user:12345',
  ttl: 300
});
```

#### Log Categories
- **HTTP Requests**: All API calls with timing and status
- **User Actions**: Registration, login, analysis requests
- **System Events**: Startup, shutdown, configuration changes
- **Security Events**: Failed logins, rate limiting, suspicious activity
- **Performance Events**: Slow queries, high memory usage
- **Business Metrics**: Feature usage, conversion events

### Log Rotation and Storage
```typescript
// Daily rotation with compression
new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',      // Max file size
  maxFiles: '14d',     // Retention period
  compress: true       // Gzip compression
});
```

#### Log Directory Structure
```
logs/
├── application-current.log     # Current application logs
├── error-current.log          # Current error logs
├── combined-current.log       # All logs combined
├── application-2025-01-15.log # Historical logs
├── error-2025-01-15.log
└── exceptions.log             # Uncaught exceptions
```

### Performance Monitoring Middleware
```typescript
// Request timing and metadata logging
export function performanceMonitoring(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
    
    // Alert on slow requests
    if (duration > 2000) {
      alertingService.triggerAlert('slow-request', {
        url: req.url,
        duration,
        threshold: 2000
      });
    }
  });
  
  next();
}
```

## Health Check System

### Comprehensive Health Checks
**Implementation**: `server/services/monitoring/health-checker.service.ts`

#### Available Health Checks
1. **Database Connectivity**
   - Connection test with timing
   - Query execution validation
   - Connection pool status

2. **Crawler System**
   - Active job monitoring
   - Last crawl timing
   - Job success/failure rates

3. **Memory Usage**
   - Heap utilization percentage
   - Memory leak detection
   - GC performance metrics

4. **External APIs**
   - OpenAI API connectivity
   - DataForSEO service status
   - Google APIs availability

5. **Data Quality**
   - Recent crawling activity
   - Duplicate content detection
   - Stale data identification

#### Health Check Endpoints
```bash
# Simple health check (for load balancers)
GET /api/health
Response: { "status": "healthy", "timestamp": "2025-01-15T10:00:00Z" }

# Detailed health information
GET /api/health/detailed
Response: {
  "overall": { "status": "healthy", "uptime": 86400 },
  "checks": {
    "database": { "status": "healthy", "responseTime": 45 },
    "crawler": { "status": "degraded", "lastRun": "2025-01-15T09:00:00Z" },
    "memory": { "status": "healthy", "usage": 65 }
  }
}
```

### Health Status Levels
- **Healthy**: All systems operational
- **Degraded**: Some issues but core functionality available
- **Unhealthy**: Critical issues affecting service availability
- **Error**: Health check failed to execute

## Alerting System

### Alert Rule Configuration
**Implementation**: `server/services/monitoring/alerting.service.ts`

#### Default Alert Rules
```typescript
const alertRules = [
  {
    id: 'high-error-rate',
    name: 'High Error Rate',
    type: 'threshold',
    condition: { metric: 'errors.total', operator: 'gt', threshold: 10 },
    severity: 'high',
    cooldownMinutes: 30
  },
  {
    id: 'database-unhealthy', 
    name: 'Database Health Critical',
    type: 'health_check',
    condition: { healthCheck: 'database' },
    severity: 'critical',
    cooldownMinutes: 15
  },
  {
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    type: 'threshold',
    condition: { metric: 'memory.usage_percent', operator: 'gt', threshold: 90 },
    severity: 'medium',
    cooldownMinutes: 60
  }
];
```

#### Alert Severity Levels
- **Critical**: Service down, data loss, security breach
- **High**: Major functionality impaired, performance degraded
- **Medium**: Minor issues, warnings, resource constraints
- **Low**: Information, maintenance reminders

### Notification Channels

#### Email Notifications
```typescript
// HTML email template with alert details
const emailTemplate = `
<h2>🚨 Alert Notification</h2>
<table>
  <tr><td>Alert ID:</td><td>${alert.id}</td></tr>
  <tr><td>Severity:</td><td>${alert.severity}</td></tr>
  <tr><td>Message:</td><td>${alert.message}</td></tr>
  <tr><td>Time:</td><td>${alert.timestamp}</td></tr>
</table>
`;
```

#### Slack Integration
```typescript
// Slack webhook payload
const slackPayload = {
  attachments: [{
    color: severityColors[alert.severity],
    title: `${alert.severity.toUpperCase()}: ${alert.type}`,
    text: alert.message,
    fields: [
      { title: 'Environment', value: process.env.NODE_ENV },
      { title: 'Time', value: alert.timestamp }
    ]
  }]
};
```

#### Custom Webhooks
- Configurable webhook endpoints
- Custom payload formatting
- Authentication token support
- Retry logic with exponential backoff

### Alert Management
```bash
# Get active alerts
GET /api/alerts/active

# Get alert history
GET /api/alerts/history?limit=100

# Resolve alert manually
POST /api/alerts/{alertId}/resolve

# Update alert rule
PUT /api/alerts/rules/{ruleId}
```

## Metrics Collection

### Business Metrics Tracking
```typescript
// Track key business events
metricsCollector.trackUserRegistration(userId, 'email');
metricsCollector.trackAnalysisRequest(userId, url, 'standard');
metricsCollector.trackCrawlJob(jobId, 'news', 'success');
metricsCollector.trackApiCall(endpoint, method, statusCode, duration);
```

### System Metrics
- **Request Metrics**: Count, duration, status codes
- **Resource Metrics**: CPU, memory, disk usage
- **Database Metrics**: Query count, duration, connections
- **Cache Metrics**: Hit ratio, evictions, size
- **Error Metrics**: Count by type, stack traces

### Custom Metrics Dashboard
```typescript
// Real-time metrics endpoint
GET /api/metrics/current
Response: {
  "cumulative": {
    "user.registrations": 1250,
    "analysis.requests": 15780,
    "api.calls": 125000
  },
  "hourly": {
    "user.registrations": 12,
    "analysis.requests": 234
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

## Environment-Specific Configuration

### Development
```bash
LOG_LEVEL=debug
ENABLE_MONITORING=false
ENABLE_ALERTING=false
```

### Staging
```bash
LOG_LEVEL=info
ENABLE_MONITORING=true
ENABLE_ALERTING=true
ALERT_EMAIL=staging-alerts@company.com
```

### Production
```bash
LOG_LEVEL=warn
ENABLE_MONITORING=true
ENABLE_ALERTING=true
ALERT_EMAIL=production-alerts@company.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## Monitoring Dashboards

### Application Dashboard
- **Request Volume**: Requests per minute/hour
- **Response Times**: P50, P95, P99 percentiles
- **Error Rates**: 4xx and 5xx error percentages
- **Active Users**: Current sessions and registrations

### Infrastructure Dashboard
- **Server Health**: CPU, memory, disk usage
- **Database Performance**: Query times, connections
- **Cache Performance**: Hit rates, memory usage
- **Network Metrics**: Bandwidth, latency

### Business Dashboard
- **User Activity**: Registrations, logins, analyses
- **Feature Usage**: Most used endpoints, features
- **Conversion Metrics**: Trial to paid conversions
- **Revenue Metrics**: Subscription and usage tracking

## Production Deployment Monitoring

### Deployment Health Checks
```bash
# Post-deployment verification
curl -f https://app.rivaloutranker.com/api/health
curl -f https://app.rivaloutranker.com/api/health/detailed

# Application-specific checks
curl -f https://app.rivaloutranker.com/api/crawl/status
curl -f https://app.rivaloutranker.com/api/analysis/sample
```

### Rollback Triggers
- Health check failures for 5+ minutes
- Error rate above 10% for 10+ minutes
- Critical alerts with no resolution path
- Database connectivity issues

### Blue-Green Deployment Monitoring
```bash
# Monitor both environments during deployment
watch -n 5 'curl -s https://blue.rivaloutranker.com/api/health | jq .status'
watch -n 5 'curl -s https://green.rivaloutranker.com/api/health | jq .status'
```

## Troubleshooting Runbook

### Common Issues and Solutions

#### High Error Rate
1. Check error logs: `tail -f logs/error-current.log`
2. Identify error patterns: `grep "ERROR" logs/error-current.log | tail -20`
3. Check system resources: `htop`, `free -m`, `df -h`
4. Restart services if needed: `systemctl restart rivaloutranker`

#### Database Connection Issues
```bash
# Check database connectivity
psql -U username -h host -d database -c "SELECT 1;"

# Check connection pool
curl -s localhost:3000/api/health/detailed | jq .checks.database

# Monitor active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

#### Memory Leaks
```bash
# Monitor memory usage over time
watch -n 5 'free -m'

# Check Node.js heap usage
curl -s localhost:3000/api/health/detailed | jq .checks.memory

# Generate heap dump for analysis
kill -USR2 <node_process_id>
```

#### Slow Performance
```bash
# Check response times
curl -w "@curl-format.txt" -s -o /dev/null https://app.rivaloutranker.com/api/health

# Monitor database queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check crawler performance
curl -s localhost:3000/api/crawl/metrics | jq
```

### Log Analysis Commands
```bash
# Find errors in last hour
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" logs/error-current.log

# Count requests by status code
grep "HTTP Request" logs/application-current.log | jq .statusCode | sort | uniq -c

# Find slow requests
grep "HTTP Request" logs/application-current.log | jq 'select(.duration > 1000)'

# Monitor real-time logs
tail -f logs/application-current.log | jq 'select(.level == "error")'
```

## Security Monitoring

### Security Event Detection
- Failed login attempts
- Rate limiting activations
- Suspicious user agent patterns
- SQL injection attempts
- XSS attempt detection

### Security Alerts
```typescript
// Security-specific alerts
logger.warn('Security Event', {
  type: 'failed_login_attempts',
  count: 5,
  ip: '192.168.1.100',
  timeWindow: '5 minutes'
});

// Automatic rate limiting
if (failedAttempts > 5) {
  alertingService.triggerAlert('security-breach', {
    type: 'brute_force',
    ip: clientIp,
    attempts: failedAttempts
  });
}
```

### Compliance Monitoring
- GDPR compliance tracking
- Data retention policy enforcement
- Access log auditing
- Privacy policy adherence

## Maintenance and Operations

### Daily Tasks
```bash
# Check system health
npm run monitor:health

# Review error logs
grep "ERROR" logs/error-current.log | tail -20

# Monitor disk space
df -h

# Check recent alerts
curl -s localhost:3000/api/alerts/active
```

### Weekly Tasks
```bash
# Log rotation verification
ls -la logs/

# Performance trend analysis
curl -s localhost:3000/api/metrics/weekly

# Database maintenance
VACUUM ANALYZE;

# Security scan
npm run security:audit
```

### Monthly Tasks
- Review and update alert thresholds
- Analyze performance trends
- Update monitoring dependencies
- Capacity planning review
- Incident response plan review

## Integration with External Services

### Supported Integrations
- **Sentry**: Error tracking and performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **New Relic**: APM and real user monitoring  
- **PagerDuty**: Incident management and escalation
- **Slack**: Team collaboration and notifications

### Custom Integration Setup
```typescript
// Example: Custom metrics to DataDog
const dogstatsd = require('node-dogstatsd');
const client = new dogstatsd.StatsD('localhost', 8125);

// Send custom metrics
client.increment('user.registration', 1, ['source:web']);
client.histogram('api.response_time', duration, ['endpoint:/api/analysis']);
```

## Performance Optimization

### Monitoring-Based Optimization
- Identify slow endpoints from logs
- Optimize database queries based on metrics
- Cache frequently accessed data
- Implement CDN for static assets

### Proactive Monitoring
- Predictive alerting based on trends
- Capacity planning using historical data
- Performance regression detection
- Resource usage forecasting

---

## Quick Reference

### Essential Monitoring Commands
```bash
# System health
npm run monitor:health
curl localhost:3000/api/health

# View logs
npm run monitor:logs
tail -f logs/application-current.log

# Check metrics
curl localhost:3000/api/metrics/current

# Test alerts
curl -X POST localhost:3000/api/alerts/test
```

### Emergency Procedures
```bash
# Critical system failure
1. Check health status: curl localhost:3000/api/health
2. Review error logs: tail -100 logs/error-current.log  
3. Check system resources: htop, free -m, df -h
4. Restart application: systemctl restart rivaloutranker
5. Notify team: Send alert to #incidents channel

# Database issues
1. Check connectivity: psql -c "SELECT 1;"
2. Monitor connections: SELECT * FROM pg_stat_activity;
3. Check disk space: df -h /var/lib/postgresql
4. Review slow queries: SELECT * FROM pg_stat_statements;
```

This comprehensive monitoring setup ensures high availability, performance, and rapid issue resolution for the Rival Outranker platform.