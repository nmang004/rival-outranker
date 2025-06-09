import { Router, Request, Response } from 'express';
import { deepContentAnalyzer } from '../services/analysis/content-analyzer.service';
import { crawler } from '../services/audit/crawler.service';
import { searchService } from '../services/external/search.service';

const router = Router();

// API endpoint for deep content analysis (GET)
router.get("/deep-content", async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    
    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }
    
    console.log(`Deep content analysis requested for: ${url}`);
    
    // Crawl the webpage to get content
    const pageData = await crawler.crawlPage(url);
    
    // Perform deep content analysis
    const deepContentResult = await deepContentAnalyzer.analyzeContent(url, pageData);
    
    return res.json({
      url,
      timestamp: new Date(),
      analysis: deepContentResult,
      queryCount: searchService.getQueryCount()
    });
  } catch (error) {
    console.error("Error performing deep content analysis:", error);
    return res.status(500).json({ 
      error: "Failed to analyze content",
      queryCount: searchService.getQueryCount()
    });
  }
});

// Get search query count
router.get("/search-query-count", (_req: Request, res: Response) => {
  try {
    const queryCount = searchService.getQueryCount();
    const limit = searchService.getQueryLimit();
    const remaining = Math.max(0, limit - queryCount);
    
    res.json({
      used: queryCount,
      limit: limit,
      remaining: remaining,
      percentage: Math.round((queryCount / limit) * 100)
    });
  } catch (error) {
    console.error("Error getting search query count:", error);
    res.status(500).json({ error: "Failed to get query count" });
  }
});

// API endpoint for content analysis (POST)
router.post("/analyze-content", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    console.log(`Content analysis requested for: ${url}`);
    
    // Return immediate response
    res.status(202).json({ 
      message: "Content analysis started", 
      url 
    });
    
    // Perform analysis asynchronously
    try {
      const pageData = await crawler.crawlPage(url);
      const analysisResult = await deepContentAnalyzer.analyzeContent(url, pageData);
      
      console.log(`Content analysis completed for: ${url}`);
      // In a real implementation, you would store this result and notify the client
      
    } catch (analysisError) {
      console.error("Error during content analysis:", analysisError);
    }
    
    return;
  } catch (error) {
    console.error("Error starting content analysis:", error);
    res.status(500).json({ error: "Failed to start content analysis" });
  }
});

// API endpoint for deep content analysis (POST)
router.post("/deep-content", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    console.log(`Deep content analysis requested for: ${url}`);
    
    // Return immediate response
    res.status(202).json({ 
      message: "Deep content analysis started", 
      url 
    });
    
    // Perform analysis asynchronously
    try {
      const pageData = await crawler.crawlPage(url);
      const deepContentResult = await deepContentAnalyzer.analyzeContent(url, pageData);
      
      console.log(`Deep content analysis completed for: ${url}`);
      // In a real implementation, you would store this result and notify the client
      
    } catch (analysisError) {
      console.error("Error during deep content analysis:", analysisError);
    }
    
    return;
  } catch (error) {
    console.error("Error starting deep content analysis:", error);
    res.status(500).json({ error: "Failed to start deep content analysis" });
  }
});

export { router as contentRoutes };