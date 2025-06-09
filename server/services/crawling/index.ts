// Crawling Services Barrel Export
export { BaseCrawlerService } from './base-crawler.service.js';
export { NewsCrawlerService } from './news-crawler.service.js';
export { SeoCrawlerService } from './seo-crawler.service.js';
export { CrawlingSchedulerService } from './crawling-scheduler.service.js';
export { DataQualityService } from './data-quality.service.js';
export { CrawlingMonitoringService } from './monitoring.service.js';

// Re-export types for convenience
export type {
  CrawlOptions,
  CrawlResult,
  SelectorConfig
} from './base-crawler.service.js';

export type {
  NewsSource,
  NewsArticle,
  NewsCrawlResult
} from './news-crawler.service.js';

export type {
  SeoData,
  CompetitorData
} from './seo-crawler.service.js';

export type {
  CrawlJob,
  CrawlMetrics
} from './crawling-scheduler.service.js';

export type {
  DataQualityReport,
  QualityIssue,
  DataValidationResult
} from './data-quality.service.js';

export type {
  CrawlEvent,
  Alert,
  AlertRule
} from './monitoring.service.js';