import { z } from 'zod';
import { db } from '../../db.js';
import { crawledContent } from '../../../shared/schema.js';
import { eq, and, sql, lt, gt } from 'drizzle-orm';

// Validation schemas for different content types
const NewsArticleSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url(),
  description: z.string().optional(),
  publishedAt: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  source: z.string().min(1),
  crawledAt: z.string()
});

const SeoDataSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  metaDescription: z.string().optional(),
  h1Tags: z.array(z.string()),
  h2Tags: z.array(z.string()),
  h3Tags: z.array(z.string()),
  wordCount: z.number().min(0),
  readingTime: z.number().min(0),
  textToHtmlRatio: z.number().min(0).max(100),
  loadTime: z.number().optional(),
  crawledAt: z.string()
});

const CompetitorDataSchema = z.object({
  domain: z.string().min(1),
  pages: z.array(SeoDataSchema),
  domainAuthority: z.number().optional(),
  backlinks: z.number().optional(),
  organicKeywords: z.number().optional(),
  organicTraffic: z.number().optional(),
  crawledAt: z.string()
});

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  staleRecords: number;
  qualityScore: number;
  issues: QualityIssue[];
  timestamp: string;
}

export interface QualityIssue {
  id: string;
  type: 'validation' | 'duplicate' | 'stale' | 'integrity' | 'content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedRecords: number;
  suggestedAction: string;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: any;
}

export class DataQualityService {
  private validationSchemas = {
    news: NewsArticleSchema,
    seo: SeoDataSchema,
    competitor: CompetitorDataSchema
  };

  async validateCrawledData(data: any, type: string): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Get the appropriate schema
      const schema = this.validationSchemas[type as keyof typeof this.validationSchemas];
      if (!schema) {
        result.errors.push(`Unknown data type: ${type}`);
        result.isValid = false;
        return result;
      }

