import { Request, Response, NextFunction } from 'express';
import { apiUsageService } from '../services/apiUsageService';
import { performance } from 'perf_hooks';

interface ApiUsageData {
  userId?: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
  apiProvider: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Middleware to track API usage
 * @param provider The API provider (e.g., 'google-ads', 'backlinks', 'internal')
 */
export const trackApiUsage = (provider: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now();
    
    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    
    let responseBody: any = null;
    let statusCode = 200;
    
    // Override status
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus.apply(this, [code]);
    };
    
    // Override send
    res.send = function(body: any) {
      responseBody = body;
      
      // Log the API call
      logApiCall({
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode,
        responseTime: Math.round(performance.now() - startTime),
        apiProvider: provider,
        requestData: sanitizeData(req.body),
        responseData: sanitizeData(responseBody),
        errorMessage: statusCode >= 400 ? extractErrorMessage(responseBody) : undefined,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      return originalSend.apply(this, [body]);
    };
    
    // Override json
    res.json = function(body: any) {
      responseBody = body;
      
      // Log the API call
      logApiCall({
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode,
        responseTime: Math.round(performance.now() - startTime),
        apiProvider: provider,
        requestData: sanitizeData(req.body),
        responseData: sanitizeData(responseBody),
        errorMessage: statusCode >= 400 ? extractErrorMessage(responseBody) : undefined,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      return originalJson.apply(this, [body]);
    };
    
    next();
  };
};

// Log API call to database
async function logApiCall(data: ApiUsageData) {
  try {
    await apiUsageService.logApiUsage(data);
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

// Sanitize data to remove sensitive information
function sanitizeData(data: any): any {
  if (!data) return null;
  
  // Convert to string if it's not an object
  let objData = data;
  if (typeof data === 'string') {
    try {
      objData = JSON.parse(data);
    } catch (e) {
      return { rawData: data.substring(0, 100) }; // Truncate string data
    }
  }
  
  // Clone to avoid modifying original
  const sanitized = { ...objData };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'apiKey', 'api_key', 
    'auth', 'authorization', 'credential', 'jwt'
  ];
  
  if (typeof sanitized === 'object' && sanitized !== null) {
    for (const [key, value] of Object.entries(sanitized)) {
      // Check if key contains sensitive information
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
      // Recursively sanitize nested objects
      else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value);
      }
    }
  }
  
  return sanitized;
}

// Extract error message from response
function extractErrorMessage(response: any): string {
  if (!response) return 'Unknown error';
  
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response);
      return parsed.error || parsed.message || response.substring(0, 200);
    } catch {
      return response.substring(0, 200); // Truncate long error messages
    }
  }
  
  if (typeof response === 'object') {
    return response.error || response.message || JSON.stringify(response).substring(0, 200);
  }
  
  return String(response).substring(0, 200);
}