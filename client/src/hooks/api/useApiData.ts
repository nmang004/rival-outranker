/**
 * Enhanced API data hooks with TanStack Query integration
 * 
 * Features:
 * - Automatic caching and background refetching
 * - Optimistic updates
 * - Real-time updates with Server-Sent Events
 * - Error handling and retry logic
 * - Loading and error states
 * - Offline support
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, type ApiResponse, type ApiError } from '../../lib/apiClient';

// Query key factory for consistent cache keys
export const queryKeys = {
  all: ['api'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...queryKeys.lists(), { filters }] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...queryKeys.details(), id] as const,
  
  // Specific entity keys
  analyses: {
    all: () => [...queryKeys.all, 'analyses'] as const,
    lists: () => [...queryKeys.analyses.all(), 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.analyses.lists(), { filters }] as const,
    details: () => [...queryKeys.analyses.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.analyses.details(), id] as const,
  },
  
  keywords: {
    all: () => [...queryKeys.all, 'keywords'] as const,
    lists: () => [...queryKeys.keywords.all(), 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.keywords.lists(), { filters }] as const,
    details: () => [...queryKeys.keywords.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.keywords.details(), id] as const,
    research: (query: string) => [...queryKeys.keywords.all(), 'research', query] as const,
    rankings: (projectId: string) => [...queryKeys.keywords.all(), 'rankings', projectId] as const,
  },
  
  backlinks: {
    all: () => [...queryKeys.all, 'backlinks'] as const,
    lists: () => [...queryKeys.backlinks.all(), 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.backlinks.lists(), { filters }] as const,
    profile: (domain: string) => [...queryKeys.backlinks.all(), 'profile', domain] as const,
  },
  
  competitors: {
    all: () => [...queryKeys.all, 'competitors'] as const,
    analysis: (domain: string) => [...queryKeys.competitors.all(), 'analysis', domain] as const,
  },
  
  learning: {
    all: () => [...queryKeys.all, 'learning'] as const,
    paths: () => [...queryKeys.learning.all(), 'paths'] as const,
    modules: () => [...queryKeys.learning.all(), 'modules'] as const,
    progress: (userId: string) => [...queryKeys.learning.all(), 'progress', userId] as const,
    achievements: (userId: string) => [...queryKeys.learning.all(), 'achievements', userId] as const,
  },
  
  user: {
    all: () => [...queryKeys.all, 'user'] as const,
    profile: () => [...queryKeys.user.all(), 'profile'] as const,
    projects: () => [...queryKeys.user.all(), 'projects'] as const,
    usage: () => [...queryKeys.user.all(), 'usage'] as const,
  },
};

// Enhanced useQuery hook with default error handling
export function useApiQuery<T = any>(
  queryKey: readonly unknown[],
  endpoint: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<ApiResponse<T>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<T>, ApiError>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const response = await apiClient.get<T>(endpoint, params);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors or client errors
      if (error.isAuthError || (error.status && error.status < 500)) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

// Enhanced useMutation hook with optimistic updates
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, ApiError, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<TData>, ApiError, TVariables>({
    mutationFn,
    onError: (error, variables, context) => {
      // Handle auth errors globally
      if (error.isAuthError) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

// Real-time data hook using Server-Sent Events
export function useRealTimeData<T = any>(
  endpoint: string,
  initialData?: T,
  options?: {
    enabled?: boolean;
    onUpdate?: (data: T) => void;
    onError?: (error: Event) => void;
  }
) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = apiClient.createEventSource(endpoint);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          setData(newData);
          options?.onUpdate?.(newData);
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
        }
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        setError(event);
        options?.onError?.(event);
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError(err as Event);
    }
  }, [endpoint, options]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (options?.enabled !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, options?.enabled]);

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

// Infinite query hook for paginated data
export function useInfiniteApiQuery<T = any>(
  queryKey: readonly unknown[],
  endpoint: string,
  options?: {
    pageSize?: number;
    getNextPageParam?: (lastPage: ApiResponse<T>) => string | number | undefined;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: options?.pageSize || 20,
      };
      return apiClient.get<T>(endpoint, params);
    },
    getNextPageParam: options?.getNextPageParam || ((lastPage: any) => {
      const { page, totalPages } = lastPage.data.pagination || {};
      return page < totalPages ? page + 1 : undefined;
    }),
    enabled: options?.enabled,
  });
}

// Optimistic update helper
export function useOptimisticUpdate<T = any>(
  queryKey: readonly unknown[],
  updateFn: (oldData: T | undefined, newData: Partial<T>) => T
) {
  const queryClient = useQueryClient();

  return useCallback(
    (newData: Partial<T>) => {
      queryClient.setQueryData<ApiResponse<T>>(queryKey, (old) => {
        if (!old) return old;
        
        const updatedData = updateFn(old.data, newData);
        return {
          ...old,
          data: updatedData,
        };
      });
    },
    [queryClient, queryKey, updateFn]
  );
}

// Bulk operations hook
export function useBulkOperation<TData = any, TVariables = any>(
  operationFn: (items: TVariables[]) => Promise<ApiResponse<TData>>,
  options?: {
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [errors, setErrors] = useState<ApiError[]>([]);

  const execute = useCallback(
    async (items: TVariables[]) => {
      setIsLoading(true);
      setProgress({ completed: 0, total: items.length });
      setErrors([]);

      const batchSize = options?.batchSize || 10;
      const results: TData[] = [];
      const batchErrors: ApiError[] = [];

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        try {
          const response = await operationFn(batch);
          results.push(response.data);
        } catch (error) {
          batchErrors.push(error as ApiError);
        }

        const completed = Math.min(i + batchSize, items.length);
        setProgress({ completed, total: items.length });
        options?.onProgress?.(completed, items.length);
      }

      setErrors(batchErrors);
      setIsLoading(false);
      
      return { results, errors: batchErrors };
    },
    [operationFn, options]
  );

  return {
    execute,
    isLoading,
    progress,
    errors,
  };
}

// Background sync hook for offline support
export function useBackgroundSync<T = any>(
  syncFn: () => Promise<T>,
  options?: {
    interval?: number;
    enabled?: boolean;
    onSync?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const data = await syncFn();
      setLastSyncTime(new Date());
      options?.onSync?.(data);
    } catch (error) {
      options?.onError?.(error as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [syncFn, isSyncing, options]);

  useEffect(() => {
    if (options?.enabled !== false) {
      const interval = options?.interval || 30000; // 30 seconds default
      intervalRef.current = setInterval(sync, interval);
      
      // Sync immediately
      sync();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sync, options?.enabled, options?.interval]);

  return {
    sync,
    isSyncing,
    lastSyncTime,
  };
}