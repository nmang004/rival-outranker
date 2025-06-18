/**
 * Enhanced Query Client Configuration
 * 
 * Features:
 * - Advanced caching strategies
 * - Optimistic updates support
 * - Network-aware caching
 * - Background refetching
 * - Error handling and retry logic
 * - Integration with new API client
 */

import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";
import axios from "axios";
import { apiClient, type ApiError } from './apiClient';

// Legacy axios instance (to be phased out)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // API error occurred - will be handled by query client
    return Promise.reject(error);
  }
);

// Legacy API request function (to be phased out)
export async function apiRequest<T = any>(
  url: string,
  options?: {
    method?: string;
    data?: unknown;
  }
): Promise<T> {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  try {
    if (method === 'GET') {
      const response = await axiosInstance.get<T>(url);
      return response.data;
    } else {
      const response = await axiosInstance.request<T>({
        url,
        method,
        data
      });
      return response.data;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T | null> =>
  async ({ queryKey }) => {
    const { on401: unauthorizedBehavior } = options;
    try {
      if (!queryKey || !queryKey[0] || typeof queryKey[0] !== 'string') {
        console.error('Invalid queryKey:', queryKey);
        return null;
      }
      
      const endpoint = queryKey[0];
      
      try {
        const response = await axiosInstance.get<T>(endpoint);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            if (error.response.status === 401) {
              if (unauthorizedBehavior === "returnNull") {
                return null;
              }
              throw new Error("Unauthorized");
            }
            
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error(`HTTP error: ${error.response.status}`);
          } else if (error.request) {
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error("Network error: No response received");
          }
        }
        
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw error;
      }
    } catch (error) {
      console.error("Query fetch error:", error);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

// Enhanced cache configuration with intelligent defaults
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Global error handling for queries
    // Emit custom event for global error handling
    if (error instanceof Error) {
      const apiError = error as ApiError;
      window.dispatchEvent(new CustomEvent('api-error', { detail: apiError }));
    }
  },
  onSuccess: (data, query) => {
    // Query completed successfully
  },
});

const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    // Global error handling for mutations
    if (error instanceof Error) {
      const apiError = error as ApiError;
      window.dispatchEvent(new CustomEvent('api-error', { detail: apiError }));
    }
  },
  onSuccess: (data, variables, context, mutation) => {
    // Mutation completed successfully
  },
});

// Create enhanced query client
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Legacy query function for backward compatibility
      queryFn: getQueryFn({ on401: "returnNull" }),
      
      // Enhanced caching strategy
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
      
      // Network-aware settings
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Background refetching
      refetchInterval: false, // Disabled by default, can be overridden per query
      refetchIntervalInBackground: false,
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on auth errors or client errors
        if (error instanceof Error) {
          const apiError = error as ApiError;
          if (apiError.isAuthError || (apiError.status && apiError.status < 500)) {
            return false;
          }
        }
        
        if (error instanceof Error && error.message.startsWith('401:')) {
          return false;
        }
        
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      
    },
    mutations: {
      retry: (failureCount, error) => {
        // Be more conservative with mutation retries
        if (error instanceof Error) {
          const apiError = error as ApiError;
          if (apiError.isAuthError || apiError.isNetworkError === false) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific entity type
  invalidateEntity: (entityType: string) => {
    queryClient.invalidateQueries({ queryKey: ['api', entityType] });
  },
  
  // Clear all cached data (useful for logout)
  clearAll: () => {
    queryClient.clear();
  },
  
  // Prefetch data
  prefetch: async <T>(queryKey: readonly unknown[], queryFn: () => Promise<T>) => {
    return queryClient.prefetchQuery({ queryKey, queryFn });
  },
  
  // Set query data optimistically
  setOptimisticData: <T>(queryKey: readonly unknown[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get cached data
  getQueryData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData(queryKey);
  },
  
  // Remove specific query from cache
  removeQueries: (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Cancel outgoing queries (useful for component unmount)
  cancelQueries: (queryKey: readonly unknown[]) => {
    return queryClient.cancelQueries({ queryKey });
  },
};

// Network status detection for smart caching
if (typeof window !== 'undefined') {
  // Resume paused queries when coming back online
  window.addEventListener('online', () => {
    queryClient.resumePausedMutations();
    queryClient.invalidateQueries();
  });
  
  // Pause queries when going offline (handled automatically by React Query)
  window.addEventListener('offline', () => {
    // Optionally show offline indicator
    console.log('Application is offline');
  });
}
