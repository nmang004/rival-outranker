import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, gte, lte, desc, asc, and, sql } from 'drizzle-orm';
import {
  systemMetrics,
  businessMetrics,
  alertHistory,
  performanceThresholds,
  monitoringConfig,
  type SystemMetrics,
  type BusinessMetrics,
  type AlertHistory,
  type PerformanceThreshold,
  type MonitoringConfig,
  type InsertSystemMetrics,
  type InsertBusinessMetrics,
  type InsertAlertHistory,
  type InsertPerformanceThreshold,
  type InsertMonitoringConfig,
} from '../../shared/schema/monitoring';

// Import the existing database connection
import { db } from '../db';

export class MonitoringRepository {
  // System Metrics Methods
  async insertSystemMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics> {
    const [result] = await db().insert(systemMetrics).values(metrics).returning();
    return result;
  }

  async getSystemMetricsHistory(
    startDate: Date,
    endDate: Date,
    interval: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<SystemMetrics[]> {
    return await db()
      .select()
      .from(systemMetrics)
      .where(and(
        gte(systemMetrics.timestamp, startDate),
        lte(systemMetrics.timestamp, endDate)
      ))
      .orderBy(asc(systemMetrics.timestamp));
  }

  async getLatestSystemMetrics(): Promise<SystemMetrics | null> {
    const [result] = await db
      .select()
      .from(systemMetrics)
      .orderBy(desc(systemMetrics.timestamp))
      .limit(1);
    return result || null;
  }

  async getSystemMetricsAggregated(
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' = 'hour'
  ): Promise<Array<{
    timestamp: Date;
    avgResponseTime: number;
    maxResponseTime: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    avgCpuUsage: number;
    maxCpuUsage: number;
    avgErrorRate: number;
    totalRequests: number;
    totalErrors: number;
  }>> {
    const intervalExpression = interval === 'hour' 
      ? sql`date_trunc('hour', ${systemMetrics.timestamp})` 
      : sql`date_trunc('day', ${systemMetrics.timestamp})`;

    return await db
      .select({
        timestamp: intervalExpression,
        avgResponseTime: sql<number>`AVG(${systemMetrics.avgResponseTime})`,
        maxResponseTime: sql<number>`MAX(${systemMetrics.avgResponseTime})`,
        avgMemoryUsage: sql<number>`AVG(${systemMetrics.memoryUsage})`,
        maxMemoryUsage: sql<number>`MAX(${systemMetrics.memoryUsage})`,
        avgCpuUsage: sql<number>`AVG(${systemMetrics.cpuUsage})`,
        maxCpuUsage: sql<number>`MAX(${systemMetrics.cpuUsage})`,
        avgErrorRate: sql<number>`AVG(${systemMetrics.errorRate})`,
        totalRequests: sql<number>`SUM(${systemMetrics.totalRequests})`,
        totalErrors: sql<number>`SUM(${systemMetrics.failedRequests})`,
      })
      .from(systemMetrics)
      .where(and(
        gte(systemMetrics.timestamp, startDate),
        lte(systemMetrics.timestamp, endDate)
      ))
      .groupBy(intervalExpression)
      .orderBy(asc(intervalExpression));
  }

  async cleanupOldSystemMetrics(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    await db
      .delete(systemMetrics)
      .where(lte(systemMetrics.timestamp, cutoffDate));
  }

  // Business Metrics Methods
  async insertBusinessMetrics(metrics: InsertBusinessMetrics): Promise<BusinessMetrics> {
    const [result] = await db.insert(businessMetrics).values(metrics).returning();
    return result;
  }

  async upsertDailyBusinessMetrics(
    dateKey: string,
    metrics: Omit<InsertBusinessMetrics, 'dateKey'>
  ): Promise<BusinessMetrics> {
    const [existing] = await db
      .select()
      .from(businessMetrics)
      .where(eq(businessMetrics.dateKey, dateKey))
      .limit(1);

    if (existing) {
      const [result] = await db
        .update(businessMetrics)
        .set(metrics)
        .where(eq(businessMetrics.dateKey, dateKey))
        .returning();
      return result;
    } else {
      const [result] = await db
        .insert(businessMetrics)
        .values({ ...metrics, dateKey })
        .returning();
      return result;
    }
  }

  async getBusinessMetricsHistory(
    startDate: Date,
    endDate: Date
  ): Promise<BusinessMetrics[]> {
    return await db
      .select()
      .from(businessMetrics)
      .where(and(
        gte(businessMetrics.timestamp, startDate),
        lte(businessMetrics.timestamp, endDate)
      ))
      .orderBy(asc(businessMetrics.timestamp));
  }

  async getBusinessMetricsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<BusinessMetrics[]> {
    return await db
      .select()
      .from(businessMetrics)
      .where(and(
        gte(businessMetrics.dateKey, startDate),
        lte(businessMetrics.dateKey, endDate)
      ))
      .orderBy(asc(businessMetrics.dateKey));
  }

  async getLatestBusinessMetrics(): Promise<BusinessMetrics | null> {
    const [result] = await db
      .select()
      .from(businessMetrics)
      .orderBy(desc(businessMetrics.timestamp))
      .limit(1);
    return result || null;
  }

  // Alert History Methods
  async insertAlertHistory(alert: InsertAlertHistory): Promise<AlertHistory> {
    const [result] = await db.insert(alertHistory).values(alert).returning();
    return result;
  }

  async getActiveAlerts(): Promise<AlertHistory[]> {
    return await db
      .select()
      .from(alertHistory)
      .where(sql`${alertHistory.resolvedAt} IS NULL`)
      .orderBy(desc(alertHistory.createdAt));
  }

  async getAlertHistory(
    startDate: Date,
    endDate: Date,
    severity?: string,
    category?: string
  ): Promise<AlertHistory[]> {
    const conditions = [
      gte(alertHistory.createdAt, startDate),
      lte(alertHistory.createdAt, endDate)
    ];

    if (severity) {
      conditions.push(eq(alertHistory.severity, severity));
    }
    if (category) {
      conditions.push(eq(alertHistory.category, category));
    }

    return await db
      .select()
      .from(alertHistory)
      .where(and(...conditions))
      .orderBy(desc(alertHistory.createdAt));
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await db
      .update(alertHistory)
      .set({
        acknowledgedAt: new Date(),
        acknowledgedBy
      })
      .where(eq(alertHistory.alertId, alertId));
  }

  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionActions?: any
  ): Promise<void> {
    await db
      .update(alertHistory)
      .set({
        resolvedAt: new Date(),
        resolvedBy,
        resolutionActions
      })
      .where(eq(alertHistory.alertId, alertId));
  }

