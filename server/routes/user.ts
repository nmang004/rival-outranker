import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { authenticate } from '../middleware/auth';
import { updateUserSchema, users } from '../../shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import bcrypt from 'bcryptjs';
import { db as getDb } from '../db';
const db = getDb();
import { eq } from 'drizzle-orm';

export const userRouter = Router();

// All routes require authentication
userRouter.use(authenticate);

// Get user profile
userRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
userRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Validate request body
    const updateData = updateUserSchema.parse(req.body);
    
    // Update user
    const updatedUser = await storage.updateUser(userId, updateData);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
userRouter.put('/change-password', async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get current user with password
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password || '');
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password - need to use the raw DB update since password is excluded from updateUser schema
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
});

// Get user analyses
userRouter.get('/analyses', async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const analyses = await storage.getAnalysesByUserId(userId);
    
    return res.status(200).json(analyses);
  } catch (error) {
    console.error('Get user analyses error:', error);
    return res.status(500).json({ message: 'Failed to get analyses' });
  }
});