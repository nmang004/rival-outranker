import { db as getDb } from '../../db.js';
import { crawlJobs, crawledContent, users } from '../../../shared/schema.js';
import { eq, sql, desc, gt } from 'drizzle-orm';
import { log } from './logger.service.js';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  message?: string;
  responseTime?: number;
  timestamp: string;
  metadata?: any;
}

export interface SystemHealth {
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
  };
  checks: Record<string, HealthCheck>;
}

export class HealthCheckerService {
  private checkFunctions: Map<string, () => Promise<HealthCheck>> = new Map();
  
  constructor() {
    this.registerDefaultChecks();
  }
  
  private getDatabase() {
    const db = getDb();
    if (!db) {
      throw new Error('Database not initialized');
    }
    return db;
  }
  
  private registerDefaultChecks() {
    this.checkFunctions.set('database', this.checkDatabase.bind(this));
    this.checkFunctions.set('crawler', this.checkCrawler.bind(this));
    this.checkFunctions.set('memory', this.checkMemory.bind(this));
    this.checkFunctions.set('disk', this.checkDisk.bind(this));
    this.checkFunctions.set('external_apis', this.checkExternalAPIs.bind(this));
    this.checkFunctions.set('data_quality', this.checkDataQuality.bind(this));
    this.checkFunctions.set('recent_activity', this.checkRecentActivity.bind(this));
  }
  
