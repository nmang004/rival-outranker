/**
 * Utility functions for formatting data display
 */

export const formatters = {
  /**
   * Format numbers with thousands separators
   */
  formatNumber: (num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString();
  },

  /**
   * Format decimal as percentage
   */
  formatPercentage: (decimal: number): string => {
    if (typeof decimal !== 'number' || isNaN(decimal)) return '0%';
    return `${Math.round(decimal * 100)}%`;
  },

  /**
   * Format score out of 100
   */
  formatScore: (score: number): string => {
    if (typeof score !== 'number' || isNaN(score)) return '0/100';
    return `${Math.round(score)}/100`;
  },

  /**
   * Format date in human-readable format
   */
  formatDate: (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format relative time (e.g., "5 minutes ago")
   */
  formatRelativeTime: (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  },

  /**
   * Format file size in human-readable format
   */
  formatFileSize: (bytes: number): string => {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
};

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    const urlObject = new URL(url);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Calculate readability score using Flesch Reading Ease formula
 */
export function calculateReadabilityScore(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in a word (simplified)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowels = word.match(/[aeiouy]/g);
  let syllableCount = vowels ? vowels.length : 0;
  
  // Subtract silent 'e'
  if (word.endsWith('e')) syllableCount--;
  
  // Handle double vowels
  syllableCount -= (word.match(/[aeiouy]{2,}/g) || []).length * 0.5;
  
  return Math.max(1, Math.round(syllableCount));
}

/**
 * Format date in human-readable format (individual export)
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return 'Invalid Date';
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format URL for display (clean and readable)
 */
export function formatUrl(url: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    
    // Remove www. prefix for cleaner display
    let hostname = urlObj.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // For homepage, just return the domain
    if (urlObj.pathname === '/' && !urlObj.search) {
      return hostname;
    }
    
    // For other pages, include path but clean it up
    let path = urlObj.pathname;
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    
    return hostname + path + (urlObj.search || '');
  } catch {
    // If URL parsing fails, return the original string cleaned up
    return url.replace(/^https?:\/\/(www\.)?/, '');
  }
}