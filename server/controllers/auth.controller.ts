import { Request, Response } from 'express';
import { authService } from '../services/auth/auth.service';
import { loginUserSchema, insertUserSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Register the user
      const { user, token } = await authService.register(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Set token as HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Return user data and token
      return res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      if (error instanceof Error && (
        error.message.includes('Username already exists') ||
        error.message.includes('Email already exists')
      )) {
        return res.status(409).json({ message: error.message });
      }
      
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // Validate request body
      const credentials = loginUserSchema.parse(req.body);
      
      // Login the user
      const { user, token } = await authService.login(credentials.username, credentials.password);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Set token as HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Return user data and token
      return res.status(200).json({
        message: 'Login successful',
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Login failed' });
    }
  }

  static logout(req: Request, res: Response) {
    // Clear the token cookie
    res.clearCookie('token');
    
    return res.status(200).json({ message: 'Logout successful' });
  }

  static getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = req.user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ message: 'Failed to get user data' });
    }
  }
}