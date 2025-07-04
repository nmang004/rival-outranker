import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../../shared/schema";

const { Pool } = pg;

// Database configuration for Railway PostgreSQL
const DATABASE_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections in the pool
  min: 2, // Minimum number of connections in the pool
  idleTimeoutMillis: 30000, // Close connections after 30 seconds of inactivity
  connectionTimeoutMillis: 10000, // How long to wait for a connection
  statement_timeout: 30000, // 30 second statement timeout
  query_timeout: 30000, // 30 second query timeout
  application_name: 'rival-outranker'
};

class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: InstanceType<typeof Pool> | null = null;
  private db: any = null;
  private isHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "⚠️  DATABASE_URL not set. Database features will be disabled. Core SEO analysis will work with sample data."
      );
      console.warn("To enable full features, set DATABASE_URL in your .env file");
      this.createMockDatabase();
      return;
    }

    try {
      this.pool = new Pool(DATABASE_CONFIG);
      this.db = drizzle({ client: this.pool, schema });
      
      // Test the connection
      await this.healthCheck();
      
      console.log("✅ Database connection pool initialized successfully");
      
      // Set up periodic health checks
      setInterval(() => this.healthCheck(), this.healthCheckInterval);
      
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      this.createMockDatabase();
    }
  }

  private createMockDatabase(): void {
    this.pool = {
      query: () => {
        throw new Error("Database not configured. Set DATABASE_URL environment variable.");
      },
      connect: () => {
        throw new Error("Database not configured. Set DATABASE_URL environment variable.");
      },
      end: () => Promise.resolve()
    } as any;
    
    this.db = {
      select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: () => Promise.resolve([]) }) }) }) }) }),
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      delete: () => ({ where: () => Promise.resolve([]) }),
      $with: () => ({ qb: { select: () => ({ from: () => Promise.resolve([]) }) } })
    } as any;
  }

  async healthCheck(): Promise<boolean> {
    const now = Date.now();
    
    // Skip if we checked recently
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isHealthy;
    }

    this.lastHealthCheck = now;

    if (!this.pool || !process.env.DATABASE_URL) {
      this.isHealthy = false;
      return false;
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      this.isHealthy = true;
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      this.isHealthy = false;
      return false;
    }
  }

  getPool(): InstanceType<typeof Pool> | null {
    return this.pool;
  }

  getDb(): any {
    return this.db;
  }

  isConnected(): boolean {
    return this.isHealthy;
  }

  async getConnectionInfo(): Promise<{
    isConnected: boolean;
    poolSize?: number;
    idleConnections?: number;
    totalConnections?: number;
  }> {
    if (!this.pool || !process.env.DATABASE_URL) {
      return { isConnected: false };
    }

    try {
      return {
        isConnected: this.isHealthy,
        poolSize: (this.pool as any).totalCount || 0,
        idleConnections: (this.pool as any).idleCount || 0,
        totalConnections: (this.pool as any).totalCount || 0
      };
    } catch {
      return { isConnected: false };
    }
  }

  async close(): Promise<void> {
    if (this.pool && typeof this.pool.end === 'function') {
      try {
        await this.pool.end();
        console.log("✅ Database connection pool closed");
      } catch (error) {
        console.error("❌ Error closing database pool:", error);
      }
    }
  }
}

// Initialize database manager
const dbManager = DatabaseManager.getInstance();

// Export initialized instances
export const pool = () => dbManager.getPool();
export const db = () => dbManager.getDb();
export const initializeDatabase = () => dbManager.initialize();
export const closeDatabase = () => dbManager.close();
export const getDatabaseHealth = () => dbManager.healthCheck();
export const getDatabaseInfo = () => dbManager.getConnectionInfo();
export const isDatabaseConnected = () => dbManager.isConnected();

// For backward compatibility
export { dbManager };

// Default export
export default dbManager;