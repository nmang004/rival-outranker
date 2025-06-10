import { PageClassificationOverrideRepository } from '../../repositories/page-classification-override.repository';
import { PageClassificationOverride as ServiceOverride, PagePriority } from './page-priority.service';
import { 
  PageClassificationOverride as DbOverride, 
  InsertPageClassificationOverride 
} from '../../../shared/schema';

/**
 * Interface for creating/updating page classification overrides
 */
export interface CreatePageOverrideRequest {
  auditId: number;
  pageUrl: string;
  priority: PagePriority;
  reason?: string;
}

/**
 * Interface for batch override operations
 */
export interface BatchOverrideRequest {
  auditId: number;
  overrides: Array<{
    pageUrl: string;
    priority: PagePriority;
    reason?: string;
  }>;
}

/**
 * Service for managing page classification overrides in audits
 */
export class PageClassificationOverrideService {
  
  constructor(private repository: PageClassificationOverrideRepository) {}

  /**
   * Create a new page classification override
   */
  async createOverride(userId: string, request: CreatePageOverrideRequest): Promise<DbOverride> {
    const override: InsertPageClassificationOverride = {
      userId,
      auditId: request.auditId,
      pageUrl: request.pageUrl,
      priority: request.priority,
      reason: request.reason
    };

    return await this.repository.create(override);
  }

  /**
   * Update an existing override
   */
  async updateOverride(
    userId: string, 
    auditId: number, 
    pageUrl: string, 
    priority: PagePriority,
    reason?: string
  ): Promise<DbOverride | null> {
    return await this.repository.update(auditId, pageUrl, {
      priority,
      reason,
      userId // Ensure user ownership
    });
  }

  /**
   * Delete an override
   */
  async deleteOverride(auditId: number, pageUrl: string): Promise<boolean> {
    return await this.repository.delete(auditId, pageUrl);
  }

  /**
   * Get all overrides for an audit in service format
   */
  async getAuditOverrides(auditId: number): Promise<ServiceOverride[]> {
    const dbOverrides = await this.repository.getByAuditId(auditId);
    return this.repository.toServiceOverrides(dbOverrides);
  }

  /**
   * Get all overrides for a user
   */
  async getUserOverrides(userId: string): Promise<DbOverride[]> {
    return await this.repository.getByUserId(userId);
  }

  /**
   * Batch create/update overrides for an audit
   */
  async batchUpsertOverrides(userId: string, request: BatchOverrideRequest): Promise<DbOverride[]> {
    const results: DbOverride[] = [];

    for (const override of request.overrides) {
      const upserted = await this.repository.upsert({
        userId,
        auditId: request.auditId,
        pageUrl: override.pageUrl,
        priority: override.priority,
        reason: override.reason
      });
      results.push(upserted);
    }

    return results;
  }

  /**
   * Clear all overrides for an audit
   */
  async clearAuditOverrides(auditId: number): Promise<number> {
    return await this.repository.deleteByAuditId(auditId);
  }

  /**
   * Get page priorities with explanations for display
   */
  getPriorityOptions(): Array<{
    value: PagePriority;
    label: string;
    description: string;
    weight: number;
  }> {
    return [
      {
        value: PagePriority.TIER_1,
        label: 'High Priority (Tier 1)',
        description: 'Homepage, primary service pages, key landing pages',
        weight: 3.0
      },
      {
        value: PagePriority.TIER_2,
        label: 'Medium Priority (Tier 2)', 
        description: 'Category pages, secondary services, about/contact pages',
        weight: 2.0
      },
      {
        value: PagePriority.TIER_3,
        label: 'Low Priority (Tier 3)',
        description: 'Blog posts, news articles, archive pages, utility pages',
        weight: 1.0
      }
    ];
  }

  /**
   * Validate override configuration for an audit
   */
  async validateOverrides(auditId: number, pageUrls: string[]): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const overrides = await this.repository.getByAuditId(auditId);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for overrides pointing to non-existent pages
    for (const override of overrides) {
      if (!pageUrls.includes(override.pageUrl)) {
        warnings.push(`Override for "${override.pageUrl}" points to a page that was not found in the audit`);
      }
    }

    // Check priority distribution
    const tier1Count = overrides.filter(o => o.priority === PagePriority.TIER_1).length;
    const totalOverrides = overrides.length;

    if (totalOverrides > 0) {
      const tier1Ratio = tier1Count / totalOverrides;
      
      if (tier1Ratio > 0.5) {
        warnings.push(`High proportion of pages (${Math.round(tier1Ratio * 100)}%) set to Tier 1 priority. Consider reserving Tier 1 for only the most critical pages.`);
      }
      
      if (tier1Count === 0 && totalOverrides > 3) {
        warnings.push('No pages set to Tier 1 priority. Consider setting your most important pages to high priority.');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get override statistics for an audit
   */
  async getOverrideStats(auditId: number): Promise<{
    totalOverrides: number;
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    distribution: {
      tier1Percentage: number;
      tier2Percentage: number;
      tier3Percentage: number;
    };
  }> {
    const overrides = await this.repository.getByAuditId(auditId);
    
    const tier1Count = overrides.filter(o => o.priority === PagePriority.TIER_1).length;
    const tier2Count = overrides.filter(o => o.priority === PagePriority.TIER_2).length;
    const tier3Count = overrides.filter(o => o.priority === PagePriority.TIER_3).length;
    const totalOverrides = overrides.length;

    const distribution = totalOverrides > 0 ? {
      tier1Percentage: Math.round((tier1Count / totalOverrides) * 100),
      tier2Percentage: Math.round((tier2Count / totalOverrides) * 100),
      tier3Percentage: Math.round((tier3Count / totalOverrides) * 100)
    } : {
      tier1Percentage: 0,
      tier2Percentage: 0,
      tier3Percentage: 0
    };

    return {
      totalOverrides,
      tier1Count,
      tier2Count,
      tier3Count,
      distribution
    };
  }
}