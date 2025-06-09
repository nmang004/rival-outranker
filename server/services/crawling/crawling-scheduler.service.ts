import cron from 'node-cron';
import { NewsCrawlerService, NewsSource, NewsCrawlResult } from './news-crawler.service.js';
import { SeoCrawlerService, CompetitorData } from './seo-crawler.service.js';
import { db } from '../../db.js';
import { crawledContent, crawlSources, crawlJobs } from '../../../shared/schema.js';
import { eq, and, lt } from 'drizzle-orm';

export interface CrawlJob {
  id: string;
  name: string;
  type: 'news' | 'seo' | 'competitor';
  schedule: string; // Cron expression
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  config: any;
  retryAttempts: number;
  maxRetries: number;
}

export interface CrawlMetrics {
  totalJobs: number;
  activeJobs: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunTime?: Date;
  averageDuration: number;
}

export class CrawlingSchedulerService {
  private newsCrawler: NewsCrawlerService;
  private seoCrawler: SeoCrawlerService;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;
  private runningJobs = new Set<string>();

  constructor() {
    this.newsCrawler = new NewsCrawlerService();
    this.seoCrawler = new SeoCrawlerService();
  }

  async initialize(): Promise<void> {
    await this.newsCrawler.initialize();
    await this.seoCrawler.initialize();
    await this.loadScheduledJobs();
    this.setupSystemJobs();
  }

