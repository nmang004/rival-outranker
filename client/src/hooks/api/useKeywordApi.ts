/**
 * Keyword API hooks for keyword research and rank tracking operations
 */

import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useApiQuery, useApiMutation, useOptimisticUpdate, queryKeys } from './useApiData';

// Types
export interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: number[];
  suggestions: string[];
  serp: any[];
  lastUpdated: string;
}

export interface KeywordResearchRequest {
  seed_keyword: string;
  location?: string;
  language?: string;
  include_serp?: boolean;
}

export interface RankTrackerProject {
  id: string;
  name: string;
  domain: string;
  keywords: RankTrackerKeyword[];
  location: string;
  device: 'desktop' | 'mobile';
  createdAt: string;
  updatedAt: string;
}

export interface RankTrackerKeyword {
  id: string;
  keyword: string;
  currentRank?: number;
  previousRank?: number;
  bestRank?: number;
  rankHistory: RankHistoryEntry[];
  url?: string;
  lastChecked?: string;
}

export interface RankHistoryEntry {
  date: string;
  rank: number;
  url?: string;
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  relevance: number;
  cpc?: number;
}

// Keyword research hooks
export function useKeywordResearch() {
  const queryClient = useQueryClient();

  return useApiMutation<Keyword[], KeywordResearchRequest>(
    async (variables) => {
      return apiClient.post('/api/keyword-research', variables);
    },
    {
      onSuccess: (data, variables) => {
        // Cache the results using the seed keyword as key
        queryClient.setQueryData(
          queryKeys.keywords.research(variables.seed_keyword),
          data
        );
      },
    }
  );
}

