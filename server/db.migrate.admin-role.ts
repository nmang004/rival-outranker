import { db as getDb, pool as getPool } from './db';
const db = getDb();
const pool = getPool();
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Running admin role migration...');
  
  try {
    // Check if the column already exists
    const checkColumnExists = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role';
    `);
    
    // Add the role column if it doesn't exist
    if (checkColumnExists.length === 0) {
      console.log('Adding role column to users table');
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
      `);
      console.log('Role column added successfully');
    } else {
      console.log('Role column already exists, skipping');
    }
    
    console.log('Admin role migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool?.end();
  }
}

runMigration()
  .then(() => {
    console.log('Migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });