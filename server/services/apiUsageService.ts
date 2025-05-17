import { db } from '../db';
import { apiUsage, InsertApiUsage, ApiUsage } from '@shared/schema';
import { between, desc, eq, sql } from 'drizzle-orm';

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
  byEndpoint: Record<string, number>;
  byMethod: Record<string, number>;
  byApiProvider: Record<string, number>;
  byStatusCode: Record<string, number>;
  timeSeriesData: {
    date: string;
    count: number;
    provider: string;
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
    let query = db.select().from(apiUsage).orderBy(desc(apiUsage.timestamp));
    
    if (dateRange) {
      if (dateRange.startDate && dateRange.endDate) {
        query = query.where(
          between(apiUsage.timestamp, dateRange.startDate, dateRange.endDate)
        );
      } else if (dateRange.startDate) {
        query = query.where(
          sql`${apiUsage.timestamp} >= ${dateRange.startDate}`
        );
      } else if (dateRange.endDate) {
        query = query.where(
          sql`${apiUsage.timestamp} <= ${dateRange.endDate}`
        );
      }
    }
    
    return await query;
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
    const byDate: Record<string, Record<string, number>> = {};
    
    let totalResponseTime = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    
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
      
      // Aggregate time series data by day and provider
      const date = record.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!byDate[date]) {
        byDate[date] = {};
      }
      byDate[date][record.apiProvider] = (byDate[date][record.apiProvider] || 0) + 1;
      
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
        Object.entries(providers).map(([provider, count]) => ({
          date,
          provider,
          count
        }))
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalCalls: records.length,
      successfulCalls,
      failedCalls,
      averageResponseTime: records.length > 0 ? Math.round(totalResponseTime / records.length) : 0,
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
    let query = db.select()
      .from(apiUsage)
      .where(eq(apiUsage.apiProvider, provider))
      .orderBy(desc(apiUsage.timestamp));
    
    if (dateRange) {
      if (dateRange.startDate && dateRange.endDate) {
        query = query.where(
          between(apiUsage.timestamp, dateRange.startDate, dateRange.endDate)
        );
      } else if (dateRange.startDate) {
        query = query.where(
          sql`${apiUsage.timestamp} >= ${dateRange.startDate}`
        );
      } else if (dateRange.endDate) {
        query = query.where(
          sql`${apiUsage.timestamp} <= ${dateRange.endDate}`
        );
      }
    }
    
    return await query;
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