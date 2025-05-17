import express, { Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { apiUsageService } from "../services/apiUsageService";

const router = express.Router();

// Admin authorization check
const isAdmin = async (req: Request, res: Response, next: Function) => {
  // Admin authorization logic - either by role or specific userIds
  if (!req.user || !req.user.claims || !req.user.claims.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const userId = req.user.claims.sub;
  
  // For development purposes, make all authenticated users admins
  // In production, use a proper role-based system with specific user IDs
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  
  // If no admin IDs are configured or this user is in the list
  if (adminUserIds.length === 0 || adminUserIds.includes(userId)) {
    return next();
  }
  
  return res.status(403).json({ error: "Forbidden - Admin access required" });
};

// Get API usage statistics
router.get("/api-usage/stats", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const stats = await apiUsageService.getApiUsageStats({ startDate, endDate });
    res.json(stats);
  } catch (error) {
    console.error("Error fetching API usage stats:", error);
    res.status(500).json({ error: "Failed to fetch API usage statistics" });
  }
});

// Get detailed API usage records
router.get("/api-usage/records", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const provider = req.query.provider as string | undefined;
    
    let records;
    if (provider) {
      records = await apiUsageService.getUsageByProvider(provider, { startDate, endDate });
    } else {
      records = await apiUsageService.getApiUsage({ startDate, endDate });
    }
    
    res.json(records);
  } catch (error) {
    console.error("Error fetching API usage records:", error);
    res.status(500).json({ error: "Failed to fetch API usage records" });
  }
});

// Get recent API errors
router.get("/api-usage/errors", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const errors = await apiUsageService.getRecentErrors(limit);
    res.json(errors);
  } catch (error) {
    console.error("Error fetching API errors:", error);
    res.status(500).json({ error: "Failed to fetch API errors" });
  }
});

export const adminRouter = router;