import express, { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { apiUsageService } from "../services/apiUsageService";

const router = express.Router();

// Admin authorization check
const isAdmin = async (req: Request, res: Response, next: Function) => {
  // Verify the user is authenticated
  if (!req.user || !req.user || !req.user.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    // Get the user from the database
    const userId = req.user.userId;
    const { storage } = await import('../storage');
    const user = await storage.getUser(userId);
    
    // Check if the user has admin role
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    
    return next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get API usage statistics - Protected route
router.get("/api-usage/stats", authenticate, isAdmin, async (req: Request, res: Response) => {
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

// Add a development route that doesn't require authentication for testing
router.get("/dev/api-usage/stats", async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Return demonstration data showing how the API usage tracking would work
    const sampleStats = {
      totalCalls: 487,
      successfulCalls: 432,
      failedCalls: 55,
      averageResponseTime: 245,
      totalCost: 18.74,
      costByProvider: {
        "google-ads": 7.25,
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
        "google-ads": 156,
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
            { date: dateStr, provider: "google-ads", count: 20 + Math.floor(Math.random() * 10), cost: 1.05 + (Math.random() * 0.5) },
            { date: dateStr, provider: "dataforseo", count: 22 + Math.floor(Math.random() * 12), cost: 1.15 + (Math.random() * 0.6) },
            { date: dateStr, provider: "openai", count: 5 + Math.floor(Math.random() * 5), cost: 0.35 + (Math.random() * 0.2) },
            { date: dateStr, provider: "internal", count: 15 + Math.floor(Math.random() * 8), cost: 0 }
          ];
        }).flat()
      ]
    };
    
    res.json(sampleStats);
  } catch (error) {
    console.error("Error fetching API usage stats:", error);
    res.status(500).json({ error: "Failed to fetch API usage statistics" });
  }
});

// Get detailed API usage records
router.get("/api-usage/records", authenticate, isAdmin, async (req: Request, res: Response) => {
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

// Development route for API records that doesn't require authentication
router.get("/dev/api-usage/records", async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const provider = req.query.provider as string | undefined;
    
    // Sample API usage records for demonstration
    const apiProviders = ["google-ads", "dataforseo", "openai", "internal"];
    const endpoints = [
      "/api/keyword-research", 
      "/api/analyze", 
      "/api/deep-content", 
      "/api/competitors", 
      "/api/rival-audit", 
      "/api/backlinks", 
      "/api/openai-chat"
    ];
    const methods = ["GET", "POST"];
    const statusCodes = [200, 200, 200, 200, 400, 401, 404, 429, 500];
    
    // Generate sample records
    const sampleRecords = Array.from({ length: 50 }, (_, i) => {
      const selectedProvider = provider || apiProviders[Math.floor(Math.random() * apiProviders.length)];
      if (provider && selectedProvider !== provider) return null;
      
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - i * 30);
      
      const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      const responseTime = Math.floor(Math.random() * 500) + 100;
      
      // Calculate estimated cost based on provider
      let estimatedCost = 0;
      if (selectedProvider === "google-ads") {
        estimatedCost = Math.random() * 0.05 + 0.01;
      } else if (selectedProvider === "dataforseo") {
        estimatedCost = Math.random() * 0.06 + 0.02;
      } else if (selectedProvider === "openai") {
        estimatedCost = Math.random() * 0.09 + 0.03;
      }
      
      return {
        id: i + 1,
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        statusCode,
        responseTime,
        timestamp: timestamp.toISOString(),
        apiProvider: selectedProvider,
        requestData: { query: "sample query data" },
        responseData: statusCode < 400 ? { success: true } : null,
        errorMessage: statusCode >= 400 ? "Sample error message" : null,
        estimatedCost,
        usageMetrics: { tokens: Math.floor(Math.random() * 1000) }
      };
    }).filter(record => record !== null);
    
    res.json(sampleRecords);
  } catch (error) {
    console.error("Error fetching API usage records:", error);
    res.status(500).json({ error: "Failed to fetch API usage records" });
  }
});

// Get recent API errors
router.get("/api-usage/errors", authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const errors = await apiUsageService.getRecentErrors(limit);
    res.json(errors);
  } catch (error) {
    console.error("Error fetching API errors:", error);
    res.status(500).json({ error: "Failed to fetch API errors" });
  }
});

// Development route for API errors that doesn't require authentication
router.get("/dev/api-usage/errors", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    // Sample API error data for demonstration
    const errorTypes = [
      { status: 400, message: "Bad Request - Invalid parameters" },
      { status: 401, message: "Unauthorized - Authentication required" },
      { status: 403, message: "Forbidden - Insufficient permissions" },
      { status: 404, message: "Not Found - Resource doesn't exist" },
      { status: 429, message: "Too Many Requests - Rate limit exceeded" },
      { status: 500, message: "Internal Server Error - Server failed to process request" }
    ];
    
    const apiProviders = ["google-ads", "dataforseo", "openai"];
    const endpoints = [
      "/api/keyword-research", 
      "/api/analyze", 
      "/api/deep-content", 
      "/api/competitors", 
      "/api/rival-audit"
    ];
    
    // Generate sample error records
    const sampleErrors = Array.from({ length: Math.min(20, limit) }, (_, i) => {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i * 2);
      
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      const apiProvider = apiProviders[Math.floor(Math.random() * apiProviders.length)];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      // Provider-specific error details
      let errorDetails = {};
      if (apiProvider === "google-ads") {
        errorDetails = {
          code: "RESOURCE_EXHAUSTED",
          details: "Too many requests. Retry in 4 seconds."
        };
      } else if (apiProvider === "dataforseo") {
        errorDetails = {
          code: "INVALID_ARGUMENT",
          details: "Missing required parameter 'keywords'"
        };
      } else if (apiProvider === "openai") {
        errorDetails = {
          code: "RATE_LIMIT_EXCEEDED",
          details: "Rate limit reached for requests"
        };
      }
      
      return {
        id: i + 1,
        endpoint,
        method: "POST",
        statusCode: errorType.status,
        responseTime: Math.floor(Math.random() * 1000) + 200,
        timestamp: timestamp.toISOString(),
        apiProvider,
        requestData: { query: "sample query data" },
        responseData: null,
        errorMessage: `${errorType.message}: ${JSON.stringify(errorDetails)}`,
        estimatedCost: 0,
        usageMetrics: null
      };
    });
    
    res.json(sampleErrors);
  } catch (error) {
    console.error("Error fetching API errors:", error);
    res.status(500).json({ error: "Failed to fetch API errors" });
  }
});

// Add endpoint to grant admin access to a user by email
router.post("/grant-admin", authenticate, isAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const { adminService } = await import('../services/adminService');
    const success = await adminService.grantAdminRoleByEmail(email);
    
    if (!success) {
      return res.status(404).json({ error: "User not found or error granting admin access" });
    }
    
    res.json({ success: true, message: `Admin access granted to ${email}` });
  } catch (error) {
    console.error("Error granting admin access:", error);
    res.status(500).json({ error: "Failed to grant admin access" });
  }
});

// Check if current user is an admin
router.get("/is-admin", authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ isAdmin: false });
    }
    
    const userId = req.user.userId;
    const { adminService } = await import('../services/adminService');
    const isAdmin = await adminService.isUserAdmin(userId);
    
    res.json({ isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Failed to check admin status" });
  }
});

export const adminRouter = router;