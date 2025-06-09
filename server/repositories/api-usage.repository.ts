import { eq, desc, and, gte, lte, sum } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { apiUsage, ApiUsage, InsertApiUsage } from '../../shared/schema';
import { db as getDb } from '../db';
const db = getDb();

/**
 * Repository for API usage tracking operations
 */
export class ApiUsageRepository extends BaseRepository<ApiUsage, InsertApiUsage> {
  constructor() {
    super(apiUsage);
  }

  /**
   * Find usage by user ID
   */
  async findByUserId(userId: string, limit?: number): Promise<ApiUsage[]> {
    return this.findMany({
      where: eq(apiUsage.userId, userId),
      orderBy: [desc(apiUsage.timestamp)],
      limit
    });
  }

  /**
   * Find usage by API provider
   */
  async findByProvider(provider: string, limit?: number): Promise<ApiUsage[]> {
    return this.findMany({
      where: eq(apiUsage.apiProvider, provider),
      orderBy: [desc(apiUsage.timestamp)],
      limit
    });
  }

  /**
   * Find usage by endpoint
   */
  async findByEndpoint(endpoint: string, limit?: number): Promise<ApiUsage[]> {
    return this.findMany({
      where: eq(apiUsage.endpoint, endpoint),
      orderBy: [desc(apiUsage.timestamp)],
      limit
    });
  }

  /**
   * Find usage by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ApiUsage[]> {
    return this.findMany({
      where: and(
        gte(apiUsage.timestamp, startDate),
        lte(apiUsage.timestamp, endDate)
      ),
      orderBy: [desc(apiUsage.timestamp)]
    });
  }

  /**
   * Find usage by user and date range
   */
  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<ApiUsage[]> {
    return this.findMany({
      where: and(
        eq(apiUsage.userId, userId),
        gte(apiUsage.timestamp, startDate),
        lte(apiUsage.timestamp, endDate)
      ),
      orderBy: [desc(apiUsage.timestamp)]
    });
  }

  /**
   * Find usage by provider and date range
   */
  async findByProviderAndDateRange(provider: string, startDate: Date, endDate: Date): Promise<ApiUsage[]> {
    return this.findMany({
      where: and(
        eq(apiUsage.apiProvider, provider),
        gte(apiUsage.timestamp, startDate),
        lte(apiUsage.timestamp, endDate)
      ),
      orderBy: [desc(apiUsage.timestamp)]
    });
  }

  /**
   * Find error logs
   */
  async findErrors(limit?: number): Promise<ApiUsage[]> {
    return this.findMany({
      where: gte(apiUsage.statusCode, 400),
      orderBy: [desc(apiUsage.timestamp)],
      limit
    });
  }

  /**
   * Get total cost for user
   */
  async getTotalCostForUser(userId: string): Promise<number> {
    const usageRecords = await this.findMany({
      where: eq(apiUsage.userId, userId)
    });
    
    return usageRecords.reduce((total, record) => {
      return total + (record.estimatedCost || 0);
    }, 0);
  }

  /**
   * Get total cost for provider
   */
  async getTotalCostForProvider(provider: string): Promise<number> {
    const usageRecords = await this.findMany({
      where: eq(apiUsage.apiProvider, provider)
    });
    
    return usageRecords.reduce((total, record) => {
      return total + (record.estimatedCost || 0);
    }, 0);
  }

  /**
   * Get total cost for date range
   */
  async getTotalCostForDateRange(startDate: Date, endDate: Date): Promise<number> {
    const usageRecords = await this.findByDateRange(startDate, endDate);
    
    return usageRecords.reduce((total, record) => {
      return total + (record.estimatedCost || 0);
    }, 0);
  }

  /**
   * Get usage statistics for user
   */
  async getUserUsageStats(userId: string, days: number = 30): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalCost: number;
    averageResponseTime: number;
    providerBreakdown: { provider: string; count: number; cost: number }[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const usageRecords = await this.findByUserAndDateRange(userId, cutoffDate, new Date());

    const totalRequests = usageRecords.length;
    const successfulRequests = usageRecords.filter(r => r.statusCode && r.statusCode < 400).length;
    const failedRequests = totalRequests - successfulRequests;
    const totalCost = usageRecords.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    
    const responseTimes = usageRecords.filter(r => r.responseTime).map(r => r.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Provider breakdown
    const providerMap = new Map<string, { count: number; cost: number }>();
    usageRecords.forEach(record => {
      const provider = record.apiProvider;
      const current = providerMap.get(provider) || { count: 0, cost: 0 };
      providerMap.set(provider, {
        count: current.count + 1,
        cost: current.cost + (record.estimatedCost || 0)
      });
    });

    const providerBreakdown = Array.from(providerMap.entries()).map(([provider, stats]) => ({
      provider,
      count: stats.count,
      cost: stats.cost
    }));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalCost,
      averageResponseTime: Math.round(averageResponseTime),
      providerBreakdown
    };
  }

