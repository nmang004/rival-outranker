import express, { type Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";

// Import existing route modules
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { keywordRouter } from "./keywords";
import { backlinkRouter } from "./backlinks";
import { adminRouter } from "./admin";
import { directAdminRouter } from "./directAdmin";
import { pagespeedRouter } from "./pagespeed";

// Import new modular route modules
import { analysisRoutes } from "./analysis.routes";
import { competitorRoutes } from "./competitor.routes";
import { auditRoutes } from "./audit.routes";
import { contentRoutes } from "./content.routes";
import { keywordResearchRoutes } from "./keyword-research.routes";
import { rankTrackerRoutes } from "./rank-tracker.routes";
import { pdfRoutes } from "./pdf.routes";
import { openaiRoutes } from "./openai.routes";

// Import middleware
import { trackInternalApi, trackApiUsage } from "../middleware/apiUsageMiddleware";
import { authenticate } from "../middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use cookie parser middleware
  app.use(cookieParser());
  
  // Set up static file serving for sample PDFs
  app.use('/static-assets', express.static('attached_assets'));
  
  // Setup middleware for tracking API usage
  app.use('/api/analysis', trackApiUsage('internal'));
  app.use('/api/competitors', trackApiUsage('internal'));
  app.use('/api/rival-audit', trackApiUsage('internal'));
  app.use('/api/content', trackApiUsage('dataforseo'));
  app.use('/api/keyword-research', trackApiUsage('dataforseo'));
  app.use('/api/rank-tracker', trackApiUsage('internal'));
  app.use('/api/pdf', trackApiUsage('internal'));
  app.use('/api/openai', trackApiUsage('openai'));
  
  // Legacy routes - keep for backward compatibility
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/keywords', trackInternalApi, keywordRouter);
  app.use('/api/backlinks', trackApiUsage('backlinks'), backlinkRouter);
  app.use('/api/admin', authenticate, trackApiUsage('internal'), adminRouter);
  app.use('/api/direct-admin', directAdminRouter);
  app.use('/api/pagespeed', pagespeedRouter);
  
  // New modular routes
  app.use('/api', analysisRoutes);
  app.use('/api/competitors', competitorRoutes);
  app.use('/api/rival-audit', auditRoutes);
  app.use('/api', contentRoutes);
  app.use('/api', keywordResearchRoutes);
  app.use('/api', rankTrackerRoutes);
  app.use('/api', pdfRoutes);
  app.use('/api', openaiRoutes);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });
  
  // Create and return the server
  const server = createServer(app);
  return server;
}