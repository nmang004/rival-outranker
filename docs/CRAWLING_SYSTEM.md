# Web Crawling Infrastructure

## Overview

The Rival Outranker crawling system is a comprehensive, production-ready web crawling infrastructure designed to replace mock data with real, dynamically updated content. The system includes robust crawling capabilities, scheduled job management, data validation, quality monitoring, and comprehensive error handling.

## Architecture

### Core Components

1. **Base Crawler Service** (`server/services/crawling/base-crawler.service.ts`)
   - Foundation for all crawling operations
   - Handles robots.txt compliance
   - Implements retry logic and error handling
   - Manages rate limiting and concurrent requests
   - Provides data validation and cleaning

2. **Specialized Crawlers**
   - **News Crawler** (`news-crawler.service.ts`) - Crawls news articles and blog content
   - **SEO Crawler** (`seo-crawler.service.ts`) - Performs technical SEO analysis on websites
   - **Additional crawlers can be easily added**

3. **Scheduler Service** (`crawling-scheduler.service.ts`)
   - Manages scheduled crawling jobs using cron expressions
   - Handles job execution, retry logic, and failure recovery
   - Provides system health monitoring and maintenance tasks

4. **Data Quality Service** (`data-quality.service.ts`)
   - Validates crawled data against defined schemas
   - Detects and removes duplicate content
   - Generates quality reports and recommendations
   - Maintains data integrity and freshness

5. **Monitoring Service** (`monitoring.service.ts`)
   - Real-time crawl monitoring and alerting
   - Performance metrics and resource usage tracking
   - Configurable alert rules and notifications
   - Health checks and system status reporting

## Features

### Ethical Crawling
- **Robots.txt Compliance**: Automatically checks and respects robots.txt directives
- **Rate Limiting**: Configurable delays between requests to respect server resources
- **User Agent Identification**: Clear identification of the crawler for transparency
- **Legal Compliance**: Built-in checks for terms of service and crawling permissions

### Reliability & Error Handling
- **Retry Logic**: Exponential backoff for failed requests
- **Timeout Management**: Configurable timeouts for different content types
- **Error Classification**: Categorizes errors for appropriate handling
- **Graceful Degradation**: System continues operating when individual sources fail

### Data Quality Assurance
- **Schema Validation**: Strict validation using Zod schemas
- **Duplicate Detection**: Automatic detection and handling of duplicate content
- **Content Classification**: Automatic categorization and tagging of content
- **Quality Scoring**: Algorithmic assessment of content quality (0-100 scale)

### Monitoring & Alerting
- **Real-time Metrics**: Live monitoring of crawl performance and system health
- **Configurable Alerts**: Customizable alert rules for various failure conditions
- **Resource Monitoring**: Memory, CPU, and connection usage tracking
- **Historical Analytics**: Trend analysis and performance reporting

### Scalability
- **Concurrent Processing**: Configurable concurrency limits for optimal performance
- **Batch Operations**: Efficient processing of multiple URLs
- **Queue Management**: Intelligent job scheduling and prioritization
- **Resource Management**: Automatic cleanup and resource optimization

## Database Schema

### Core Tables

#### `crawl_sources`
Defines crawling targets and their configuration:
```sql
- id: Unique identifier
- name: Human-readable source name
- type: Source type (news, seo, competitor)
- url: Base URL to crawl
- config: JSON configuration (selectors, etc.)
- isActive: Whether source is currently active
- crawlFrequency: How often to crawl (hourly, daily, weekly)
- lastCrawled: Timestamp of last successful crawl
```

#### `crawl_jobs`
Manages scheduled crawling jobs:
```sql
- id: Unique job identifier
- name: Job name
- type: Job type (news, seo, competitor, custom)
- schedule: Cron expression for scheduling
- config: Job-specific configuration
- lastRun/nextRun: Execution timing
- retryAttempts: Current retry count
- successCount/errorCount: Performance metrics
```

#### `crawled_content`
Stores crawled content and metadata:
```sql
- id: Unique content identifier
- type: Content type
- source: Source identifier
- url: Original URL
- title: Extracted title
- content: Main content text
- metadata: Structured data from crawl
- qualityScore: Automated quality assessment
- isStale/isDuplicate: Data quality flags
- wordCount: Content length metrics
- entities/keywords: Extracted semantic data
```

