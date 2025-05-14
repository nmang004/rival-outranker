import { storage } from '../storage';
import { InsertKeywordRanking, InsertCompetitorRanking } from '@shared/schema';
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
}

export const keywordService = new KeywordService();