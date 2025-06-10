import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { 
  pageClassificationOverrides, 
  PageClassificationOverride, 
  InsertPageClassificationOverride 
} from '../../shared/schema';
import { BaseRepository } from './base.repository';

/**
 * Repository for managing page classification overrides
 */
export class PageClassificationOverrideRepository extends BaseRepository {
  
  /**
   * Create a new page classification override
   */
  async create(override: InsertPageClassificationOverride): Promise<PageClassificationOverride> {
    try {
      const [result] = await db
        .insert(pageClassificationOverrides)
        .values(override)
        .returning();
      
      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to create page classification override');
    }
  }

  /**
   * Get all overrides for a specific audit
   */
  async getByAuditId(auditId: number): Promise<PageClassificationOverride[]> {
    try {
      return await db
        .select()
        .from(pageClassificationOverrides)
        .where(eq(pageClassificationOverrides.auditId, auditId));
    } catch (error) {
      throw this.handleError(error, 'Failed to get page classification overrides');
    }
  }

  /**
   * Get all overrides for a user
   */
  async getByUserId(userId: string): Promise<PageClassificationOverride[]> {
    try {
      return await db
        .select()
        .from(pageClassificationOverrides)
        .where(eq(pageClassificationOverrides.userId, userId));
    } catch (error) {
      throw this.handleError(error, 'Failed to get user page classification overrides');
    }
  }

  /**
   * Get a specific override by audit and page URL
   */
  async getByAuditAndPage(auditId: number, pageUrl: string): Promise<PageClassificationOverride | null> {
    try {
      const results = await db
        .select()
        .from(pageClassificationOverrides)
        .where(
          and(
            eq(pageClassificationOverrides.auditId, auditId),
            eq(pageClassificationOverrides.pageUrl, pageUrl)
          )
        )
        .limit(1);

      return results[0] || null;
    } catch (error) {
      throw this.handleError(error, 'Failed to get page classification override');
    }
  }

  /**
   * Update an existing override
   */
  async update(
    auditId: number, 
    pageUrl: string, 
    updates: Partial<InsertPageClassificationOverride>
  ): Promise<PageClassificationOverride | null> {
    try {
      const [result] = await db
        .update(pageClassificationOverrides)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(pageClassificationOverrides.auditId, auditId),
            eq(pageClassificationOverrides.pageUrl, pageUrl)
          )
        )
        .returning();

      return result || null;
    } catch (error) {
      throw this.handleError(error, 'Failed to update page classification override');
    }
  }

  /**
   * Delete an override
   */
  async delete(auditId: number, pageUrl: string): Promise<boolean> {
    try {
      const result = await db
        .delete(pageClassificationOverrides)
        .where(
          and(
            eq(pageClassificationOverrides.auditId, auditId),
            eq(pageClassificationOverrides.pageUrl, pageUrl)
          )
        );

      return result.rowCount > 0;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete page classification override');
    }
  }

  /**
   * Create or update an override (upsert)
   */
  async upsert(override: InsertPageClassificationOverride): Promise<PageClassificationOverride> {
    try {
      // Try to find existing override
      const existing = await this.getByAuditAndPage(override.auditId!, override.pageUrl);
      
      if (existing) {
        // Update existing
        const updated = await this.update(override.auditId!, override.pageUrl, override);
        return updated!;
      } else {
        // Create new
        return await this.create(override);
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to upsert page classification override');
    }
  }

  /**
   * Delete all overrides for an audit
   */
  async deleteByAuditId(auditId: number): Promise<number> {
    try {
      const result = await db
        .delete(pageClassificationOverrides)
        .where(eq(pageClassificationOverrides.auditId, auditId));

      return result.rowCount || 0;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete audit page classification overrides');
    }
  }

  /**
   * Convert database override to PageClassificationOverride interface for the service
   */
  toServiceOverride(dbOverride: PageClassificationOverride): import('../services/audit/page-priority.service').PageClassificationOverride {
    return {
      url: dbOverride.pageUrl,
      priority: dbOverride.priority as import('../services/audit/page-priority.service').PagePriority,
      reason: dbOverride.reason || undefined
    };
  }

  /**
   * Convert multiple database overrides to service format
   */
  toServiceOverrides(dbOverrides: PageClassificationOverride[]): import('../services/audit/page-priority.service').PageClassificationOverride[] {
    return dbOverrides.map(override => this.toServiceOverride(override));
  }
}