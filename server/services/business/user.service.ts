import bcrypt from 'bcryptjs';
import { IUserService } from '../interfaces/user.service.interface';
import { User, InsertUser, UpdateUser, LoginCredentials } from '@shared/schema';
import { 
  userRepository, 
  analysisRepository, 
  projectRepository, 
  keywordRepository 
} from '../../repositories';

/**
 * User business logic service
 * 
 * Coordinates user-related operations across multiple repositories
 * and implements business rules for user management.
 */
export class UserService implements IUserService {
  
  /**
   * Create a new user with hashed password
   */
  async createUser(userData: InsertUser): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      const saltRounds = 12;
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }

    // Set default role if not specified
    if (!userData.role) {
      userData.role = 'user';
    }

    return await userRepository.create(userData);
  }

  /**
   * Validate user credentials for login
   */
  async validateCredentials(credentials: LoginCredentials): Promise<User | null> {
    const user = await userRepository.findByUsernameOrEmail(credentials.username);
    
    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    return isValidPassword ? user : null;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<User | null> {
    return await userRepository.updateLastLogin(userId);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return await userRepository.findById(userId);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    return await userRepository.findByUsername(username);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await userRepository.findByEmail(email);
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(userId: string, updates: UpdateUser): Promise<User | null> {
    // Remove sensitive fields that shouldn't be updated via this method
    const sanitizedUpdates = { ...updates };
    delete (sanitizedUpdates as any).password;
    delete (sanitizedUpdates as any).role;
    delete (sanitizedUpdates as any).id;

    return await userRepository.updateProfile(userId, sanitizedUpdates);
  }

  /**
   * Verify user's email address
   */
  async verifyUserEmail(userId: string): Promise<User | null> {
    return await userRepository.verifyEmail(userId);
  }

  /**
   * Increment user's chat usage count
   */
  async incrementChatUsage(userId: string): Promise<User | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    // Check if usage needs to be reset (monthly reset)
    const now = new Date();
    const resetDate = user.chatUsageResetDate;
    
    if (!resetDate || this.shouldResetChatUsage(resetDate, now)) {
      return await userRepository.resetChatUsage(userId);
    }

    return await userRepository.incrementChatUsage(userId);
  }

  /**
   * Reset user's chat usage count
   */
  async resetChatUsage(userId: string): Promise<User | null> {
    return await userRepository.resetChatUsage(userId);
  }

  /**
   * Get current chat usage count for user
   */
  async getChatUsageCount(userId: string): Promise<number> {
    const user = await userRepository.findById(userId);
    return user?.chatUsageCount || 0;
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(page: number = 1, pageSize: number = 50): Promise<{
    users: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const result = await userRepository.paginate({
      page,
      pageSize
    });

    return {
      users: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages
    };
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(): Promise<User[]> {
    return await userRepository.getAdmins();
  }

  /**
   * Set user role (admin operation)
   */
  async setUserRole(userId: string, role: 'user' | 'admin'): Promise<User | null> {
    return await userRepository.setRole(userId, role);
  }

  /**
   * Get users with recent activity
   */
  async getRecentlyActiveUsers(days: number = 30): Promise<User[]> {
    return await userRepository.getRecentlyActive(days);
  }

  /**
   * Get comprehensive user statistics
   */
  async getUserStats(userId: string): Promise<{
    analysisCount: number;
    projectCount: number;
    keywordCount: number;
    chatUsage: number;
    lastLoginAt: Date | null;
    memberSince: Date;
  }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [analysisCount, projectCount, keywordCount] = await Promise.all([
      analysisRepository.countByUserId(userId),
      // We'll need to implement a countByUserId method for projects
      0, // Placeholder for now
      keywordRepository.countByUserId(userId)
    ]);

    return {
      analysisCount,
      projectCount,
      keywordCount,
      chatUsage: user.chatUsageCount || 0,
      lastLoginAt: user.lastLoginAt,
      memberSince: user.createdAt
    };
  }

  /**
   * Check if chat usage should be reset based on time elapsed
   */
  private shouldResetChatUsage(lastResetDate: Date, currentDate: Date): boolean {
    const diffInMs = currentDate.getTime() - lastResetDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    // Reset every 30 days
    return diffInDays >= 30;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user || !user.password) {
      return false;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return false;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updatedUser = await userRepository.updateById(userId, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    return !!updatedUser;
  }

  /**
   * Check if user exists by username or email
   */
  async userExists(usernameOrEmail: string): Promise<boolean> {
    const user = await userRepository.findByUsernameOrEmail(usernameOrEmail);
    return !!user;
  }

  /**
   * Delete user account and all associated data
   */
  async deleteUserAccount(userId: string): Promise<boolean> {
    // This would typically involve cascading deletes across multiple tables
    // For now, just delete the user record
    return await userRepository.deleteById(userId);
  }
}

// Export singleton instance
export const userService = new UserService();