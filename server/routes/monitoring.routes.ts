import { Router } from 'express';
import { 
  healthCheckHandler, 
  simpleHealthCheckHandler 
} from '../services/monitoring/health-checker.service.js';
import { alertingService } from '../services/monitoring/alerting.service.js';
import { metricsCollector, log } from '../services/monitoring/logger.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Simple health check for load balancers (no authentication required)
router.get('/health', simpleHealthCheckHandler);

// Detailed health check with full system status
router.get('/health/detailed', healthCheckHandler);

// Metrics endpoints (admin only)
router.get('/metrics/current', requireAdmin, async (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    res.json(metrics);
  } catch (error) {
    log.error('Failed to get current metrics', { error });
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

router.get('/metrics/business', requireAdmin, async (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    
    // Extract business-specific metrics
    const businessMetrics = {
      users: {
        registrations: metrics.cumulative['user.registrations'] || 0,
        registrationsToday: metrics.daily['user.registrations'] || 0,
        registrationsThisHour: metrics.hourly['user.registrations'] || 0
      },
      analyses: {
        total: metrics.cumulative['analysis.requests'] || 0,
        today: metrics.daily['analysis.requests'] || 0,
        thisHour: metrics.hourly['analysis.requests'] || 0
      },
      api: {
        totalCalls: metrics.cumulative['api.calls'] || 0,
        callsToday: metrics.daily['api.calls'] || 0,
        callsThisHour: metrics.hourly['api.calls'] || 0
      },
      errors: {
        total: metrics.cumulative['errors.total'] || 0,
        today: metrics.daily['errors.total'] || 0,
        thisHour: metrics.hourly['errors.total'] || 0
      },
      timestamp: metrics.timestamp
    };
    
    res.json(businessMetrics);
  } catch (error) {
    log.error('Failed to get business metrics', { error });
    res.status(500).json({ error: 'Failed to retrieve business metrics' });
  }
});

// Alert management endpoints (admin only)
router.get('/alerts/active', requireAdmin, (req, res) => {
  try {
    const activeAlerts = alertingService.getActiveAlerts();
    res.json(activeAlerts);
  } catch (error) {
    log.error('Failed to get active alerts', { error });
    res.status(500).json({ error: 'Failed to retrieve active alerts' });
  }
});

router.get('/alerts/history', requireAdmin, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const alertHistory = alertingService.getAlertHistory(limit);
    res.json({
      alerts: alertHistory,
      pagination: {
        limit,
        total: alertHistory.length
      }
    });
  } catch (error) {
    log.error('Failed to get alert history', { error });
    res.status(500).json({ error: 'Failed to retrieve alert history' });
  }
});

router.post('/alerts/:alertId/resolve', requireAdmin, (req, res) => {
  try {
    const { alertId } = req.params;
    alertingService.resolveAlert(alertId);
    
    log.info('Alert manually resolved', { 
      alertId, 
      resolvedBy: req.user?.id 
    });
    
    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    log.error('Failed to resolve alert', { 
      alertId: req.params.alertId, 
      error 
    });
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

router.get('/alerts/rules', requireAdmin, (req, res) => {
  try {
    const rules = alertingService.getAlertRules();
    res.json(rules);
  } catch (error) {
    log.error('Failed to get alert rules', { error });
    res.status(500).json({ error: 'Failed to retrieve alert rules' });
  }
});

// Test alert endpoint for verification (admin only)
router.post('/alerts/test', requireAdmin, async (req, res) => {
  try {
    const { type = 'test', severity = 'low', message = 'Test alert from API' } = req.body;
    
    await alertingService.triggerAlert({
      id: 'test-rule',
      name: 'Test Alert',
      type: 'custom',
      condition: {},
      severity: severity as any,
      cooldownMinutes: 0,
      isActive: true,
      recipients: [req.user?.email || 'admin@example.com'],
      channels: ['email']
    }, message, {
      triggeredBy: req.user?.id,
      source: 'manual_test'
    });
    
    log.info('Test alert triggered', { 
      triggeredBy: req.user?.id,
      type,
      severity,
      message 
    });
    
    res.json({ 
      message: 'Test alert triggered successfully',
      details: { type, severity, message }
    });
  } catch (error) {
    log.error('Failed to trigger test alert', { error });
    res.status(500).json({ error: 'Failed to trigger test alert' });
  }
});

// System status endpoint (authenticated users)
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { healthChecker } = await import('../services/monitoring/health-checker.service.js');
    const health = await healthChecker.runAllChecks();
    
    // Simplified status for regular users
    const status = {
      overall: health.overall.status,
      timestamp: health.overall.timestamp,
      uptime: health.overall.uptime,
      services: {
        database: health.checks.database?.status || 'unknown',
        crawler: health.checks.crawler?.status || 'unknown',
        apis: health.checks.external_apis?.status || 'unknown'
      }
    };
    
    res.json(status);
  } catch (error) {
    log.error('Failed to get system status', { error });
    res.status(500).json({ error: 'Failed to retrieve system status' });
  }
});

