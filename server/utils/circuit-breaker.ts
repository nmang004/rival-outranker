/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring failure rates and implementing proper state transitions
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Failure threshold exceeded, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerOptions {
  /** Maximum number of failures before opening circuit */
  failureThreshold?: number;
  /** Time to wait before attempting recovery (milliseconds) */
  resetTimeout?: number;
  /** Number of requests to allow in half-open state for testing */
  halfOpenMaxCalls?: number;
  /** Timeout for individual operations (milliseconds) */
  timeout?: number;
  /** Function to determine if an error should count as a failure */
  isFailure?: (error: any) => boolean;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime: number;
  lastStateChange: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime = 0;
  private lastStateChange = Date.now();
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private halfOpenCalls = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxCalls: number;
  private readonly timeout: number;
  private readonly isFailure: (error: any) => boolean;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.isFailure = options.isFailure || (() => true); // All errors count as failures by default
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check current state and handle accordingly
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new CircuitBreakerError(`Circuit breaker is OPEN. Next retry in ${this.getTimeToReset()}ms`);
      }
    }

    if (this.state === CircuitBreakerState.HALF_OPEN && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new CircuitBreakerError('Circuit breaker is HALF_OPEN but max calls exceeded');
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenCalls++;
    }

    this.totalCalls++;

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute operation with timeout protection
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Circuit breaker timeout')), this.timeout)
      )
    ]);
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.halfOpenMaxCalls) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: any): void {
    if (!this.isFailure(error)) {
      return; // Error doesn't count as circuit breaker failure
    }

    this.failureCount++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state transitions back to open
      this.transitionToOpen();
    } else if (this.state === CircuitBreakerState.CLOSED && this.consecutiveFailures >= this.failureThreshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Transition to CLOSED state (normal operation)
   */
  private transitionToClosed(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.lastStateChange = Date.now();
    this.halfOpenCalls = 0;
    this.consecutiveFailures = 0;
    console.log('[CircuitBreaker] State changed to CLOSED - normal operation resumed');
  }

  /**
   * Transition to OPEN state (fail fast)
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.lastStateChange = Date.now();
    this.halfOpenCalls = 0;
    console.log('[CircuitBreaker] State changed to OPEN - failing fast for protection');
  }

  /**
   * Transition to HALF_OPEN state (testing recovery)
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.lastStateChange = Date.now();
    this.halfOpenCalls = 0;
    console.log('[CircuitBreaker] State changed to HALF_OPEN - testing service recovery');
  }

  /**
   * Check if we should attempt to reset from OPEN to HALF_OPEN
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastStateChange >= this.resetTimeout;
  }

  /**
   * Get time remaining until reset attempt (in milliseconds)
   */
  private getTimeToReset(): number {
    const elapsed = Date.now() - this.lastStateChange;
    return Math.max(0, this.resetTimeout - elapsed);
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Check if circuit breaker is allowing requests
   */
  isRequestAllowed(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) {
      return true;
    }
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      return this.halfOpenCalls < this.halfOpenMaxCalls;
    }
    
    if (this.state === CircuitBreakerState.OPEN) {
      return this.shouldAttemptReset();
    }
    
    return false;
  }

  /**
   * Force reset circuit breaker to CLOSED state (for testing/manual intervention)
   */
  reset(): void {
    this.transitionToClosed();
    this.failureCount = 0;
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    console.log('[CircuitBreaker] Manual reset performed');
  }

  /**
   * Get health status with additional metrics
   */
  getHealthStatus(): {
    isHealthy: boolean;
    state: CircuitBreakerState;
    failureRate: number;
    timeToReset?: number;
    stats: CircuitBreakerStats;
  } {
    const stats = this.getStats();
    const failureRate = stats.totalCalls > 0 ? (stats.failureCount / stats.totalCalls) * 100 : 0;
    
    return {
      isHealthy: this.state === CircuitBreakerState.CLOSED,
      state: this.state,
      failureRate: Math.round(failureRate * 100) / 100,
      timeToReset: this.state === CircuitBreakerState.OPEN ? this.getTimeToReset() : undefined,
      stats
    };
  }
}

/**
 * Custom error for circuit breaker failures
 */
export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Factory for creating circuit breakers with common configurations
 */
export class CircuitBreakerFactory {
  /**
   * Create a circuit breaker for HTTP/network operations
   */
  static createNetworkCircuitBreaker(): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      halfOpenMaxCalls: 3,
      timeout: 30000, // 30 seconds
      isFailure: (error: any) => {
        // Network/timeout errors count as failures
        if (error?.code === 'ECONNREFUSED' || 
            error?.code === 'ETIMEDOUT' || 
            error?.message?.includes('timeout')) {
          return true;
        }
        // HTTP 5xx errors count as failures
        if (error?.response?.status >= 500) {
          return true;
        }
        // Other errors might be client-side issues, don't count as service failures
        return false;
      }
    });
  }

  /**
   * Create a circuit breaker for browser/Puppeteer operations
   */
  static createBrowserCircuitBreaker(): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 3, // Lower threshold for browser issues
      resetTimeout: 300000, // 5 minutes (browser issues take longer to resolve)
      halfOpenMaxCalls: 2,
      timeout: 45000, // 45 seconds for browser operations
      isFailure: (error: any) => {
        // Browser-specific errors that indicate service issues
        const browserErrorPatterns = [
          'net::ERR_',
          'Protocol error',
          'Session closed',
          'Target closed',
          'Browser closed',
          'timeout'
        ];
        
        const errorMessage = error?.message?.toLowerCase() || '';
        return browserErrorPatterns.some(pattern => 
          errorMessage.includes(pattern.toLowerCase())
        );
      }
    });
  }

  /**
   * Create a general purpose circuit breaker
   */
  static createGeneral(options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenMaxCalls: 3,
      timeout: 30000,
      ...options
    });
  }
}