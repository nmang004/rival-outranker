/**
 * Comprehensive Error Boundary Components
 * 
 * Features:
 * - Global error boundary for unhandled errors
 * - API-specific error boundary with retry logic
 * - Network error detection and handling
 * - User-friendly error messages
 * - Error reporting and logging
 */

import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Home, ChevronLeft } from 'lucide-react';
import { type ApiError } from '../../lib/apiClient';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnLocationChange?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId: string;
}

// Base Error Boundary Component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    this.logError(error, errorInfo);
    
    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when location changes (if enabled)
    if (
      this.props.resetOnLocationChange &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }

  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId,
    };

    // Send to logging service (implement based on your logging solution)
    console.error('Error Boundary caught an error:', errorReport);
    
    // You can integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: errorReport });
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
export function DefaultErrorFallback({ error, resetError, errorId }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription>
            {isNetworkError 
              ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
              : "An unexpected error occurred. Our team has been notified and is working on a fix."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="text-sm text-gray-600 font-mono">
              {error.message}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
          
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Technical Details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              Error ID: {errorId}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}

// API-specific Error Boundary
interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void | Promise<void>;
  fallback?: React.ComponentType<ApiErrorFallbackProps>;
}

interface ApiErrorFallbackProps {
  error: ApiError;
  retry: () => void;
  isRetrying: boolean;
}

export function ApiErrorBoundary({ children, onRetry, fallback }: ApiErrorBoundaryProps) {
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    const handleApiError = (event: CustomEvent<ApiError>) => {
      setError(event.detail);
    };

    window.addEventListener('api-error', handleApiError as EventListener);
    return () => window.removeEventListener('api-error', handleApiError as EventListener);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry?.();
      setError(null);
    } catch (err) {
      // Retry failed - error will be handled by error boundary
    } finally {
      setIsRetrying(false);
    }
  };

  if (error) {
    const FallbackComponent = fallback || ApiErrorFallback;
    return <FallbackComponent error={error} retry={handleRetry} isRetrying={isRetrying} />;
  }

  return <>{children}</>;
}

// API Error Fallback Component
export function ApiErrorFallback({ error, retry, isRetrying }: ApiErrorFallbackProps) {
  const getErrorMessage = () => {
    if (error.isNetworkError) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    
    if (error.isAuthError) {
      return "Your session has expired. Please log in again.";
    }
    
    if (error.isServerError) {
      return "Our servers are experiencing issues. Please try again in a few moments.";
    }
    
    if (error.status === 404) {
      return "The requested resource was not found.";
    }
    
    if (error.status === 429) {
      return "Too many requests. Please wait a moment before trying again.";
    }
    
    return error.message || "An unexpected error occurred.";
  };

  const getErrorIcon = () => {
    if (error.isNetworkError) {
      return <WifiOff className="w-8 h-8 text-red-500" />;
    }
    
    return <AlertTriangle className="w-8 h-8 text-red-500" />;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        {getErrorIcon()}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {error.isNetworkError ? 'Connection Problem' : 'Something went wrong'}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {getErrorMessage()}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={retry}
          disabled={isRetrying}
          className="min-w-32"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
        
        {error.isAuthError && (
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        )}
      </div>
      
      {error.status && (
        <p className="text-xs text-gray-400 mt-4">
          Error {error.status}: {error.code}
        </p>
      )}
    </div>
  );
}

// Network Status Component
export function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Optionally trigger data refetch when coming back online
        window.dispatchEvent(new CustomEvent('network:online'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
        <div className="flex items-center justify-center">
          <WifiOff className="w-4 h-4 mr-2" />
          You're offline. Some features may not be available.
        </div>
      </div>
    );
  }

  return null;
}

// Inline Error Display Component
interface InlineErrorProps {
  error: Error | ApiError | null;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ error, onRetry, className }: InlineErrorProps) {
  if (!error) return null;

  const isApiError = 'status' in error;
  const message = isApiError 
    ? (error as ApiError).message || 'An error occurred'
    : error.message;

  return (
    <Alert className={className} variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Route Error Boundary for React Router
export function RouteErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="mr-2"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}