// Performance metrics endpoint (admin only)
router.get('/performance', requireAdmin, async (req, res) => {
  try {
    const { healthChecker } = await import('../services/monitoring/health-checker.service.js');
    const health = await healthChecker.runAllChecks();
    
    const performance = {
      memory: health.checks.memory?.metadata || {},
      database: {
        responseTime: health.checks.database?.responseTime || 0,
        status: health.checks.database?.status
      },
      uptime: health.overall.uptime,
      timestamp: health.overall.timestamp,
      resourceUsage: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    res.json(performance);
  } catch (error) {
    log.error('Failed to get performance metrics', { error });
    res.status(500).json({ error: 'Failed to retrieve performance metrics' });
  }
});

// Log level management (admin only)
router.get('/logs/level', requireAdmin, (req, res) => {
  try {
    const { logger } = require('../services/monitoring/logger.service.js');
    res.json({ 
      currentLevel: logger.level,
      availableLevels: ['error', 'warn', 'info', 'debug']
    });
  } catch (error) {
    log.error('Failed to get log level', { error });
    res.status(500).json({ error: 'Failed to retrieve log level' });
  }
});

router.post('/logs/level', requireAdmin, (req, res) => {
  try {
    const { level } = req.body;
    const validLevels = ['error', 'warn', 'info', 'debug'];
    
    if (!validLevels.includes(level)) {
      return res.status(400).json({ 
        error: 'Invalid log level',
        validLevels 
      });
    }
    
    const { logger } = require('../services/monitoring/logger.service.js');
    logger.level = level;
    
    log.info('Log level changed', { 
      newLevel: level,
      changedBy: req.user?.id 
    });
    
    res.json({ 
      message: 'Log level updated successfully',
      newLevel: level 
    });
  } catch (error) {
    log.error('Failed to update log level', { error });
    res.status(500).json({ error: 'Failed to update log level' });
  }
});

// System information endpoint (admin only)
router.get('/system', requireAdmin, (req, res) => {
  try {
    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        env: process.env.NODE_ENV
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
      freeMemory: require('os').freemem(),
      totalMemory: require('os').totalmem(),
      hostname: require('os').hostname(),
      timestamp: new Date().toISOString()
    };
    
    res.json(systemInfo);
  } catch (error) {
    log.error('Failed to get system information', { error });
    res.status(500).json({ error: 'Failed to retrieve system information' });
  }
});

// Restart monitoring services (admin only)
router.post('/restart', requireAdmin, async (req, res) => {
  try {
    log.warn('Monitoring services restart requested', { 
      requestedBy: req.user?.id 
    });
    
    // This would restart monitoring services if needed
    // For now, we'll just log the request
    res.json({ 
      message: 'Monitoring services restart logged',
      note: 'Manual restart may be required for full effect'
    });
  } catch (error) {
    log.error('Failed to restart monitoring services', { error });
    res.status(500).json({ error: 'Failed to restart monitoring services' });
  }
});

export default router;