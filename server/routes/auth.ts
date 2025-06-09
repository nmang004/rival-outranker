import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

// Register a new user
authRouter.post('/register', AuthController.register);

// Login
authRouter.post('/login', AuthController.login);

// Logout
authRouter.post('/logout', AuthController.logout);

// Get current authenticated user
authRouter.get('/me', authenticate, AuthController.getMe);

// Check authentication status (public endpoint)
authRouter.get('/user', (req, res) => {
  // This endpoint is called by the frontend to check auth status
  // It should return user data if authenticated, or null if not
  
  // Try to get user from token without middleware enforcement
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(200).json(null);
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Get user data
    const { storage } = require('../storage');
    storage.getUser(decoded.userId).then((user: any) => {
      if (!user) {
        return res.status(200).json(null);
      }
      
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    }).catch(() => {
      return res.status(200).json(null);
    });
  } catch (error) {
    return res.status(200).json(null);
  }
});