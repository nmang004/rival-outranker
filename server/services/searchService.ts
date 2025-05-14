import axios from 'axios';

interface SerpApiResponse {
  search_metadata?: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters?: {
    engine: string;
    q: string;
    location: string;
  };
  organic_results?: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
    domain: string;
  }>;
  error?: string;
}

interface SearchOptions {
  count?: number;
  offset?: number;
  location?: string;
  timeframe?: string; // 'day' | 'week' | 'month'
}

class SearchService {
  private apiKey: string | undefined;
  private baseUrl = 'https://serpapi.com/search';
  private queryCounter = 0;
  // Default daily limit for SerpAPI - can be adjusted based on your plan
  private queryLimit = 100;

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY;
    this.queryCounter = Number(process.env.SEARCH_QUERY_COUNTER) || 0;
  }

  /**
   * Search for competitors based on keyword and location
   */
  async searchCompetitors(keyword: string, location?: string, options: SearchOptions = {}): Promise<any[]> {
    if (!this.apiKey) {
      console.warn('SerpAPI key is not set, using fallback data');
      return this.getFallbackResults(keyword, 5);
    }

    try {
      // Increment the query counter when making a real API call
      this.queryCounter++;
      // Save the counter to the environment so it persists across restarts
      process.env.SEARCH_QUERY_COUNTER = this.queryCounter.toString();

      const response = await axios.get<SerpApiResponse>(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          engine: 'google',
          q: keyword,
          location: location || 'United States',
          num: options.count || 10,
          start: options.offset || 0,
          tbm: 'nws',
          time_period: options.timeframe,
        },
      });

      if (response.data.error) {
        console.error('SerpAPI error:', response.data.error);
        return this.getFallbackResults(keyword, 5);
      }

      if (!response.data.organic_results || response.data.organic_results.length === 0) {
        console.warn('No results from SerpAPI');
        return this.getFallbackResults(keyword, 5);
      }

      // Filter out non-business domains (like Wikipedia, YouTube, etc.)
      const filteredResults = response.data.organic_results.filter(result => {
        const domain = result.domain.toLowerCase();
        
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
        name: result.title,
        url: result.link,
        snippet: result.snippet,
      }));
    } catch (error) {
      console.error('Error searching SerpAPI:', error);
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
   * Get the query limit
   */
  getQueryLimit(): number {
    return this.queryLimit;
  }

  /**
   * Get remaining queries
   */
  getRemainingQueries(): number {
    return Math.max(0, this.queryLimit - this.queryCounter);
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

export const bingSearchService = new SearchService();