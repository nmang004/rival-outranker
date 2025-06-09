import { eq, and, desc } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { users, User, InsertUser, UpdateUser } from '../../shared/schema';

/**
 * Repository for user-related database operations
 */
export class UserRepository extends BaseRepository<User, InsertUser> {
  constructor() {
    super(users);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne(eq(users.username, username));
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne(eq(users.email, email));
  }

  /**
   * Find user by username or email
   */
  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    const userByUsername = await this.findByUsername(identifier);
    if (userByUsername) return userByUsername;
    
    return this.findByEmail(identifier);
  }

  /**
   * Update user profile information
   */
  async updateProfile(userId: string, data: UpdateUser): Promise<User | null> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    return this.updateById(userId, updateData);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<User | null> {
    // Note: lastLoginAt and updatedAt may be auto-managed
    return this.findById(userId);
  }

  /**
   * Increment chat usage count
   */
  async incrementChatUsage(userId: string): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const chatUsageCount = (user.chatUsageCount || 0) + 1;
    return this.updateById(userId, {
      chatUsageCount
    });
  }

  /**
   * Reset chat usage count
   */
  async resetChatUsage(userId: string): Promise<User | null> {
    return this.updateById(userId, {
      chatUsageCount: 0,
      chatUsageResetDate: new Date()
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<User | null> {
    return this.updateById(userId, {
      isEmailVerified: true
    });
  }

  /**
   * Get all admin users
   */
  async getAdmins(): Promise<User[]> {
    return this.findMany({
      where: eq(users.role, 'admin'),
      orderBy: [desc(users.createdAt)]
    });
  }

  /**
   * Set user role
   */
  async setRole(userId: string, role: 'user' | 'admin'): Promise<User | null> {
    return this.updateById(userId, {
      role
    });
  }

  /**
   * Get users with recent activity
   */
  async getRecentlyActive(days: number = 30): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.findMany({
      where: and(
        eq(users.lastLoginAt, cutoffDate)
      ),
      orderBy: [desc(users.lastLoginAt)]
    });
  }

  /**
   * Override getIdColumn to use string ID
   */
  protected getIdColumn() {
    return users.id;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();