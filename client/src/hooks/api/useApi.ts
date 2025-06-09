/**
 * Custom hooks for API state management
 * Eliminates repetitive loading, error, and data state patterns
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../ui/use-toast';

// Generic API state interface
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Request configuration interface
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

// Hook options
export interface UseApiOptions {
  immediate?: boolean; // Execute immediately on mount
  showToastOnError?: boolean; // Show toast notification on error
  showToastOnSuccess?: boolean; // Show toast notification on success
  successMessage?: string;
  errorMessage?: string;
  transformData?: (data: any) => any; // Transform response data
  onSuccess?: (data: any) => void; // Success callback
  onError?: (error: string) => void; // Error callback
}

/**
 * Generic API request hook for any HTTP method
 * Handles loading, error, and success states automatically
 */
export function useApiRequest<T = any>(
  url: string | null,
  config: ApiRequestConfig = {},
  options: UseApiOptions = {}
): ApiState<T> & {
  execute: () => Promise<T | null>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });
  
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    immediate = false,
    showToastOnError = false,
    showToastOnSuccess = false,
    successMessage,
    errorMessage,
    transformData,
    onSuccess,
    onError,
  } = options;

  const execute = useCallback(async (): Promise<T | null> => {
    if (!url) return null;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
    }));

    try {
      const requestConfig: RequestInit = {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        credentials: config.credentials || 'include',
        signal: config.signal || abortControllerRef.current.signal,
      };

      // Add body for non-GET requests
      if (config.body && config.method !== 'GET') {
        requestConfig.body = typeof config.body === 'string' 
          ? config.body 
          : JSON.stringify(config.body);
      }

      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      const transformedData = transformData ? transformData(responseData) : responseData;

      setState({
        data: transformedData,
        loading: false,
        error: null,
        success: true,
      });

      // Success callbacks and notifications
      if (onSuccess) onSuccess(transformedData);
      if (showToastOnSuccess && successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default',
        });
      }

      return transformedData;
    } catch (error: any) {
      // Handle aborted requests
      if (error.name === 'AbortError') {
        return null;
      }

      const errorMsg = error.message || errorMessage || 'An error occurred';
      
      setState({
        data: null,
        loading: false,
        error: errorMsg,
        success: false,
      });

      // Error callbacks and notifications
      if (onError) onError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }

      return null;
    }
  }, [url, config, toast, successMessage, errorMessage, transformData, onSuccess, onError, showToastOnError, showToastOnSuccess]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  // Execute immediately on mount if requested
  useEffect(() => {
    if (immediate && url) {
      execute();
    }

    // Cleanup: abort any pending request when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, execute, url]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Specialized hook for API mutations (POST, PUT, DELETE)
 * Provides optimistic updates and rollback capabilities
 */
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiOptions & {
    optimisticUpdate?: (variables: TVariables) => TData;
    rollbackOnError?: boolean;
  } = {}
): {
  mutate: (variables: TVariables) => Promise<TData | null>;
  data: TData | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const { toast } = useToast();
  const previousDataRef = useRef<TData | null>(null);

  const {
    showToastOnError = true,
    showToastOnSuccess = false,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    optimisticUpdate,
    rollbackOnError = true,
  } = options;

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    // Store previous data for potential rollback
    previousDataRef.current = state.data;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
      // Apply optimistic update if provided
      data: optimisticUpdate ? optimisticUpdate(variables) : prev.data,
    }));

    try {
      const result = await mutationFn(variables);

      setState({
        data: result,
        loading: false,
        error: null,
        success: true,
      });

      // Success callbacks and notifications
      if (onSuccess) onSuccess(result);
      if (showToastOnSuccess && successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default',
        });
      }

      return result;
    } catch (error: any) {
      const errorMsg = error.message || errorMessage || 'Mutation failed';

      setState({
        data: rollbackOnError ? previousDataRef.current : null,
        loading: false,
        error: errorMsg,
        success: false,
      });

      // Error callbacks and notifications
      if (onError) onError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }

      return null;
    }
  }, [mutationFn, state.data, toast, successMessage, errorMessage, onSuccess, onError, showToastOnError, showToastOnSuccess, optimisticUpdate, rollbackOnError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    mutate,
    ...state,
    reset,
  };
}

/**
 * Hook for GET requests with automatic fetching
 */
export function useApiGet<T = any>(
  url: string | null,
  options: UseApiOptions = {}
): ApiState<T> & {
  refetch: () => Promise<T | null>;
  reset: () => void;
} {
  const { execute, ...state } = useApiRequest<T>(
    url,
    { method: 'GET' },
    { immediate: true, ...options }
  );

  return {
    ...state,
    refetch: execute,
    reset: state.reset,
  };
}

