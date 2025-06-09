import { storage } from '../../storage';
import { InsertKeywordRanking, InsertCompetitorRanking, InsertKeywordMetrics } from '../../../shared/schema';
import axios from 'axios';

/**
 * Service for handling keyword tracking functionality
 */
export class KeywordService {
  private GOOGLE_SEARCH_API_KEY: string;
  private GOOGLE_SEARCH_ENGINE_ID: string;

  constructor() {
    this.GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    
    if (!this.GOOGLE_SEARCH_API_KEY || !this.GOOGLE_SEARCH_ENGINE_ID) {
      console.warn('Google Search API Key or Search Engine ID not set. Keyword ranking tracking will not work.');
    }
  }

  /**
   * Check ranking for a keyword
   * @param keywordId The ID of the keyword to check
   */
  async checkRanking(keywordId: number): Promise<boolean> {
    try {
      // Get keyword info
      const keyword = await storage.getKeyword(keywordId);
      if (!keyword) {
        throw new Error(`Keyword with ID ${keywordId} not found`);
      }
      
      // Get the previous ranking to update previousRank
      const previousRanking = await storage.getLatestKeywordRanking(keywordId);
      const previousRank = previousRanking?.rank;
      
      // Get Google search results
      const searchResults = await this.googleSearch(keyword.keyword);
      if (!searchResults || !searchResults.items) {
        console.error('No search results found for keyword:', keyword.keyword);
        return false;
      }
      
      // Find the target URL in the results
      let rank = null;
      let rankingUrl = null;
      
      // Make targetUrl consistent by ensuring it has no trailing slash and uses a consistent protocol
      let targetUrl = keyword.targetUrl.toLowerCase();
      if (targetUrl.endsWith('/')) {
        targetUrl = targetUrl.slice(0, -1);
      }
      
      // Remove protocol to make matching more lenient
      const targetDomain = targetUrl.replace(/^https?:\/\//, '');
      
      // Check each result for the target URL
      for (let i = 0; i < searchResults.items.length; i++) {
        const item = searchResults.items[i];
        let itemUrl = item.link.toLowerCase();
        if (itemUrl.endsWith('/')) {
          itemUrl = itemUrl.slice(0, -1);
        }
        
        // Remove protocol for more lenient matching
        const itemDomain = itemUrl.replace(/^https?:\/\//, '');
        
        // Check if this is the target domain
        if (itemDomain.includes(targetDomain) || targetDomain.includes(itemDomain)) {
          rank = i + 1; // 1-based ranking
          rankingUrl = item.link;
          break;
        }
      }
      
      // Create a new ranking entry
      const newRanking: InsertKeywordRanking = {
        keywordId,
        rank,
        rankingUrl,
        previousRank: previousRank || null,
        searchEngine: 'google',
        device: 'desktop',
        location: 'us',
        serp: searchResults.items || []
      };
      
      await storage.createKeywordRanking(newRanking);
      
      // Check and store competitor rankings
      await this.storeCompetitorRankings(keywordId, keyword.keyword, searchResults.items);
      
      return true;
    } catch (error) {
      console.error('Error checking keyword ranking:', error);
      return false;
    }
  }
  
  /**
   * Store rankings for competitors
   */
  private async storeCompetitorRankings(
    keywordId: number, 
    keywordText: string, 
    searchResults: any[]
  ): Promise<void> {
    if (!searchResults || !searchResults.length) return;
    
    try {
      // Store top 10 results as competitor rankings
      const competitors = searchResults.slice(0, 10);
      
      for (let i = 0; i < competitors.length; i++) {
        const competitor = competitors[i];
        
        // Skip results without links
        if (!competitor.link) continue;
        
        const competitorRanking: InsertCompetitorRanking = {
          keywordId,
          competitorUrl: competitor.link,
          rank: i + 1,
          searchEngine: 'google',
          device: 'desktop',
          location: 'us'
        };
        
        await storage.createCompetitorRanking(competitorRanking);
      }
    } catch (error) {
      console.error('Error storing competitor rankings:', error);
    }
  }
  
  /**
   * Perform a Google search using the Custom Search API
   */
  private async googleSearch(query: string): Promise<any> {
    if (!this.GOOGLE_SEARCH_API_KEY || !this.GOOGLE_SEARCH_ENGINE_ID) {
      throw new Error('Google Search API Key or Search Engine ID not set');
    }
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1`;
      const response = await axios.get(url, {
        params: {
          key: this.GOOGLE_SEARCH_API_KEY,
          cx: this.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          num: 10, // Get top 10 results
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error performing Google search:', error);
      throw error;
    }
  }
  
  /**
   * Update metrics for a keyword
   * @param keywordId The ID of the keyword to update metrics for
   */
  async updateKeywordMetrics(keywordId: number): Promise<boolean> {
    try {
      // Get keyword info
      const keyword = await storage.getKeyword(keywordId);
      if (!keyword) {
        throw new Error(`Keyword with ID ${keywordId} not found`);
      }

      // Get existing metrics or create new ones
      let metrics = await storage.getKeywordMetrics(keywordId);
      
      // Calculate metrics based on search results and ranking data
      const searchResults = await this.googleSearch(keyword.keyword);
      if (!searchResults || !searchResults.items) {
        console.error('No search results found for keyword:', keyword.keyword);
        return false;
      }
      
      // Extract metrics from search results
      const totalResults = searchResults.searchInformation?.totalResults || 0;
      
      // Calculate keyword difficulty (0-100 scale)
      // This is a simplified algorithm - in reality, difficulty would factor in domain authority, backlinks, etc.
      // Higher competition = higher difficulty
      let difficulty = 0;
      const competitorRankings = await storage.getCompetitorRankingsByKeyword(keywordId);
      
      if (competitorRankings && competitorRankings.length > 0) {
        // Check if top positions are taken by high authority domains
        const topDomains = competitorRankings
          .filter((r: any) => r.rank <= 10)
          .map((r: any) => {
            try {
              const url = new URL(r.competitorUrl);
              return url.hostname;
            } catch (e) {
              return r.competitorUrl;
            }
          });
          
        // Count .gov, .edu domains which typically have high authority
        const highAuthorityDomains = topDomains.filter(domain => 
          domain.endsWith('.gov') || 
          domain.endsWith('.edu') || 
          domain.endsWith('.org') || 
          domain.includes('wikipedia') ||
          domain.includes('amazon') ||
          domain.includes('youtube')
        ).length;
        
        // Base difficulty on position of competitors and number of high authority domains
        difficulty = Math.min(100, Math.round(
          (highAuthorityDomains * 10) + 
          (competitorRankings.length * 5) + 
          (Math.log10(parseInt(totalResults) || 1) * 10)
        ));
      }
      
      // Estimate search volume (this would normally come from a paid API)
      // Here we're using a simplified algorithm based on search results
      const estimatedSearchVolume = Math.round(
        Math.min(10000, Math.max(10, Math.log10(parseInt(totalResults) || 1) * 1000))
      );
      
      // Create or update metrics
      const metricsData: InsertKeywordMetrics = {
        keywordId,
        searchVolume: estimatedSearchVolume,
        globalSearchVolume: Math.round(estimatedSearchVolume * 2.5), // Global volume is usually higher
        keywordDifficulty: difficulty,
        cpc: Math.random() * 5, // Random CPC between 0-5 (would normally come from a paid API)
        competition: difficulty / 100, // Scale 0-1
        trendsData: { 
          // Example trend data (would normally come from a trends API)
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [
            Math.round(estimatedSearchVolume * (0.8 + Math.random() * 0.4)),
            Math.round(estimatedSearchVolume * (0.8 + Math.random() * 0.4)),
            Math.round(estimatedSearchVolume * (0.8 + Math.random() * 0.4)),
            Math.round(estimatedSearchVolume * (0.8 + Math.random() * 0.4)),
            Math.round(estimatedSearchVolume * (0.8 + Math.random() * 0.4)),
            estimatedSearchVolume
          ]
        },
        relatedKeywords: await this.getRelatedKeywords(keyword.keyword)
      };
      
      if (metrics) {
        await storage.updateKeywordMetrics(keywordId, metricsData);
      } else {
        await storage.createKeywordMetrics(metricsData);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating keyword metrics:', error);
      return false;
    }
  }
  
  /**
   * Get related keywords for a given keyword
   */
  private async getRelatedKeywords(keyword: string): Promise<any[]> {
    try {
      const searchResults = await this.googleSearch(keyword);
      if (!searchResults) return [];
      
      const relatedKeywords: any[] = [];
      
      // Extract from related searches if available
      if (searchResults.context?.facets) {
        for (const facet of searchResults.context.facets) {
          if (facet.label && facet.label !== keyword) {
            relatedKeywords.push({
              keyword: facet.label,
              source: 'related'
            });
          }
        }
      }
      
      // Extract from "People also ask" section if available
      if (searchResults.items) {
        for (const item of searchResults.items) {
          if (item.pagemap?.question) {
            for (const question of item.pagemap.question) {
              if (question.name) {
                relatedKeywords.push({
                  keyword: question.name,
                  source: 'question'
                });
              }
            }
          }
        }
      }
      
      return relatedKeywords.slice(0, 10); // Limit to 10 related keywords
    } catch (error) {
      console.error('Error getting related keywords:', error);
      return [];
    }
  }
  
  /**
   * Generate keyword suggestions based on a base keyword
   */
  async generateSuggestions(userId: string, baseKeyword: string): Promise<any[]> {
    try {
      // Use Google search to get related keywords
      const searchResults = await this.googleSearch(baseKeyword);
      
      if (!searchResults || !searchResults.items) {
        return [];
      }
      
      // Extract suggestions from search results
      const suggestions: any[] = [];
      
      // Get from "related searches" if available
      if (searchResults.context?.facets) {
        for (const facet of searchResults.context.facets) {
          if (facet.label && facet.label !== baseKeyword) {
            suggestions.push({
              userId,
              baseKeyword,
              suggestedKeyword: facet.label,
              source: 'related'
            });
          }
        }
      }
      
      // Get from titles and snippets of search results
      const stopwords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'in', 'on', 'at', 'to', 'for', 'with'];
      const baseKeywordWords = baseKeyword.toLowerCase().split(' ');
      
      for (const item of searchResults.items) {
        if (item.title) {
          // Process title to extract possible keywords
          const titleParts = item.title.split(/\s-\s|\s\|\s|\s:\s/); // Split by common title separators
          
          for (const part of titleParts) {
            const words = part.toLowerCase().split(/\s+/);
            if (words.length >= 2 && words.length <= 6) {
              // Filter out very short or very long phrases
              const phrase = part.trim();
              
              // Skip exact matches to the base keyword
              if (phrase.toLowerCase() !== baseKeyword.toLowerCase() && 
                  !suggestions.some(s => s.suggestedKeyword.toLowerCase() === phrase.toLowerCase())) {
                suggestions.push({
                  userId,
                  baseKeyword,
                  suggestedKeyword: phrase,
                  source: 'title'
                });
              }
            }
          }
        }
        
        // Extract phrases from snippet
        if (item.snippet) {
          const sentences = item.snippet.split(/[.!?]+/);
          
          for (const sentence of sentences) {
            const words = sentence.toLowerCase().split(/\s+/);
            
            // Look for phrases of 2-5 words that include at least one word from the base keyword
            for (let i = 0; i < words.length - 1; i++) {
              for (let len = 2; len <= 5 && i + len <= words.length; len++) {
                const phrase = words.slice(i, i + len)
                  .filter((w: string) => !stopwords.includes(w)) // Remove stopwords
                  .join(' ');
                
                // Check if phrase is related to the base keyword
                const hasRelatedWord = baseKeywordWords.some(word => 
                  phrase.includes(word) && word.length > 3 // Only consider significant words
                );
                
                if (hasRelatedWord && phrase.length >= 5 && 
                    !suggestions.some(s => s.suggestedKeyword.toLowerCase() === phrase)) {
                  suggestions.push({
                    userId,
                    baseKeyword,
                    suggestedKeyword: phrase,
                    source: 'snippet'
                  });
                }
              }
            }
          }
        }
      }
      
      // Limit to 20 unique suggestions
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
        self.findIndex(s => s.suggestedKeyword.toLowerCase() === suggestion.suggestedKeyword.toLowerCase()) === index
      ).slice(0, 20);
      
      return uniqueSuggestions;
    } catch (error) {
      console.error('Error generating keyword suggestions:', error);
      return [];
    }
  }

  /**
   * Check keyword ranking for a specific keyword
   */
  async checkKeywordRanking(keywordId: number): Promise<any> {
    try {
      // Get the keyword details
      const keyword = await storage.getKeyword(keywordId);
      if (!keyword) {
        throw new Error('Keyword not found');
      }

      // Get latest ranking for this keyword
      const latestRanking = await storage.getLatestKeywordRanking(keywordId);
      
      return {
        keyword: keyword.keyword,
        latestRanking: latestRanking?.rank || null,
        lastChecked: latestRanking?.rankDate || null
      };
    } catch (error) {
      console.error('Error checking keyword ranking:', error);
      throw error;
    }
  }

  /**
   * Get keyword data for a specific keyword
   */
  async getKeywordData(keyword: string): Promise<any> {
    // This would typically call an external API
    // For now, return a basic structure
    return {
      keyword,
      searchVolume: 1000,
      difficulty: 50,
      cpc: '$1.25',
      competition: 0.6
    };
  }

  /**
   * Get keyword suggestions for a base keyword
   */
  async getKeywordSuggestions(keyword: string): Promise<any[]> {
    // This would typically call an external API
    // For now, return basic suggestions
    return [
      { keyword: `${keyword} services`, searchVolume: 800, difficulty: 45 },
      { keyword: `best ${keyword}`, searchVolume: 600, difficulty: 55 },
      { keyword: `${keyword} near me`, searchVolume: 1200, difficulty: 40 }
    ];
  }
}

export const keywordService = new KeywordService();