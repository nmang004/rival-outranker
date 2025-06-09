import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { analysisService } from '../services/business';
import { urlFormSchema, updateKeywordSchema } from '@shared/schema';
import { ZodError } from 'zod';

/**
 * Controller for SEO analysis operations
 */
export class AnalysisController extends BaseController {

  /**
   * POST /api/analysis/analyze
   * Perform SEO analysis on a URL
   */
  public analyzeUrl = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { 
        url: rawUrl, 
        targetKeyword,
        runDeepContentAnalysis = false,
        includeCompetitorAnalysis = false 
      } = req.body;

      // Validate URL
      urlFormSchema.parse({ url: rawUrl });

      const userId = this.getUserId(req);

      this.logAction('analyze_url', userId, { url: rawUrl, targetKeyword });

      // Send accepted response for async processing
      this.sendAccepted(res, 
        runDeepContentAnalysis ? "Deep content analysis started" : "Analysis started", 
        { 
          url: rawUrl,
          runDeepContentAnalysis,
          includeCompetitorAnalysis
        }
      );

      // Perform analysis asynchronously
      try {
        const result = await analysisService.performAnalysis(rawUrl, {
          userId,
          targetKeyword,
          includeCompetitorAnalysis,
          runDeepContentAnalysis
        });

        console.log(`[AnalysisController] Analysis completed for: ${rawUrl}`);
      } catch (analysisError) {
        console.error(`[AnalysisController] Analysis failed for ${rawUrl}:`, analysisError);
      }

    } catch (error) {
      if (error instanceof ZodError) {
        this.sendValidationError(res, error);
      } else {
        console.error('[AnalysisController] Error in analyzeUrl:', error);
        this.sendError(res, 'Failed to analyze the URL');
      }
    }
  });

  /**
   * GET /api/analysis
   * Get analysis results by URL or list all analyses
   */
  public getAnalysis = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const rawUrl = req.query.url as string;
      const targetKeyword = req.query.targetKeyword as string;

      if (rawUrl) {
        // Get analysis for specific URL
        if (targetKeyword && targetKeyword.trim() !== '') {
          // Perform fresh analysis with target keyword
          const userId = this.getUserId(req);
          const result = await analysisService.performAnalysis(rawUrl, {
            userId,
            targetKeyword
          });
          
          this.sendSuccess(res, result, 'Analysis completed with target keyword');
        } else {
          // Get existing analysis
          const analyses = await analysisService.getAnalysesByUrl(rawUrl);
          
          if (analyses.length === 0) {
            this.sendNotFound(res, 'Analysis');
            return;
          }
          
          // Return the most recent analysis
          this.sendSuccess(res, analyses[0].results, 'Analysis retrieved successfully');
        }
      } else {
        // Get all analyses with pagination
        const { page, pageSize } = this.getPaginationParams(req);
        const result = await analysisService.getAllAnalyses({ page, pageSize });
        
        this.sendPaginatedResponse(res, {
          data: result.analyses,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }, 'Analyses retrieved successfully');
      }

    } catch (error) {
      console.error('[AnalysisController] Error in getAnalysis:', error);
      this.sendError(res, 'Failed to fetch analysis');
    }
  });

  /**
   * GET /api/analysis/:id
   * Get analysis by ID
   */
  public getAnalysisById = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const analysisId = this.parseInteger(req.params.id);
      
      if (!analysisId) {
        this.sendError(res, 'Invalid analysis ID', 400);
        return;
      }

      const analysis = await analysisService.getAnalysisById(analysisId);
      
      if (!analysis) {
        this.sendNotFound(res, 'Analysis');
        return;
      }

      this.sendSuccess(res, analysis, 'Analysis retrieved successfully');

    } catch (error) {
      console.error('[AnalysisController] Error in getAnalysisById:', error);
      this.sendError(res, 'Failed to fetch analysis');
    }
  });

  /**
   * POST /api/analysis/:id/update-keyword
   * Update target keyword for an analysis
   */
  public updateAnalysisKeyword = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const analysisId = this.parseInteger(req.params.id);
      const { keyword } = updateKeywordSchema.parse(req.body);

      if (!analysisId) {
        this.sendError(res, 'Invalid analysis ID', 400);
        return;
      }

      const userId = this.getUserId(req);
      this.logAction('update_analysis_keyword', userId, { analysisId, keyword });

      const updatedAnalysis = await analysisService.reAnalyzeWithKeyword(analysisId, keyword);
      
      this.sendSuccess(res, updatedAnalysis, 'Analysis updated with new keyword');

    } catch (error) {
      if (error instanceof ZodError) {
        this.sendValidationError(res, error);
      } else {
        console.error('[AnalysisController] Error in updateAnalysisKeyword:', error);
        this.sendError(res, 'Failed to update analysis');
      }
    }
  });

  /**
   * DELETE /api/analysis/:id
   * Delete an analysis
   */
  public deleteAnalysis = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const analysisId = this.parseInteger(req.params.id);
      
      if (!analysisId) {
        this.sendError(res, 'Invalid analysis ID', 400);
        return;
      }

      const userId = this.getUserId(req);
      
      // Check if analysis exists and user has permission
      const analysis = await analysisService.getAnalysisById(analysisId);
      if (!analysis) {
        this.sendNotFound(res, 'Analysis');
        return;
      }

      // Check ownership (if analysis has userId)
      if (analysis.userId && analysis.userId !== userId && !this.isAdmin(req)) {
        this.sendForbidden(res, 'You can only delete your own analyses');
        return;
      }

      this.logAction('delete_analysis', userId, { analysisId });

      const deleted = await analysisService.deleteAnalysis(analysisId);
      
      if (deleted) {
        this.sendNoContent(res);
      } else {
        this.sendError(res, 'Failed to delete analysis');
      }

    } catch (error) {
      console.error('[AnalysisController] Error in deleteAnalysis:', error);
      this.sendError(res, 'Failed to delete analysis');
    }
  });

  /**
   * GET /api/analysis/user/:userId
   * Get analyses for a specific user
   */
  public getUserAnalyses = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = this.getUserId(req);

      // Check authorization
      if (targetUserId !== currentUserId && !this.isAdmin(req)) {
        this.sendForbidden(res, 'You can only view your own analyses');
        return;
      }

      const { page, pageSize } = this.getPaginationParams(req);
      const limit = parseInt(req.query.limit as string) || undefined;

      const result = await analysisService.getUserAnalyses(targetUserId, {
        page: page,
        pageSize: pageSize,
        limit
      });

      if ('total' in result) {
        // Paginated response
        this.sendPaginatedResponse(res, {
          data: result.analyses,
          total: result.total!,
          page: result.page!,
          pageSize: result.pageSize!,
          totalPages: result.totalPages!
        }, 'User analyses retrieved successfully');
      } else {
        // Simple list response
        this.sendSuccess(res, result.analyses, 'User analyses retrieved successfully');
      }

    } catch (error) {
      console.error('[AnalysisController] Error in getUserAnalyses:', error);
      this.sendError(res, 'Failed to fetch user analyses');
    }
  });

  /**
   * GET /api/analysis/stats
   * Get analysis statistics
   */
  public getAnalysisStats = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const includeUserStats = this.parseBoolean(req.query.includeUserStats);

      const systemStats = await analysisService.getAnalysisStats();
      
      let userStats = null;
      if (includeUserStats && userId) {
        userStats = await analysisService.getUserAnalysisStats(userId);
      }

      this.sendSuccess(res, {
        system: systemStats,
        user: userStats
      }, 'Analysis statistics retrieved successfully');

    } catch (error) {
      console.error('[AnalysisController] Error in getAnalysisStats:', error);
      this.sendError(res, 'Failed to fetch analysis statistics');
    }
  });

  /**
   * GET /api/analysis/search
   * Search analyses with filters
   */
  public searchAnalyses = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = this.getUserId(req);
      const { page, pageSize } = this.getPaginationParams(req);
      const { startDate, endDate } = this.getDateRange(req);
      
      const query = req.query.query as string;
      const minScore = this.parseInteger(req.query.minScore);
      const maxScore = this.parseInteger(req.query.maxScore);
      const searchUserId = req.query.userId as string;

      // Check authorization for user-specific searches
      if (searchUserId && searchUserId !== userId && !this.isAdmin(req)) {
        this.sendForbidden(res, 'You can only search your own analyses');
        return;
      }

      const result = await analysisService.searchAnalyses({
        query,
        userId: searchUserId || userId,
        minScore: minScore || undefined,
        maxScore: maxScore || undefined,
        startDate,
        endDate,
        page,
        pageSize
      });

      this.sendPaginatedResponse(res, {
        data: result.analyses,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }, 'Search results retrieved successfully');

    } catch (error) {
      console.error('[AnalysisController] Error in searchAnalyses:', error);
      this.sendError(res, 'Failed to search analyses');
    }
  });

  /**
   * GET /api/analysis/trends/:url
   * Get trends for a specific URL
   */
  public getUrlTrends = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const url = decodeURIComponent(req.params.url);
      
      if (!url) {
        this.sendError(res, 'URL parameter is required', 400);
        return;
      }

      const trends = await analysisService.getUrlTrends(url);
      
      this.sendSuccess(res, trends, 'URL trends retrieved successfully');

    } catch (error) {
      console.error('[AnalysisController] Error in getUrlTrends:', error);
      this.sendError(res, 'Failed to fetch URL trends');
    }
  });

  /**
   * POST /api/analysis/compare
   * Compare multiple analyses
   */
  public compareAnalyses = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const { analysisIds } = req.body;
      
      if (!Array.isArray(analysisIds) || analysisIds.length < 2) {
        this.sendError(res, 'At least 2 analysis IDs are required for comparison', 400);
        return;
      }

      const userId = this.getUserId(req);
      this.logAction('compare_analyses', userId, { analysisIds });

      const comparison = await analysisService.compareAnalyses(analysisIds);
      
      this.sendSuccess(res, comparison, 'Analysis comparison completed');

    } catch (error) {
      console.error('[AnalysisController] Error in compareAnalyses:', error);
      this.sendError(res, 'Failed to compare analyses');
    }
  });

  /**
   * DELETE /api/analysis/cleanup
   * Clean up old analyses (admin only)
   */
  public cleanupOldAnalyses = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!this.requireAdmin(req)) {
        this.sendForbidden(res, 'Admin access required');
        return;
      }

      const days = this.parseInteger(req.query.days, 90);
      const userId = this.getUserId(req);

      this.logAction('cleanup_analyses', userId, { days });

      const deletedCount = await analysisService.cleanupOldAnalyses(days);
      
      this.sendSuccess(res, { deletedCount }, `Cleaned up ${deletedCount} old analyses`);

    } catch (error) {
      console.error('[AnalysisController] Error in cleanupOldAnalyses:', error);
      this.sendError(res, 'Failed to cleanup analyses');
    }
  });
}

// Export singleton instance
export const analysisController = new AnalysisController();