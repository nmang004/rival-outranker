import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios from "axios";

// Create a custom axios instance with default settings
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Handle common axios errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    }
    return Promise.reject(error);
  }
);

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
      // Safely handle potentially undefined or non-string queryKey
      if (!queryKey || !queryKey[0] || typeof queryKey[0] !== 'string') {
        console.error('Invalid queryKey:', queryKey);
        return null;
      }
      
      const endpoint = queryKey[0];
      console.log("Fetching data from:", endpoint);
      
      try {
        const response = await axiosInstance.get<T>(endpoint);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Handle specific error types
          if (error.response) {
            // The request was made and the server responded with an error status
            if (error.response.status === 401) {
              console.log("401 Unauthorized response received");
              if (unauthorizedBehavior === "returnNull") {
                return null;
              }
              throw new Error("Unauthorized");
            }
            
            console.error(`HTTP error: ${error.response.status}`);
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error(`HTTP error: ${error.response.status}`);
          } else if (error.request) {
            // The request was made but no response was received
            console.error("Network error: No response received");
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            throw new Error("Network error: No response received");
          }
        }
        
        // General error handling
        console.error("Request error:", error);
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Changed from "throw" to "returnNull" to handle auth better
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: (failureCount, error) => {
        // Don't retry on 401 errors
        if (error instanceof Error && error.message.startsWith('401:')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