  /**
   * Get system-wide usage statistics
   */
  async getSystemUsageStats(days: number = 30): Promise<{
    totalRequests: number;
    totalUsers: number;
    totalCost: number;
    averageResponseTime: number;
    providerBreakdown: { provider: string; count: number; cost: number }[];
    endpointBreakdown: { endpoint: string; count: number; averageResponseTime: number }[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const usageRecords = await this.findByDateRange(cutoffDate, new Date());

    const totalRequests = usageRecords.length;
    const uniqueUsers = new Set(usageRecords.filter(r => r.userId).map(r => r.userId!)).size;
    const totalCost = usageRecords.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    
    const responseTimes = usageRecords.filter(r => r.responseTime).map(r => r.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Provider breakdown
    const providerMap = new Map<string, { count: number; cost: number }>();
    usageRecords.forEach(record => {
      const provider = record.apiProvider;
      const current = providerMap.get(provider) || { count: 0, cost: 0 };
      providerMap.set(provider, {
        count: current.count + 1,
        cost: current.cost + (record.estimatedCost || 0)
      });
    });

    const providerBreakdown = Array.from(providerMap.entries()).map(([provider, stats]) => ({
      provider,
      count: stats.count,
      cost: stats.cost
    }));

    // Endpoint breakdown
    const endpointMap = new Map<string, { count: number; totalResponseTime: number }>();
    usageRecords.forEach(record => {
      const endpoint = record.endpoint;
      const current = endpointMap.get(endpoint) || { count: 0, totalResponseTime: 0 };
      endpointMap.set(endpoint, {
        count: current.count + 1,
        totalResponseTime: current.totalResponseTime + (record.responseTime || 0)
      });
    });

    const endpointBreakdown = Array.from(endpointMap.entries()).map(([endpoint, stats]) => ({
      endpoint,
      count: stats.count,
      averageResponseTime: stats.count > 0 ? Math.round(stats.totalResponseTime / stats.count) : 0
    }));

    return {
      totalRequests,
      totalUsers: uniqueUsers,
      totalCost,
      averageResponseTime: Math.round(averageResponseTime),
      providerBreakdown,
      endpointBreakdown
    };
  }

  /**
   * Get daily usage summary for date range
   */
  async getDailyUsageSummary(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    requests: number;
    cost: number;
    averageResponseTime: number;
  }>> {
    const usageRecords = await this.findByDateRange(startDate, endDate);

    // Group by day
    const dailyMap = new Map<string, { requests: number; cost: number; totalResponseTime: number; responseCount: number }>();
    
    usageRecords.forEach(record => {
      const date = record.timestamp.toISOString().split('T')[0];
      const current = dailyMap.get(date) || { requests: 0, cost: 0, totalResponseTime: 0, responseCount: 0 };
      dailyMap.set(date, {
        requests: current.requests + 1,
        cost: current.cost + (record.estimatedCost || 0),
        totalResponseTime: current.totalResponseTime + (record.responseTime || 0),
        responseCount: current.responseCount + (record.responseTime ? 1 : 0)
      });
    });

    return Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      requests: stats.requests,
      cost: stats.cost,
      averageResponseTime: stats.responseCount > 0 ? Math.round(stats.totalResponseTime / stats.responseCount) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Clean up old usage records
   */
  async cleanupOldRecords(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return this.deleteWhere(lte(apiUsage.timestamp, cutoffDate));
  }

  /**
   * Get top users by usage
   */
  async getTopUsersByUsage(limit: number = 10, days: number = 30): Promise<Array<{
    userId: string;
    requests: number;
    cost: number;
  }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const usageRecords = await this.findByDateRange(cutoffDate, new Date());

    // Group by user
    const userMap = new Map<string, { requests: number; cost: number }>();
    
    usageRecords.forEach(record => {
      if (!record.userId) return;
      const current = userMap.get(record.userId) || { requests: 0, cost: 0 };
      userMap.set(record.userId, {
        requests: current.requests + 1,
        cost: current.cost + (record.estimatedCost || 0)
      });
    });

    return Array.from(userMap.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }
}

// Export singleton instance
export const apiUsageRepository = new ApiUsageRepository();