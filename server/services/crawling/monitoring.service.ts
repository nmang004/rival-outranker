import { EventEmitter } from 'events';
import { db } from '../../db.js';
import { crawlJobs, crawledContent } from '../../../shared/schema.js';
import { eq, and, sql, gte, lt } from 'drizzle-orm';

export interface CrawlEvent {
  id: string;
  type: 'start' | 'success' | 'error' | 'timeout' | 'retry' | 'complete';
  jobId: string;
  jobName: string;
  timestamp: Date;
  duration?: number;
  error?: string;
  metadata?: any;
}

export interface CrawlMetrics {
  totalJobs: number;
  activeJobs: number;
  successRate: number;
  averageDuration: number;
  errorRate: number;
  lastActivity: Date | undefined;
  resourceUsage: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'error_rate' | 'success_rate' | 'duration' | 'failure_count' | 'resource_usage';
  threshold: number;
  timeWindow: number; // minutes
  isActive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggeredAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: any;
}

export class CrawlingMonitoringService extends EventEmitter {
  private metrics: Map<string, any> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private eventBuffer: CrawlEvent[] = [];
  private maxBufferSize = 1000;

  constructor() {
    super();
    this.setupDefaultAlertRules();
    this.startMetricsCollection();
  }

  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        type: 'error_rate',
        threshold: 20, // 20% error rate
        timeWindow: 60, // 1 hour
        isActive: true,
        severity: 'high',
        recipients: ['admin@example.com']
      },
      {
        id: 'low-success-rate',
        name: 'Low Success Rate',
        type: 'success_rate',
        threshold: 80, // Below 80% success rate
        timeWindow: 120, // 2 hours
        isActive: true,
        severity: 'medium',
        recipients: ['admin@example.com']
      },
      {
        id: 'slow-crawls',
        name: 'Slow Crawl Performance',
        type: 'duration',
        threshold: 300000, // 5 minutes
        timeWindow: 30,
        isActive: true,
        severity: 'low',
        recipients: ['admin@example.com']
      },
      {
        id: 'multiple-failures',
        name: 'Multiple Consecutive Failures',
        type: 'failure_count',
        threshold: 5, // 5 consecutive failures
        timeWindow: 30,
        isActive: true,
        severity: 'critical',
        recipients: ['admin@example.com']
      }
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  private startMetricsCollection(): void {
    // Collect metrics every minute
    setInterval(() => {
      this.collectMetrics();
    }, 60000);

    // Check alert rules every 5 minutes
    setInterval(() => {
      this.checkAlertRules();
    }, 300000);

    // Cleanup old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 3600000);
  }

  logEvent(event: Omit<CrawlEvent, 'id' | 'timestamp'>): void {
    const crawlEvent: CrawlEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...event
    };

    this.eventBuffer.push(crawlEvent);
    
    // Trim buffer if it gets too large
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.maxBufferSize);
    }

    // Emit event for real-time monitoring
    this.emit('crawlEvent', crawlEvent);

    // Log to console for debugging
    console.log(`[CRAWL ${event.type.toUpperCase()}] ${event.jobName}: ${event.error || 'OK'}`);

    // Check for immediate alerts
    this.checkImmediateAlerts(crawlEvent);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.calculateCurrentMetrics();
      this.metrics.set('current', metrics);
      
      // Store historical metrics
      const timestamp = new Date();
      this.metrics.set(`history_${timestamp.getTime()}`, {
        ...metrics,
        timestamp
      });

      // Keep only last 24 hours of metrics
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      for (const [key] of this.metrics) {
        if (key.startsWith('history_')) {
          const timestamp = parseInt(key.split('_')[1]);
          if (timestamp < oneDayAgo) {
            this.metrics.delete(key);
          }
        }
      }

      this.emit('metricsUpdated', metrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  private async calculateCurrentMetrics(): Promise<CrawlMetrics> {
    try {
      // Get job statistics
      const totalJobsResult = await db().select({ count: sql<number>`count(*)` })
        .from(crawlJobs);
      
      const activeJobsResult = await db().select({ count: sql<number>`count(*)` })
        .from(crawlJobs)
        .where(eq(crawlJobs.isActive, true));

      // Calculate success rate from recent events (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentEvents = this.eventBuffer.filter(e => e.timestamp >= oneHourAgo);
      
      const successEvents = recentEvents.filter(e => e.type === 'success').length;
      const errorEvents = recentEvents.filter(e => e.type === 'error').length;
      const totalRecentEvents = successEvents + errorEvents;
      
      const successRate = totalRecentEvents > 0 ? (successEvents / totalRecentEvents) * 100 : 100;
      const errorRate = totalRecentEvents > 0 ? (errorEvents / totalRecentEvents) * 100 : 0;

      // Calculate average duration
      const completedEvents = recentEvents.filter(e => e.type === 'complete' && e.duration);
      const averageDuration = completedEvents.length > 0 
        ? completedEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / completedEvents.length
        : 0;

      // Get last activity
      const lastActivity = this.eventBuffer.length > 0 
        ? this.eventBuffer[this.eventBuffer.length - 1].timestamp
        : undefined;

      // Get resource usage
      const resourceUsage = this.getResourceUsage();

      return {
        totalJobs: totalJobsResult[0]?.count || 0,
        activeJobs: activeJobsResult[0]?.count || 0,
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        averageDuration: Math.round(averageDuration),
        lastActivity,
        resourceUsage
      };
    } catch (error) {
      console.error('Failed to calculate metrics:', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        successRate: 0,
        errorRate: 0,
        averageDuration: 0,
        lastActivity: undefined,
        resourceUsage: {
          memoryUsage: 0,
          cpuUsage: 0,
          activeConnections: 0
        }
      };
    }
  }

  private getResourceUsage(): { memoryUsage: number; cpuUsage: number; activeConnections: number } {
    const memUsage = process.memoryUsage();
    
    return {
      memoryUsage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      cpuUsage: 0, // Would need additional monitoring for CPU usage
      activeConnections: this.eventBuffer.filter(e => 
        e.type === 'start' && Date.now() - e.timestamp.getTime() < 300000
      ).length
    };
  }

  private checkImmediateAlerts(event: CrawlEvent): void {
    // Check for consecutive failures
    if (event.type === 'error') {
      const recentEvents = this.eventBuffer
        .filter(e => e.jobId === event.jobId)
        .slice(-10); // Check last 10 events for this job

      const consecutiveErrors = [];
      for (let i = recentEvents.length - 1; i >= 0; i--) {
        if (recentEvents[i].type === 'error') {
          consecutiveErrors.push(recentEvents[i]);
        } else {
          break;
        }
      }

      if (consecutiveErrors.length >= 3) {
        this.triggerAlert('multiple-failures', {
          jobId: event.jobId,
          jobName: event.jobName,
          consecutiveErrors: consecutiveErrors.length,
          lastError: event.error
        });
      }
    }

    // Check for timeout events
    if (event.type === 'timeout') {
      this.triggerAlert('timeout-detected', {
        jobId: event.jobId,
        jobName: event.jobName,
        duration: event.duration
      });
    }
  }

  private async checkAlertRules(): Promise<void> {
    const currentMetrics = this.metrics.get('current');
    if (!currentMetrics) return;

    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.isActive) continue;

      try {
        const shouldTrigger = await this.evaluateAlertRule(rule, currentMetrics);
        
        if (shouldTrigger && !this.activeAlerts.has(ruleId)) {
          this.triggerAlert(ruleId, currentMetrics);
        } else if (!shouldTrigger && this.activeAlerts.has(ruleId)) {
          this.resolveAlert(ruleId);
        }
      } catch (error) {
        console.error(`Failed to check alert rule ${ruleId}:`, error);
      }
    }
  }

  private async evaluateAlertRule(rule: AlertRule, metrics: CrawlMetrics): Promise<boolean> {
    switch (rule.type) {
      case 'error_rate':
        return metrics.errorRate > rule.threshold;
      
      case 'success_rate':
        return metrics.successRate < rule.threshold;
      
      case 'duration':
        return metrics.averageDuration > rule.threshold;
      
      case 'failure_count':
        // This is handled in immediate alerts
        return false;
      
      case 'resource_usage':
        return metrics.resourceUsage.memoryUsage > rule.threshold;
      
      default:
        return false;
    }
  }

  private triggerAlert(ruleId: string, metadata?: any): void {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return;

    const alert: Alert = {
      id: crypto.randomUUID(),
      ruleId,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, metadata),
      triggeredAt: new Date(),
      resolved: false,
      metadata
    };

    this.activeAlerts.set(ruleId, alert);
    rule.lastTriggered = new Date();

    this.emit('alertTriggered', alert);
    
    console.error(`[ALERT ${alert.severity.toUpperCase()}] ${alert.message}`);
    
    // Send notifications (email, Slack, etc.)
    this.sendAlertNotifications(alert, rule.recipients);
  }

  private resolveAlert(ruleId: string): void {
    const alert = this.activeAlerts.get(ruleId);
    if (!alert) return;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.activeAlerts.delete(ruleId);
    this.emit('alertResolved', alert);
    
    console.log(`[ALERT RESOLVED] ${alert.message}`);
  }

  private generateAlertMessage(rule: AlertRule, metadata?: any): string {
    switch (rule.type) {
      case 'error_rate':
        return `High error rate detected: ${metadata?.errorRate?.toFixed(1)}% (threshold: ${rule.threshold}%)`;
      
      case 'success_rate':
        return `Low success rate detected: ${metadata?.successRate?.toFixed(1)}% (threshold: ${rule.threshold}%)`;
      
      case 'duration':
        return `Slow crawl performance detected: ${Math.round(metadata?.averageDuration / 1000)}s average (threshold: ${Math.round(rule.threshold / 1000)}s)`;
      
      case 'failure_count':
        return `Multiple consecutive failures for job "${metadata?.jobName}": ${metadata?.consecutiveErrors} failures`;
      
      case 'resource_usage':
        return `High resource usage detected: ${metadata?.resourceUsage?.memoryUsage}% memory (threshold: ${rule.threshold}%)`;
      
      default:
        return `Alert triggered for rule: ${rule.name}`;
    }
  }

  private async sendAlertNotifications(alert: Alert, recipients: string[]): Promise<void> {
    // This would integrate with your notification system
    // For now, just log to console
    console.log(`Alert notification would be sent to: ${recipients.join(', ')}`);
    console.log(`Alert: ${alert.message}`);
  }

  private cleanupOldEvents(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    this.eventBuffer = this.eventBuffer.filter(event => event.timestamp >= cutoffTime);
  }

  // Public API methods
  async getMetrics(): Promise<CrawlMetrics> {
    return this.metrics.get('current') || await this.calculateCurrentMetrics();
  }

  getRecentEvents(limit: number = 100): CrawlEvent[] {
    return this.eventBuffer.slice(-limit).reverse();
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(): Alert[] {
    // Would typically come from database
    return [];
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    if (this.activeAlerts.has(ruleId)) {
      this.resolveAlert(ruleId);
    }
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      this.alertRules.set(ruleId, { ...rule, ...updates });
    }
  }

  async getHistoricalMetrics(hours: number = 24): Promise<Array<CrawlMetrics & { timestamp: Date }>> {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const historical: Array<CrawlMetrics & { timestamp: Date }> = [];

    for (const [key, value] of this.metrics) {
      if (key.startsWith('history_')) {
        const timestamp = parseInt(key.split('_')[1]);
        if (timestamp >= cutoffTime) {
          historical.push(value);
        }
      }
    }

    return historical.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getJobPerformance(jobId: string): Promise<{
    successRate: number;
    averageDuration: number;
    errorCount: number;
    lastRun?: Date;
    recentErrors: string[];
  }> {
    const jobEvents = this.eventBuffer.filter(e => e.jobId === jobId);
    
    const successEvents = jobEvents.filter(e => e.type === 'success');
    const errorEvents = jobEvents.filter(e => e.type === 'error');
    const completeEvents = jobEvents.filter(e => e.type === 'complete' && e.duration);
    
    const successRate = jobEvents.length > 0 ? (successEvents.length / jobEvents.length) * 100 : 0;
    const averageDuration = completeEvents.length > 0 
      ? completeEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / completeEvents.length
      : 0;
    
    const lastRun = jobEvents.length > 0 
      ? jobEvents[jobEvents.length - 1].timestamp
      : undefined;
    
    const recentErrors = errorEvents
      .slice(-5)
      .map(e => e.error || 'Unknown error')
      .filter(Boolean);

    return {
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      errorCount: errorEvents.length,
      lastRun,
      recentErrors
    };
  }

  // Health check endpoint
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    activeJobs: number;
    recentErrors: number;
    resourceUsage: any;
    lastActivity?: Date;
  }> {
    const metrics = await this.getMetrics();
    const recentErrors = this.eventBuffer.filter(e => 
      e.type === 'error' && e.timestamp > new Date(Date.now() - 60 * 60 * 1000)
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.errorRate > 50 || recentErrors > 10) {
      status = 'unhealthy';
    } else if (metrics.errorRate > 20 || recentErrors > 5) {
      status = 'degraded';
    }

    return {
      status,
      uptime: process.uptime(),
      activeJobs: metrics.activeJobs,
      recentErrors,
      resourceUsage: metrics.resourceUsage,
      lastActivity: metrics.lastActivity
    };
  }
}