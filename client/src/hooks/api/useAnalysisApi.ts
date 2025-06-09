/**
 * Analysis API hooks for SEO analysis operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiResponse, type ApiError } from '../../lib/apiClient';
import { useApiQuery, useApiMutation, useRealTimeData, queryKeys } from './useApiData';

// Types
export interface AnalysisResult {
  id: string;
  url: string;
  overallScore: number;
  results: {
    keywords: any;
    meta: any;
    content: any;
    technical: any;
    recommendations: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisRequest {
  url: string;
  keywords?: string[];
  analyzeCompetitors?: boolean;
  deepAnalysis?: boolean;
}

export interface CompetitorAnalysisRequest {
  domain: string;
  competitors: string[];
  keywords?: string[];
}

export interface DeepContentAnalysisRequest {
  url: string;
  content?: string;
  targetKeywords?: string[];
}

// Analysis hooks
export function useAnalyses(filters?: Record<string, any>) {
  return useApiQuery<AnalysisResult[]>(
    queryKeys.analyses.list(filters),
    '/api/analyses',
    filters,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for analysis lists
    }
  );
}

export function useAnalysis(id: string) {
  return useApiQuery<AnalysisResult>(
    queryKeys.analyses.detail(id),
    `/api/analyses/${id}`,
    undefined,
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutes for individual analysis
    }
  );
}

export function useCreateAnalysis() {
  const queryClient = useQueryClient();

  return useApiMutation<AnalysisResult, AnalysisRequest>(
    async (variables) => {
      return apiClient.post<AnalysisResult>('/api/analyze', variables);
    },
    {
      onSuccess: (data) => {
        // Invalidate and refetch analyses list
        queryClient.invalidateQueries({ queryKey: queryKeys.analyses.all() });
        
        // Add new analysis to cache
        queryClient.setQueryData(
          queryKeys.analyses.detail(data.data.id),
          data
        );
      },
    }
  );
}

export function useRealTimeAnalysis(analysisId: string, enabled = true) {
  return useRealTimeData<{ progress: number; status: string; result?: AnalysisResult }>(
    `/api/analyses/${analysisId}/stream`,
    undefined,
    {
      enabled: enabled && !!analysisId,
      onUpdate: (data) => {
        // Update analysis in cache if completed
        if (data.result) {
          const queryClient = useQueryClient();
          queryClient.setQueryData(
            queryKeys.analyses.detail(analysisId),
            { data: data.result }
          );
        }
      },
    }
  );
}

// Competitor analysis hooks
export function useCompetitorAnalysis() {
  const queryClient = useQueryClient();

  return useApiMutation<any, CompetitorAnalysisRequest>(
    async (variables) => {
      return apiClient.post('/api/competitor-analysis', variables);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.competitors.all() });
      },
    }
  );
}

export function useCompetitorAnalysisResult(domain: string) {
  return useApiQuery(
    queryKeys.competitors.analysis(domain),
    `/api/competitor-analysis/${encodeURIComponent(domain)}`,
    undefined,
    {
      enabled: !!domain,
    }
  );
}

// Deep content analysis hooks
export function useDeepContentAnalysis() {
  const queryClient = useQueryClient();

  return useApiMutation<any, DeepContentAnalysisRequest>(
    async (variables) => {
      return apiClient.post('/api/content/deep-analysis', variables);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analyses.all() });
      },
    }
  );
}

export function useRealTimeDeepAnalysis(analysisId: string, enabled = true) {
  return useRealTimeData<{ 
    progress: number; 
    currentSection: string; 
    completedSections: string[];
    result?: any;
  }>(
    `/api/content/deep-analysis/${analysisId}/stream`,
    undefined,
    {
      enabled: enabled && !!analysisId,
    }
  );
}

// Export analysis hooks
export function useExportAnalysis() {
  return useApiMutation<Blob, { analysisId: string; format: 'pdf' | 'excel' | 'csv' }>(
    async (variables) => {
      const response = await apiClient.get(
        `/api/analyses/${variables.analysisId}/export`,
        { format: variables.format },
        {
          headers: {
            'Accept': variables.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        }
      );
      return response;
    }
  );
}

// Analysis history hooks
export function useAnalysisHistory(url?: string) {
  return useApiQuery(
    queryKeys.analyses.list({ url }),
    '/api/analyses/history',
    { url },
    {
      enabled: !!url,
      staleTime: 5 * 60 * 1000,
    }
  );
}

// Delete analysis hook
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useApiMutation<void, string>(
    async (analysisId) => {
      return apiClient.delete(`/api/analyses/${analysisId}`);
    },
    {
      onSuccess: (_, analysisId) => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: queryKeys.analyses.detail(analysisId) });
        
        // Invalidate lists
        queryClient.invalidateQueries({ queryKey: queryKeys.analyses.lists() });
      },
    }
  );
}

// Bulk operations
export function useBulkDeleteAnalyses() {
  const queryClient = useQueryClient();

  return useApiMutation<void, string[]>(
    async (analysisIds) => {
      return apiClient.post('/api/analyses/bulk-delete', { ids: analysisIds });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analyses.all() });
      },
    }
  );
}

// Analysis insights and recommendations
export function useAnalysisInsights(analysisId: string) {
  return useApiQuery(
    [...queryKeys.analyses.detail(analysisId), 'insights'],
    `/api/analyses/${analysisId}/insights`,
    undefined,
    {
      enabled: !!analysisId,
      staleTime: 30 * 60 * 1000, // 30 minutes for insights
    }
  );
}

export function useUpdateAnalysisNotes() {
  const queryClient = useQueryClient();

  return useApiMutation<AnalysisResult, { analysisId: string; notes: string }>(
    async (variables) => {
      return apiClient.patch(`/api/analyses/${variables.analysisId}`, {
        notes: variables.notes,
      });
    },
    {
      onSuccess: (data, variables) => {
        // Update cache
        queryClient.setQueryData(
          queryKeys.analyses.detail(variables.analysisId),
          data
        );
      },
    }
  );
}