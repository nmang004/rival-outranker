/**
 * LRU Cache with TTL (Time To Live) support
 * Prevents memory leaks by limiting cache size and expiring old entries
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export interface LRUCacheOptions {
  maxSize?: number;
  ttlMs?: number;
  cleanupIntervalMs?: number;
}

export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly cleanupIntervalMs: number;
  private cleanupTimer?: NodeJS.Timeout;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0
  };

  constructor(options: LRUCacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttlMs = options.ttlMs || 30 * 60 * 1000; // 30 minutes default
    this.cleanupIntervalMs = options.cleanupIntervalMs || 5 * 60 * 1000; // 5 minutes cleanup
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return undefined;
    }

    // Update access count and move to end (most recently used)
    entry.accessCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;
    
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V): void {
    const now = Date.now();
    
    // If key already exists, update it
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = now;
      entry.accessCount++;
      
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return;
    }

    // Check if we need to evict entries to make room
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 1
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.expirations++;
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryEstimate: this.estimateMemoryUsage()
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.cache.delete(key);
        expiredCount++;
        this.stats.expirations++;
      }
    }
    
    return expiredCount;
  }

  /**
   * Destroy cache and stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: CacheEntry<V>, now: number = Date.now()): boolean {
    return now - entry.timestamp > this.ttlMs;
  }

  /**
   * Evict oldest entry (LRU)
   */
  private evictOldest(): void {
    // Find the least recently used entry (first in Map iteration order)
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
    
    // Don't keep the process alive for cleanup timer
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): string {
    // Rough estimation: assume average 100 bytes per entry
    const estimatedBytes = this.cache.size * 100;
    
    if (estimatedBytes < 1024) {
      return `${estimatedBytes} B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${Math.round(estimatedBytes / 1024)} KB`;
    } else {
      return `${Math.round(estimatedBytes / (1024 * 1024))} MB`;
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }
}

/**
 * Factory function for creating LRU caches with common configurations
 */
export class LRUCacheFactory {
  /**
   * Create DNS cache (small, long TTL)
   */
  static createDNSCache<K, V>(): LRUCache<K, V> {
    return new LRUCache<K, V>({
      maxSize: 500,
      ttlMs: 60 * 60 * 1000, // 1 hour
      cleanupIntervalMs: 10 * 60 * 1000 // 10 minutes
    });
  }

  /**
   * Create response cache (larger, medium TTL)
   */
  static createResponseCache<K, V>(): LRUCache<K, V> {
    return new LRUCache<K, V>({
      maxSize: 1000,
      ttlMs: 15 * 60 * 1000, // 15 minutes
      cleanupIntervalMs: 5 * 60 * 1000 // 5 minutes
    });
  }

  /**
   * Create general purpose cache
   */
  static createGeneralCache<K, V>(options?: Partial<LRUCacheOptions>): LRUCache<K, V> {
    return new LRUCache<K, V>({
      maxSize: 1000,
      ttlMs: 30 * 60 * 1000, // 30 minutes
      cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
      ...options
    });
  }
}