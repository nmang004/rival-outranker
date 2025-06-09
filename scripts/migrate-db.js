#!/usr/bin/env node

/**
 * Database migration script for Railway deployment
 * Handles schema migration with proper error handling and fallbacks
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigration() {
  console.log('🔧 Starting database migration...');
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found. Skipping database migration.');
    console.log('   Application will run with sample data only.');
    return;
  }

  try {
    console.log('📡 Connecting to database...');
    
    // Run the drizzle migration
    const { stdout, stderr } = await execAsync('npx drizzle-kit push --config=config/drizzle.config.ts');
    
    if (stdout) {
      console.log('✅ Migration output:', stdout);
    }
    
    if (stderr && !stderr.includes('Reading config file')) {
      console.warn('⚠️  Migration warnings:', stderr);
    }
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    
    // Don't fail the build - let the app start with sample data
    console.log('🔄 Continuing deployment without database migration.');
    console.log('   The application will function with sample data.');
  }
}

// Run migration
runMigration().catch((error) => {
  console.error('💥 Migration script failed:', error);
  // Exit with success to not block deployment
  process.exit(0);
});