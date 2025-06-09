/**
 * Utilities Index
 * 
 * Exports all utility functions and classes for common operations
 * across the application.
 */

// Error handling
export * from './errors';

// Validation utilities
export * from './validation';

// Logging utilities
export * from './logging';

// Async utilities
export * from './async';

// Common utility functions
export * from './common';

/**
 * Utility registry for easy access to commonly used utilities
 */
export const utils = {
  // Re-export key utilities for convenience
  errors: () => import('./errors'),
  validation: () => import('./validation'),
  logging: () => import('./logging'),
  async: () => import('./async'),
  common: () => import('./common')
} as const;