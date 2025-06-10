import { rivalAuditRepository } from '../../repositories/rival-audit.repository';

/**
 * Service for managing audit cleanup and expiration
 */
export class AuditCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start automatic cleanup job
   * Runs every 2 minutes to clean up expired audits
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Audit cleanup service is already running');
      return;
    }

    console.log('🧹 Starting audit cleanup service (runs every 2 minutes)');
    this.isRunning = true;

    // Run cleanup immediately
    this.runCleanup();

    // Then run every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Stop automatic cleanup job
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Audit cleanup service is not running');
      return;
    }

    console.log('🛑 Stopping audit cleanup service');
    this.isRunning = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<number> {
    try {
      const deletedCount = await rivalAuditRepository.cleanupExpiredAudits();
      
      if (deletedCount > 0) {
        console.log(`🧹 Audit cleanup: Removed ${deletedCount} expired audits`);
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Error during audit cleanup:', error);
      return 0;
    }
  }

  /**
   * Get cleanup service status
   */
  getStatus(): {
    isRunning: boolean;
    intervalMinutes: number;
    nextCleanupEstimate?: Date;
  } {
    const status = {
      isRunning: this.isRunning,
      intervalMinutes: 2
    };

    if (this.isRunning) {
      // Estimate next cleanup (approximately)
      const nextCleanup = new Date();
      nextCleanup.setMinutes(nextCleanup.getMinutes() + 2);
      return {
        ...status,
        nextCleanupEstimate: nextCleanup
      };
    }

    return status;
  }

  /**
   * Force cleanup of all expired audits (admin function)
   */
  async forceCleanupAll(): Promise<{
    deletedAudits: number;
    stats: any;
  }> {
    console.log('🧹 Force cleanup: Removing all expired audits...');
    
    try {
      // Get stats before cleanup
      const statsBefore = await rivalAuditRepository.getAuditStats();
      
      // Run cleanup
      const deletedCount = await rivalAuditRepository.cleanupExpiredAudits();
      
      // Get stats after cleanup
      const statsAfter = await rivalAuditRepository.getAuditStats();
      
      console.log(`🧹 Force cleanup completed: Removed ${deletedCount} audits`);
      
      return {
        deletedAudits: deletedCount,
        stats: {
          before: statsBefore,
          after: statsAfter
        }
      };
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(): Promise<any> {
    try {
      return await rivalAuditRepository.getAuditStats();
    } catch (error) {
      console.error('❌ Error getting audit stats:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        processing: 0,
        pending: 0
      };
    }
  }
}

// Singleton instance
export const auditCleanupService = new AuditCleanupService();