#### `crawl_metrics`
Tracks performance and execution metrics:
```sql
- jobId/sourceId: References to jobs and sources
- startTime/endTime/duration: Timing information
- status: Execution result
- itemsProcessed/Successful/Failed: Processing statistics
- bytesDownloaded: Data transfer metrics
- errorMessage/errorType: Failure details
```

#### `crawl_alerts`
Manages system alerts and notifications:
```sql
- ruleId: Alert rule identifier
- severity: Alert importance level
- message: Alert description
- triggeredAt/resolvedAt: Timing information
- metadata: Alert-specific data
```

## Usage Examples

### Basic SEO Crawling
```typescript
import { SeoCrawlerService } from './services/crawling';

const crawler = new SeoCrawlerService();
await crawler.initialize();

const result = await crawler.crawlSeoData('https://example.com');
if (result.success) {
  console.log('SEO Data:', result.data);
  // Data includes: title, meta description, headings, 
  // internal/external links, images, schema markup, etc.
}
```

### News Content Crawling
```typescript
import { NewsCrawlerService } from './services/crawling';

const newsCrawler = new NewsCrawlerService();
const sources = [
  {
    id: 'tech-news',
    name: 'Tech News',
    url: 'https://technews.com',
    selectors: {
      headlines: 'h2.headline',
      links: 'h2.headline a',
      dates: '.publish-date',
      descriptions: '.article-summary'
    },
    isActive: true,
    crawlFrequency: 'daily'
  }
];

const results = await newsCrawler.crawlMultipleSources(sources);
results.forEach(result => {
  if (result.success) {
    console.log(`Found ${result.articles.length} articles from ${result.source}`);
  }
});
```

### Scheduled Crawling
```typescript
import { CrawlingSchedulerService } from './services/crawling';

const scheduler = new CrawlingSchedulerService();
await scheduler.initialize();

// Jobs are automatically loaded from database and scheduled
// System jobs run automatically:
// - News crawling every 2 hours
// - Competitor monitoring daily at 3 AM
// - Data quality checks daily at 6 AM
// - Cleanup weekly on Sundays at 2 AM
```

### Data Quality Monitoring
```typescript
import { DataQualityService } from './services/crawling';

const qualityService = new DataQualityService();

// Generate comprehensive quality report
const report = await qualityService.generateQualityReport();
console.log(`Quality Score: ${report.qualityScore}/100`);
console.log(`Issues Found: ${report.issues.length}`);

// Validate specific content
const validationResult = await qualityService.validateCrawledData(
  newsArticle, 
  'news'
);
if (!validationResult.isValid) {
  console.log('Validation Errors:', validationResult.errors);
}
```

### Real-time Monitoring
```typescript
import { CrawlingMonitoringService } from './services/crawling';

const monitor = new CrawlingMonitoringService();

// Listen for crawl events
monitor.on('crawlEvent', (event) => {
  console.log(`[${event.type}] ${event.jobName}: ${event.error || 'OK'}`);
});

// Listen for alerts
monitor.on('alertTriggered', (alert) => {
  console.error(`Alert: ${alert.message} (${alert.severity})`);
});

// Get current metrics
const metrics = await monitor.getMetrics();
console.log(`Success Rate: ${metrics.successRate}%`);
console.log(`Active Jobs: ${metrics.activeJobs}`);
```

## Configuration

### Environment Variables
```env
# Crawling configuration
CRAWL_MAX_CONCURRENCY=5
CRAWL_DEFAULT_DELAY=1000
CRAWL_DEFAULT_TIMEOUT=30000
CRAWL_RESPECT_ROBOTS=true
CRAWL_USER_AGENT="RivalOutranker/1.0 (+https://rivaloutranker.com/bot)"

# Monitoring configuration
CRAWL_MONITORING_ENABLED=true
CRAWL_ALERT_EMAIL=admin@yourapp.com
CRAWL_METRICS_RETENTION_DAYS=30
```

