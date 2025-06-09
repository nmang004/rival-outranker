import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { userService } from '../services/business';
import { insertUserSchema, updateUserSchema, loginUserSchema } from '../../shared/schema';
import { ZodError } from 'zod';

/**
 * Controller for user management operations
 */
export class UserController extends BaseController {

  /**
   * POST /api/users/register
   * Register a new user
   */
  public registerUser = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await userService.getUserByUsername(userData.username!);
      if (existingUser) {
        this.sendError(res, 'Username already exists', 409);
        return;
      }

      if (userData.email) {
        const existingEmailUser = await userService.getUserByEmail(userData.email);
        if (existingEmailUser) {
          this.sendError(res, 'Email already exists', 409);
          return;
        }
      }

      this.logAction('register_user', undefined, { username: userData.username });

      const newUser = await userService.createUser(userData);
      
      // Remove password from response
      const { password, ...userResponse } = newUser;
      
      this.sendCreated(res, userResponse, 'User registered successfully');

    } catch (error) {
      if (error instanceof ZodError) {
        this.sendValidationError(res, error);
      } else {
        console.error('[UserController] Error in registerUser:', error);
        this.sendError(res, 'Failed to register user');
      }
    }
  });

  /**
   * POST /api/users/login
   * Authenticate user
   */
  public loginUser = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const credentials = loginUserSchema.parse(req.body);

      this.logAction('login_attempt', undefined, { username: credentials.username });

      const user = await userService.validateCredentials(credentials);
      
      if (!user) {
        this.sendError(res, 'Invalid username or password', 401);
        return;
      }

      // Update last login
      await userService.updateLastLogin(user.id);

      // Remove password from response
      const { password, ...userResponse } = user;
      
      this.sendSuccess(res, userResponse, 'Login successful');

    } catch (error) {
      if (error instanceof ZodError) {
        this.sendValidationError(res, error);
      } else {
        console.error('[UserController] Error in loginUser:', error);
        this.sendError(res, 'Login failed');
      }
    }
  });

  /**
   * GET /api/users/profile
   * Get current user's profile
   */
  public getUserProfile = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const user = await userService.getUserById(userId);
      
      if (!user) {
        this.sendNotFound(res, 'User');
        return;
      }

      // Remove password from response
      const { password, ...userResponse } = user;
      
      this.sendSuccess(res, userResponse, 'Profile retrieved successfully');

    } catch (error) {
      console.error('[UserController] Error in getUserProfile:', error);
      this.sendError(res, 'Failed to fetch profile');
    }
  });

  /**
   * PUT /api/users/profile
   * Update current user's profile
   */
  public updateUserProfile = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const updates = updateUserSchema.parse(req.body);

      this.logAction('update_profile', userId, { fields: Object.keys(updates) });

      const updatedUser = await userService.updateUserProfile(userId, updates);
      
      if (!updatedUser) {
        this.sendNotFound(res, 'User');
        return;
      }

      // Remove password from response
      const { password, ...userResponse } = updatedUser;
      
      this.sendSuccess(res, userResponse, 'Profile updated successfully');

    } catch (error) {
      if (error instanceof ZodError) {
        this.sendValidationError(res, error);
      } else {
        console.error('[UserController] Error in updateUserProfile:', error);
        this.sendError(res, 'Failed to update profile');
      }
    }
  });

  /**
   * POST /api/users/change-password
   * Change user password
   */
  public changePassword = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const { currentPassword, newPassword } = req.body;

      const validation = this.validateRequiredFields(req, ['currentPassword', 'newPassword']);
      if (!validation.isValid) {
        this.sendError(res, `Missing required fields: ${validation.missingFields.join(', ')}`, 400);
        return;
      }

      if (newPassword.length < 6) {
        this.sendError(res, 'New password must be at least 6 characters long', 400);
        return;
      }

      this.logAction('change_password', userId);

      const success = await userService.changePassword(userId, currentPassword, newPassword);
      
      if (!success) {
        this.sendError(res, 'Current password is incorrect', 400);
        return;
      }

      this.sendSuccess(res, null, 'Password changed successfully');

    } catch (error) {
      console.error('[UserController] Error in changePassword:', error);
      this.sendError(res, 'Failed to change password');
    }
  });

  /**
   * POST /api/users/verify-email
   * Verify user email
   */
  public verifyEmail = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      this.logAction('verify_email', userId);

      const updatedUser = await userService.verifyUserEmail(userId);
      
      if (!updatedUser) {
        this.sendNotFound(res, 'User');
        return;
      }

      this.sendSuccess(res, null, 'Email verified successfully');

    } catch (error) {
      console.error('[UserController] Error in verifyEmail:', error);
      this.sendError(res, 'Failed to verify email');
    }
  });

  /**
   * GET /api/users/stats
   * Get user statistics
   */
  public getUserStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const stats = await userService.getUserStats(userId);
      
      this.sendSuccess(res, stats, 'User statistics retrieved successfully');

    } catch (error) {
      console.error('[UserController] Error in getUserStats:', error);
      this.sendError(res, 'Failed to fetch user statistics');
    }
  });

  /**
   * POST /api/users/chat-usage
   * Increment chat usage count
   */
  public incrementChatUsage = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const updatedUser = await userService.incrementChatUsage(userId);
      
      if (!updatedUser) {
        this.sendNotFound(res, 'User');
        return;
      }

      this.sendSuccess(res, { 
        chatUsageCount: updatedUser.chatUsageCount 
      }, 'Chat usage updated');

    } catch (error) {
      console.error('[UserController] Error in incrementChatUsage:', error);
      this.sendError(res, 'Failed to update chat usage');
    }
  });

  /**
   * GET /api/users/chat-usage
   * Get chat usage count
   */
  public getChatUsage = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      
      if (!userId) {
        this.sendUnauthorized(res);
        return;
      }

      const usageCount = await userService.getChatUsageCount(userId);
      
      this.sendSuccess(res, { chatUsageCount: usageCount }, 'Chat usage retrieved');

    } catch (error) {
      console.error('[UserController] Error in getChatUsage:', error);
      this.sendError(res, 'Failed to fetch chat usage');
    }
  });

  // Admin-only endpoints

  /**
   * GET /api/users
   * Get all users (admin only)
   */
  public getAllUsers = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!this.requireAdmin(req)) {
        this.sendForbidden(res, 'Admin access required');
        return;
      }

      const { page, pageSize } = this.getPaginationParams(req);

      const result = await userService.getAllUsers(page, pageSize);
      
      // Remove passwords from response
      const usersWithoutPasswords = result.users.map(user => {
        const { password, ...userResponse } = user;
        return userResponse;
      });

      this.sendPaginatedResponse(res, {
        ...result,
        data: usersWithoutPasswords
      }, 'Users retrieved successfully');

    } catch (error) {
      console.error('[UserController] Error in getAllUsers:', error);
      this.sendError(res, 'Failed to fetch users');
    }
  });

  /**
   * GET /api/users/:userId
   * Get user by ID (admin only)
   */
  public getUserById = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = this.getUserId(req);

      // Users can view their own profile, admins can view any profile
      if (targetUserId !== currentUserId && !this.isAdmin(req)) {
        this.sendForbidden(res, 'You can only view your own profile');
        return;
      }

      const user = await userService.getUserById(targetUserId);
      
      if (!user) {
        this.sendNotFound(res, 'User');
        return;
      }

      // Remove password from response
      const { password, ...userResponse } = user;
      
      this.sendSuccess(res, userResponse, 'User retrieved successfully');

    } catch (error) {
      console.error('[UserController] Error in getUserById:', error);
      this.sendError(res, 'Failed to fetch user');
    }
  });

  /**
   * PUT /api/users/:userId/role
   * Update user role (admin only)
   */
  public updateUserRole = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!this.requireAdmin(req)) {
        this.sendForbidden(res, 'Admin access required');
        return;
      }

      const targetUserId = req.params.userId;
      const { role } = req.body;

      if (!role || !['user', 'admin'].includes(role)) {
        this.sendError(res, 'Valid role (user or admin) is required', 400);
        return;
      }

      const currentUserId = this.getUserId(req);
      this.logAction('update_user_role', currentUserId, { targetUserId, role });

      const updatedUser = await userService.setUserRole(targetUserId, role);
      
      if (!updatedUser) {
        this.sendNotFound(res, 'User');
        return;
      }

      // Remove password from response
      const { password, ...userResponse } = updatedUser;
      
      this.sendSuccess(res, userResponse, 'User role updated successfully');

    } catch (error) {
      console.error('[UserController] Error in updateUserRole:', error);
      this.sendError(res, 'Failed to update user role');
    }
  });

  /**
   * GET /api/users/admin/recent
   * Get recently active users (admin only)
   */
  public getRecentlyActiveUsers = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!this.requireAdmin(req)) {
        this.sendForbidden(res, 'Admin access required');
        return;
      }

      const days = this.parseInteger(req.query.days, 30);

      const users = await userService.getRecentlyActiveUsers(days);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userResponse } = user;
        return userResponse;
      });

      this.sendSuccess(res, usersWithoutPasswords, 'Recently active users retrieved');

    } catch (error) {
      console.error('[UserController] Error in getRecentlyActiveUsers:', error);
      this.sendError(res, 'Failed to fetch recently active users');
    }
  });

  /**
   * DELETE /api/users/:userId
   * Delete user account (admin only or self-deletion)
   */
  public deleteUser = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = this.getUserId(req);

      // Users can delete their own account, admins can delete any account
      if (targetUserId !== currentUserId && !this.isAdmin(req)) {
        this.sendForbidden(res, 'You can only delete your own account');
        return;
      }

      this.logAction('delete_user', currentUserId, { targetUserId });

      const deleted = await userService.deleteUserAccount(targetUserId);
      
      if (deleted) {
        this.sendNoContent(res);
      } else {
        this.sendError(res, 'Failed to delete user account');
      }

    } catch (error) {
      console.error('[UserController] Error in deleteUser:', error);
      this.sendError(res, 'Failed to delete user');
    }
  });
}

// Export singleton instance
export const userController = new UserController();