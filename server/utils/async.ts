/**
 * Async utilities for handling asynchronous operations safely
 */

import { logger } from './logging';

/**
 * Result type for safe async operations
 */
export type AsyncResult<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

/**
 * Safely execute an async operation and return a result object
 */
export async function safeAsync<T, E = Error>(
  operation: () => Promise<T>,
  context?: string
): Promise<AsyncResult<T, E>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    if (context) {
      logger.error(`Safe async operation failed: ${context}`, { error: error as Error });
    }
    return { success: false, error: error as E };
  }
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError: Error = new Error('Operation failed');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(lastError, attempt + 1)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      logger.warn(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, {
        error: lastError,
        metadata: {
          attempt: attempt + 1,
          delay
        }
      });

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run async operations with a timeout
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([operation, timeout]);
}

/**
 * Execute multiple async operations concurrently with a limit
 */
export async function concurrentMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const promise = mapper(items[i], i).then(result => {
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Execute async operations in batches
 */
export async function batchAsync<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);

    // Add delay between batches if specified
    if (delayMs > 0 && i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return results;
}

/**
 * Debounce an async function
 */
export function debounceAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delayMs: number
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<R> | null = null;

  return (...args: T): Promise<R> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise<R>((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
            timeoutId = null;
          }
        }, delayMs);
      });
    }

    return pendingPromise;
  };
}

/**
 * Throttle an async function
 */
export function throttleAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  intervalMs: number
): (...args: T) => Promise<R | null> {
  let lastExecution = 0;
  let pendingPromise: Promise<R> | null = null;

  return async (...args: T): Promise<R | null> => {
    const now = Date.now();

    if (now - lastExecution >= intervalMs) {
      lastExecution = now;
      
      if (!pendingPromise) {
        pendingPromise = fn(...args).finally(() => {
          pendingPromise = null;
        });
      }
      
      return pendingPromise;
    }

    return null;
  };
}

/**
 * Circuit breaker pattern for async operations
 */
export class CircuitBreaker<T extends any[], R> {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private fn: (...args: T) => Promise<R>,
    private options: {
      failureThreshold?: number;
      resetTimeoutMs?: number;
      monitoringPeriodMs?: number;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      monitoringPeriodMs: 60000,
      ...options
    };
  }

  async execute(...args: T): Promise<R> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs!) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await this.fn(...args);
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold!) {
      this.state = 'open';
      logger.warn('Circuit breaker opened due to failure threshold', {
        metadata: {
          failures: this.failures,
          threshold: this.options.failureThreshold
        }
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    logger.info('Circuit breaker reset to closed state');
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}

/**
 * Execute promises with all settled semantics but throw if all fail
 */
export async function allSettledWithFailure<T>(
  promises: Promise<T>[],
  minimumSuccessCount: number = 1
): Promise<T[]> {
  const results = await Promise.allSettled(promises);
  
  const successful = results
    .filter((result): result is PromiseFulfilledResult<Awaited<T>> => result.status === 'fulfilled')
    .map(result => result.value);

  if (successful.length < minimumSuccessCount) {
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);
    
    throw new AggregateError(errors, `Only ${successful.length} out of ${promises.length} promises succeeded`);
  }

  return successful;
}

/**
 * Rate limiter for async operations
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(
    private maxConcurrent: number,
    private intervalMs: number
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          setTimeout(() => this.processQueue(), this.intervalMs);
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        operation();
      }
    }
  }
}

/**
 * Memoize async functions with TTL
 */
export function memoizeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    ttlMs?: number;
    maxSize?: number;
    keyGenerator?: (...args: T) => string;
  } = {}
): (...args: T) => Promise<R> {
  const cache = new Map<string, { value: Promise<R>; expiry: number }>();
  const { ttlMs = 300000, maxSize = 100, keyGenerator = (...args) => JSON.stringify(args) } = options;

  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    const now = Date.now();

    // Check if we have a valid cached result
    const cached = cache.get(key);
    if (cached && cached.expiry > now) {
      return cached.value;
    }

    // Remove expired entries and enforce max size
    for (const [k, v] of cache.entries()) {
      if (v.expiry <= now) {
        cache.delete(k);
      }
    }

    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    // Execute and cache the result
    const promise = fn(...args);
    cache.set(key, {
      value: promise,
      expiry: now + ttlMs
    });

    return promise;
  };
}