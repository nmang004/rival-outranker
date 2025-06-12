import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        role?: string | null;
        userId?: string | null;
        password?: string | null;
        username?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        profileImageUrl?: string | null;
        company?: string | null;
        chatUsageResetDate?: Date | null;
        [key: string]: any;
      };
      token?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header or cookies
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header (Bearer token)
    let token = req.headers.authorization?.split(' ')[1];
    
    // If no token in headers, try getting from cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token and get user
    const user = await authService.getUserFromToken(token);
    
    // Attach user and token to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid authentication' });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 */
/**
 * Required authentication middleware (alias for authenticate)
 */
export const requireAuth = authenticate;

/**
 * Admin role requirement middleware
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First authenticate the user
    await authenticate(req, res, () => {});
    
    // Check if user has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ message: 'Invalid authentication' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header (Bearer token)
    let token = req.headers.authorization?.split(' ')[1];
    
    // If no token in headers, try getting from cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      // Verify token and get user
      const user = await authService.getUserFromToken(token);
      
      // Attach user and token to request object
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};