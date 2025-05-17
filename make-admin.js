const { db } = require('./server/db');
const { sql } = require('drizzle-orm');

async function makeAdmin() {
  try {
    // Get email from command line arguments
    const email = process.argv[2];
    
    if (!email) {
      console.error('Error: Please provide an email address as a command line argument');
      console.error('Usage: node make-admin.js your-email@example.com');
      process.exit(1);
    }

    console.log(`Looking up user with email: ${email}...`);
    
    // Find user by email
    const users = await db.execute(sql`SELECT * FROM users WHERE email = ${email}`);
    
    if (!users || users.length === 0 || !users.rows || users.rows.length === 0) {
      console.error(`Error: No user found with email ${email}`);
      console.error('The user must sign in at least once using ReplitAuth before they can be granted admin access');
      process.exit(1);
    }
    
    const user = users.rows[0];
    console.log(`Found user: ${user.id}`);
    console.log(`Current role: ${user.role || 'user'}`);
    
    // Update user role to admin
    await db.execute(sql`UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = ${user.id}`);
    
    console.log(`Admin role has been granted to ${email}`);
    console.log('This user can now access the admin dashboard at /admin/dashboard');
    
  } catch (error) {
    console.error('Error setting up admin account:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

makeAdmin();