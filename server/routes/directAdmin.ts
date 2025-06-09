import express, { Request, Response } from "express";
import { apiUsageService } from "../services/common/api-usage.service";

const router = express.Router();

// Enable direct access to admin dashboard for demo purposes
router.get("/api-usage/stats", async (req: Request, res: Response) => {
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

// Direct access to API usage records
router.get("/api-usage/records", async (req: Request, res: Response) => {
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

// Direct access to API errors
router.get("/api-usage/errors", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const errors = await apiUsageService.getRecentErrors(limit);
    res.json(errors);
  } catch (error) {
    console.error("Error fetching API errors:", error);
    res.status(500).json({ error: "Failed to fetch API errors" });
  }
});

// If real data is not available, provide sample data for demonstration
router.get("/sample/api-usage/stats", async (req: Request, res: Response) => {
  try {
    // Return demonstration data showing how the API usage tracking would work
    const sampleStats = {
      totalCalls: 487,
      successfulCalls: 432,
      failedCalls: 55,
      averageResponseTime: 245,
      totalCost: 18.74,
      costByProvider: {
        "dataforseo": 8.49,
        "openai": 3.00,
        "internal": 0
      },
      byEndpoint: {
        "/api/keyword-research": 145,
        "/api/analyze": 98,
        "/api/deep-content": 76,
        "/api/competitors": 62,
        "/api/rival-audit": 41,
        "/api/backlinks": 35,
        "/api/openai-chat": 30
      },
      byMethod: {
        "GET": 287,
        "POST": 200
      },
      byApiProvider: {
        "dataforseo": 178,
        "openai": 42,
        "internal": 111
      },
      byStatusCode: {
        "200": 432,
        "400": 21,
        "401": 13,
        "404": 7,
        "429": 8,
        "500": 6
      },
      timeSeriesData: [
        // Past 7 days of sample data
        ...[...Array(7)].map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const dateStr = date.toISOString().split('T')[0];
          
          return [
            { date: dateStr, provider: "dataforseo", count: 22 + Math.floor(Math.random() * 12), cost: 1.15 + (Math.random() * 0.6) },
            { date: dateStr, provider: "openai", count: 5 + Math.floor(Math.random() * 5), cost: 0.35 + (Math.random() * 0.2) },
            { date: dateStr, provider: "internal", count: 15 + Math.floor(Math.random() * 8), cost: 0 }
          ];
        }).flat()
      ]
    };
    
    res.json(sampleStats);
  } catch (error) {
    console.error("Error fetching sample API usage stats:", error);
    res.status(500).json({ error: "Failed to fetch sample API usage statistics" });
  }
});

export const directAdminRouter = router;