/**
 * SEO-specific API hooks
 * Specialized hooks for common SEO operations in the application
 */

import { useState, useCallback } from 'react';
import { useApiMutation, useApiRequest, usePolling } from './useApi';
import { useToast } from '../ui/use-toast';

// SEO Analysis Types
export interface SeoAnalysisRequest {
  url: string;
  keyword?: string;
  options?: {
    includeCompetitor?: boolean;
    deepAnalysis?: boolean;
  };
}

export interface SeoAnalysisResult {
  url: string;
  overallScore: {
    score: number;
    category: string;
  };
  keywords: any;
  metaTags: any;
  content: any;
  pageSpeed: any;
  // ... other analysis results
}

export interface PageSpeedMetrics {
  score: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  source: 'api' | 'simulation';
}

export interface RankTrackerData {
  keyword: string;
  domain: string;
  rankings: Array<{
    position: number;
    url: string;
    title: string;
    date: string;
  }>;
}

/**
 * Hook for SEO analysis operations
 */
export function useSeoAnalysis() {
  const { toast } = useToast();

  const analysisMutation = useApiMutation<SeoAnalysisResult, SeoAnalysisRequest>(
    async (request) => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return response.json();
    },
    {
      showToastOnSuccess: true,
      successMessage: 'SEO analysis completed successfully!',
      showToastOnError: true,
      errorMessage: 'Failed to analyze website. Please check the URL and try again.',
    }
  );

  const analyzeWebsite = useCallback(
    (url: string, keyword?: string, options?: any) => {
      return analysisMutation.mutate({
        url,
        keyword,
        options,
      });
    },
    [analysisMutation.mutate]
  );

  return {
    analyzeWebsite,
    loading: analysisMutation.loading,
    error: analysisMutation.error,
    result: analysisMutation.data,
    success: analysisMutation.success,
    reset: analysisMutation.reset,
  };
}

/**
 * Hook for PageSpeed Insights API
 */
export function usePageSpeedAnalysis(url: string | null) {
  return useApiRequest<PageSpeedMetrics>(
    url ? `/api/pagespeed?url=${encodeURIComponent(url)}` : null,
    { method: 'GET' },
    {
      showToastOnError: true,
      errorMessage: 'Failed to fetch PageSpeed metrics',
      transformData: (data) => ({
        score: data.score || 50,
        lcp: data.lcp || 4000,
        fid: data.fid || 200,
        cls: data.cls || 0.25,
        ttfb: data.ttfb || 800,
        source: data.source || 'simulation',
        ...data,
      }),
    }
  );
}

/**
 * Hook for keyword suggestions
 */
export function useKeywordSuggestions() {
  const { toast } = useToast();

  const suggestionsMutation = useApiMutation<string[], { baseKeyword: string }>(
    async ({ baseKeyword }) => {
      const response = await fetch('/api/keywords/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ baseKeyword: baseKeyword.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate keyword suggestions');
      }

      const data = await response.json();
      return data.suggestions || data;
    },
    {
      showToastOnSuccess: true,
      successMessage: 'Keyword suggestions generated successfully!',
      showToastOnError: true,
    }
  );

  const generateSuggestions = useCallback(
    (baseKeyword: string) => {
      if (!baseKeyword.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a base keyword',
          variant: 'destructive',
        });
        return Promise.resolve(null);
      }
      return suggestionsMutation.mutate({ baseKeyword });
    },
    [suggestionsMutation.mutate, toast]
  );

  return {
    generateSuggestions,
    loading: suggestionsMutation.loading,
    error: suggestionsMutation.error,
    suggestions: suggestionsMutation.data,
    success: suggestionsMutation.success,
    reset: suggestionsMutation.reset,
  };
}

/**
 * Hook for saving keywords
 */
export function useSaveKeyword() {
  return useApiMutation<any, { keyword: string; data: any }>(
    async ({ keyword, data }) => {
      const response = await fetch('/api/keywords/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyword, ...data }),
      });

      if (!response.ok) {
        throw new Error('Failed to save keyword');
      }

      return response.json();
    },
    {
      showToastOnSuccess: true,
      successMessage: 'Keyword saved successfully!',
    }
  );
}

/**
 * Hook for rank tracking operations
 */
export function useRankTracker() {
  const { toast } = useToast();

  const trackingMutation = useApiMutation<RankTrackerData, {
    keyword: string;
    domain: string;
    location?: string;
    device?: string;
  }>(
    async ({ keyword, domain, location = 'United States', device = 'desktop' }) => {
      const response = await fetch('/api/rank-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyword, domain, location, device }),
      });

      if (!response.ok) {
        throw new Error('Failed to track rankings');
      }

      return response.json();
    },
    {
      showToastOnSuccess: true,
      successMessage: 'Rank tracking completed!',
      showToastOnError: true,
    }
  );

  const trackRankings = useCallback(
    (keyword: string, domain: string, location?: string, device?: string) => {
      if (!keyword.trim() || !domain.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter both keyword and domain',
          variant: 'destructive',
        });
        return Promise.resolve(null);
      }
      return trackingMutation.mutate({ keyword, domain, location, device });
    },
    [trackingMutation.mutate, toast]
  );

  return {
    trackRankings,
    loading: trackingMutation.loading,
    error: trackingMutation.error,
    data: trackingMutation.data,
    success: trackingMutation.success,
    reset: trackingMutation.reset,
  };
}

