import { Pool, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Set WebSocket constructor
neonConfig.webSocketConstructor = ws;

// Create a database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Begin a transaction
      await client.query('BEGIN');
      
      console.log('Running keyword tables migration...');
      
      // Create keywords table
      console.log('Creating keywords table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS keywords (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          project_id INTEGER REFERENCES projects(id),
          keyword TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          target_url TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          notes TEXT,
          UNIQUE(user_id, keyword, target_url)
        );
      `);
      
      // Create keyword_metrics table
      console.log('Creating keyword_metrics table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS keyword_metrics (
          id SERIAL PRIMARY KEY,
          keyword_id INTEGER NOT NULL REFERENCES keywords(id),
          search_volume INTEGER,
          global_search_volume INTEGER,
          keyword_difficulty INTEGER,
          last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          cpc REAL,
          competition REAL,
          trends_data JSONB,
          related_keywords JSONB
        );
      `);
      
      // Create keyword_rankings table
      console.log('Creating keyword_rankings table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS keyword_rankings (
          id SERIAL PRIMARY KEY,
          keyword_id INTEGER NOT NULL REFERENCES keywords(id),
          rank INTEGER,
          ranking_url TEXT,
          previous_rank INTEGER,
          rank_date DATE NOT NULL DEFAULT CURRENT_DATE,
          search_engine TEXT NOT NULL DEFAULT 'google',
          device TEXT NOT NULL DEFAULT 'desktop',
          location TEXT NOT NULL DEFAULT 'us',
          serp JSONB,
          local_rank INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_ranking_keyword_date ON keyword_rankings (keyword_id, rank_date);
      `);
      
      // Create competitor_rankings table
      console.log('Creating competitor_rankings table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS competitor_rankings (
          id SERIAL PRIMARY KEY,
          keyword_id INTEGER NOT NULL REFERENCES keywords(id),
          competitor_url TEXT NOT NULL,
          rank INTEGER,
          rank_date DATE NOT NULL DEFAULT CURRENT_DATE,
          search_engine TEXT NOT NULL DEFAULT 'google',
          device TEXT NOT NULL DEFAULT 'desktop',
          location TEXT NOT NULL DEFAULT 'us'
        );
        CREATE INDEX IF NOT EXISTS idx_competitor_keyword_date ON competitor_rankings (keyword_id, competitor_url, rank_date);
      `);
      
      // Create keyword_suggestions table
      console.log('Creating keyword_suggestions table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS keyword_suggestions (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          base_keyword TEXT NOT NULL,
          suggested_keyword TEXT NOT NULL,
          search_volume INTEGER,
          keyword_difficulty INTEGER,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          source TEXT NOT NULL DEFAULT 'related',
          saved BOOLEAN NOT NULL DEFAULT FALSE
        );
      `);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Keyword tables migration completed successfully');
    } catch (err) {
      // Rollback the transaction in case of error
      await client.query('ROLLBACK');
      console.error('Migration failed:', err);
      throw err;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    // Close the pool
    pool.end();
  }
}

// Run the migration
runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});