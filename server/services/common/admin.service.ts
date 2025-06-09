import { storage } from '../../storage';

export const adminService = {
  // Grant admin role to a user by email
  async grantAdminRoleByEmail(email: string): Promise<boolean> {
    try {
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.error(`User with email ${email} not found`);
        return false;
      }
      
      // Update user role to admin
      await storage.updateUserRole(user.id, 'admin');
      console.log(`Admin role granted to user ${user.id}`);
      return true;
    } catch (error) {
      console.error('Error granting admin role:', error);
      return false;
    }
  },
  
  // Check if a user is an admin
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      return user?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
};