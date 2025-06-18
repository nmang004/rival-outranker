import { MonitoringRepository } from '../../repositories/monitoring.repository';
import { 
  InsertSystemMetrics, 
  InsertBusinessMetrics, 
  SystemMetrics, 
  BusinessMetrics 
} from '../../../shared/schema/monitoring';
import os from 'os';
import { performance } from 'perf_hooks';

interface CollectedMetrics {
  system: InsertSystemMetrics;
  business: Partial<InsertBusinessMetrics>;
}

interface MetricCollectorConfig {
  collectInterval: number; // milliseconds
  retentionDays: {
    systemMetrics: number;
    businessMetrics: number;
    alertHistory: number;
  };
  enabledMetrics: {
    system: boolean;
    business: boolean;
    external: boolean;
  };
}

export class MetricsCollectorService {
  private repository: MonitoringRepository;
  private config: MetricCollectorConfig;
  private collectionTimer: NodeJS.Timeout | null = null;
  private requestMetrics: Map<string, { count: number; totalTime: number; errors: number }> = new Map();
  private activeUsers: Set<string> = new Set();
  private auditsInProgress: number = 0;
  private externalApiMetrics: Map<string, { calls: number; successes: number; failures: number }> = new Map();

  constructor(config?: Partial<MetricCollectorConfig>) {
    this.repository = new MonitoringRepository();
    this.config = {
      collectInterval: 60000, // 1 minute
      retentionDays: {
        systemMetrics: 30,
        businessMetrics: 365,
        alertHistory: 90,
      },
      enabledMetrics: {
        system: true,
        business: true,
        external: true,
      },
      ...config,
    };
  }

  public startCollection(): void {
    if (this.collectionTimer) {
      this.stopCollection();
    }

    console.log('Starting metrics collection...');
    this.collectionTimer = setInterval(
      () => this.collectAndStoreMetrics(),
      this.config.collectInterval
    );

    // Collect initial metrics
    this.collectAndStoreMetrics();

    // Setup cleanup job (runs once per day)
    setInterval(() => this.cleanupOldMetrics(), 24 * 60 * 60 * 1000);
  }

  public stopCollection(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
      console.log('Stopped metrics collection');
    }
  }

  private async collectAndStoreMetrics(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();

      if (this.config.enabledMetrics.system) {
        await this.repository.insertSystemMetrics(metrics.system);
      }

      if (this.config.enabledMetrics.business && metrics.business.activeUsers !== undefined) {
        const dateKey = new Date().toISOString().split('T')[0];
        await this.repository.upsertDailyBusinessMetrics(dateKey, metrics.business as any);
      }

      // Reset interval counters
      this.resetIntervalMetrics();
    } catch (error) {
      console.error('Failed to collect and store metrics:', error);
    }
  }

  private async collectMetrics(): Promise<CollectedMetrics> {
    const systemMetrics = await this.collectSystemMetrics();
    const businessMetrics = await this.collectBusinessMetrics();

    return {
      system: systemMetrics,
      business: businessMetrics,
    };
  }

  private async collectSystemMetrics(): Promise<InsertSystemMetrics> {
    // Calculate performance metrics
    const totalRequests = Array.from(this.requestMetrics.values())
      .reduce((sum, metric) => sum + metric.count, 0);
    
    const totalErrors = Array.from(this.requestMetrics.values())
      .reduce((sum, metric) => sum + metric.errors, 0);
    
    const avgResponseTime = totalRequests > 0 
      ? Array.from(this.requestMetrics.values())
          .reduce((sum, metric) => sum + metric.totalTime, 0) / totalRequests
      : 0;

    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    // Get system resource usage
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = await this.getCpuUsage();
    const diskUsage = await this.getDiskUsage();

    // Get database metrics
    const dbMetrics = await this.getDatabaseMetrics();

    // Get external API metrics
    const externalMetrics = this.getExternalApiMetrics();

    return {
      avgResponseTime,
      errorRate,
      memoryUsage: memoryUsage.percentage,
      cpuUsage,
      diskUsage,
      activeUsers: this.activeUsers.size,
      auditsInProgress: this.auditsInProgress,
      totalRequests,
      successfulRequests: totalRequests - totalErrors,
      failedRequests: totalErrors,
      dbConnections: dbMetrics.connections,
      dbResponseTime: dbMetrics.responseTime,
      dbQueryCount: dbMetrics.queryCount,
      openaiCalls: externalMetrics.openai.calls,
      openaiSuccessRate: externalMetrics.openai.successRate,
      dataforseoCalls: externalMetrics.dataforseo.calls,
      dataforseoSuccessRate: externalMetrics.dataforseo.successRate,
      googleApiCalls: externalMetrics.google.calls,
      googleApiSuccessRate: externalMetrics.google.successRate,
      additionalMetrics: {
        memoryDetails: memoryUsage,
        nodeVersion: process.version,
        platform: os.platform(),
        uptime: process.uptime(),
      },
    };
  }

  private async collectBusinessMetrics(): Promise<Partial<InsertBusinessMetrics>> {
    // This would typically query your application database for business metrics
    // For now, we'll use the accumulated data from tracking methods
    
    const totalAudits = this.getAuditMetrics();
    const userMetrics = this.getUserMetrics();
    const featureUsage = this.getFeatureUsage();

    return {
      totalAudits: totalAudits.total,
      successfulAudits: totalAudits.successful,
      failedAudits: totalAudits.failed,
      avgAuditTime: totalAudits.avgTime,
      activeUsers: userMetrics.active,
      newUsers: userMetrics.new,
      returningUsers: userMetrics.returning,
      userSatisfaction: userMetrics.satisfaction,
      basicAnalysisCount: featureUsage.basicAnalysis,
      deepAnalysisCount: featureUsage.deepAnalysis,
      auditCount: featureUsage.audits,
      chatbotUsage: featureUsage.chatbot,
      additionalMetrics: {
        collectionTimestamp: new Date().toISOString(),
        dataSource: 'metrics-collector',
      },
    };
  }

  // System metrics helpers
  private getMemoryUsage(): { 
    used: number; 
    total: number; 
    percentage: number; 
    heap: NodeJS.MemoryUsage 
  } {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const percentage = (usedMem / totalMem) * 100;
    const heap = process.memoryUsage();

    return {
      used: usedMem,
      total: totalMem,
      percentage,
      heap,
    };
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = process.hrtime();
      const startUsage = process.cpuUsage();

      setTimeout(() => {
        const endTime = process.hrtime(startTime);
        const endUsage = process.cpuUsage(startUsage);

        const userTime = endUsage.user / 1000; // Convert to milliseconds
        const systemTime = endUsage.system / 1000;
        const totalTime = (endTime[0] * 1000) + (endTime[1] / 1000000);

        const cpuPercent = ((userTime + systemTime) / totalTime) * 100;
        resolve(Math.min(cpuPercent, 100)); // Cap at 100%
      }, 100);
    });
  }

  private async getDiskUsage(): Promise<number> {
    // This is a simplified implementation
    // In production, you might want to use a library like 'fs' or 'diskusage'
    try {
      const stats = await import('fs').then(fs => fs.promises.stat('.'));
      // Return a placeholder value since disk usage requires platform-specific code
      return 50; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  private async getDatabaseMetrics(): Promise<{
    connections: number;
    responseTime: number;
    queryCount: number;
  }> {
    const startTime = performance.now();
    try {
      const isHealthy = await this.repository.healthCheck();
      const responseTime = performance.now() - startTime;
      
      return {
        connections: 1, // Simplified - in production, query connection pool
        responseTime,
        queryCount: 1, // Track actual query count in production
      };
    } catch (error) {
      return {
        connections: 0,
        responseTime: performance.now() - startTime,
        queryCount: 0,
      };
    }
  }

  private getExternalApiMetrics(): {
    openai: { calls: number; successRate: number };
    dataforseo: { calls: number; successRate: number };
    google: { calls: number; successRate: number };
  } {
    const getApiStats = (apiName: string) => {
      const stats = this.externalApiMetrics.get(apiName) || { calls: 0, successes: 0, failures: 0 };
      const successRate = stats.calls > 0 ? stats.successes / stats.calls : 1.0;
      return { calls: stats.calls, successRate };
    };

    return {
      openai: getApiStats('openai'),
      dataforseo: getApiStats('dataforseo'),
      google: getApiStats('google'),
    };
  }

  // Business metrics helpers
  private getAuditMetrics(): {
    total: number;
    successful: number;
    failed: number;
    avgTime: number;
  } {
    // This would query your database for actual audit statistics
    // Placeholder implementation
    return {
      total: 0,
      successful: 0,
      failed: 0,
      avgTime: 0,
    };
  }

  private getUserMetrics(): {
    active: number;
    new: number;
    returning: number;
    satisfaction: number;
  } {
    return {
      active: this.activeUsers.size,
      new: 0, // Would query database for new users today
      returning: 0, // Would query database for returning users
      satisfaction: 4.5, // Placeholder - would come from feedback system
    };
  }

  private getFeatureUsage(): {
    basicAnalysis: number;
    deepAnalysis: number;
    audits: number;
    chatbot: number;
  } {
    // This would track actual feature usage
    return {
      basicAnalysis: 0,
      deepAnalysis: 0,
      audits: 0,
      chatbot: 0,
    };
  }

  // Public methods for tracking application events
  public trackRequest(endpoint: string, responseTime: number, success: boolean): void {
    const key = endpoint;
    const current = this.requestMetrics.get(key) || { count: 0, totalTime: 0, errors: 0 };
    
    this.requestMetrics.set(key, {
      count: current.count + 1,
      totalTime: current.totalTime + responseTime,
      errors: current.errors + (success ? 0 : 1),
    });
  }

  public trackUserActivity(userId: string): void {
    this.activeUsers.add(userId);
  }

  public trackAuditStart(): void {
    this.auditsInProgress++;
  }

  public trackAuditEnd(): void {
    this.auditsInProgress = Math.max(0, this.auditsInProgress - 1);
  }

  public trackExternalApiCall(provider: string, success: boolean): void {
    const current = this.externalApiMetrics.get(provider) || { calls: 0, successes: 0, failures: 0 };
    
    this.externalApiMetrics.set(provider, {
      calls: current.calls + 1,
      successes: current.successes + (success ? 1 : 0),
      failures: current.failures + (success ? 0 : 1),
    });
  }

  private resetIntervalMetrics(): void {
    // Reset metrics that are calculated per interval
    this.requestMetrics.clear();
    this.activeUsers.clear();
    this.externalApiMetrics.clear();
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      await this.repository.cleanupOldData(this.config.retentionDays);
      console.log('Cleaned up old metrics data');
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }

  // Get current metrics without storing them
  public async getCurrentMetrics(): Promise<{
    system: InsertSystemMetrics;
    business: Partial<InsertBusinessMetrics>;
  }> {
    return await this.collectMetrics();
  }

  // Get historical metrics
  public async getMetricsHistory(
    startDate: Date,
    endDate: Date,
    type: 'system' | 'business' = 'system'
  ): Promise<SystemMetrics[] | BusinessMetrics[]> {
    if (type === 'system') {
      return await this.repository.getSystemMetricsHistory(startDate, endDate);
    } else {
      return await this.repository.getBusinessMetricsHistory(startDate, endDate);
    }
  }

  public getConfig(): MetricCollectorConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MetricCollectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart collection if interval changed
    if (newConfig.collectInterval && this.collectionTimer) {
      this.stopCollection();
      this.startCollection();
    }
  }
}