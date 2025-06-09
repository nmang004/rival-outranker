import { RivalAudit } from '../../../shared/schema';
import { auditService } from './audit.service';

/**
 * Legacy RivalAuditCrawler - now delegates to modular audit services
 * This maintains backward compatibility while using the new architecture
 */
class RivalAuditCrawler {
  
  /**
   * Crawl a website and perform a rival audit
   * 
   * @param url Target website URL
   * @returns RivalAudit data
   */
  async crawlAndAudit(url: string): Promise<RivalAudit> {
    console.log(`[RivalAuditCrawler] Starting audit for: ${url}`);
    
    try {
      const result = await auditService.crawlAndAudit(url);
      console.log(`[RivalAuditCrawler] Completed audit for: ${url}`);
      return result;
    } catch (error) {
      console.error(`[RivalAuditCrawler] Error during audit for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Continue an existing crawl (for large sites)
   * 
   * @param url Target website URL
   * @returns RivalAudit data
   */
  async continueCrawl(url: string): Promise<RivalAudit> {
    console.log(`[RivalAuditCrawler] Continuing crawl for: ${url}`);
    
    try {
      const result = await auditService.continueCrawl(url);
      console.log(`[RivalAuditCrawler] Completed continued crawl for: ${url}`);
      return result;
    } catch (error) {
      console.error(`[RivalAuditCrawler] Error during continued crawl for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Get crawler statistics
   */
  getStats() {
    return auditService.getCrawlerStats();
  }
}

// Create and export singleton instance
export const rivalAuditCrawler = new RivalAuditCrawler();