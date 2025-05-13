import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { crawler } from "./services/crawler";
import { analyzer } from "./services/analyzer";
import { competitorAnalyzer } from "./services/competitorAnalyzer";
import { deepContentAnalyzer } from "./services/deepContentAnalyzer";
import { urlFormSchema, insertAnalysisSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to analyze a URL
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      // Validate the URL
      const { url } = urlFormSchema.parse(req.body);
      
      // Show the analysis is in progress
      res.status(202).json({ message: "Analysis started", url });
      
      try {
        // Crawl the webpage
        console.log("Crawling page:", url);
        const pageData = await crawler.crawlPage(url);
        
        // Analyze the page data
        console.log("Analyzing page:", url);
        const analysisResult = await analyzer.analyzePage(url, pageData);
        
        // Store the analysis result
        const analysisData = {
          url: analysisResult.url,
          overallScore: analysisResult.overallScore.score,
          results: analysisResult
        };
        
        // Validate and save to storage
        const validatedData = insertAnalysisSchema.parse(analysisData);
        await storage.createAnalysis(validatedData);
        
        console.log("Analysis completed for:", url);
      } catch (analysisError) {
        console.error("Error during analysis:", analysisError);
        
        // Even if analysis fails, create a minimal valid analysis record to prevent timeouts
        const fallbackAnalysis = {
          url,
          overallScore: 0,
          results: {
            url,
            timestamp: new Date(),
            overallScore: {
              score: 0,
              category: 'poor' as const
            },
            strengths: [],
            weaknesses: ["Analysis could not be completed. Please try again."],
            keywordAnalysis: {
              primaryKeyword: "",
              density: 0,
              relatedKeywords: [],
              titlePresent: false,
              descriptionPresent: false,
              h1Present: false,
              headingsPresent: false,
              contentPresent: false,
              urlPresent: false,
              altTextPresent: false,
              overallScore: { score: 0, category: 'poor' as const }
            }
          }
        };
        
        try {
          await storage.createAnalysis(fallbackAnalysis);
        } catch (storageError) {
          console.error("Failed to create fallback analysis:", storageError);
        }
      }
      
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        console.error("Error analyzing URL:", error);
        res.status(500).json({ error: "Failed to analyze the URL" });
      }
    }
  });

  // API endpoint to get analysis results by URL
  app.get("/api/analysis", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        // If no URL is provided, return the latest analyses
        const latestAnalyses = await storage.getLatestAnalyses(10);
        return res.json(latestAnalyses);
      }
      
      // Get analyses for the specific URL
      const analyses = await storage.getAnalysesByUrl(url);
      
      if (analyses.length === 0) {
        return res.status(404).json({ message: "No analysis found for this URL" });
      }
      
      // Return the most recent analysis
      return res.json(analyses[0]);
    } catch (error) {
      console.error("Error retrieving analysis:", error);
      res.status(500).json({ error: "Failed to retrieve analysis" });
    }
  });

  // API endpoint to get a specific analysis by ID
  app.get("/api/analysis/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }
      
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      return res.json(analysis);
    } catch (error) {
      console.error("Error retrieving analysis:", error);
      res.status(500).json({ error: "Failed to retrieve analysis" });
    }
  });

  // API endpoint to get all analyses (for history)
  app.get("/api/analyses", async (_req: Request, res: Response) => {
    try {
      const analyses = await storage.getAllAnalyses();
      return res.json(analyses);
    } catch (error) {
      console.error("Error retrieving analyses:", error);
      res.status(500).json({ error: "Failed to retrieve analyses" });
    }
  });

  // API endpoint for competitor analysis
  app.get("/api/competitors", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      const keyword = req.query.keyword as string;
      const location = req.query.location as string || 'United States';
      
      if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      if (!keyword) {
        return res.status(400).json({ error: "Keyword parameter is required" });
      }
      
      console.log(`Analyzing competitors for URL: ${url}, Keyword: ${keyword}, Location: ${location}`);
      
      // Get competitor analysis with location
      const competitorAnalysis = await competitorAnalyzer.analyzeCompetitors(url, keyword, location);
      
      return res.json(competitorAnalysis);
    } catch (error) {
      console.error("Error performing competitor analysis:", error);
      res.status(500).json({ error: "Failed to analyze competitors" });
    }
  });
  
  // API endpoint for deep content analysis
  app.get("/api/deep-content", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
      }
      
      // Crawl the webpage if needed
      console.log(`Performing deep content analysis for URL: ${url}`);
      
      try {
        // Crawl the page
        const pageData = await crawler.crawlPage(url);
        
        // Extract primary keyword first
        const keywordAnalysisResult = await analyzer.analyzePage(url, pageData);
        const primaryKeyword = keywordAnalysisResult.keywordAnalysis.primaryKeyword;
        
        // Perform deep content analysis
        const deepAnalysisResult = await deepContentAnalyzer.analyzeContent(pageData, primaryKeyword);
        
        return res.json(deepAnalysisResult);
      } catch (analysisError) {
        console.error("Error during deep content analysis:", analysisError);
        return res.status(500).json({ error: "Failed to perform deep content analysis" });
      }
    } catch (error) {
      console.error("Error in deep content analysis request:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
