import { db } from "./db";
import { pgTable, serial, text, integer, timestamp, jsonb, real } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log("Starting API usage tracking table migration...");
  
  try {
    // Check if table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_usage'
      );
    `);
    
    if (tableExists.rows[0]?.exists) {
      console.log("Table api_usage already exists");
      return;
    }
    
    // Create the API usage tracking table
    await db.execute(sql`
      CREATE TABLE "api_usage" (
        "id" SERIAL PRIMARY KEY,
        "user_id" TEXT REFERENCES "users"("id"),
        "endpoint" TEXT NOT NULL,
        "method" TEXT NOT NULL,
        "status_code" INTEGER,
        "response_time" INTEGER,
        "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
        "api_provider" TEXT NOT NULL,
        "request_data" JSONB,
        "response_data" JSONB,
        "error_message" TEXT,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "estimated_cost" REAL,
        "usage_metrics" JSONB
      )
    `);
    
    console.log("API usage tracking table created successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });