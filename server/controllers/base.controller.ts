import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Base controller class providing common functionality for all controllers
 */
export abstract class BaseController {
  
  /**
   * Handle async operations with consistent error handling
   */
  protected asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Send success response with consistent format
   */
  protected sendSuccess(res: Response, data: any, message?: string, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      message: message || 'Operation successful',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send error response with consistent format
   */
  protected sendError(res: Response, error: string | Error, statusCode: number = 500, details?: any): void {
    const message = error instanceof Error ? error.message : error;
    
    res.status(statusCode).json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send validation error response
   */
  protected sendValidationError(res: Response, error: ZodError): void {
    const validationError = fromZodError(error);
    this.sendError(res, validationError.message, 400, {
      type: 'validation_error',
      issues: error.issues
    });
  }

  /**
   * Send paginated response
   */
  protected sendPaginatedResponse(res: Response, data: {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }, message?: string): void {
    res.json({
      success: true,
      message: message || 'Data retrieved successfully',
      data: data.data,
      pagination: {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        hasNext: data.page < data.totalPages,
        hasPrev: data.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Extract user ID from authenticated request
   */
  protected getUserId(req: Request): string {
    // This assumes authentication middleware has set user info
    return (req as any).user?.id || (req as any).user?.userId;
  }

  /**
   * Check if user is admin
   */
  protected isAdmin(req: Request): boolean {
    return (req as any).user?.role === 'admin';
  }

  /**
   * Parse pagination parameters from query
   */
  protected getPaginationParams(req: Request): { page: number; pageSize: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    
    return { page, pageSize };
  }

  /**
   * Parse date range from query parameters
   */
  protected getDateRange(req: Request): { startDate?: Date; endDate?: Date } {
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        startDate = undefined;
      }
    }
    
    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        endDate = undefined;
      }
    }
    
    return { startDate, endDate };
  }

  /**
   * Validate required fields in request body
   */
  protected validateRequiredFields(req: Request, fields: string[]): { isValid: boolean; missingFields: string[] } {
    const missingFields = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Sanitize string input
   */
  protected sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Parse integer with default value
   */
  protected parseInteger(value: any, defaultValue: number = 0): number {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse boolean with default value
   */
  protected parseBoolean(value: any, defaultValue: boolean = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return defaultValue;
  }

  /**
   * Check if request is from authenticated user
   */
  protected requireAuth(req: Request): boolean {
    return !!(req as any).user;
  }

  /**
   * Check if user has admin privileges
   */
  protected requireAdmin(req: Request): boolean {
    return this.requireAuth(req) && this.isAdmin(req);
  }

  /**
   * Log controller action for debugging
   */
  protected logAction(action: string, userId?: string, details?: any): void {
    console.log(`[Controller] ${action}`, {
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle not found response
   */
  protected sendNotFound(res: Response, resource: string = 'Resource'): void {
    this.sendError(res, `${resource} not found`, 404);
  }

  /**
   * Handle forbidden response
   */
  protected sendForbidden(res: Response, message: string = 'Access denied'): void {
    this.sendError(res, message, 403);
  }

  /**
   * Handle unauthorized response
   */
  protected sendUnauthorized(res: Response, message: string = 'Authentication required'): void {
    this.sendError(res, message, 401);
  }

  /**
   * Handle accepted response for async operations
   */
  protected sendAccepted(res: Response, message: string, data?: any): void {
    res.status(202).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle created response
   */
  protected sendCreated(res: Response, data: any, message?: string): void {
    this.sendSuccess(res, data, message || 'Resource created successfully', 201);
  }

  /**
   * Handle no content response
   */
  protected sendNoContent(res: Response): void {
    res.status(204).send();
  }
}