import nodemailer from 'nodemailer';
import { log, metricsCollector } from './logger.service.js';
import type { SystemHealth, HealthCheck } from './health-checker.service.js';

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: any;
  notificationsSent: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'threshold' | 'pattern' | 'health_check' | 'custom';
  condition: {
    metric?: string;
    operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold?: number;
    healthCheck?: string;
    pattern?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMinutes: number;
  isActive: boolean;
  recipients: string[];
  channels: ('email' | 'slack' | 'webhook')[];
  lastTriggered?: string;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook';
  config: any;
}

export class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private emailTransporter: any;
  
  constructor() {
    this.setupEmailTransporter();
    this.setupDefaultRules();
    this.setupNotificationChannels();
    this.startAlertMonitoring();
  }
  
  private setupEmailTransporter() {
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      log.info('Email transporter configured', { 
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT 
      });
    } else {
      log.warn('Email notifications not configured - missing SMTP settings');
    }
  }
  
  private setupDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        type: 'threshold',
        condition: {
          metric: 'errors.total',
          operator: 'gt',
          threshold: 10
        },
        severity: 'high',
        cooldownMinutes: 30,
        isActive: true,
        recipients: [process.env.ALERT_EMAIL || 'admin@example.com'],
        channels: ['email']
      },
      {
        id: 'database-unhealthy',
        name: 'Database Health Critical',
        type: 'health_check',
        condition: {
          healthCheck: 'database'
        },
        severity: 'critical',
        cooldownMinutes: 15,
        isActive: true,
        recipients: [process.env.ALERT_EMAIL || 'admin@example.com'],
        channels: ['email', 'slack']
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        type: 'threshold',
        condition: {
          metric: 'memory.usage_percent',
          operator: 'gt',
          threshold: 90
        },
        severity: 'medium',
        cooldownMinutes: 60,
        isActive: true,
        recipients: [process.env.ALERT_EMAIL || 'admin@example.com'],
        channels: ['email']
      },
      {
        id: 'crawler-inactive',
        name: 'Crawler Inactive',
        type: 'health_check',
        condition: {
          healthCheck: 'crawler'
        },
        severity: 'medium',
        cooldownMinutes: 120,
        isActive: true,
        recipients: [process.env.ALERT_EMAIL || 'admin@example.com'],
        channels: ['email']
      },
      {
        id: 'slow-response-time',
        name: 'Slow API Response Time',
        type: 'threshold',
        condition: {
          metric: 'api.avg_response_time',
          operator: 'gt',
          threshold: 2000
        },
        severity: 'low',
        cooldownMinutes: 60,
        isActive: true,
        recipients: [process.env.ALERT_EMAIL || 'admin@example.com'],
        channels: ['email']
      }
    ];
    
    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
    
    log.info('Default alert rules configured', { ruleCount: defaultRules.length });
  }
  
  private setupNotificationChannels() {
    // Email channel
    if (this.emailTransporter) {
      this.notificationChannels.set('email', {
        type: 'email',
        config: {
          from: process.env.ALERT_FROM_EMAIL || 'alerts@rivaloutranker.com',
          transporter: this.emailTransporter
        }
      });
    }
    
    // Slack channel
    if (process.env.SLACK_WEBHOOK_URL) {
      this.notificationChannels.set('slack', {
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: 'RivalOutranker Alerts'
        }
      });
    }
    
    // Custom webhook channel
    if (process.env.ALERT_WEBHOOK_URL) {
      this.notificationChannels.set('webhook', {
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.ALERT_WEBHOOK_TOKEN ? `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}` : undefined
          }
        }
      });
    }
    
    log.info('Notification channels configured', { 
      channels: Array.from(this.notificationChannels.keys()) 
    });
  }
  
  private startAlertMonitoring() {
    // Check alert rules every 5 minutes
    setInterval(() => {
      this.checkAllRules();
    }, 5 * 60 * 1000);
    
    // Auto-resolve old alerts every 30 minutes
    setInterval(() => {
      this.autoResolveOldAlerts();
    }, 30 * 60 * 1000);
    
    log.info('Alert monitoring started');
  }
  
  async checkAllRules() {
    const activeRules = Array.from(this.alertRules.values()).filter(rule => rule.isActive);
    
    for (const rule of activeRules) {
      try {
        await this.checkRule(rule);
      } catch (error) {
        log.error('Error checking alert rule', { 
          ruleId: rule.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }
  
  private async checkRule(rule: AlertRule) {
    // Check cooldown period
    if (rule.lastTriggered) {
      const cooldownEnd = new Date(rule.lastTriggered).getTime() + (rule.cooldownMinutes * 60 * 1000);
      if (Date.now() < cooldownEnd) {
        return;
      }
    }
    
    let shouldTrigger = false;
    let alertMessage = '';
    let metadata: any = {};
    
    switch (rule.type) {
      case 'threshold':
        const result = await this.checkThresholdRule(rule);
        shouldTrigger = result.triggered;
        alertMessage = result.message;
        metadata = result.metadata;
        break;
        
      case 'health_check':
        const healthResult = await this.checkHealthRule(rule);
        shouldTrigger = healthResult.triggered;
        alertMessage = healthResult.message;
        metadata = healthResult.metadata;
        break;
        
      case 'pattern':
        // Pattern-based rules (e.g., log pattern matching)
        // Implementation depends on specific requirements
        break;
        
      case 'custom':
        // Custom rule evaluation
        // Implementation depends on specific requirements
        break;
    }
    
    if (shouldTrigger) {
      await this.triggerAlert(rule, alertMessage, metadata);
    }
  }
  
  private async checkThresholdRule(rule: AlertRule): Promise<{
    triggered: boolean;
    message: string;
    metadata: any;
  }> {
    const { metric, operator, threshold } = rule.condition;
    
    if (!metric || !operator || threshold === undefined) {
      return { triggered: false, message: '', metadata: {} };
    }
    
    // Get current metric value
    const metrics = metricsCollector.getMetrics();
    const currentValue = this.getMetricValue(metrics, metric);
    
    if (currentValue === null) {
      return { triggered: false, message: '', metadata: {} };
    }
    
    let triggered = false;
    switch (operator) {
      case 'gt':
        triggered = currentValue > threshold;
        break;
      case 'gte':
        triggered = currentValue >= threshold;
        break;
      case 'lt':
        triggered = currentValue < threshold;
        break;
      case 'lte':
        triggered = currentValue <= threshold;
        break;
      case 'eq':
        triggered = currentValue === threshold;
        break;
    }
    
    const message = triggered ? 
      `${metric} is ${currentValue} (threshold: ${operator} ${threshold})` :
      '';
    
    return {
      triggered,
      message,
      metadata: {
        metric,
        currentValue,
        threshold,
        operator
      }
    };
  }
  
  private async checkHealthRule(rule: AlertRule): Promise<{
    triggered: boolean;
    message: string;
    metadata: any;
  }> {
    const { healthCheck } = rule.condition;
    
    if (!healthCheck) {
      return { triggered: false, message: '', metadata: {} };
    }
    
    // This would integrate with the health checker service
    // For now, we'll simulate the check
    try {
      const { healthChecker } = await import('./health-checker.service.js');
      const result = await healthChecker.runCheck(healthCheck);
      
      const triggered = result.status === 'unhealthy' || result.status === 'error';
      const message = triggered ? 
        `Health check '${healthCheck}' failed: ${result.message}` :
        '';
      
      return {
        triggered,
        message,
        metadata: {
          healthCheck,
          status: result.status,
          checkMessage: result.message
        }
      };
    } catch (error) {
      return {
        triggered: true,
        message: `Health check '${healthCheck}' error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { healthCheck, error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
  
  private getMetricValue(metrics: any, metricPath: string): number | null {
    const parts = metricPath.split('.');
    let value = metrics;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return typeof value === 'number' ? value : null;
  }
  
  async triggerAlert(rule: AlertRule, message: string, metadata: any = {}) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      type: rule.name,
      severity: rule.severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata,
      notificationsSent: []
    };
    
    this.alerts.set(alertId, alert);
    rule.lastTriggered = alert.timestamp;
    
    log.error('Alert triggered', {
      alertId,
      ruleId: rule.id,
      severity: rule.severity,
      message,
      metadata
    });
    
    // Send notifications
    await this.sendNotifications(alert, rule);
    
    // Track metric
    metricsCollector.incrementMetric('alerts.triggered', 1, {
      severity: rule.severity,
      type: rule.name
    });
  }
  
  private async sendNotifications(alert: Alert, rule: AlertRule) {
    for (const channelType of rule.channels) {
      try {
        await this.sendNotification(alert, rule, channelType);
        alert.notificationsSent.push(channelType);
      } catch (error) {
        log.error('Failed to send notification', {
          alertId: alert.id,
          channel: channelType,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  private async sendNotification(alert: Alert, rule: AlertRule, channelType: string) {
    const channel = this.notificationChannels.get(channelType);
    if (!channel) {
      throw new Error(`Notification channel '${channelType}' not configured`);
    }
    
    switch (channelType) {
      case 'email':
        await this.sendEmailNotification(alert, rule, channel.config);
        break;
      case 'slack':
        await this.sendSlackNotification(alert, rule, channel.config);
        break;
      case 'webhook':
        await this.sendWebhookNotification(alert, rule, channel.config);
        break;
    }
  }
  
  private async sendEmailNotification(alert: Alert, rule: AlertRule, config: any) {
    if (!config.transporter) {
      throw new Error('Email transporter not configured');
    }
    
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    };
    
    const subject = `${severityEmoji[alert.severity]} ${alert.severity.toUpperCase()}: ${alert.type}`;
    
    const html = `
      <h2>🚨 Alert Notification</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Alert ID:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${alert.id}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${alert.type}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Severity:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${severityEmoji[alert.severity]} ${alert.severity.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Message:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${alert.message}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(alert.timestamp).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Environment:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${process.env.NODE_ENV || 'development'}</td>
        </tr>
      </table>
      
      ${alert.metadata && Object.keys(alert.metadata).length > 0 ? `
        <h3>Additional Details:</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(alert.metadata, null, 2)}</pre>
      ` : ''}
      
      <p><small>This alert was generated by RivalOutranker monitoring system.</small></p>
    `;
    
    await config.transporter.sendMail({
      from: config.from,
      to: rule.recipients.join(', '),
      subject,
      html
    });
    
    log.info('Email notification sent', { alertId: alert.id, recipients: rule.recipients });
  }
  
  private async sendSlackNotification(alert: Alert, rule: AlertRule, config: any) {
    const severityColors = {
      low: '#ffeb3b',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#9c27b0'
    };
    
    const payload = {
      username: config.username || 'RivalOutranker Alerts',
      channel: config.channel || '#alerts',
      attachments: [{
        color: severityColors[alert.severity],
        title: `${alert.severity.toUpperCase()}: ${alert.type}`,
        text: alert.message,
        fields: [
          { title: 'Alert ID', value: alert.id, short: true },
          { title: 'Environment', value: process.env.NODE_ENV || 'development', short: true },
          { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: false }
        ],
        footer: 'RivalOutranker Monitoring',
        ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
      }]
    };
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
    
    log.info('Slack notification sent', { alertId: alert.id });
  }
  
  private async sendWebhookNotification(alert: Alert, rule: AlertRule, config: any) {
    const payload = {
      alert,
      rule: {
        id: rule.id,
        name: rule.name,
        severity: rule.severity
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: alert.timestamp
    };
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
    
    log.info('Webhook notification sent', { alertId: alert.id, url: config.url });
  }
  
  resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      
      log.info('Alert resolved', { alertId, resolvedAt: alert.resolvedAt });
      
      metricsCollector.incrementMetric('alerts.resolved', 1, {
        severity: alert.severity,
        type: alert.type
      });
    }
  }
  
  private autoResolveOldAlerts() {
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.alerts) {
      if (!alert.resolved && new Date(alert.timestamp).getTime() < fourHoursAgo) {
        this.resolveAlert(alertId);
        log.info('Auto-resolved old alert', { alertId, age: 'over 4 hours' });
      }
    }
  }
  
  // Public API methods
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }
  
  getAlertHistory(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  addAlertRule(rule: AlertRule) {
    this.alertRules.set(rule.id, rule);
    log.info('Alert rule added', { ruleId: rule.id, name: rule.name });
  }
  
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      log.info('Alert rule updated', { ruleId, updates });
    }
  }
  
  removeAlertRule(ruleId: string) {
    this.alertRules.delete(ruleId);
    log.info('Alert rule removed', { ruleId });
  }
  
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }
}

// Singleton instance
export const alertingService = new AlertingService();