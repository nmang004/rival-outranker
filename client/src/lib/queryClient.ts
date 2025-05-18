import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: {
    method?: string;
    data?: unknown;
  }
): Promise<T> {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // For requests like POST that might return no content
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }
  
  // Parse JSON response body
  try {
    return await res.json() as T;
  } catch (error) {
    // If JSON parsing fails, return the response object
    return res as unknown as T;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Safely handle potentially undefined or non-string queryKey
      if (!queryKey || !queryKey[0] || typeof queryKey[0] !== 'string') {
        console.error('Invalid queryKey:', queryKey);
        return null;
      }
      
      let res;
      try {
        res = await fetch(queryKey[0], {
          credentials: "include",
        });
      } catch (error) {
        console.error("Fetch error:", error);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw error;
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      try {
        await throwIfResNotOk(res);
        
        // Check if the response is empty or not JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return null;
        }
        
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Response processing error:", error);
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
