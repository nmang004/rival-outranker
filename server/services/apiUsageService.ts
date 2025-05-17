import { db } from '../db';
import { apiUsage, InsertApiUsage, ApiUsage } from '@shared/schema';
import { between, desc, eq, sql, and } from 'drizzle-orm';

interface ApiUsageData {
  userId?: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
  apiProvider: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ApiUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  totalCost: number;
  costByProvider: Record<string, number>;
  byEndpoint: Record<string, number>;
  byMethod: Record<string, number>;
  byApiProvider: Record<string, number>;
  byStatusCode: Record<string, number>;
  timeSeriesData: {
    date: string;
    count: number;
    provider: string;
    cost?: number;
  }[];
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

class ApiUsageService {
  /**
   * Log API usage to the database
   */
  async logApiUsage(data: ApiUsageData): Promise<ApiUsage> {
    const [result] = await db.insert(apiUsage).values({
      userId: data.userId,
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      apiProvider: data.apiProvider,
      requestData: data.requestData,
      responseData: data.responseData,
      errorMessage: data.errorMessage,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date()
    }).returning();
    
    return result;
  }
  
  /**
   * Get API usage by date range
   */
  async getApiUsage(dateRange?: DateRange): Promise<ApiUsage[]> {
    // Initial query without conditions
    let query = db.select().from(apiUsage);
    
    // Add conditions if date range is provided
    if (dateRange) {
      if (dateRange.startDate && dateRange.endDate) {
        query = db.select().from(apiUsage).where(
          between(apiUsage.timestamp, dateRange.startDate, dateRange.endDate)
        );
      } else if (dateRange.startDate) {
        query = db.select().from(apiUsage).where(
          sql`${apiUsage.timestamp} >= ${dateRange.startDate}`
        );
      } else if (dateRange.endDate) {
        query = db.select().from(apiUsage).where(
          sql`${apiUsage.timestamp} <= ${dateRange.endDate}`
        );
      }
    }
    
    // Add ordering
    const finalQuery = query.orderBy(desc(apiUsage.timestamp));
    
    return await finalQuery;
  }
  
  /**
   * Get API usage statistics
   */
  async getApiUsageStats(dateRange?: DateRange): Promise<ApiUsageStats> {
    const records = await this.getApiUsage(dateRange);
    
    // Initialize statistics
    const byEndpoint: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const byApiProvider: Record<string, number> = {};
    const byStatusCode: Record<string, number> = {};
    const byDate: Record<string, Record<string, {count: number, cost: number}>> = {};
    const costByProvider: Record<string, number> = {};
    
    let totalResponseTime = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    let totalCost = 0;
    
    records.forEach(record => {
      // Count by endpoint
      byEndpoint[record.endpoint] = (byEndpoint[record.endpoint] || 0) + 1;
      
      // Count by method
      byMethod[record.method] = (byMethod[record.method] || 0) + 1;
      
      // Count by API provider
      byApiProvider[record.apiProvider] = (byApiProvider[record.apiProvider] || 0) + 1;
      
      // Count by status code
      const statusString = String(record.statusCode || 'unknown');
      byStatusCode[statusString] = (byStatusCode[statusString] || 0) + 1;
      
      // Track costs
      const cost = record.estimatedCost || 0;
      totalCost += cost;
      costByProvider[record.apiProvider] = (costByProvider[record.apiProvider] || 0) + cost;
      
      // Aggregate time series data by day and provider
      const date = record.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!byDate[date]) {
        byDate[date] = {};
      }
      
      if (!byDate[date][record.apiProvider]) {
        byDate[date][record.apiProvider] = { count: 0, cost: 0 };
      }
      
      byDate[date][record.apiProvider].count += 1;
      byDate[date][record.apiProvider].cost += cost;
      
      // Calculate success/failure and response time
      if (record.responseTime) {
        totalResponseTime += record.responseTime;
      }
      
      if (record.statusCode && record.statusCode >= 200 && record.statusCode < 400) {
        successfulCalls++;
      } else {
        failedCalls++;
      }
    });
    
    // Generate time series data for charting
    const timeSeriesData = Object.entries(byDate)
      .flatMap(([date, providers]) => 
        Object.entries(providers).map(([provider, data]) => ({
          date,
          provider,
          count: data.count,
          cost: data.cost
        }))
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalCalls: records.length,
      successfulCalls,
      failedCalls,
      averageResponseTime: records.length > 0 ? Math.round(totalResponseTime / records.length) : 0,
      totalCost: Number(totalCost.toFixed(6)),
      costByProvider,
      byEndpoint,
      byMethod,
      byApiProvider,
      byStatusCode,
      timeSeriesData
    };
  }
  
  /**
   * Get usage by API provider
   */
  async getUsageByProvider(provider: string, dateRange?: DateRange): Promise<ApiUsage[]> {
    // Build query conditions
    const conditions = [eq(apiUsage.apiProvider, provider)];
    
    if (dateRange) {
      if (dateRange.startDate && dateRange.endDate) {
        conditions.push(between(apiUsage.timestamp, dateRange.startDate, dateRange.endDate));
      } else if (dateRange.startDate) {
        conditions.push(sql`${apiUsage.timestamp} >= ${dateRange.startDate}`);
      } else if (dateRange.endDate) {
        conditions.push(sql`${apiUsage.timestamp} <= ${dateRange.endDate}`);
      }
    }
    
    // Execute query with all conditions
    return await db.select()
      .from(apiUsage)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(apiUsage.timestamp));
  }
  
  /**
   * Get recent errors
   */
  async getRecentErrors(limit: number = 100): Promise<ApiUsage[]> {
    return await db.select()
      .from(apiUsage)
      .where(sql`${apiUsage.statusCode} >= 400 OR ${apiUsage.errorMessage} IS NOT NULL`)
      .orderBy(desc(apiUsage.timestamp))
      .limit(limit);
  }
}

export const apiUsageService = new ApiUsageService();