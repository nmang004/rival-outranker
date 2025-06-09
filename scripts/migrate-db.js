#!/usr/bin/env node

/**
 * Database migration script for Railway deployment
 * Handles schema migration with proper error handling and fallbacks
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runMigration() {
  console.log('🔧 Starting database migration...');
  console.log('📊 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    PORT: process.env.PORT
  });
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found. Skipping database migration.');
    console.log('   Application will run with sample data only.');
    return;
  }

  try {
    console.log('📡 Connecting to database...');
    
    // Run the drizzle migration
    const { stdout, stderr } = await execAsync('npx drizzle-kit push --config=config/drizzle.config.ts', {
      timeout: 60000 // 60 second timeout
    });
    
    if (stdout) {
      console.log('✅ Migration output:', stdout);
    }
    
    if (stderr && !stderr.includes('Reading config file')) {
      console.warn('⚠️  Migration warnings:', stderr);
    }
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    
    // Don't fail the startup - let the app start with sample data
    console.log('🔄 Continuing startup without database migration.');
    console.log('   The application will function with sample data.');
  }
}

// Run migration
runMigration().catch((error) => {
  console.error('💥 Migration script failed:', error);
  // Exit with success to not block startup
  console.log('🚀 Proceeding to start server...');
});