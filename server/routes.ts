import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { crawler } from "./services/crawler";
import { analyzer } from "./services/analyzer";
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
      
      // Crawl the webpage
      const pageData = await crawler.crawlPage(url);
      
      // Analyze the page data
      const analysisResult = await analyzer.analyzePage(url, pageData);
      
      // Store the analysis result
      const analysisData = {
        url: analysisResult.url,
        overallScore: analysisResult.overallScore.score,
        results: analysisResult
      };
      
      // Validate the analysis data
      const validatedData = insertAnalysisSchema.parse(analysisData);
      
      // Save to storage
      await storage.createAnalysis(validatedData);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
