/**
 * Comprehensive API Client for Rival Outranker
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Automatic authentication token handling
 * - Request timeout handling
 * - Error categorization and handling
 * - Offline detection and queuing
 * - Request cancellation
 */

export interface ApiError extends Error {
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isAuthError?: boolean;
  isServerError?: boolean;
  originalError?: Error;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableOfflineQueue?: boolean;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retryAttempts?: number;
  skipAuthRefresh?: boolean;
  skipRetry?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private enableOfflineQueue: boolean;
  private offlineQueue: Array<() => Promise<any>> = [];
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse | Promise<ApiResponse>> = [];
  private errorInterceptors: Array<(error: ApiError) => ApiError | Promise<ApiError>> = [];

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || import.meta.env.VITE_API_BASE_URL || '';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.enableOfflineQueue = config.enableOfflineQueue || true;

    // Setup default interceptors
    this.setupDefaultInterceptors();

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.processOfflineQueue.bind(this));
    }
  }

  private setupDefaultInterceptors(): void {
    // Request interceptor for auth tokens
    this.addRequestInterceptor((config) => {
      const token = this.getAuthToken();
      if (token && !config.skipAuthRefresh) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    });

    // Response interceptor for auth refresh
    this.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        await this.handleAuthRefresh();
      }
      return response;
    });

    // Error interceptor for error categorization
    this.addErrorInterceptor((error) => {
      return this.categorizeError(error);
    });
  }

  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>): void {
    this.errorInterceptors.push(interceptor);
  }

  private async processInterceptors<T>(
    interceptors: Array<(item: T) => T | Promise<T>>,
    item: T
  ): Promise<T> {
    let result = item;
    for (const interceptor of interceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  private async handleAuthRefresh(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const response = await this.request('/api/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipAuthRefresh: true,
        });
        
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
      }
    } catch (error) {
      // Clear tokens and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  private categorizeError(error: ApiError): ApiError {
    if (!error.status) {
      error.isNetworkError = true;
    } else if (error.status === 401 || error.status === 403) {
      error.isAuthError = true;
    } else if (error.status >= 500) {
      error.isServerError = true;
    }
    
    return error;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldRetry(error: ApiError, attempt: number): boolean {
    if (attempt >= this.retryAttempts) return false;
    if (error.isAuthError) return false;
    if (error.status && error.status >= 400 && error.status < 500) return false;
    return true;
  }

  private async retryWithBackoff(
    request: () => Promise<ApiResponse>,
    attempt: number = 0
  ): Promise<ApiResponse> {
    try {
      return await request();
    } catch (error) {
      const apiError = error as ApiError;
      
      if (this.shouldRetry(apiError, attempt)) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        await this.delay(delay);
        return this.retryWithBackoff(request, attempt + 1);
      }
      
      throw await this.processInterceptors(this.errorInterceptors, apiError);
    }
  }

  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline() || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await request();
      } catch (error) {
        console.warn('Failed to process queued request:', error);
      }
    }
  }

  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Process request interceptors
    const processedConfig = await this.processInterceptors(this.requestInterceptors, {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      ...config,
    });

    // Handle offline scenarios
    if (!this.isOnline() && this.enableOfflineQueue) {
      return new Promise((resolve, reject) => {
        this.offlineQueue.push(async () => {
          try {
            const result = await this.request<T>(endpoint, config);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), processedConfig.timeout || this.timeout);

      try {
        const response = await fetch(url, {
          ...processedConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error: ApiError = new Error(`HTTP error! status: ${response.status}`);
          error.status = response.status;
          error.code = response.statusText;
          throw error;
        }

        const data = await response.json();
        const apiResponse: ApiResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };

        return await this.processInterceptors(this.responseInterceptors, apiResponse);
      } catch (error) {
        clearTimeout(timeoutId);
        
        const apiError: ApiError = error instanceof Error ? error : new Error(String(error));
        if (error instanceof Error && error.name === 'AbortError') {
          apiError.code = 'TIMEOUT';
          apiError.message = 'Request timeout';
        }
        apiError.originalError = error instanceof Error ? error : undefined;
        
        throw apiError;
      }
    };

    if (config.skipRetry) {
      return makeRequest();
    }

    return this.retryWithBackoff(makeRequest);
  }

  // Convenience methods
  async get<T = any>(endpoint: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const url = `${endpoint}${queryString}`;
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // File upload method
  async upload<T = any>(endpoint: string, file: File | FormData, config?: RequestConfig): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary for FormData
        ...config?.headers,
      },
    });
  }

  // Server-sent events method
  createEventSource(endpoint: string, config?: EventSourceInit): EventSource {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    
    // Add auth token to URL params for SSE
    const urlWithAuth = token ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : url;
    
    return new EventSource(urlWithAuth, config);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();