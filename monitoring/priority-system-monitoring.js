// Priority System Monitoring Configuration
// Monitors the health and performance of the enhanced priority system

const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Monitoring configuration
const MONITORING_CONFIG = {
  // Performance thresholds
  thresholds: {
    priorityAccuracy: 90,        // Minimum accuracy percentage
    processingTime: 60000,       // Maximum processing time in ms (60 seconds)
    memoryUsage: 200 * 1024 * 1024, // Maximum memory usage in bytes (200MB)
    templateDetectionRate: 80,   // Minimum template detection rate percentage
    priorityOFIRatio: {
      min: 0.05,                 // Minimum 5% Priority OFI
      max: 0.40                  // Maximum 40% Priority OFI
    }
  },
  
  // Monitoring intervals
  intervals: {
    healthCheck: 60000,          // 1 minute
    performanceCheck: 300000,    // 5 minutes
    accuracyCheck: 900000,       // 15 minutes
    reportGeneration: 3600000    // 1 hour
  },
  
  // Alert settings
  alerts: {
    email: process.env.ALERT_EMAIL || 'admin@example.com',
    webhook: process.env.ALERT_WEBHOOK || null,
    retryCount: 3,
    retryDelay: 30000           // 30 seconds
  }
};

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/priority-system-monitoring.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Monitoring state
const monitoringState = {
  startTime: Date.now(),
  checks: {
    health: { count: 0, failures: 0, lastCheck: null, lastFailure: null },
    performance: { count: 0, failures: 0, lastCheck: null, lastFailure: null },
    accuracy: { count: 0, failures: 0, lastCheck: null, lastFailure: null }
  },
  metrics: {
    priorityAccuracy: [],
    processingTimes: [],
    memoryUsage: [],
    templateDetectionRates: [],
    priorityOFIRatios: []
  },
  alerts: {
    sent: 0,
    lastAlert: null,
    suppressedUntil: null
  }
};

// Utility functions
function calculateAverage(array) {
  return array.length > 0 ? array.reduce((a, b) => a + b, 0) / array.length : 0;
}