/**
 * Hook for file upload operations with progress tracking
 */
export function useFileUpload<T = any>(
  uploadUrl: string,
  options: UseApiOptions = {}
): {
  upload: (file: File, additionalData?: Record<string, any>) => Promise<T | null>;
  progress: number;
  loading: boolean;
  error: string | null;
  success: boolean;
  data: T | null;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<T> & { progress: number }>({
    data: null,
    loading: false,
    error: null,
    success: false,
    progress: 0,
  });

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    showToastOnError = true,
    showToastOnSuccess = false,
    successMessage = 'File uploaded successfully',
    errorMessage,
    onSuccess,
    onError,
  } = options;

  const upload = useCallback(async (
    file: File,
    additionalData: Record<string, any> = {}
  ): Promise<T | null> => {
    // Cancel previous upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
      progress: 0,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional form data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressPercent = Math.round((event.loaded / event.total) * 100);
          setState(prev => ({ ...prev, progress: progressPercent }));
        }
      });

      // Handle completion
      const uploadPromise = new Promise<T>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send(formData);

      const result = await uploadPromise;

      setState({
        data: result,
        loading: false,
        error: null,
        success: true,
        progress: 100,
      });

      // Success callbacks and notifications
      if (onSuccess) onSuccess(result);
      if (showToastOnSuccess) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default',
        });
      }

      return result;
    } catch (error: any) {
      if (error.message === 'Upload cancelled') {
        return null;
      }

      const errorMsg = error.message || errorMessage || 'Upload failed';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
        success: false,
      }));

      // Error callbacks and notifications
      if (onError) onError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Upload Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }

      return null;
    }
  }, [uploadUrl, toast, successMessage, errorMessage, onSuccess, onError, showToastOnError, showToastOnSuccess]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
      progress: 0,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    upload,
    progress: state.progress,
    loading: state.loading,
    error: state.error,
    success: state.success,
    data: state.data,
    reset,
  };
}

/**
 * Hook for polling operations (useful for progress tracking)
 */
export function usePolling<T = any>(
  url: string | null,
  interval: number = 1000,
  options: UseApiOptions & {
    stopCondition?: (data: T) => boolean;
    maxAttempts?: number;
  } = {}
): ApiState<T> & {
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
} {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  const { stopCondition, maxAttempts = 100, ...apiOptions } = options;

  const { execute, ...state } = useApiRequest<T>(url, { method: 'GET' }, {
    ...apiOptions,
    onSuccess: (data) => {
      if (stopCondition && stopCondition(data)) {
        stopPolling();
      }
      if (options.onSuccess) options.onSuccess(data);
    },
  });

  const startPolling = useCallback(() => {
    if (isPolling || !url) return;

    setIsPolling(true);
    attemptsRef.current = 0;

    // Execute immediately
    execute();

    intervalRef.current = setInterval(() => {
      attemptsRef.current += 1;
      
      if (attemptsRef.current >= maxAttempts) {
        stopPolling();
        return;
      }

      execute();
    }, interval);
  }, [execute, interval, isPolling, url, maxAttempts]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    startPolling,
    stopPolling,
    isPolling,
  };
}

/**
 * Hook for paginated API requests
 */
export function usePaginatedApi<T = any>(
  baseUrl: string,
  pageSize: number = 10,
  options: UseApiOptions = {}
): {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  loadMore: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState({
    data: [] as T[],
    loading: false,
    error: null as string | null,
    currentPage: 0,
    totalPages: 0,
    hasMore: true,
  });

  const { toast } = useToast();

  const loadPage = useCallback(async (page: number, append: boolean = true) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const url = `${baseUrl}?page=${page}&limit=${pageSize}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const newData = result.data || result.items || result;
      const total = result.totalPages || Math.ceil((result.total || newData.length) / pageSize);

      setState(prev => ({
        ...prev,
        data: append ? [...prev.data, ...newData] : newData,
        loading: false,
        currentPage: page,
        totalPages: total,
        hasMore: page < total - 1,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load data',
      }));

      if (options.showToastOnError !== false) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load data',
          variant: 'destructive',
        });
      }
    }
  }, [baseUrl, pageSize, toast, options.showToastOnError]);

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    await loadPage(state.currentPage + 1, true);
  }, [loadPage, state.loading, state.hasMore, state.currentPage]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, data: [], currentPage: 0, hasMore: true }));
    await loadPage(0, false);
  }, [loadPage]);

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      currentPage: 0,
      totalPages: 0,
      hasMore: true,
    });
  }, []);

  // Load initial data
  useEffect(() => {
    if (options.immediate !== false) {
      loadPage(0, false);
    }
  }, [loadPage, options.immediate]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    loadMore,
    reset,
    refresh,
  };
}