### Default Alert Rules
- **High Error Rate**: >20% error rate in 1 hour
- **Low Success Rate**: <80% success rate in 2 hours
- **Slow Performance**: >5 minute average duration
- **Consecutive Failures**: 5+ consecutive job failures
- **Resource Usage**: >80% memory usage

## Installation & Setup

### 1. Install Dependencies
```bash
npm install puppeteer robots-parser node-cron
```

### 2. Database Migration
```bash
npm run db:push
```

### 3. Initialize Crawler Services
```typescript
import { CrawlingSchedulerService } from './services/crawling';

const scheduler = new CrawlingSchedulerService();
await scheduler.initialize();
```

### 4. Configure Sources
Add crawl sources to the database or use the admin interface to configure crawling targets.

## Performance Considerations

### Resource Management
- **Memory Usage**: Puppeteer instances are properly cleaned up after use
- **Connection Limits**: Configurable concurrency to prevent overwhelming servers
- **CPU Usage**: Batch processing to optimize CPU utilization
- **Storage**: Automatic cleanup of old data and metrics

### Optimization Strategies
- **Selective Crawling**: Only crawl necessary pages and content
- **Incremental Updates**: Track changes and only process modified content
- **Content Deduplication**: Prevent storage of duplicate content
- **Compression**: Efficient storage of crawled data

## Security Considerations

### Data Protection
- **Input Sanitization**: All crawled content is sanitized before storage
- **Access Controls**: Proper authorization for admin functions
- **Rate Limiting**: Protection against abuse and overuse
- **Error Handling**: Secure error messages that don't expose system details

### Legal Compliance
- **Robots.txt Respect**: Automatic compliance with robots.txt directives
- **Terms of Service**: Built-in checks for crawling permissions
- **User Agent**: Clear identification for transparency
- **Data Retention**: Configurable retention policies

## Troubleshooting

### Common Issues

#### Crawl Failures
1. Check robots.txt compliance
2. Verify network connectivity
3. Check rate limiting settings
4. Review error logs for specific issues

#### Performance Issues
1. Adjust concurrency settings
2. Increase timeout values
3. Monitor resource usage
4. Review data quality scores

#### Data Quality Issues
1. Check validation schemas
2. Review source configurations
3. Monitor duplicate detection
4. Verify content selectors

### Monitoring Commands
```typescript
// Check system health
const health = await monitor.getHealthStatus();

// Get job performance
const performance = await monitor.getJobPerformance('job-id');

// View recent events
const events = monitor.getRecentEvents(100);

// Get active alerts
const alerts = monitor.getActiveAlerts();
```

## Future Enhancements

### Planned Features
- **AI Content Analysis**: Advanced content classification using machine learning
- **Visual Content Processing**: Image and video content extraction
- **Real-time Crawling**: WebSocket-based real-time content monitoring
- **Multi-language Support**: Enhanced support for international content
- **Advanced Analytics**: Machine learning-powered insights and recommendations

### Extensibility
The system is designed for easy extension:
- **Custom Crawlers**: Add new crawler types by extending BaseCrawlerService
- **Custom Validators**: Add domain-specific validation rules
- **Custom Alerts**: Define new alert conditions and notification channels
- **Custom Metrics**: Add application-specific performance metrics

## API Documentation

### REST Endpoints
- `GET /api/crawl/status` - System health status
- `GET /api/crawl/metrics` - Performance metrics
- `GET /api/crawl/sources` - List crawl sources
- `POST /api/crawl/sources` - Create new crawl source
- `GET /api/crawl/jobs` - List scheduled jobs
- `POST /api/crawl/jobs` - Create new crawl job
- `GET /api/crawl/content` - Query crawled content
- `GET /api/crawl/quality` - Data quality reports

### WebSocket Events
- `crawl:started` - Crawl job started
- `crawl:progress` - Crawl progress update
- `crawl:completed` - Crawl job completed
- `crawl:error` - Crawl error occurred
- `alert:triggered` - System alert triggered
- `metrics:updated` - Performance metrics updated

## Support

For issues, questions, or contributions:
1. Check the troubleshooting section
2. Review error logs and monitoring data
3. Create detailed issue reports with reproduction steps
4. Include relevant configuration and environment information

The crawling system is designed to be robust, scalable, and maintainable, providing a solid foundation for data-driven SEO applications.