/**
 * Hook for competitor analysis
 */
export function useCompetitorAnalysis() {
  const competitorMutation = useApiMutation<any, {
    keyword: string;
    location?: string;
    competitors?: number;
  }>(
    async ({ keyword, location = 'United States', competitors = 10 }) => {
      const response = await fetch('/api/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyword, location, competitors }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze competitors');
      }

      return response.json();
    },
    {
      showToastOnSuccess: true,
      successMessage: 'Competitor analysis completed!',
      showToastOnError: true,
    }
  );

  const analyzeCompetitors = useCallback(
    (keyword: string, location?: string, competitors?: number) => {
      return competitorMutation.mutate({ keyword, location, competitors });
    },
    [competitorMutation.mutate]
  );

  return {
    analyzeCompetitors,
    loading: competitorMutation.loading,
    error: competitorMutation.error,
    data: competitorMutation.data,
    success: competitorMutation.success,
    reset: competitorMutation.reset,
  };
}

/**
 * Hook for deep content analysis with OpenAI
 */
export function useDeepContentAnalysis() {
  const analysisMutation = useApiMutation<any, { url: string; keyword?: string }>(
    async ({ url, keyword }) => {
      const response = await fetch('/api/deep-content-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url, keyword }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform deep content analysis');
      }

      return response.json();
    },
    {
      showToastOnSuccess: true,
      successMessage: 'Deep content analysis completed!',
      showToastOnError: true,
    }
  );

  const analyzeContent = useCallback(
    (url: string, keyword?: string) => {
      return analysisMutation.mutate({ url, keyword });
    },
    [analysisMutation.mutate]
  );

  return {
    analyzeContent,
    loading: analysisMutation.loading,
    error: analysisMutation.error,
    data: analysisMutation.data,
    success: analysisMutation.success,
    reset: analysisMutation.reset,
  };
}

/**
 * Hook for long-running SEO audit operations with progress tracking
 */
export function useSeoAudit() {
  const [auditId, setAuditId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Start audit mutation
  const startAuditMutation = useApiMutation<{ auditId: string }, {
    url: string;
    options?: any;
  }>(
    async ({ url, options }) => {
      const response = await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url, options }),
      });

      if (!response.ok) {
        throw new Error('Failed to start audit');
      }

      return response.json();
    },
    {
      showToastOnSuccess: true,
      successMessage: 'Audit started successfully!',
      onSuccess: (data) => {
        setAuditId(data.auditId);
        setProgress(0);
      },
    }
  );

  // Poll audit progress
  const progressPolling = usePolling<{
    progress: number;
    status: string;
    result?: any;
  }>(
    auditId ? `/api/audit/progress/${auditId}` : null,
    2000, // Poll every 2 seconds
    {
      stopCondition: (data) => data.status === 'completed' || data.status === 'failed',
      onSuccess: (data) => {
        setProgress(data.progress);
      },
    }
  );

  const startAudit = useCallback(
    (url: string, options?: any) => {
      return startAuditMutation.mutate({ url, options });
    },
    [startAuditMutation.mutate]
  );

  const resetAudit = useCallback(() => {
    setAuditId(null);
    setProgress(0);
    startAuditMutation.reset();
    progressPolling.stopPolling();
  }, [startAuditMutation.reset, progressPolling.stopPolling]);

  // Auto-start polling when audit ID is available
  useState(() => {
    if (auditId && !progressPolling.isPolling) {
      progressPolling.startPolling();
    }
  });

  return {
    startAudit,
    progress,
    auditId,
    isStarting: startAuditMutation.loading,
    isPolling: progressPolling.isPolling,
    result: progressPolling.data?.result,
    status: progressPolling.data?.status,
    error: startAuditMutation.error || progressPolling.error,
    reset: resetAudit,
  };
}

/**
 * Hook for authentication-aware API calls
 */
export function useAuthenticatedApi<T = any>(
  url: string | null,
  config: any = {},
  options: any = {}
) {
  const { toast } = useToast();

  return useApiRequest<T>(
    url,
    {
      ...config,
      credentials: 'include',
    },
    {
      ...options,
      onError: (error) => {
        // Handle authentication errors
        if (error.includes('401') || error.includes('Unauthorized')) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to continue',
            variant: 'destructive',
          });
          // Could redirect to login here
        }
        if (options.onError) options.onError(error);
      },
    }
  );
}