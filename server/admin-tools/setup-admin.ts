import { storage } from '../storage';

/**
 * This script is used to set up an admin account for the SEO platform
 * It takes an email address as a command line argument and grants admin role to that user
 */

async function setupAdminAccount() {
  try {
    // Get email from command line arguments
    const email = process.argv[2];
    
    if (!email) {
      console.error('Error: Please provide an email address as a command line argument');
      console.error('Usage: npx tsx server/admin-tools/setup-admin.ts your-email@example.com');
      process.exit(1);
    }

    console.log(`Looking up user with email: ${email}...`);
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.error(`Error: No user found with email ${email}`);
      console.error('The user must sign in at least once using ReplitAuth before they can be granted admin access');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.id}`);
    console.log(`Current role: ${user.role || 'user'}`);
    
    // Grant admin role
    await storage.updateUserRole(user.id, 'admin');
    console.log(`Admin role has been granted to ${email}`);
    console.log('This user can now access the admin dashboard');
    
  } catch (error) {
    console.error('Error setting up admin account:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setupAdminAccount();