export function useKeywordResearchResults(seedKeyword: string) {
  return useApiQuery<Keyword[]>(
    queryKeys.keywords.research(seedKeyword),
    `/api/keyword-research/results`,
    { seed_keyword: seedKeyword },
    {
      enabled: !!seedKeyword,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useKeywordSuggestions(keyword: string) {
  return useApiQuery<KeywordSuggestion[]>(
    [...queryKeys.keywords.all(), 'suggestions', keyword],
    `/api/keywords/suggestions`,
    { keyword },
    {
      enabled: !!keyword && keyword.length > 2,
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );
}

export function useKeywordMetrics(keywords: string[]) {
  return useApiQuery<Record<string, Keyword>>(
    [...queryKeys.keywords.all(), 'metrics', keywords.sort().join(',')],
    `/api/keywords/metrics`,
    { keywords: keywords.join(',') },
    {
      enabled: keywords.length > 0,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}

// Rank tracker hooks
export function useRankTrackerProjects() {
  return useApiQuery<RankTrackerProject[]>(
    [...queryKeys.keywords.all(), 'rank-tracker', 'projects'],
    '/api/rank-tracker/projects',
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useRankTrackerProject(projectId: string) {
  return useApiQuery<RankTrackerProject>(
    [...queryKeys.keywords.all(), 'rank-tracker', 'project', projectId],
    `/api/rank-tracker/projects/${projectId}`,
    undefined,
    {
      enabled: !!projectId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useCreateRankTrackerProject() {
  const queryClient = useQueryClient();

  return useApiMutation<RankTrackerProject, Omit<RankTrackerProject, 'id' | 'createdAt' | 'updatedAt'>>(
    async (variables) => {
      return apiClient.post('/api/rank-tracker/projects', variables);
    },
    {
      onSuccess: (data) => {
        // Add to projects list
        queryClient.setQueryData<{ data: RankTrackerProject[] }>(
          [...queryKeys.keywords.all(), 'rank-tracker', 'projects'],
          (old) => {
            if (!old) return { data: [data.data] };
            return { data: [...old.data, data.data] };
          }
        );

        // Cache the new project
        queryClient.setQueryData(
          [...queryKeys.keywords.all(), 'rank-tracker', 'project', data.data.id],
          data
        );
      },
    }
  );
}

export function useUpdateRankTrackerProject() {
  const queryClient = useQueryClient();

  return useApiMutation<RankTrackerProject, { projectId: string; updates: Partial<RankTrackerProject> }>(
    async (variables) => {
      return apiClient.patch(`/api/rank-tracker/projects/${variables.projectId}`, variables.updates);
    },
    {
      onSuccess: (data, variables) => {
        // Update project in cache
        queryClient.setQueryData(
          [...queryKeys.keywords.all(), 'rank-tracker', 'project', variables.projectId],
          data
        );

        // Update in projects list
        queryClient.setQueryData<{ data: RankTrackerProject[] }>(
          [...queryKeys.keywords.all(), 'rank-tracker', 'projects'],
          (old) => {
            if (!old) return old;
            return {
              data: old.data.map(project => 
                project.id === variables.projectId ? data.data : project
              )
            };
          }
        );
      },
    }
  );
}

export function useDeleteRankTrackerProject() {
  const queryClient = useQueryClient();

  return useApiMutation<void, string>(
    async (projectId) => {
      return apiClient.delete(`/api/rank-tracker/projects/${projectId}`);
    },
    {
      onSuccess: (_, projectId) => {
        // Remove from cache
        queryClient.removeQueries({ 
          queryKey: [...queryKeys.keywords.all(), 'rank-tracker', 'project', projectId] 
        });

        // Remove from projects list
        queryClient.setQueryData<{ data: RankTrackerProject[] }>(
          [...queryKeys.keywords.all(), 'rank-tracker', 'projects'],
          (old) => {
            if (!old) return old;
            return {
              data: old.data.filter(project => project.id !== projectId)
            };
          }
        );
      },
    }
  );
}

// Keyword management in projects
export function useAddKeywordsToProject() {
  const queryClient = useQueryClient();

  return useApiMutation<RankTrackerProject, { projectId: string; keywords: string[] }>(
    async (variables) => {
      return apiClient.post(`/api/rank-tracker/projects/${variables.projectId}/keywords`, {
        keywords: variables.keywords,
      });
    },
    {
      onSuccess: (data, variables) => {
        // Update project in cache
        queryClient.setQueryData(
          [...queryKeys.keywords.all(), 'rank-tracker', 'project', variables.projectId],
          data
        );
      },
    }
  );
}

export function useRemoveKeywordFromProject() {
  const queryClient = useQueryClient();

  return useApiMutation<RankTrackerProject, { projectId: string; keywordId: string }>(
    async (variables) => {
      return apiClient.delete(`/api/rank-tracker/projects/${variables.projectId}/keywords/${variables.keywordId}`);
    },
    {
      onSuccess: (data, variables) => {
        // Update project in cache
        queryClient.setQueryData(
          [...queryKeys.keywords.all(), 'rank-tracker', 'project', variables.projectId],
          data
        );
      },
    }
  );
}

// Rank checking
export function useCheckRankings() {
  const queryClient = useQueryClient();

  return useApiMutation<RankTrackerProject, string>(
    async (projectId) => {
      return apiClient.post(`/api/rank-tracker/projects/${projectId}/check-rankings`);
    },
    {
      onSuccess: (data, projectId) => {
        // Update project with new rankings
        queryClient.setQueryData(
          [...queryKeys.keywords.all(), 'rank-tracker', 'project', projectId],
          data
        );
      },
    }
  );
}

export function useRankingHistory(projectId: string, keywordId: string, days = 30) {
  return useApiQuery<RankHistoryEntry[]>(
    [...queryKeys.keywords.all(), 'rank-tracker', 'history', projectId, keywordId, days],
    `/api/rank-tracker/projects/${projectId}/keywords/${keywordId}/history`,
    { days },
    {
      enabled: !!(projectId && keywordId),
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

// Optimistic updates for rank tracker
export function useOptimisticRankUpdate(projectId: string) {
  return useOptimisticUpdate<RankTrackerProject>(
    [...queryKeys.keywords.all(), 'rank-tracker', 'project', projectId],
    (oldData, newData) => {
      if (!oldData) {
        // Create a minimal default project if oldData is not available
        return {
          id: projectId,
          name: newData.name || 'New Project',
          domain: newData.domain || '',
          keywords: newData.keywords || [],
          location: newData.location || '',
          device: newData.device || 'desktop',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...newData
        } as RankTrackerProject;
      }
      return { ...oldData, ...newData };
    }
  );
}

// SERP analysis
export function useSerpAnalysis() {
  return useApiMutation<any, { keyword: string; location?: string; device?: 'desktop' | 'mobile' }>(
    async (variables) => {
      return apiClient.post('/api/keywords/serp-analysis', variables);
    }
  );
}

export function useSerpResults(keyword: string, location?: string) {
  return useApiQuery(
    [...queryKeys.keywords.all(), 'serp', keyword, location],
    '/api/keywords/serp',
    { keyword, location },
    {
      enabled: !!keyword,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}

// Keyword clustering and grouping
export function useKeywordClustering() {
  return useApiMutation<any, { keywords: string[]; similarity_threshold?: number }>(
    async (variables) => {
      return apiClient.post('/api/keywords/clustering', variables);
    }
  );
}

// Competitive keyword analysis
export function useCompetitorKeywords(domain: string) {
  return useApiQuery(
    [...queryKeys.keywords.all(), 'competitor', domain],
    '/api/keywords/competitor-analysis',
    { domain },
    {
      enabled: !!domain,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}

// Keyword difficulty analysis
export function useKeywordDifficulty(keywords: string[]) {
  return useApiQuery(
    [...queryKeys.keywords.all(), 'difficulty', keywords.sort().join(',')],
    '/api/keywords/difficulty',
    { keywords: keywords.join(',') },
    {
      enabled: keywords.length > 0,
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );
}