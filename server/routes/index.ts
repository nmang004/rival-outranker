import express, { type Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";

// Import existing route modules
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { directAdminRouter } from "./directAdmin";
import { pagespeedRouter } from "./pagespeed";

// Import new modular route modules
import { analysisRoutes } from "./analysis.routes";
import { auditRoutes } from "./audit.routes";
import { adminAuditRoutes } from "./admin-audit.routes";
import { contentRoutes } from "./content.routes";
import { openaiRoutes } from "./openai.routes";
import monitoringRoutes from "./monitoring.routes";
import ofiReportRoutes from "./ofi-report.routes";

// Import middleware
import { trackInternalApi, trackApiUsage } from "../middleware/apiUsageMiddleware";
import { authenticate } from "../middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use cookie parser middleware
  app.use(cookieParser());
  
  // Set up static file serving for audit assets
  app.use('/static-assets', express.static('attached_assets'));
  
  // Setup middleware for tracking API usage
  app.use('/api/analysis', trackApiUsage('internal'));
  app.use('/api/rival-audit', trackApiUsage('internal'));
  app.use('/api/content', trackApiUsage('openai'));
  app.use('/api/openai', trackApiUsage('openai'));
  
  // Legacy routes - keep for backward compatibility
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/admin', authenticate, trackApiUsage('internal'), adminRouter);
  app.use('/api/direct-admin', directAdminRouter);
  app.use('/api/pagespeed', pagespeedRouter);
  
  // New modular routes
  app.use('/api', analysisRoutes);
  app.use('/api/rival-audit', auditRoutes);
  app.use('/api', contentRoutes);
  app.use('/api', openaiRoutes);
  
  // Admin audit management routes
  app.use('/api/admin/audits', adminAuditRoutes);
  
  // Monitoring and health check routes
  app.use('/api', monitoringRoutes);
  
  // OFI reporting and classification routes
  app.use('/api/ofi-reports', trackApiUsage('internal'), ofiReportRoutes);
  
  // Create and return the server
  const server = createServer(app);
  return server;
}