  async runAllChecks(): Promise<SystemHealth> {
    const startTime = Date.now();
    const results: Record<string, HealthCheck> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    log.debug('Starting comprehensive health checks');
    
    // Run all health checks concurrently for better performance
    const checkPromises = Array.from(this.checkFunctions.entries()).map(
      async ([name, checkFn]) => {
        try {
          const result = await checkFn();
          results[name] = result;
          
          // Update overall status based on individual check results
          if (result.status === 'unhealthy') {
            overallStatus = 'unhealthy';
          } else if (result.status === 'degraded' && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
          
          return { name, result };
        } catch (error) {
          const errorResult: HealthCheck = {
            name,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          };
          results[name] = errorResult;
          overallStatus = 'unhealthy';
          
          log.error('Health check failed', { checkName: name, error });
          return { name, result: errorResult };
        }
      }
    );
    
    await Promise.all(checkPromises);
    
    const totalTime = Date.now() - startTime;
    
    const systemHealth: SystemHealth = {
      overall: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      checks: results
    };
    
    log.info('Health check completed', {
      overallStatus,
      totalTime,
      checksRun: Object.keys(results).length
    });
    
    return systemHealth;
  }
  
  async runCheck(checkName: string): Promise<HealthCheck> {
    const checkFn = this.checkFunctions.get(checkName);
    if (!checkFn) {
      throw new Error(`Health check '${checkName}' not found`);
    }
    
    try {
      return await checkFn();
    } catch (error) {
      return {
        name: checkName,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const database = this.getDatabase();
      
      // Test basic connectivity
      await database.execute(sql`SELECT 1`);
      
      // Test table access
      const userCount = await database.select({ count: sql<number>`count(*)` }).from(users);
      
      // Test write capability (if needed)
      // await db.execute(sql`SELECT pg_is_in_recovery()`);
      
      const responseTime = Date.now() - start;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 2000) {
        status = 'unhealthy';
      } else if (responseTime > 1000) {
        status = 'degraded';
      }
      
      return {
        name: 'database',
        status,
        message: `Database connection successful. ${userCount[0]?.count || 0} users in system.`,
        responseTime,
        timestamp: new Date().toISOString(),
        metadata: {
          userCount: userCount[0]?.count || 0,
          responseTimeMs: responseTime
        }
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  private async checkCrawler(): Promise<HealthCheck> {
    try {
      const database = this.getDatabase();
      
      // Check if crawler jobs exist and are active
      const activeJobs = await database.select({ count: sql<number>`count(*)` })
        .from(crawlJobs)
        .where(eq(crawlJobs.isActive, true));
      
      // Check last crawl activity
      const lastActivity = await database.select({
        lastRun: crawlJobs.lastRun,
        name: crawlJobs.name
      })
      .from(crawlJobs)
      .orderBy(desc(crawlJobs.lastRun))
      .limit(1);
      
      const activeJobCount = activeJobs[0]?.count || 0;
      const lastRun = lastActivity[0]?.lastRun;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `${activeJobCount} active crawler jobs`;
      
      if (activeJobCount === 0) {
        status = 'degraded';
        message = 'No active crawler jobs found';
      }
      
      if (lastRun) {
        const hoursSinceLastRun = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastRun > 24) {
          status = 'unhealthy';
          message += `. Last run was ${Math.round(hoursSinceLastRun)} hours ago`;
        } else if (hoursSinceLastRun > 6) {
          status = 'degraded';
          message += `. Last run was ${Math.round(hoursSinceLastRun)} hours ago`;
        }
      } else {
        status = 'degraded';
        message += '. No recent crawl activity';
      }
      
      return {
        name: 'crawler',
        status,
        message,
        timestamp: new Date().toISOString(),
        metadata: {
          activeJobs: activeJobCount,
          lastRun: lastRun?.toISOString(),
          hoursSinceLastRun: lastRun ? Math.round((Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60)) : null
        }
      };
    } catch (error) {
      return {
        name: 'crawler',
        status: 'unhealthy',
        message: `Crawler check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  private async checkMemory(): Promise<HealthCheck> {
    const usage = process.memoryUsage();
    const usageInMB = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
    
    const heapUsagePercent = (usageInMB.heapUsed / usageInMB.heapTotal) * 100;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (heapUsagePercent > 95) {
      status = 'unhealthy';
    } else if (heapUsagePercent > 85) {
      status = 'degraded';
    }
    
    return {
      name: 'memory',
      status,
      message: `Memory usage: ${Math.round(heapUsagePercent)}% (${usageInMB.heapUsed}MB / ${usageInMB.heapTotal}MB)`,
      timestamp: new Date().toISOString(),
      metadata: {
        usage: usageInMB,
        heapUsagePercent: Math.round(heapUsagePercent),
        rssUsageMB: usageInMB.rss
      }
    };
  }
  
  private async checkDisk(): Promise<HealthCheck> {
    try {
      // This is a simplified disk check - in production you might want to use a library like 'diskusage'
      const fs = await import('fs/promises');
      const stats = await fs.stat(process.cwd());
      
      // For now, just check if we can access the filesystem
      return {
        name: 'disk',
        status: 'healthy',
        message: 'Disk access successful',
        timestamp: new Date().toISOString(),
        metadata: {
          accessible: true,
          workingDirectory: process.cwd()
        }
      };
    } catch (error) {
      return {
        name: 'disk',
        status: 'unhealthy',
        message: `Disk check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  private async checkExternalAPIs(): Promise<HealthCheck> {
    const apiChecks = [];
    
    // Check OpenAI API if configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'User-Agent': 'RivalOutranker/1.0'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        apiChecks.push({
          service: 'OpenAI',
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now()
        });
      } catch (error) {
        apiChecks.push({
          service: 'OpenAI',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check DataForSEO API if configured
    if (process.env.DATAFORSEO_API_LOGIN && process.env.DATAFORSEO_API_PASSWORD) {
      try {
        const auth = Buffer.from(`${process.env.DATAFORSEO_API_LOGIN}:${process.env.DATAFORSEO_API_PASSWORD}`).toString('base64');
        const response = await fetch('https://api.dataforseo.com/v3/user', {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        apiChecks.push({
          service: 'DataForSEO',
          status: response.ok ? 'healthy' : 'degraded'
        });
      } catch (error) {
        apiChecks.push({
          service: 'DataForSEO',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const unhealthyApis = apiChecks.filter(api => api.status === 'unhealthy');
    const degradedApis = apiChecks.filter(api => api.status === 'degraded');
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = `${apiChecks.length} external APIs checked`;
    
    if (unhealthyApis.length > 0) {
      status = 'degraded'; // External APIs being down is degraded, not unhealthy for the whole system
      message += `. ${unhealthyApis.length} APIs unavailable`;
    } else if (degradedApis.length > 0) {
      status = 'degraded';
      message += `. ${degradedApis.length} APIs degraded`;
    }
    
    return {
      name: 'external_apis',
      status,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        apis: apiChecks,
        totalChecked: apiChecks.length,
        healthy: apiChecks.filter(api => api.status === 'healthy').length,
        degraded: degradedApis.length,
        unhealthy: unhealthyApis.length
      }
    };
  }
  
  private async checkDataQuality(): Promise<HealthCheck> {
    try {
      // Check recent data crawling activity
      const recentContent = await this.getDatabase().select({ count: sql<number>`count(*)` })
        .from(crawledContent)
        .where(gt(crawledContent.crawledAt, sql`NOW() - INTERVAL '24 hours'`));
      
      // Check for data quality issues
      const duplicateCount = await this.getDatabase().select({ count: sql<number>`count(*)` })
        .from(crawledContent)
        .where(eq(crawledContent.isDuplicate, true));
      
      const staleCount = await this.getDatabase().select({ count: sql<number>`count(*)` })
        .from(crawledContent)
        .where(eq(crawledContent.isStale, true));
      
      const recentCount = recentContent[0]?.count || 0;
      const duplicates = duplicateCount[0]?.count || 0;
      const stale = staleCount[0]?.count || 0;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `Data quality check: ${recentCount} items crawled in last 24h`;
      
      if (recentCount === 0) {
        status = 'degraded';
        message = 'No recent data crawling activity';
      }
      
      if (duplicates > 100) {
        status = 'degraded';
        message += `, ${duplicates} duplicates found`;
      }
      
      if (stale > 1000) {
        status = 'degraded';
        message += `, ${stale} stale items`;
      }
      
      return {
        name: 'data_quality',
        status,
        message,
        timestamp: new Date().toISOString(),
        metadata: {
          recentItems: recentCount,
          duplicates,
          staleItems: stale
        }
      };
    } catch (error) {
      return {
        name: 'data_quality',
        status: 'unhealthy',
        message: `Data quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  private async checkRecentActivity(): Promise<HealthCheck> {
    try {
      // Check recent user activity
      const recentUsers = await this.getDatabase().select({ count: sql<number>`count(*)` })
        .from(users)
        .where(gt(users.lastLoginAt, sql`NOW() - INTERVAL '24 hours'`));
      
      // Check recent analyses
      const recentAnalyses = await this.getDatabase().select({ count: sql<number>`count(*)` })
        .from(crawledContent)
        .where(gt(crawledContent.crawledAt, sql`NOW() - INTERVAL '1 hour'`));
      
      const activeUsers = recentUsers[0]?.count || 0;
      const recentActivity = recentAnalyses[0]?.count || 0;
      
      return {
        name: 'recent_activity',
        status: 'healthy',
        message: `${activeUsers} active users, ${recentActivity} recent items processed`,
        timestamp: new Date().toISOString(),
        metadata: {
          activeUsers,
          recentActivity
        }
      };
    } catch (error) {
      return {
        name: 'recent_activity',
        status: 'unhealthy',
        message: `Activity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Register custom health checks
  registerCheck(name: string, checkFn: () => Promise<HealthCheck>) {
    this.checkFunctions.set(name, checkFn);
    log.info('Custom health check registered', { checkName: name });
  }
  
  // Remove health checks
  unregisterCheck(name: string) {
    this.checkFunctions.delete(name);
    log.info('Health check unregistered', { checkName: name });
  }
  
  // Get list of available checks
  getAvailableChecks(): string[] {
    return Array.from(this.checkFunctions.keys());
  }
}

// Singleton instance
export const healthChecker = new HealthCheckerService();

// Express middleware for health check endpoints
export async function healthCheckHandler(req: any, res: any) {
  try {
    const health = await healthChecker.runAllChecks();
    const statusCode = health.overall.status === 'healthy' ? 200 : 
                      health.overall.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    log.error('Health check endpoint failed', { error });
    res.status(500).json({
      overall: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      },
      error: 'Health check failed'
    });
  }
}

export async function simpleHealthCheckHandler(req: any, res: any) {
  try {
    // Quick health check for load balancers
    const database = getDb();
    if (database) {
      await database.execute(sql`SELECT 1`);
    }
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
  }
}