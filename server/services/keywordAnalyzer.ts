import { CrawlerOutput } from '@/lib/types';

class KeywordAnalyzer {
  // Common English stop words to filter out when extracting keywords
  private stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
  ]);

  /**
   * Extract primary keyword from page data
   */
  async extractPrimaryKeyword(pageData: CrawlerOutput): Promise<string> {
    try {
      // If the page can't be crawled or has errors, return a default value
      if (pageData.error || !pageData.title) {
        return "no keyword detected";
      }
      
      // Get possible keywords from various sources
      const titleKeywords = this.extractKeywordsFromText(pageData.title || '');
      const h1Keywords = this.extractKeywordsFromTexts(pageData.headings.h1);
      const metaKeywords = this.extractKeywordsFromText(pageData.meta.description || '');
      const urlKeywords = this.extractKeywordsFromUrl(pageData.url);
      
      // Combine all keywords
      const allKeywords = [...titleKeywords, ...h1Keywords, ...metaKeywords, ...urlKeywords];
      
      // Count occurrences of each keyword
      const keywordCounts = this.countKeywordOccurrences(allKeywords);
      
      // Get content text for additional analysis
      const contentText = pageData.content.text;
      
      // Weight each keyword based on where it appears
      const weightedKeywords = this.weightKeywords(keywordCounts, pageData, contentText);
      
      // Sort by weight and get the top keyword
      const sortedKeywords = Array.from(weightedKeywords.entries())
        .sort((a, b) => b[1] - a[1]);
      
      // Return the top keyword or a default
      return sortedKeywords.length > 0 ? sortedKeywords[0][0] : "no keyword detected";
    } catch (error) {
      console.error('Error extracting primary keyword:', error);
      return "no keyword detected";
    }
  }

  /**
   * Analyze keyword optimization
   */
  async analyze(pageData: CrawlerOutput, primaryKeyword: string): Promise<any> {
    try {
      // If no primary keyword could be detected
      if (primaryKeyword === "no keyword detected") {
        return this.getDefaultKeywordAnalysis();
      }
      
      // Extract related keywords
      const relatedKeywords = await this.extractRelatedKeywords(pageData, primaryKeyword);
      
      // Check keyword presence in different elements
      const titlePresent = this.isKeywordPresent(pageData.title || '', primaryKeyword);
      const descriptionPresent = this.isKeywordPresent(pageData.meta.description || '', primaryKeyword);
      const h1Present = pageData.headings.h1.some(h => this.isKeywordPresent(h, primaryKeyword));
      
      // Check if keyword is present in any H2-H6 headings
      const headingsPresent = 
        pageData.headings.h2.some(h => this.isKeywordPresent(h, primaryKeyword)) ||
        pageData.headings.h3.some(h => this.isKeywordPresent(h, primaryKeyword)) ||
        pageData.headings.h4.some(h => this.isKeywordPresent(h, primaryKeyword)) ||
        pageData.headings.h5.some(h => this.isKeywordPresent(h, primaryKeyword)) ||
        pageData.headings.h6.some(h => this.isKeywordPresent(h, primaryKeyword));
      
      // Check if keyword is present in first 100 words
      const first100Words = this.getFirst100Words(pageData.content.text);
      const contentPresent = this.isKeywordPresent(first100Words, primaryKeyword);
      
      // Check if keyword is present in URL
      const urlPresent = this.isKeywordPresent(pageData.url, primaryKeyword);
      
      // Check if keyword is present in image alt text
      const altTextPresent = pageData.images.some(img => 
        img.alt && this.isKeywordPresent(img.alt, primaryKeyword)
      );
      
      // Calculate keyword density
      const density = this.calculateKeywordDensity(pageData.content.text, primaryKeyword);
      
      // Calculate overall score
      const score = this.calculateKeywordScore({
        titlePresent,
        descriptionPresent,
        h1Present,
        headingsPresent,
        contentPresent,
        urlPresent,
        altTextPresent,
        density,
        relatedKeywords
      });
      
      // Get score category
      const category = this.getScoreCategory(score);
      
      return {
        primaryKeyword,
        relatedKeywords,
        titlePresent,
        descriptionPresent,
        h1Present,
        headingsPresent,
        contentPresent,
        urlPresent,
        altTextPresent,
        density,
        overallScore: { score, category }
      };
    } catch (error) {
      console.error('Error analyzing keywords:', error);
      return this.getDefaultKeywordAnalysis();
    }
  }

  /**
   * Extract keywords from text
   */
  private extractKeywordsFromText(text: string): string[] {
    if (!text) return [];
    
    // Normalize text and split into words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace non-alphanumeric chars with spaces
      .split(/\s+/)             // Split by whitespace
      .filter(word => word.length > 2 && !this.stopWords.has(word)); // Filter out short words and stop words
    
    // Extract potential 2-gram and 3-gram phrases
    const bigrams = this.extractNgrams(words, 2);
    const trigrams = this.extractNgrams(words, 3);
    
    // Combine single words, bigrams, and trigrams
    return [...words, ...bigrams, ...trigrams];
  }

  /**
   * Extract keywords from an array of texts
   */
  private extractKeywordsFromTexts(texts: string[]): string[] {
    if (!texts || texts.length === 0) return [];
    
    const allKeywords: string[] = [];
    
    for (const text of texts) {
      const keywords = this.extractKeywordsFromText(text);
      allKeywords.push(...keywords);
    }
    
    return allKeywords;
  }

  /**
   * Extract keywords from URL
   */
  private extractKeywordsFromUrl(url: string): string[] {
    try {
      const parsedUrl = new URL(url);
      
      // Get path segments
      const pathSegments = parsedUrl.pathname
        .split('/')
        .filter(segment => segment.length > 0);
      
      // Process each segment to extract keywords
      const keywords: string[] = [];
      
      for (const segment of pathSegments) {
        // Replace hyphens, underscores with spaces
        const processedSegment = segment.replace(/[-_]/g, ' ');
        
        // Extract keywords from the processed segment
        const segmentKeywords = this.extractKeywordsFromText(processedSegment);
        
        // Add the segment as a whole
        if (segment.length > 3 && !this.stopWords.has(segment)) {
          keywords.push(segment.toLowerCase());
        }
        
        // Add individual keywords
        keywords.push(...segmentKeywords);
      }
      
      return keywords;
    } catch (error) {
      console.error('Error extracting keywords from URL:', error);
      return [];
    }
  }

  /**
   * Extract n-grams (phrases of n words) from an array of words
   */
  private extractNgrams(words: string[], n: number): string[] {
    if (words.length < n) return [];
    
    const ngrams: string[] = [];
    
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ');
      ngrams.push(ngram);
    }
    
    return ngrams;
  }

  /**
   * Count occurrences of each keyword
   */
  private countKeywordOccurrences(keywords: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const keyword of keywords) {
      const currentCount = counts.get(keyword) || 0;
      counts.set(keyword, currentCount + 1);
    }
    
    return counts;
  }

  /**
   * Weight keywords based on their importance
   */
  private weightKeywords(
    keywordCounts: Map<string, number>, 
    pageData: CrawlerOutput, 
    contentText: string
  ): Map<string, number> {
    const weightedKeywords = new Map<string, number>();
    
    for (const [keyword, count] of keywordCounts.entries()) {
      let weight = count;
      
      // Higher weight if in title
      if (pageData.title && this.isKeywordPresent(pageData.title, keyword)) {
        weight += 3;
      }
      
      // Higher weight if in H1
      if (pageData.headings.h1.some(h => this.isKeywordPresent(h, keyword))) {
        weight += 3;
      }
      
      // Higher weight if in URL
      if (this.isKeywordPresent(pageData.url, keyword)) {
        weight += 2;
      }
      
      // Higher weight if in meta description
      if (pageData.meta.description && this.isKeywordPresent(pageData.meta.description, keyword)) {
        weight += 2;
      }
      
      // Higher weight based on frequency in content
      const contentFrequency = this.countSingleKeywordOccurrences(contentText, keyword);
      weight += contentFrequency;
      
      // Store the weighted value
      weightedKeywords.set(keyword, weight);
    }
    
    return weightedKeywords;
  }

  /**
   * Count occurrences of a single keyword in text
   */
  private countSingleKeywordOccurrences(text: string, keyword: string): number {
    if (!text || !keyword) return 0;
    
    try {
      const escapedKeyword = this.escapeRegExp(keyword);
      if (!escapedKeyword) return 0;
      
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      const matches = text.match(regex);
      return matches ? matches.length : 0;
    } catch (error) {
      console.error('Error counting keyword occurrences:', error);
      return 0;
    }
  }

  /**
   * Escape special characters for use in RegExp
   */
  private escapeRegExp(string: string): string {
    if (!string || typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if a keyword is present in text
   */
  private isKeywordPresent(text: string, keyword: string): boolean {
    if (!text || !keyword) return false;
    
    const normalizedText = text.toLowerCase();
    const normalizedKeyword = keyword.toLowerCase();
    
    // Check exact match
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }
    
    // Check words that make up the keyword (for phrases)
    if (keyword.includes(' ')) {
      const keywordParts = normalizedKeyword.split(' ').filter(w => w.length > 3);
      return keywordParts.some(part => normalizedText.includes(part));
    }
    
    return false;
  }

  /**
   * Get the first 100 words from text
   */
  private getFirst100Words(text: string): string {
    if (!text) return '';
    
    const words = text.split(/\s+/).slice(0, 100);
    return words.join(' ');
  }

  /**
   * Extract related keywords based on primary keyword and page content
   */
  private async extractRelatedKeywords(pageData: CrawlerOutput, primaryKeyword: string): Promise<string[]> {
    // Extract all possible keywords from content
    const contentKeywords = this.extractKeywordsFromText(pageData.content.text);
    
    // Count occurrences of each keyword
    const keywordCounts = this.countKeywordOccurrences(contentKeywords);
    
    // Remove the primary keyword from the counts
    keywordCounts.delete(primaryKeyword);
    
    // Filter out very rare keywords
    const filteredCounts = new Map<string, number>();
    for (const [keyword, count] of keywordCounts.entries()) {
      if (count >= 2) {
        filteredCounts.set(keyword, count);
      }
    }
    
    // Sort by frequency
    const sortedKeywords = Array.from(filteredCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    // Return top 5 keywords
    return sortedKeywords.slice(0, 5);
  }

  /**
   * Calculate keyword density in content
   */
  private calculateKeywordDensity(content: string, keyword: string): number {
    if (!content || !keyword) return 0;
    
    const words = content.split(/\s+/).length;
    if (words === 0) return 0;
    
    const keywordOccurrences = this.countSingleKeywordOccurrences(content, keyword);
    
    // Keyword density as a percentage
    return (keywordOccurrences / words) * 100;
  }

  /**
   * Calculate keyword optimization score
   */
  private calculateKeywordScore(factors: any): number {
    let score = 50; // Base score
    
    // Core elements
    if (factors.titlePresent) score += 10;
    if (factors.h1Present) score += 10;
    if (factors.descriptionPresent) score += 5;
    if (factors.urlPresent) score += 5;
    
    // Additional elements
    if (factors.headingsPresent) score += 5;
    if (factors.contentPresent) score += 5;
    if (factors.altTextPresent) score += 5;
    
    // Keyword density
    if (factors.density > 0 && factors.density <= 3) {
      // Good density range
      score += 5;
      if (factors.density >= 0.5 && factors.density <= 2) {
        // Optimal density range
        score += 5;
      }
    } else if (factors.density > 3) {
      // Keyword stuffing penalty
      score -= 5;
    }
    
    // Related keywords
    if (factors.relatedKeywords.length >= 3) score += 5;
    
    // Cap score at 100
    return Math.min(Math.max(0, score), 100);
  }

  /**
   * Get score category based on numeric score
   */
  private getScoreCategory(score: number): 'excellent' | 'good' | 'needs-work' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs-work';
    return 'poor';
  }

  /**
   * Get default keyword analysis result when unable to detect keywords
   */
  private getDefaultKeywordAnalysis(): any {
    return {
      primaryKeyword: "no keyword detected",
      relatedKeywords: [],
      titlePresent: false,
      descriptionPresent: false,
      h1Present: false,
      headingsPresent: false,
      contentPresent: false,
      urlPresent: false,
      altTextPresent: false,
      density: 0,
      overallScore: { score: 40, category: 'poor' as const }
    };
  }
}

export const keywordAnalyzer = new KeywordAnalyzer();
