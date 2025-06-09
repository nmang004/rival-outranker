import { Request, Response, NextFunction } from 'express';
import { apiUsageService } from '../services/common/api-usage.service';
import { estimateCost, extractUsageMetrics } from '../services/common/cost-estimation.service';

/**
 * Middleware to track API usage
 * This middleware logs all API requests to the database
 */
export const trackApiUsage = (apiProvider: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip tracking for static assets or non-API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }
    
    // Store original timestamp to calculate response time
    const startTime = Date.now();
    
    // Store original end function to intercept it
    const originalEnd = res.end;
    let responseBody: any = '';
    
    // Override res.end to capture response data and timing
    // @ts-ignore - we need to override this method
    res.end = function(chunk: any, ...args: any[]) {
      const responseTime = Date.now() - startTime;
      
      // Try to parse response body if it's JSON
      if (chunk) {
        try {
          // Convert Buffer to string if needed
          const chunkStr = chunk instanceof Buffer ? chunk.toString('utf8') : chunk;
          responseBody = JSON.parse(chunkStr);
        } catch (e) {
          // Not parseable JSON, which is fine
          responseBody = null;
        }
      }

      // Log the API call
      const userId = req.user?.id as string | undefined;
      
      // Extract usage metrics for cost calculation
      const usageMetrics = extractUsageMetrics(apiProvider, req.body, responseBody);
      
      // Calculate estimated cost
      const estimatedCost = estimateCost(apiProvider, req.path, usageMetrics);
      
      // Log API usage to database with cost information
      apiUsageService.logApiUsage({
        userId,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        apiProvider,
        requestData: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
        responseData: responseBody,
        errorMessage: res.statusCode >= 400 ? responseBody?.error || responseBody?.message : undefined,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        estimatedCost,
        usageMetrics
      }).catch(err => {
        console.error('Error logging API usage:', err);
      });
      
      // Call the original end method
      return originalEnd.apply(res, arguments as any);
    };
    
    // Continue with the request
    next();
  };
};

// Middleware factory for common API providers
export const trackDataForSeoApi = trackApiUsage('DataForSEO');
export const trackOpenAiApi = trackApiUsage('OpenAI');
export const trackInternalApi = trackApiUsage('Internal API');