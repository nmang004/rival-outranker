const { db } = require('./server/db');
const { sql } = require('drizzle-orm');

async function runMigration() {
  console.log('Creating API usage tracking table...');
  
  try {
    // Check if table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_usage'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Table api_usage already exists, skipping creation');
      return;
    }
    
    // Create table
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
      );
    `);
    
    console.log('API usage tracking table created successfully');
  } catch (error) {
    console.error('Error creating API usage table:', error);
    process.exit(1);
  }
}

runMigration();