  async getAlertStatistics(days: number = 30): Promise<{
    totalAlerts: number;
    criticalAlerts: number;
    resolvedAlerts: number;
    avgResolutionTime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [stats] = await db
      .select({
        totalAlerts: sql<number>`COUNT(*)`,
        criticalAlerts: sql<number>`COUNT(*) FILTER (WHERE severity = 'critical')`,
        resolvedAlerts: sql<number>`COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)`,
        avgResolutionTime: sql<number>`
          AVG(EXTRACT(epoch FROM (resolved_at - created_at)) / 3600) 
          FILTER (WHERE resolved_at IS NOT NULL)
        `,
      })
      .from(alertHistory)
      .where(gte(alertHistory.createdAt, startDate));

    return {
      totalAlerts: Number(stats.totalAlerts) || 0,
      criticalAlerts: Number(stats.criticalAlerts) || 0,
      resolvedAlerts: Number(stats.resolvedAlerts) || 0,
      avgResolutionTime: Number(stats.avgResolutionTime) || 0,
    };
  }

  // Performance Thresholds Methods
  async getPerformanceThresholds(): Promise<PerformanceThreshold[]> {
    return await db
      .select()
      .from(performanceThresholds)
      .where(eq(performanceThresholds.isEnabled, true))
      .orderBy(asc(performanceThresholds.category));
  }

  async upsertPerformanceThreshold(
    metricName: string,
    threshold: Omit<InsertPerformanceThreshold, 'metricName'>
  ): Promise<PerformanceThreshold> {
    const [existing] = await db
      .select()
      .from(performanceThresholds)
      .where(eq(performanceThresholds.metricName, metricName))
      .limit(1);

    if (existing) {
      const [result] = await db
        .update(performanceThresholds)
        .set({ ...threshold, updatedAt: new Date() })
        .where(eq(performanceThresholds.metricName, metricName))
        .returning();
      return result;
    } else {
      const [result] = await db
        .insert(performanceThresholds)
        .values({ ...threshold, metricName })
        .returning();
      return result;
    }
  }

  async getPerformanceThreshold(metricName: string): Promise<PerformanceThreshold | null> {
    const [result] = await db
      .select()
      .from(performanceThresholds)
      .where(eq(performanceThresholds.metricName, metricName))
      .limit(1);
    return result || null;
  }

  // Monitoring Configuration Methods
  async getMonitoringConfig(): Promise<MonitoringConfig[]> {
    return await db
      .select()
      .from(monitoringConfig)
      .orderBy(asc(monitoringConfig.category));
  }

  async getConfigValue(key: string): Promise<string | null> {
    const [result] = await db
      .select()
      .from(monitoringConfig)
      .where(eq(monitoringConfig.key, key))
      .limit(1);
    return result?.value || null;
  }

  async setConfigValue(
    key: string,
    value: string,
    type: string = 'string',
    category: string = 'general',
    description?: string
  ): Promise<MonitoringConfig> {
    const [existing] = await db
      .select()
      .from(monitoringConfig)
      .where(eq(monitoringConfig.key, key))
      .limit(1);

    if (existing) {
      const [result] = await db
        .update(monitoringConfig)
        .set({ value, type, category, description, updatedAt: new Date() })
        .where(eq(monitoringConfig.key, key))
        .returning();
      return result;
    } else {
      const [result] = await db
        .insert(monitoringConfig)
        .values({ key, value, type, category, description })
        .returning();
      return result;
    }
  }

  // Cleanup Methods
  async cleanupOldData(retentionDays: {
    systemMetrics?: number;
    businessMetrics?: number;
    alertHistory?: number;
  }): Promise<void> {
    const promises = [];

    if (retentionDays.systemMetrics) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays.systemMetrics);
      promises.push(
        db.delete(systemMetrics).where(lte(systemMetrics.timestamp, cutoffDate))
      );
    }

    if (retentionDays.businessMetrics) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays.businessMetrics);
      promises.push(
        db.delete(businessMetrics).where(lte(businessMetrics.timestamp, cutoffDate))
      );
    }

    if (retentionDays.alertHistory) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays.alertHistory);
      promises.push(
        db.delete(alertHistory).where(lte(alertHistory.createdAt, cutoffDate))
      );
    }

    await Promise.all(promises);
  }

  // Health check for the monitoring repository
  async healthCheck(): Promise<boolean> {
    try {
      await db.select().from(systemMetrics).limit(1);
      return true;
    } catch (error) {
      console.error('Monitoring repository health check failed:', error);
      return false;
    }
  }
}