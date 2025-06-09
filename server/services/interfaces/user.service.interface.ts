import { User, InsertUser, UpdateUser, LoginCredentials } from '../../../shared/schema';

/**
 * Interface for user service operations
 */
export interface IUserService {
  /**
   * User Authentication
   */
  createUser(userData: InsertUser): Promise<User>;
  validateCredentials(credentials: LoginCredentials): Promise<User | null>;
  updateLastLogin(userId: string): Promise<User | null>;
  
  /**
   * User Profile Management
   */
  getUserById(userId: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserProfile(userId: string, updates: UpdateUser): Promise<User | null>;
  verifyUserEmail(userId: string): Promise<User | null>;
  
  /**
   * User Activity
   */
  incrementChatUsage(userId: string): Promise<User | null>;
  resetChatUsage(userId: string): Promise<User | null>;
  getChatUsageCount(userId: string): Promise<number>;
  
  /**
   * User Management (Admin)
   */
  getAllUsers(page?: number, pageSize?: number): Promise<{
    users: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  getAdminUsers(): Promise<User[]>;
  setUserRole(userId: string, role: 'user' | 'admin'): Promise<User | null>;
  getRecentlyActiveUsers(days?: number): Promise<User[]>;
  
  /**
   * User Statistics
   */
  getUserStats(userId: string): Promise<{
    analysisCount: number;
    projectCount: number;
    keywordCount: number;
    chatUsage: number;
    lastLoginAt: Date | null;
    memberSince: Date;
  }>;
}