import { db } from './db';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool } from '@neondatabase/serverless';

// Connect to the database and run migrations
async function runMigrations() {
  console.log("Starting database migration...");
  
  try {
    // Ensure database connection
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    // Run migrations
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log("Migrations completed successfully");
    
    // Close the connection pool
    await pool.end();
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();