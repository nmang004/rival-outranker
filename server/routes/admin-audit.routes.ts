import { Router, Request, Response } from 'express';
import { rivalAuditRepository } from '../repositories/rival-audit.repository';
import { auditCleanupService } from '../services/audit/cleanup.service';

const router = Router();

// Middleware to ensure admin access (add proper admin middleware later)
const requireAdmin = (req: Request, res: Response, next: any) => {
  // For now, just check if user exists - in production, check for admin role
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // TODO: Add proper admin role check here
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Admin access required' });
  // }
  next();
};

// Get audit statistics
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await auditCleanupService.getAuditStats();
    const cleanupStatus = auditCleanupService.getStatus();
    
    res.json({
      auditStats: stats,
      cleanupService: cleanupStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting audit stats:', error);
    res.status(500).json({ error: 'Failed to get audit statistics' });
  }
});

// Get recent audits
router.get('/recent', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    
    let audits;
    if (userId) {
      audits = await rivalAuditRepository.getAuditsByUser(userId, limit);
    } else {
      // Get all recent audits - we'd need to add this method to repository
      // For now, just return empty array
      audits = [];
    }
    
    res.json({
      audits,
      total: audits.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recent audits:', error);
    res.status(500).json({ error: 'Failed to get recent audits' });
  }
});

// Force cleanup of expired audits
router.post('/cleanup', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await auditCleanupService.forceCleanupAll();
    
    res.json({
      success: true,
      deletedAudits: result.deletedAudits,
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during force cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup expired audits' });
  }
});

// Start/stop cleanup service
router.post('/cleanup/control', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    
    if (action === 'start') {
      auditCleanupService.start();
      res.json({ success: true, message: 'Cleanup service started' });
    } else if (action === 'stop') {
      auditCleanupService.stop();
      res.json({ success: true, message: 'Cleanup service stopped' });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
    }
  } catch (error) {
    console.error('Error controlling cleanup service:', error);
    res.status(500).json({ error: 'Failed to control cleanup service' });
  }
});

// Get specific audit details (admin view)
router.get('/audit/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const auditId = parseInt(req.params.id);
    
    if (isNaN(auditId)) {
      return res.status(400).json({ error: 'Invalid audit ID' });
    }
    
    const audit = await rivalAuditRepository.getAudit(auditId);
    
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    
    // Get crawled pages for this audit
    const crawledPages = await rivalAuditRepository.getCrawledPages(auditId);
    
    res.json({
      audit,
      crawledPages: crawledPages.length > 0 ? crawledPages : null,
      pageCount: crawledPages.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting audit details:', error);
    res.status(500).json({ error: 'Failed to get audit details' });
  }
});

export { router as adminAuditRoutes };