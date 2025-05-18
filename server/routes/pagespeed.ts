import { Router, Request, Response } from "express";
import { fetchPageSpeedMetrics } from "../services/pageSpeedService";
import { trackApiUsage } from "../middleware/apiUsageMiddleware";

export const pagespeedRouter = Router();

// Apply API usage tracking middleware
pagespeedRouter.use(trackApiUsage('google'));

/**
 * GET /api/pagespeed
 * Fetch PageSpeed Insights metrics for a given URL
 * Query parameters:
 *   - url: The URL to analyze (required)
 */
pagespeedRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'PageSpeed API key is not configured' });
    }
    
    console.log(`Fetching PageSpeed metrics for: ${url}`);
    const metrics = await fetchPageSpeedMetrics(url);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching PageSpeed metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch PageSpeed metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});