function calculatePercentile(array, percentile) {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function addMetric(metricArray, value, maxSize = 100) {
  metricArray.push(value);
  if (metricArray.length > maxSize) {
    metricArray.shift();
  }
}

// Health check functions
async function checkPrioritySystemHealth() {
  const check = monitoringState.checks.health;
  check.count++;
  check.lastCheck = new Date();
  
  try {
    logger.info('Starting priority system health check');
    
    // Check if priority system files exist
    const requiredFiles = [
      '../server/services/audit/issue-grouping.service.ts',
      '../server/services/audit/enhanced-analyzer.service.ts',
      '../server/services/audit/page-priority.service.ts',
      '../server/services/audit/ofi-classification.service.ts'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required priority system file missing: ${file}`);
      }
    }
    
    // Check if override system was properly removed
    const overrideFiles = [
      '../server/services/audit/page-classification-override.service.ts',
      '../server/repositories/page-classification-override.repository.ts'
    ];
    
    for (const file of overrideFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        throw new Error(`Override system file should have been removed: ${file}`);
      }
    }
    
    logger.info('Priority system health check passed');
    return true;
    
  } catch (error) {
    check.failures++;
    check.lastFailure = new Date();
    logger.error('Priority system health check failed', { error: error.message });
    
    await sendAlert('health', `Priority system health check failed: ${error.message}`);
    return false;
  }
}

async function checkPerformanceMetrics() {
  const check = monitoringState.checks.performance;
  check.count++;
  check.lastCheck = new Date();
  
  try {
    logger.info('Starting performance metrics check');
    
    // Get current memory usage
    const memoryUsage = process.memoryUsage().heapUsed;
    addMetric(monitoringState.metrics.memoryUsage, memoryUsage);
    
    // Check memory threshold
    if (memoryUsage > MONITORING_CONFIG.thresholds.memoryUsage) {
      throw new Error(`Memory usage exceeds threshold: ${Math.round(memoryUsage / 1024 / 1024)}MB > ${Math.round(MONITORING_CONFIG.thresholds.memoryUsage / 1024 / 1024)}MB`);
    }
    
    // Calculate metrics
    const avgMemory = calculateAverage(monitoringState.metrics.memoryUsage);
    const p95Memory = calculatePercentile(monitoringState.metrics.memoryUsage, 95);
    const avgProcessingTime = calculateAverage(monitoringState.metrics.processingTimes);
    const p95ProcessingTime = calculatePercentile(monitoringState.metrics.processingTimes, 95);
    
    logger.info('Performance metrics', {
      currentMemoryMB: Math.round(memoryUsage / 1024 / 1024),
      avgMemoryMB: Math.round(avgMemory / 1024 / 1024),
      p95MemoryMB: Math.round(p95Memory / 1024 / 1024),
      avgProcessingTimeMs: Math.round(avgProcessingTime),
      p95ProcessingTimeMs: Math.round(p95ProcessingTime)
    });
    
    // Check processing time if we have data
    if (monitoringState.metrics.processingTimes.length > 0 && p95ProcessingTime > MONITORING_CONFIG.thresholds.processingTime) {
      throw new Error(`95th percentile processing time exceeds threshold: ${Math.round(p95ProcessingTime)}ms > ${MONITORING_CONFIG.thresholds.processingTime}ms`);
    }
    
    logger.info('Performance metrics check passed');
    return true;
    
  } catch (error) {
    check.failures++;
    check.lastFailure = new Date();
    logger.error('Performance metrics check failed', { error: error.message });
    
    await sendAlert('performance', `Performance check failed: ${error.message}`);
    return false;
  }
}

async function checkAccuracyMetrics() {
  const check = monitoringState.checks.accuracy;
  check.count++;
  check.lastCheck = new Date();
  
  try {
    logger.info('Starting accuracy metrics check');
    
    if (monitoringState.metrics.priorityAccuracy.length === 0) {
      logger.info('No accuracy data available yet');
      return true;
    }
    
    const avgAccuracy = calculateAverage(monitoringState.metrics.priorityAccuracy);
    const avgTemplateDetection = calculateAverage(monitoringState.metrics.templateDetectionRates);
    const avgPriorityRatio = calculateAverage(monitoringState.metrics.priorityOFIRatios);
    
    // Check accuracy threshold
    if (avgAccuracy < MONITORING_CONFIG.thresholds.priorityAccuracy) {
      throw new Error(`Priority accuracy below threshold: ${avgAccuracy.toFixed(1)}% < ${MONITORING_CONFIG.thresholds.priorityAccuracy}%`);
    }
    
    // Check template detection rate
    if (avgTemplateDetection < MONITORING_CONFIG.thresholds.templateDetectionRate) {
      throw new Error(`Template detection rate below threshold: ${avgTemplateDetection.toFixed(1)}% < ${MONITORING_CONFIG.thresholds.templateDetectionRate}%`);
    }
    
    // Check Priority OFI ratio
    if (avgPriorityRatio < MONITORING_CONFIG.thresholds.priorityOFIRatio.min || 
        avgPriorityRatio > MONITORING_CONFIG.thresholds.priorityOFIRatio.max) {
      throw new Error(`Priority OFI ratio outside acceptable range: ${(avgPriorityRatio * 100).toFixed(1)}% (expected ${MONITORING_CONFIG.thresholds.priorityOFIRatio.min * 100}%-${MONITORING_CONFIG.thresholds.priorityOFIRatio.max * 100}%)`);
    }
    
    logger.info('Accuracy metrics', {
      priorityAccuracy: `${avgAccuracy.toFixed(1)}%`,
      templateDetectionRate: `${avgTemplateDetection.toFixed(1)}%`,
      priorityOFIRatio: `${(avgPriorityRatio * 100).toFixed(1)}%`
    });
    
    logger.info('Accuracy metrics check passed');
    return true;
    
  } catch (error) {
    check.failures++;
    check.lastFailure = new Date();
    logger.error('Accuracy metrics check failed', { error: error.message });
    
    await sendAlert('accuracy', `Accuracy check failed: ${error.message}`);
    return false;
  }
}

// Alert functions
async function sendAlert(type, message) {
  // Check if alerts are suppressed
  if (monitoringState.alerts.suppressedUntil && Date.now() < monitoringState.alerts.suppressedUntil) {
    logger.info(`Alert suppressed: ${message}`);
    return;
  }
  
  monitoringState.alerts.sent++;
  monitoringState.alerts.lastAlert = new Date();
  
  const alertData = {
    timestamp: new Date().toISOString(),
    type,
    message,
    severity: getSeverity(type),
    system: 'Priority System v2.0',
    environment: process.env.NODE_ENV || 'development',
    metrics: getRecentMetrics()
  };
  
  logger.error('ALERT', alertData);
  
  // Send email alert if configured
  if (MONITORING_CONFIG.alerts.email) {
    await sendEmailAlert(alertData);
  }
  
  // Send webhook alert if configured
  if (MONITORING_CONFIG.alerts.webhook) {
    await sendWebhookAlert(alertData);
  }
  
  // Suppress alerts for 15 minutes to prevent spam
  monitoringState.alerts.suppressedUntil = Date.now() + 900000;
}

function getSeverity(type) {
  const severityMap = {
    health: 'critical',
    performance: 'warning',
    accuracy: 'high'
  };
  return severityMap[type] || 'medium';
}

function getRecentMetrics() {
  return {
    avgMemoryMB: Math.round(calculateAverage(monitoringState.metrics.memoryUsage) / 1024 / 1024),
    avgProcessingTimeMs: Math.round(calculateAverage(monitoringState.metrics.processingTimes)),
    avgAccuracy: calculateAverage(monitoringState.metrics.priorityAccuracy).toFixed(1),
    avgTemplateDetection: calculateAverage(monitoringState.metrics.templateDetectionRates).toFixed(1),
    checksPerformed: monitoringState.checks.health.count + monitoringState.checks.performance.count + monitoringState.checks.accuracy.count,
    totalFailures: monitoringState.checks.health.failures + monitoringState.checks.performance.failures + monitoringState.checks.accuracy.failures
  };
}

async function sendEmailAlert(alertData) {
  // Email implementation would go here
  // For now, just log that an email would be sent
  logger.info('Email alert would be sent', { 
    to: MONITORING_CONFIG.alerts.email,
    subject: `Priority System Alert: ${alertData.type}`,
    severity: alertData.severity
  });
}

async function sendWebhookAlert(alertData) {
  // Webhook implementation would go here
  // For now, just log that a webhook would be called
  logger.info('Webhook alert would be sent', { 
    url: MONITORING_CONFIG.alerts.webhook,
    payload: alertData
  });
}

// Reporting functions
function generateHourlyReport() {
  const report = {
    timestamp: new Date().toISOString(),
    period: 'hourly',
    uptime: Date.now() - monitoringState.startTime,
    checks: {
      health: {
        performed: monitoringState.checks.health.count,
        failed: monitoringState.checks.health.failures,
        successRate: ((monitoringState.checks.health.count - monitoringState.checks.health.failures) / Math.max(1, monitoringState.checks.health.count) * 100).toFixed(1)
      },
      performance: {
        performed: monitoringState.checks.performance.count,
        failed: monitoringState.checks.performance.failures,
        successRate: ((monitoringState.checks.performance.count - monitoringState.checks.performance.failures) / Math.max(1, monitoringState.checks.performance.count) * 100).toFixed(1)
      },
      accuracy: {
        performed: monitoringState.checks.accuracy.count,
        failed: monitoringState.checks.accuracy.failures,
        successRate: ((monitoringState.checks.accuracy.count - monitoringState.checks.accuracy.failures) / Math.max(1, monitoringState.checks.accuracy.count) * 100).toFixed(1)
      }
    },
    metrics: getRecentMetrics(),
    alerts: {
      sent: monitoringState.alerts.sent,
      lastAlert: monitoringState.alerts.lastAlert,
      suppressed: monitoringState.alerts.suppressedUntil > Date.now()
    }
  };
  
  logger.info('Hourly monitoring report', report);
  
  // Save report to file
  const reportPath = path.join(__dirname, '../logs/monitoring-reports', `report-${new Date().toISOString().slice(0, 13)}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

// API for external metric reporting
function reportAuditMetrics(auditResults) {
  if (!auditResults) return;
  
  const {
    processingTime,
    priorityAccuracy,
    templateDetectionRate,
    priorityOFIRatio
  } = auditResults;
  
  if (typeof processingTime === 'number') {
    addMetric(monitoringState.metrics.processingTimes, processingTime);
  }
  
  if (typeof priorityAccuracy === 'number') {
    addMetric(monitoringState.metrics.priorityAccuracy, priorityAccuracy);
  }
  
  if (typeof templateDetectionRate === 'number') {
    addMetric(monitoringState.metrics.templateDetectionRates, templateDetectionRate);
  }
  
  if (typeof priorityOFIRatio === 'number') {
    addMetric(monitoringState.metrics.priorityOFIRatios, priorityOFIRatio);
  }
  
  logger.info('Audit metrics reported', {
    processingTime,
    priorityAccuracy,
    templateDetectionRate,
    priorityOFIRatio
  });
}

// Start monitoring
function startMonitoring() {
  logger.info('Starting Priority System monitoring', {
    config: MONITORING_CONFIG,
    startTime: new Date().toISOString()
  });
  
  // Schedule periodic checks
  setInterval(checkPrioritySystemHealth, MONITORING_CONFIG.intervals.healthCheck);
  setInterval(checkPerformanceMetrics, MONITORING_CONFIG.intervals.performanceCheck);
  setInterval(checkAccuracyMetrics, MONITORING_CONFIG.intervals.accuracyCheck);
  setInterval(generateHourlyReport, MONITORING_CONFIG.intervals.reportGeneration);
  
  // Initial checks
  setTimeout(checkPrioritySystemHealth, 5000);
  setTimeout(checkPerformanceMetrics, 10000);
  setTimeout(checkAccuracyMetrics, 15000);
  
  logger.info('Priority System monitoring started successfully');
}

// Stop monitoring
function stopMonitoring() {
  logger.info('Stopping Priority System monitoring');
  // In a real implementation, you would clear intervals here
}

// Export monitoring interface
module.exports = {
  startMonitoring,
  stopMonitoring,
  reportAuditMetrics,
  getMonitoringState: () => ({ ...monitoringState }),
  generateReport: generateHourlyReport,
  config: MONITORING_CONFIG
};