  private async loadScheduledJobs(): Promise<void> {
    try {
      const jobs = await db.select().from(crawlJobs).where(eq(crawlJobs.isActive, true));
      
      for (const job of jobs) {
        this.scheduleJob(job);
      }

      console.log(`Loaded ${jobs.length} scheduled crawl jobs`);
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error);
    }
  }

  private setupSystemJobs(): void {
    // News crawling - every 2 hours
    this.scheduleSystemJob('news-crawl', '0 */2 * * *', () => this.runNewsCrawl());
    
    // Competitor monitoring - daily at 3 AM
    this.scheduleSystemJob('competitor-crawl', '0 3 * * *', () => this.runCompetitorCrawl());
    
    // Data quality check - daily at 6 AM
    this.scheduleSystemJob('quality-check', '0 6 * * *', () => this.runDataQualityCheck());
    
    // Cleanup old data - weekly on Sunday at 2 AM
    this.scheduleSystemJob('data-cleanup', '0 2 * * 0', () => this.runDataCleanup());
    
    // Health check - every hour
    this.scheduleSystemJob('health-check', '0 * * * *', () => this.runHealthCheck());
  }

  private scheduleSystemJob(name: string, schedule: string, handler: () => Promise<void>): void {
    if (this.scheduledJobs.has(name)) {
      this.scheduledJobs.get(name)?.destroy();
    }

    const task = cron.schedule(schedule, async () => {
      if (this.runningJobs.has(name)) {
        console.log(`Skipping ${name} - already running`);
        return;
      }

      this.runningJobs.add(name);
      const startTime = Date.now();

      try {
        console.log(`Starting scheduled job: ${name}`);
        await handler();
        const duration = Date.now() - startTime;
        console.log(`Completed scheduled job: ${name} (${duration}ms)`);
        
        await this.logJobExecution(name, true, duration);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Failed scheduled job: ${name}`, error);
        
        await this.logJobExecution(name, false, duration, error instanceof Error ? error.message : 'Unknown error');
      } finally {
        this.runningJobs.delete(name);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledJobs.set(name, task);
  }

  private scheduleJob(job: any): void {
    if (this.scheduledJobs.has(job.id)) {
      this.scheduledJobs.get(job.id)?.destroy();
    }

    const task = cron.schedule(job.schedule, async () => {
      if (this.runningJobs.has(job.id)) {
        console.log(`Skipping job ${job.name} - already running`);
        return;
      }

      await this.executeJob(job);
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledJobs.set(job.id, task);
  }

  private async executeJob(job: any): Promise<void> {
    this.runningJobs.add(job.id);
    const startTime = Date.now();

    try {
      console.log(`Executing crawl job: ${job.name}`);

      let success = false;
      let error: string | undefined;

      switch (job.type) {
        case 'news':
          success = await this.executeNewsJob(job);
          break;
        case 'seo':
          success = await this.executeSeoJob(job);
          break;
        case 'competitor':
          success = await this.executeCompetitorJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      const duration = Date.now() - startTime;
      
      if (success) {
        console.log(`Completed crawl job: ${job.name} (${duration}ms)`);
        await this.updateJobLastRun(job.id, true);
      } else {
        console.log(`Failed crawl job: ${job.name} (${duration}ms)`);
        await this.updateJobLastRun(job.id, false);
      }

      await this.logJobExecution(job.id, success, duration, error);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Error executing job ${job.name}:`, error);
      
      await this.updateJobLastRun(job.id, false);
      await this.logJobExecution(job.id, false, duration, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  private async executeNewsJob(job: any): Promise<boolean> {
    const sources = await this.getActiveNewsSources();
    if (sources.length === 0) {
      console.log('No active news sources found');
      return true;
    }

    const results = await this.newsCrawler.crawlMultipleSources(sources);
    let totalSuccess = 0;

    for (const result of results) {
      if (result.success) {
        await this.saveNewsData(result);
        totalSuccess++;
      } else {
        await this.logCrawlError('news', result.source, result.error);
      }
    }

    console.log(`News crawl completed: ${totalSuccess}/${results.length} sources successful`);
    return totalSuccess > 0;
  }

  private async executeSeoJob(job: any): Promise<boolean> {
    const { urls } = job.config;
    if (!urls || !Array.isArray(urls)) {
      console.error('Invalid SEO job config: missing URLs array');
      return false;
    }

    const results = await this.seoCrawler.batchCrawlSeoData(urls);
    let successCount = 0;

    for (const result of results) {
      if (result.success && result.data) {
        await this.saveSeoData(result.data);
        successCount++;
      } else {
        await this.logCrawlError('seo', result.metadata.url, result.error);
      }
    }

    console.log(`SEO crawl completed: ${successCount}/${results.length} URLs successful`);
    return successCount > 0;
  }

  private async executeCompetitorJob(job: any): Promise<boolean> {
    const { domains, maxPages = 10 } = job.config;
    if (!domains || !Array.isArray(domains)) {
      console.error('Invalid competitor job config: missing domains array');
      return false;
    }

    let successCount = 0;

    for (const domain of domains) {
      try {
        const competitorData = await this.seoCrawler.crawlCompetitorSite(domain, maxPages);
        if (competitorData.pages.length > 0) {
          await this.saveCompetitorData(competitorData);
          successCount++;
        }
        
        // Add delay between competitor crawls
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        await this.logCrawlError('competitor', domain, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log(`Competitor crawl completed: ${successCount}/${domains.length} domains successful`);
    return successCount > 0;
  }

  private async runNewsCrawl(): Promise<void> {
    console.log('Starting scheduled news crawl...');
    const sources = await this.getActiveNewsSources();
    
    if (sources.length === 0) {
      console.log('No active news sources configured');
      return;
    }

    const results = await this.newsCrawler.crawlMultipleSources(sources);
    let successCount = 0;

    for (const result of results) {
      if (result.success) {
        await this.saveNewsData(result);
        successCount++;
      } else {
        await this.logCrawlError('news', result.source, result.error);
      }
    }

    console.log(`News crawl completed: ${successCount}/${results.length} sources successful`);
  }

  private async runCompetitorCrawl(): Promise<void> {
    console.log('Starting scheduled competitor crawl...');
    // Implementation for competitor monitoring
  }

  private async runDataQualityCheck(): Promise<void> {
    console.log('Starting data quality check...');
    
    try {
      // Check for duplicate content
      await this.removeDuplicateContent();
      
      // Check for stale data
      await this.markStaleContent();
      
      // Validate data integrity
      await this.validateDataIntegrity();
      
      console.log('Data quality check completed');
    } catch (error) {
      console.error('Data quality check failed:', error);
    }
  }

  private async runDataCleanup(): Promise<void> {
    console.log('Starting data cleanup...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Remove data older than 30 days
      
      const result = await db.delete(crawledContent)
        .where(lt(crawledContent.createdAt, cutoffDate));
      
      console.log(`Data cleanup completed: removed old content`);
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  private async runHealthCheck(): Promise<void> {
    try {
      // Check crawler health
      const newsStats = this.newsCrawler.getStats();
      const seoStats = this.seoCrawler.getStats();
      
      // Log health metrics
      console.log('Crawler health check:', { newsStats, seoStats });
      
      // Check for any issues and alert if necessary
      if (!newsStats.isInitialized || !seoStats.isInitialized) {
        console.warn('Some crawlers are not properly initialized');
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  private async getActiveNewsSources(): Promise<NewsSource[]> {
    try {
      const sources = await db.select().from(crawlSources)
        .where(and(eq(crawlSources.type, 'news'), eq(crawlSources.isActive, true)));
      
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        url: source.url,
        selectors: source.config as any,
        isActive: source.isActive,
        crawlFrequency: 'daily' as const,
        lastCrawled: source.lastCrawled || undefined
      }));
    } catch (error) {
      console.error('Failed to get active news sources:', error);
      return [];
    }
  }

  private async saveNewsData(result: NewsCrawlResult): Promise<void> {
    try {
      for (const article of result.articles) {
        await db.insert(crawledContent).values({
          id: crypto.randomUUID(),
          type: 'news',
          source: result.source,
          url: article.url,
          title: article.title,
          content: article.description || '',
          metadata: article,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
      }
    } catch (error) {
      console.error('Failed to save news data:', error);
    }
  }

  private async saveSeoData(seoData: any): Promise<void> {
    try {
      await db.insert(crawledContent).values({
        id: crypto.randomUUID(),
        type: 'seo',
        source: 'seo-crawler',
        url: seoData.url,
        title: seoData.title || '',
        content: JSON.stringify(seoData),
        metadata: seoData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    } catch (error) {
      console.error('Failed to save SEO data:', error);
    }
  }

  private async saveCompetitorData(competitorData: CompetitorData): Promise<void> {
    try {
      await db.insert(crawledContent).values({
        id: crypto.randomUUID(),
        type: 'competitor',
        source: 'competitor-crawler',
        url: `https://${competitorData.domain}`,
        title: competitorData.domain,
        content: JSON.stringify(competitorData),
        metadata: competitorData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    } catch (error) {
      console.error('Failed to save competitor data:', error);
    }
  }

  private async logCrawlError(type: string, source: string, error?: string): Promise<void> {
    console.error(`Crawl error [${type}] ${source}:`, error);
    // Could save to database for monitoring
  }

  private async logJobExecution(jobId: string, success: boolean, duration: number, error?: string): Promise<void> {
    // Implementation for logging job execution metrics
    console.log(`Job ${jobId}: ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`, error || '');
  }

  private async updateJobLastRun(jobId: string, success: boolean): Promise<void> {
    try {
      await db.update(crawlJobs)
        .set({ 
          lastRun: new Date(),
          ...(success && { retryAttempts: 0 })
        })
        .where(eq(crawlJobs.id, jobId));
    } catch (error) {
      console.error('Failed to update job last run:', error);
    }
  }

  private async removeDuplicateContent(): Promise<void> {
    // Implementation for removing duplicate content
  }

  private async markStaleContent(): Promise<void> {
    // Implementation for marking stale content
  }

  private async validateDataIntegrity(): Promise<void> {
    // Implementation for validating data integrity
  }

  async getMetrics(): Promise<CrawlMetrics> {
    try {
      const jobs = await db.select().from(crawlJobs);
      const activeJobs = jobs.filter(job => job.isActive);
      
      return {
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        successfulRuns: 0, // Would need to implement tracking
        failedRuns: 0, // Would need to implement tracking
        averageDuration: 0 // Would need to implement tracking
      };
    } catch (error) {
      console.error('Failed to get crawl metrics:', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageDuration: 0
      };
    }
  }

  async stop(): Promise<void> {
    console.log('Stopping crawling scheduler...');
    
    for (const [name, task] of this.scheduledJobs) {
      task.destroy();
      console.log(`Stopped scheduled job: ${name}`);
    }
    
    this.scheduledJobs.clear();
    
    await this.newsCrawler.close();
    await this.seoCrawler.close();
    
    console.log('Crawling scheduler stopped');
  }
}