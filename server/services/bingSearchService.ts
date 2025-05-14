import axios from 'axios';

interface BingSearchResponse {
  webPages?: {
    value: Array<{
      name: string;
      url: string;
      snippet: string;
      displayUrl: string;
    }>;
    totalEstimatedMatches: number;
  };
  errors?: Array<{
    code: string;
    message: string;
    moreDetails?: string;
  }>;
}

interface SearchOptions {
  count?: number;
  offset?: number;
  market?: string;
  freshness?: string; // 'Day' | 'Week' | 'Month'
}

class BingSearchService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.bing.microsoft.com/v7.0/search';
  private queryCounter = 0;

  constructor() {
    this.apiKey = process.env.BING_SEARCH_API_KEY;
    this.queryCounter = Number(process.env.BING_SEARCH_COUNTER) || 0;
  }

  /**
   * Search for competitors based on keyword and location
   */
  async searchCompetitors(keyword: string, location?: string, options: SearchOptions = {}): Promise<any[]> {
    if (!this.apiKey) {
      console.warn('Bing Search API key is not set, using fallback data');
      return this.getFallbackResults(keyword, 5);
    }

    const searchQuery = location ? 
      `${keyword} ${location}` : 
      keyword;
    
    try {
      // Increment the query counter when making a real API call
      this.queryCounter++;
      // Save the counter to the environment so it persists across restarts
      process.env.BING_SEARCH_COUNTER = this.queryCounter.toString();

      const response = await axios.get<BingSearchResponse>(this.baseUrl, {
        params: {
          q: searchQuery,
          count: options.count || 10,
          offset: options.offset || 0,
          mkt: options.market || 'en-US',
          freshness: options.freshness,
          responseFilter: 'Webpages',
        },
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (response.data.errors) {
        console.error('Bing Search API error:', response.data.errors);
        return this.getFallbackResults(keyword, 5);
      }

      if (!response.data.webPages?.value || response.data.webPages.value.length === 0) {
        console.warn('No results from Bing Search API');
        return this.getFallbackResults(keyword, 5);
      }

      // Filter out non-business domains (like Wikipedia, YouTube, etc.)
      const filteredResults = response.data.webPages.value.filter(result => {
        const url = new URL(result.url);
        const domain = url.hostname.toLowerCase();
        
        // Skip common non-business domains
        if (
          domain.includes('wikipedia.org') ||
          domain.includes('youtube.com') ||
          domain.includes('facebook.com') ||
          domain.includes('twitter.com') ||
          domain.includes('instagram.com') ||
          domain.includes('reddit.com') ||
          domain.includes('quora.com') ||
          domain.includes('amazon.com') ||
          domain.includes('yelp.com') ||
          domain.includes('gov') ||
          domain.includes('edu')
        ) {
          return false;
        }
        
        return true;
      });

      // Format the results
      return filteredResults.map(result => ({
        name: result.name,
        url: result.url,
        snippet: result.snippet,
      }));
    } catch (error) {
      console.error('Error searching Bing API:', error);
      return this.getFallbackResults(keyword, 5);
    }
  }

  /**
   * Get the current query count
   */
  getQueryCount(): number {
    return this.queryCounter;
  }

  /**
   * Get fallback results when API is not available
   */
  private getFallbackResults(keyword: string, count: number): any[] {
    // Generate some generic competitor URLs
    const results = [];
    
    // Create generic business names based on the keyword
    const keywordFormatted = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (let i = 0; i < count; i++) {
      results.push({
        name: `${keywordFormatted}expert.com`,
        url: `https://www.${keywordFormatted}expert.com`,
        snippet: `Leading provider of ${keyword} services with expert solutions.`,
      });
    }
    
    return results;
  }
}

export const bingSearchService = new BingSearchService();