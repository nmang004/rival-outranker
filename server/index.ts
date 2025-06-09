import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase, closeDatabase, getDatabaseHealth, getDatabaseInfo } from "./lib/database";

// Railway-specific configuration
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const app = express();

// CORS configuration for Railway deployment
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://*.railway.app',
  'https://*.up.railway.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database connection pool
  await initializeDatabase();
  
  const server = await registerRoutes(app);
  
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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    
    server.close(async () => {
      console.log('HTTP server closed');
      
      try {
        await closeDatabase();
        console.log('Database connections closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
      
      console.log('Graceful shutdown complete');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
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
    log(`🚀 Server running on ${HOST}:${PORT}`);
    log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`🗄️  Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  });
})();
