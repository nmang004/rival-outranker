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