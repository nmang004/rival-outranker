import { db as getDb } from '../db';
import { 
  rivalAudits, 
  crawledContent,
  RivalAuditRecord, 
  InsertRivalAuditRecord,
  CrawledContent,
  InsertCrawledContent
} from '../../shared/schema';
import { eq, and, lt, desc, asc, gte, lte, count } from 'drizzle-orm';

export class RivalAuditRepository {
  private getDatabase() {
    const db = getDb();
    if (!db) {
      throw new Error('Database not initialized');
    }
    return db;
  }

  /**
   * Create a new rival audit record
   */
  async createAudit(auditData: InsertRivalAuditRecord): Promise<RivalAuditRecord> {
    try {
      const database = this.getDatabase();
      
      // Set expiration to 30 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      
      console.log('💾 Creating audit record in database...', {
        url: auditData.url,
        status: auditData.status || 'pending',
        userId: auditData.userId
      });
      
      const [audit] = await database
        .insert(rivalAudits)
        .values({
          ...auditData,
          expiresAt,
          status: auditData.status || 'pending'
        })
        .returning();
      
      console.log('✅ Successfully created audit record:', audit.id);
      return audit;
    } catch (error) {
      console.error('❌ Failed to create audit record:', error);
      throw new Error(`Failed to create audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an audit by ID
   */
  async getAudit(id: number): Promise<RivalAuditRecord | undefined> {
    try {
      const database = this.getDatabase();
      
      console.log(`🔍 Querying database for audit ID: ${id}`);
      
      const [audit] = await database
        .select()
        .from(rivalAudits)
        .where(eq(rivalAudits.id, id));
      
      if (audit) {
        console.log(`✅ Found audit in database: ${id}, status: ${audit.status}, created: ${audit.createdAt}`);
      } else {
        console.log(`❌ Audit not found in database: ${id}`);
      }
      
      return audit;
    } catch (error) {
      console.error(`❌ Database error querying audit ${id}:`, error);
      throw new Error(`Failed to get audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an audit by ID for a specific user
   */
  async getAuditByUser(id: number, userId: string): Promise<RivalAuditRecord | undefined> {
    const database = this.getDatabase();
    
    const [audit] = await database
      .select()
      .from(rivalAudits)
      .where(
        and(
          eq(rivalAudits.id, id),
          eq(rivalAudits.userId, userId)
        )
      );
    
    return audit;
  }

  /**
   * Update an audit's status and results
   */
  async updateAudit(
    id: number, 
    updates: Partial<Omit<RivalAuditRecord, 'id' | 'createdAt'>>
  ): Promise<RivalAuditRecord> {
    const database = this.getDatabase();
    
    const [audit] = await database
      .update(rivalAudits)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(rivalAudits.id, id))
      .returning();
    
    return audit;
  }

  /**
   * Mark an audit as completed with results
   */
  async completeAudit(
    id: number, 
    results: any, 
    summary: any, 
    pagesAnalyzed: number,
    reachedMaxPages: boolean = false
  ): Promise<RivalAuditRecord> {
    const database = this.getDatabase();
    
    // ENHANCED DEBUG: Log what we're storing before saving
    console.log(`[Repository] Storing audit ${id} results. Keys:`, Object.keys(results));
    console.log(`[Repository] Enhanced categories being stored:`, {
      contentQuality: !!results.contentQuality,
      technicalSEO: !!results.technicalSEO,
      localSEO: !!results.localSEO,
      uxPerformance: !!results.uxPerformance,
      contentQualityItems: results.contentQuality?.items?.length || 0,
      technicalSEOItems: results.technicalSEO?.items?.length || 0,
      localSEOItems: results.localSEO?.items?.length || 0,
      uxPerformanceItems: results.uxPerformance?.items?.length || 0
    });
    
    const [audit] = await database
      .update(rivalAudits)
      .set({
        status: 'completed',
        results,
        summary,
        pagesAnalyzed,
        reachedMaxPages,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rivalAudits.id, id))
      .returning();
    
    // ENHANCED DEBUG: Verify what was stored immediately after saving
    console.log(`[Repository] Stored audit ${id}. Verifying stored data...`);
    if (audit.results) {
      const storedResults = audit.results as any;
      console.log(`[Repository] Verified stored keys:`, Object.keys(storedResults));
      console.log(`[Repository] Verified enhanced categories stored:`, {
        contentQuality: !!storedResults.contentQuality,
        technicalSEO: !!storedResults.technicalSEO,
        localSEO: !!storedResults.localSEO,
        uxPerformance: !!storedResults.uxPerformance
      });
    }
    
    return audit;
  }

  /**
   * Mark an audit as failed with error message
   */
  async failAudit(id: number, errorMessage: string): Promise<RivalAuditRecord> {
    const database = this.getDatabase();
    
    const [audit] = await database
      .update(rivalAudits)
      .set({
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(rivalAudits.id, id))
      .returning();
    
    return audit;
  }

  /**
   * Get all audits for a user
   */
  async getAuditsByUser(userId: string, limit: number = 10): Promise<RivalAuditRecord[]> {
    const database = this.getDatabase();
    
    return await database
      .select()
      .from(rivalAudits)
      .where(eq(rivalAudits.userId, userId))
      .orderBy(desc(rivalAudits.createdAt))
      .limit(limit);
  }

  /**
   * Get recent audits for a URL
   */
  async getAuditsByUrl(url: string, limit: number = 5): Promise<RivalAuditRecord[]> {
    const database = this.getDatabase();
    
    return await database
      .select()
      .from(rivalAudits)
      .where(eq(rivalAudits.url, url))
      .orderBy(desc(rivalAudits.createdAt))
      .limit(limit);
  }

  /**
   * Delete expired audits (older than 30 minutes)
   */
  async cleanupExpiredAudits(): Promise<number> {
    const database = this.getDatabase();
    
    const now = new Date();
    
    // Get expired audit IDs before deleting
    const expiredAudits = await database
      .select({ id: rivalAudits.id })
      .from(rivalAudits)
      .where(lt(rivalAudits.expiresAt, now));
    
    const expiredIds = expiredAudits.map((audit: any) => audit.id);
    
    // Delete related crawled content first (if we're storing it separately)
    if (expiredIds.length > 0) {
      await database
        .delete(crawledContent)
        .where(
          and(
            eq(crawledContent.type, 'rival_audit'),
            eq(crawledContent.source, `audit_${expiredIds.join('_')}`)
          )
        );
    }
    
    // Delete expired audits
    const deletedAudits = await database
      .delete(rivalAudits)
      .where(lt(rivalAudits.expiresAt, now))
      .returning({ id: rivalAudits.id });
    
    console.log(`🧹 Cleaned up ${deletedAudits.length} expired rival audits`);
    return deletedAudits.length;
  }

  /**
   * Store individual page crawl result
   */
  async storeCrawledPage(
    auditId: number,
    pageData: {
      url: string;
      title: string;
      content: string;
      metadata: any;
    }
  ): Promise<CrawledContent> {
    const database = this.getDatabase();
    
    const crawledData = {
      id: `audit_${auditId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'rival_audit',
      source: `audit_${auditId}`,
      url: pageData.url,
      title: pageData.title,
      content: pageData.content,
      metadata: pageData.metadata,
      wordCount: pageData.content ? pageData.content.split(/\s+/).length : 0,
      languageCode: 'en'
    };
    
    const [crawledPage] = await database
      .insert(crawledContent)
      .values(crawledData)
      .returning();
    
    return crawledPage;
  }

  /**
   * Get crawled pages for an audit
   */
  async getCrawledPages(auditId: number): Promise<CrawledContent[]> {
    const database = this.getDatabase();
    
    return await database
      .select()
      .from(crawledContent)
      .where(
        and(
          eq(crawledContent.type, 'rival_audit'),
          eq(crawledContent.source, `audit_${auditId}`)
        )
      )
      .orderBy(asc(crawledContent.crawledAt));
  }

  /**
   * Check if an audit is still valid (not expired)
   */
  async isAuditValid(id: number): Promise<boolean> {
    const database = this.getDatabase();
    
    const [audit] = await database
      .select({ expiresAt: rivalAudits.expiresAt })
      .from(rivalAudits)
      .where(eq(rivalAudits.id, id));
    
    if (!audit) return false;
    
    return audit.expiresAt > new Date();
  }

  /**
   * Extend audit expiration by 30 minutes (for continue crawl functionality)
   */
  async extendAuditExpiration(id: number): Promise<RivalAuditRecord> {
    const database = this.getDatabase();
    
    const newExpiresAt = new Date();
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 30);
    
    const [audit] = await database
      .update(rivalAudits)
      .set({
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(rivalAudits.id, id))
      .returning();
    
    return audit;
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    pending: number;
  }> {
    const database = this.getDatabase();
    
    const stats = await database
      .select({
        status: rivalAudits.status,
        count: count()
      })
      .from(rivalAudits)
      .groupBy(rivalAudits.status);
    
    const result = {
      total: 0,
      completed: 0,
      failed: 0,
      processing: 0,
      pending: 0
    };
    
    stats.forEach((stat: any) => {
      const count = parseInt(stat.count);
      result.total += count;
      
      switch (stat.status) {
        case 'completed':
          result.completed = count;
          break;
        case 'failed':
          result.failed = count;
          break;
        case 'processing':
          result.processing = count;
          break;
        case 'pending':
          result.pending = count;
          break;
      }
    });
    
    return result;
  }

  /**
   * Get audits by date range for reporting
   */
  async getAuditsByDateRange(startDate: Date, endDate: Date, userId?: number | string): Promise<RivalAuditRecord[]> {
    const database = this.getDatabase();
    
    const whereConditions = [
      gte(rivalAudits.createdAt, startDate),
      lte(rivalAudits.createdAt, endDate),
      eq(rivalAudits.status, 'completed') // Only completed audits for reporting
    ];

    if (userId) {
      whereConditions.push(eq(rivalAudits.userId, userId.toString()));
    }

    return await database
      .select()
      .from(rivalAudits)
      .where(and(...whereConditions))
      .orderBy(desc(rivalAudits.createdAt));
  }

  /**
   * Get an audit by string ID (for backward compatibility)
   */
  /**
   * Get audit by ID for reporting
   */
  async getAuditById(id: string): Promise<RivalAuditRecord | null> {
    const database = this.getDatabase();
    
    const [audit] = await database
      .select()
      .from(rivalAudits)
      .where(eq(rivalAudits.id, parseInt(id)));
    
    return audit || null;
  }
}

// Singleton instance
export const rivalAuditRepository = new RivalAuditRepository();