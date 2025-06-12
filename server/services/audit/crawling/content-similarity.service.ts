/**
 * Content Similarity Service
 * Handles duplicate content detection and similarity analysis for web crawling
 */

export interface SimilarityResult {
  isDuplicate: boolean;
  similarUrl?: string;
  similarity?: number;
}

export class ContentSimilarityService {
  private contentHashes = new Map<string, string>(); // hash -> url
  private similarityThreshold = 0.8; // 80% similarity threshold

  /**
   * Generate a simple hash from content for similarity detection
   */
  generateContentHash(content: string): string {
    // Simple hash function for content similarity
    let hash = 0;
    const cleanContent = content
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .trim();
    
    for (let i = 0; i < cleanContent.length; i++) {
      const char = cleanContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate content similarity between two strings using simple metrics
   */
  calculateContentSimilarity(content1: string, content2: string): number {
    // Normalize both contents
    const normalize = (text: string) => text
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();
    
    const norm1 = normalize(content1);
    const norm2 = normalize(content2);
    
    if (norm1.length === 0 || norm2.length === 0) return 0;
    
    // Simple word-based similarity
    const words1 = norm1.split(' ').filter(w => w.length > 3);
    const words2 = norm2.split(' ').filter(w => w.length > 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Check if content is similar to already crawled pages
   */
  checkContentSimilarity(content: string, url: string): SimilarityResult {
    const contentHash = this.generateContentHash(content);
    
    // Check for exact hash match first (fastest)
    if (this.contentHashes.has(contentHash)) {
      const existingUrl = this.contentHashes.get(contentHash)!;
      return { 
        isDuplicate: true, 
        similarUrl: existingUrl, 
        similarity: 1.0 
      };
    }
    
    // For performance, only check similarity against a sample of recent pages
    const recentHashes = Array.from(this.contentHashes.entries()).slice(-20);
    
    for (const [hash, existingUrl] of recentHashes) {
      // Skip if it's the same URL
      if (existingUrl === url) continue;
      
      // Check if the hashes are similar (simple string similarity)
      if (Math.abs(hash.length - contentHash.length) <= 2) {
        // For similar hash lengths, do a more detailed check
        // This is a simplified approach - in production you might want more sophisticated algorithms
        const hashSimilarity = this.calculateSimpleStringSimilarity(hash, contentHash);
        
        if (hashSimilarity > 0.9) { // Very similar hashes indicate very similar content
          return { 
            isDuplicate: true, 
            similarUrl: existingUrl, 
            similarity: hashSimilarity 
          };
        }
      }
    }
    
    // Store this content hash
    this.contentHashes.set(contentHash, url);
    
    return { isDuplicate: false };
  }

  /**
   * Simple string similarity calculation
   */
  calculateSimpleStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer[i] === shorter[i]) {
        matches++;
      }
    }
    
    return matches / longer.length;
  }

  /**
   * Set the similarity threshold for duplicate detection
   */
  setSimilarityThreshold(threshold: number): void {
    if (threshold >= 0 && threshold <= 1) {
      this.similarityThreshold = threshold;
    }
  }

  /**
   * Get the current similarity threshold
   */
  getSimilarityThreshold(): number {
    return this.similarityThreshold;
  }

  /**
   * Get all stored content hashes
   */
  getContentHashes(): Map<string, string> {
    return new Map(this.contentHashes);
  }

  /**
   * Clear all stored content hashes (useful for new crawl sessions)
   */
  clearContentHashes(): void {
    this.contentHashes.clear();
    console.log('[ContentSimilarity] 🧹 Content hash cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalHashes: number; memoryUsage: string } {
    const totalHashes = this.contentHashes.size;
    const memoryUsage = `${Math.round(totalHashes * 64 / 1024)} KB`; // Rough estimate
    
    return { totalHashes, memoryUsage };
  }

  /**
   * Remove old hashes to prevent memory bloat
   */
  cleanupOldHashes(maxHashes: number = 1000): void {
    if (this.contentHashes.size > maxHashes) {
      const hashesToRemove = this.contentHashes.size - maxHashes;
      const hashArray = Array.from(this.contentHashes.keys());
      
      // Remove oldest hashes (first in, first out)
      for (let i = 0; i < hashesToRemove; i++) {
        this.contentHashes.delete(hashArray[i]);
      }
      
      console.log(`[ContentSimilarity] 🧹 Cleaned up ${hashesToRemove} old content hashes`);
    }
  }

  /**
   * Check if a specific URL has been processed
   */
  hasProcessedUrl(url: string): boolean {
    return Array.from(this.contentHashes.values()).includes(url);
  }

  /**
   * Get similarity statistics for debugging
   */
  getDebugStats(): {
    totalPages: number;
    duplicatesFound: number;
    uniqueHashes: number;
    averageHashLength: number;
  } {
    const totalPages = this.contentHashes.size;
    const uniqueHashes = new Set(this.contentHashes.keys()).size;
    const duplicatesFound = totalPages - uniqueHashes;
    
    const hashLengths = Array.from(this.contentHashes.keys()).map(h => h.length);
    const averageHashLength = hashLengths.length > 0 
      ? Math.round(hashLengths.reduce((a, b) => a + b, 0) / hashLengths.length)
      : 0;
    
    return {
      totalPages,
      duplicatesFound,
      uniqueHashes,
      averageHashLength
    };
  }
}