import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

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
      
      console.log('Running migration...');
      
      // Drop existing tables (cascade to remove dependencies)
      console.log('Dropping existing tables...');
      await client.query(`
        DROP TABLE IF EXISTS project_analyses CASCADE;
        DROP TABLE IF EXISTS projects CASCADE;
        DROP TABLE IF EXISTS analyses CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
      
      // Create sessions table for Replit Auth
      console.log('Creating sessions table...');
      await client.query(`
        CREATE TABLE sessions (
          sid VARCHAR(255) PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
        CREATE INDEX "IDX_session_expire" ON sessions ("expire");
      `);
      
      // Create users table with string ID
      console.log('Creating users table...');
      await client.query(`
        CREATE TABLE users (
          id VARCHAR(255) PRIMARY KEY,
          username TEXT UNIQUE,
          email TEXT UNIQUE,
          password TEXT,
          first_name TEXT,
          last_name TEXT,
          profile_image_url TEXT,
          company TEXT,
          job_title TEXT,
          bio TEXT,
          website_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          last_login_at TIMESTAMP WITH TIME ZONE,
          is_email_verified BOOLEAN DEFAULT FALSE
        );
      `);
      
      // Create analyses table with references to users
      console.log('Creating analyses table...');
      await client.query(`
        CREATE TABLE analyses (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL,
          user_id TEXT REFERENCES users(id),
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          overall_score INTEGER NOT NULL,
          results JSONB NOT NULL
        );
      `);
      
      // Create projects table with references to users
      console.log('Creating projects table...');
      await client.query(`
        CREATE TABLE projects (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      
      // Create project_analyses join table
      console.log('Creating project_analyses table...');
      await client.query(`
        CREATE TABLE project_analyses (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES projects(id),
          analysis_id INTEGER NOT NULL REFERENCES analyses(id),
          added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully');
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