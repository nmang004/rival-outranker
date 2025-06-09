import { storage } from '../../storage';
import { User, InsertUser } from '../../../shared/schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

interface TokenPayload {
  userId: string;
  username: string | null;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: InsertUser): Promise<{ user: User; token: string }> {
    // Check if username already exists
    if (!userData.username) {
      throw new Error('Username is required');
    }
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error('Username already exists');
    }
    
    // Check if email already exists (if provided)
    if (userData.email) {
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error('Email already exists');
      }
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password || '', salt);
    
    // Create the user with hashed password
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return { user, token };
  }
  
  /**
   * Login a user
   */
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    if (!user.password) {
      throw new Error('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login timestamp
    await storage.updateLastLogin(user.id);
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return { user, token };
  }
  
  /**
   * Generate JWT token for a user
   */
  generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
  
  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
  
  /**
   * Get authenticated user from token
   */
  async getUserFromToken(token: string): Promise<User> {
    const decoded = this.verifyToken(token);
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}

export const authService = new AuthService();