      // Validate against schema
      const validationResult = schema.safeParse(data);
      if (!validationResult.success) {
        result.errors.push(...validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ));
        result.isValid = false;
      }

      // Additional validation checks
      await this.performAdditionalValidation(data, type, result);

      return result;
    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
      return result;
    }
  }

  private async performAdditionalValidation(
    data: any, 
    type: string, 
    result: DataValidationResult
  ): Promise<void> {
    switch (type) {
      case 'news':
        await this.validateNewsArticle(data, result);
        break;
      case 'seo':
        await this.validateSeoData(data, result);
        break;
      case 'competitor':
        await this.validateCompetitorData(data, result);
        break;
    }
  }

  private async validateNewsArticle(data: any, result: DataValidationResult): Promise<void> {
    // Check for duplicate URLs
    if (data.url) {
      const existing = await db.select({ id: crawledContent.id })
        .from(crawledContent)
        .where(and(
          eq(crawledContent.type, 'news'),
          eq(crawledContent.url, data.url)
        ))
        .limit(1);

      if (existing.length > 0) {
        result.warnings.push('Article with this URL already exists');
      }
    }

    // Validate content quality
    if (data.title) {
      if (data.title.length < 10) {
        result.warnings.push('Title is very short (less than 10 characters)');
      }
      if (data.title.length > 200) {
        result.warnings.push('Title is very long (more than 200 characters)');
      }
      if (this.containsSpam(data.title)) {
        result.errors.push('Title contains spam-like content');
        result.isValid = false;
      }
    }

    // Validate publish date
    if (data.publishedAt) {
      const publishDate = new Date(data.publishedAt);
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      if (publishDate > now) {
        result.warnings.push('Article has future publish date');
      }
      if (publishDate < oneYearAgo) {
        result.warnings.push('Article is more than one year old');
      }
    }
  }

  private async validateSeoData(data: any, result: DataValidationResult): Promise<void> {
    // Check for reasonable SEO metrics
    if (data.wordCount !== undefined) {
      if (data.wordCount < 50) {
        result.warnings.push('Very low word count (less than 50 words)');
      }
      if (data.wordCount > 10000) {
        result.warnings.push('Very high word count (more than 10,000 words)');
      }
    }

    if (data.textToHtmlRatio !== undefined) {
      if (data.textToHtmlRatio < 5) {
        result.warnings.push('Low text-to-HTML ratio (less than 5%)');
      }
    }

    if (data.loadTime !== undefined) {
      if (data.loadTime > 5000) {
        result.warnings.push('Slow page load time (more than 5 seconds)');
      }
    }

    // Validate meta tags
    if (!data.title || data.title.length === 0) {
      result.warnings.push('Missing page title');
    }

    if (!data.metaDescription || data.metaDescription.length === 0) {
      result.warnings.push('Missing meta description');
    }

    if (data.h1Tags && data.h1Tags.length === 0) {
      result.warnings.push('No H1 tags found');
    }

    if (data.h1Tags && data.h1Tags.length > 1) {
      result.warnings.push('Multiple H1 tags found');
    }
  }

  private async validateCompetitorData(data: any, result: DataValidationResult): Promise<void> {
    if (!data.pages || data.pages.length === 0) {
      result.errors.push('No pages found for competitor analysis');
      result.isValid = false;
      return;
    }

    // Validate each page
    for (let i = 0; i < data.pages.length; i++) {
      const pageResult = await this.validateSeoData(data.pages[i], {
        isValid: true,
        errors: [],
        warnings: []
      });

      if (!pageResult.isValid) {
        result.errors.push(`Page ${i + 1}: ${pageResult.errors.join(', ')}`);
      }
      
      result.warnings.push(...pageResult.warnings.map(w => `Page ${i + 1}: ${w}`));
    }

    // Check for reasonable metrics
    if (data.domainAuthority !== undefined) {
      if (data.domainAuthority < 0 || data.domainAuthority > 100) {
        result.errors.push('Domain Authority must be between 0 and 100');
        result.isValid = false;
      }
    }
  }

  private containsSpam(text: string): boolean {
    const spamPatterns = [
      /click here/i,
      /buy now/i,
      /free money/i,
      /guaranteed/i,
      /act now/i,
      /limited time/i,
      /\$\$\$/,
      /!!!/
    ];

    return spamPatterns.some(pattern => pattern.test(text));
  }

  async generateQualityReport(): Promise<DataQualityReport> {
    const report: DataQualityReport = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicateRecords: 0,
      staleRecords: 0,
      qualityScore: 0,
      issues: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Get total record count
      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(crawledContent);
      report.totalRecords = totalResult[0]?.count || 0;

      if (report.totalRecords === 0) {
        report.qualityScore = 100;
        return report;
      }

      // Find duplicates
      const duplicatesResult = await db.select({
        url: crawledContent.url,
        count: sql<number>`count(*)`
      })
      .from(crawledContent)
      .groupBy(crawledContent.url)
      .having(sql`count(*) > 1`);

      report.duplicateRecords = duplicatesResult.reduce((sum, dup) => sum + (dup.count - 1), 0);

      if (report.duplicateRecords > 0) {
        report.issues.push({
          id: 'duplicates',
          type: 'duplicate',
          severity: 'medium',
          message: `Found ${report.duplicateRecords} duplicate records`,
          affectedRecords: report.duplicateRecords,
          suggestedAction: 'Remove duplicate entries to improve data quality'
        });
      }

      // Find stale records (older than 7 days)
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 7);

      const staleResult = await db.select({ count: sql<number>`count(*)` })
        .from(crawledContent)
        .where(lt(crawledContent.updatedAt, staleDate));

      report.staleRecords = staleResult[0]?.count || 0;

      if (report.staleRecords > 0) {
        report.issues.push({
          id: 'stale-data',
          type: 'stale',
          severity: 'low',
          message: `Found ${report.staleRecords} stale records (older than 7 days)`,
          affectedRecords: report.staleRecords,
          suggestedAction: 'Update or remove outdated content'
        });
      }

      // Check for validation issues
      await this.checkValidationIssues(report);

      // Calculate quality score
      report.validRecords = report.totalRecords - report.invalidRecords - report.duplicateRecords;
      report.qualityScore = Math.max(0, Math.round(
        (report.validRecords / report.totalRecords) * 100
      ));

      return report;
    } catch (error) {
      console.error('Failed to generate quality report:', error);
      report.issues.push({
        id: 'report-error',
        type: 'integrity',
        severity: 'critical',
        message: 'Failed to generate complete quality report',
        affectedRecords: 0,
        suggestedAction: 'Check database connectivity and data integrity'
      });
      return report;
    }
  }

  private async checkValidationIssues(report: DataQualityReport): Promise<void> {
    // Sample a subset of records for validation
    const sampleSize = Math.min(100, Math.max(10, Math.floor(report.totalRecords * 0.1)));
    
    const sampleRecords = await db.select()
      .from(crawledContent)
      .limit(sampleSize);

    let invalidCount = 0;

    for (const record of sampleRecords) {
      try {
        const validationResult = await this.validateCrawledData(
          record.metadata || {},
          record.type
        );

        if (!validationResult.isValid) {
          invalidCount++;
        }
      } catch (error) {
        invalidCount++;
      }
    }

    // Extrapolate to full dataset
    report.invalidRecords = Math.round((invalidCount / sampleSize) * report.totalRecords);

    if (report.invalidRecords > 0) {
      const invalidPercentage = (report.invalidRecords / report.totalRecords) * 100;
      const severity = invalidPercentage > 20 ? 'high' : invalidPercentage > 10 ? 'medium' : 'low';

      report.issues.push({
        id: 'validation-errors',
        type: 'validation',
        severity,
        message: `Approximately ${report.invalidRecords} records have validation issues`,
        affectedRecords: report.invalidRecords,
        suggestedAction: 'Review and fix data validation errors'
      });
    }
  }

  async cleanupDuplicates(): Promise<number> {
    try {
      // Find and remove duplicates, keeping the most recent one
      const duplicatesQuery = sql`
        WITH duplicates AS (
          SELECT id, url, ROW_NUMBER() OVER (PARTITION BY url ORDER BY updated_at DESC) as rn
          FROM ${crawledContent}
        )
        DELETE FROM ${crawledContent}
        WHERE id IN (
          SELECT id FROM duplicates WHERE rn > 1
        )
      `;

      const result = await db.execute(duplicatesQuery);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to cleanup duplicates:', error);
      return 0;
    }
  }

  async markStaleContent(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db.update(crawledContent)
        .set({ 
          metadata: sql`jsonb_set(metadata, '{isStale}', 'true')`
        })
        .where(lt(crawledContent.updatedAt, cutoffDate));

      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to mark stale content:', error);
      return 0;
    }
  }

  async validateDataIntegrity(): Promise<{
    orphanedRecords: number;
    corruptedMetadata: number;
    missingUrls: number;
  }> {
    const integrity = {
      orphanedRecords: 0,
      corruptedMetadata: 0,
      missingUrls: 0
    };

    try {
      // Check for missing URLs
      const missingUrlsResult = await db.select({ count: sql<number>`count(*)` })
        .from(crawledContent)
        .where(sql`url IS NULL OR url = ''`);
      
      integrity.missingUrls = missingUrlsResult[0]?.count || 0;

      // Check for corrupted metadata
      const records = await db.select({ id: crawledContent.id, metadata: crawledContent.metadata })
        .from(crawledContent)
        .limit(1000);

      for (const record of records) {
        try {
          if (record.metadata && typeof record.metadata === 'string') {
            JSON.parse(record.metadata);
          }
        } catch (error) {
          integrity.corruptedMetadata++;
        }
      }

      return integrity;
    } catch (error) {
      console.error('Failed to validate data integrity:', error);
      return integrity;
    }
  }

  async getQualityMetrics(): Promise<{
    averageWordCount: number;
    averageLoadTime: number;
    contentDistribution: Record<string, number>;
    recentCrawlActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      const metrics = {
        averageWordCount: 0,
        averageLoadTime: 0,
        contentDistribution: {} as Record<string, number>,
        recentCrawlActivity: [] as Array<{ date: string; count: number }>
      };

      // Get content type distribution
      const distributionResult = await db.select({
        type: crawledContent.type,
        count: sql<number>`count(*)`
      })
      .from(crawledContent)
      .groupBy(crawledContent.type);

      metrics.contentDistribution = distributionResult.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Get recent activity (last 7 days)
      const activityResult = await db.select({
        date: sql<string>`DATE(created_at)`,
        count: sql<number>`count(*)`
      })
      .from(crawledContent)
      .where(gt(crawledContent.createdAt, sql`NOW() - INTERVAL '7 days'`))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

      metrics.recentCrawlActivity = activityResult.map(row => ({
        date: row.date,
        count: row.count
      }));

      return metrics;
    } catch (error) {
      console.error('Failed to get quality metrics:', error);
      return {
        averageWordCount: 0,
        averageLoadTime: 0,
        contentDistribution: {},
        recentCrawlActivity: []
      };
    }
  }
}