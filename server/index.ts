import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index";
import { initializeDatabase, closeDatabase, getDatabaseHealth, getDatabaseInfo } from "./lib/database";

// Service registry for graceful shutdown
// This allows services (like PuppeteerHandlerService) to register cleanup functions
// that will be called during graceful shutdown to prevent zombie processes
interface ServiceWithCleanup {
  name: string;
  cleanup: () => Promise<void>;
}

const serviceRegistry: ServiceWithCleanup[] = [];

/**
 * Register a service for graceful shutdown cleanup
 */
export const registerServiceForCleanup = (name: string, cleanup: () => Promise<void>) => {
  serviceRegistry.push({ name, cleanup });
  console.log(`📋 Registered service for cleanup: ${name}`);
};

/**
 * Cleanup all active Puppeteer clusters across services
 */
const cleanupPuppeteerClusters = async (): Promise<void> => {
  try {
    console.log('🧹 Starting Puppeteer cluster cleanup...');
    
    // Import and check for active Puppeteer services
    const { PuppeteerHandlerService } = await import('./services/audit/crawling/puppeteer-handler.service');
    
    // Get any global or singleton instances that might exist
    // Since PuppeteerHandlerService is instantiated within other services,
    // we need to handle cleanup through the service registry pattern
    console.log('🔍 Checking for active Puppeteer clusters in service registry...');
    
    // Filter services that contain 'puppeteer' in their name
    const puppeteerServices = serviceRegistry.filter(service => 
      service.name.toLowerCase().includes('puppeteer')
    );
    
    if (puppeteerServices.length > 0) {
      console.log(`🎯 Found ${puppeteerServices.length} Puppeteer service(s) to cleanup`);
      
      for (const service of puppeteerServices) {
        try {
          console.log(`🧽 Cleaning up ${service.name}...`);
          await Promise.race([
            service.cleanup(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Cleanup timeout')), 5000)
            )
          ]);
          console.log(`✅ ${service.name} cleanup completed`);
        } catch (error) {
          console.error(`❌ Error cleaning up ${service.name}:`, error);
        }
      }
    } else {
      console.log('ℹ️  No active Puppeteer clusters found in registry');
    }
    
    console.log('✅ Puppeteer cluster cleanup completed');
  } catch (error) {
    console.error('❌ Error during Puppeteer cleanup:', error);
  }
};

// Railway-specific configuration
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

const app = express();

// CORS configuration for Railway deployment
const allowedOrigins = (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim()) 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://*.railway.app',
      'https://*.up.railway.app',
      'https://rival-outranker.netlify.app',
      'https://*.netlify.app'
    ];

app.use(cors({
  origin: function(origin, callback) {
    // Only log CORS details in development
    if (!isProduction) {
      console.log(`🔍 CORS check for origin: ${origin}`);
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      if (!isProduction) console.log('✅ No origin - allowing request');
      return callback(null, true);
    }
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (!isProduction) console.log(`🔍 Checking ${origin} against ${allowedOrigin}`);
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        const regex = new RegExp(pattern);
        const matches = regex.test(origin);
        if (!isProduction) console.log(`🔍 Wildcard pattern ${pattern} matches ${origin}: ${matches}`);
        return matches;
      }
      const exactMatch = allowedOrigin === origin;
      if (!isProduction) console.log(`🔍 Exact match ${allowedOrigin} === ${origin}: ${exactMatch}`);
      return exactMatch;
    });
    
    if (isAllowed) {
      if (!isProduction) console.log(`✅ CORS allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      console.warn(`❌ Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Has-More']
}));

// Increase JSON payload limit to 50MB for larger PDF files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database connection pool (non-blocking)
  console.log('🔧 Starting database initialization...');
  try {
    await initializeDatabase();
    
    // Run database migration after successful connection
    console.log('🗄️ Running database migration...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout, stderr } = await execAsync('npx drizzle-kit push --config=config/drizzle.config.ts', {
        timeout: 60000
      });
      
      if (stdout) {
        console.log('✅ Migration completed:', stdout);
      }
      if (stderr && !stderr.includes('Reading config file')) {
        console.warn('⚠️ Migration warnings:', stderr);
      }
      
      console.log('🎯 Database schema is ready!');
    } catch (migrationError) {
      console.error('❌ Database migration failed:', migrationError);
      console.log('🔄 Server will continue without full database features');
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('🔄 Server will continue with sample data mode');
  }
  
  const server = await registerRoutes(app);
  
  // Start audit cleanup service for automatic expired audit removal
  if (process.env.DATABASE_URL) {
    console.log('🧹 Starting audit cleanup service...');
    const { auditCleanupService } = await import('./services/audit/cleanup.service');
    auditCleanupService.start();
  }
  
  // Enhanced health check endpoint
  app.get('/health', async (req, res) => {
    const dbHealth = await getDatabaseHealth();
    const dbInfo = await getDatabaseInfo();
    
    const health = {
      status: dbHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      database: {
        connected: dbHealth,
        ...dbInfo
      }
    };
    
    const statusCode = dbHealth ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // Enhanced error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log error details in development
    if (!isProduction) {
      console.error('Error details:', {
        url: req.url,
        method: req.method,
        status,
        message,
        stack: err.stack
      });
    }
    
    // Don't expose sensitive error details in production
    const responseMessage = isProduction && status === 500 ? 'Internal Server Error' : message;
    
    res.status(status).json({ 
      error: responseMessage,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  });

  // Setup Vite in development, serve static files in production
  if (!isProduction) {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } catch (error) {
      console.warn("Could not load Vite for development:", error instanceof Error ? error.message : String(error));
    }
  } else {
    // In production, no need for Vite or static file serving
    // Frontend is hosted on Netlify
    console.log("🏭 Production mode: Frontend served by Netlify");
  }
  
  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    
    server.close(async () => {
      console.log('HTTP server closed');
      
      // Stop audit cleanup service
      if (process.env.DATABASE_URL) {
        try {
          const { auditCleanupService } = await import('./services/audit/cleanup.service');
          auditCleanupService.stop();
          console.log('Audit cleanup service stopped');
        } catch (error) {
          console.error('Error stopping audit cleanup service:', error);
        }
      }
      
      // Cleanup all Puppeteer clusters
      await cleanupPuppeteerClusters();
      
      // Cleanup all registered services
      if (serviceRegistry.length > 0) {
        console.log(`🧹 Cleaning up ${serviceRegistry.length} registered service(s)...`);
        
        for (const service of serviceRegistry) {
          try {
            console.log(`🧽 Cleaning up ${service.name}...`);
            await Promise.race([
              service.cleanup(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Service cleanup timeout')), 3000)
              )
            ]);
            console.log(`✅ ${service.name} cleanup completed`);
          } catch (error) {
            console.error(`❌ Error cleaning up ${service.name}:`, error);
          }
        }
        
        console.log('✅ All registered services cleaned up');
      }
      
      try {
        await closeDatabase();
        console.log('Database connections closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
      
      console.log('Graceful shutdown complete');
      process.exit(0);
    });
    
    // Force close after 15 seconds (increased to accommodate Puppeteer cleanup)
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 15000);
  };
  
  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
  
  // Start the server
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  });
})();
