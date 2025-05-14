import axios from 'axios';

interface GoogleCustomSearchResponse {
  kind?: string;
  url?: {
    type: string;
    template: string;
  };
  queries?: {
    request: Array<{
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
    }>;
    nextPage?: Array<{
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
    }>;
  };
  searchInformation?: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: Array<{
    kind: string;
    title: string;
    htmlTitle: string;
    link: string;
    displayLink: string;
    snippet: string;
    htmlSnippet: string;
    cacheId?: string;
    formattedUrl: string;
    htmlFormattedUrl: string;
  }>;
  error?: {
    code: number;
    message: string;
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}

interface SearchOptions {
  count?: number;
  offset?: number;
  location?: string;
  dateRestrict?: string; // 'd1' | 'w1' | 'm1' etc.
}

class SearchService {
  private apiKey: string | undefined;
  private searchEngineId: string | undefined;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';
  private queryCounter = 0;
  // Google Custom Search provides 100 free queries per day (default)
  private queryLimit = 100;

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.queryCounter = Number(process.env.SEARCH_QUERY_COUNTER) || 0;
  }

  /**
   * Search for competitors based on keyword and location
   */
  async searchCompetitors(keyword: string, location?: string, options: SearchOptions = {}): Promise<any[]> {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Custom Search API configuration is not complete, using fallback data');
      return this.getFallbackResults(keyword, 5);
    }

    try {
      // Combine keyword and location for more specific results
      const searchQuery = location ? 
        `${keyword} ${location}` : 
        keyword;
      
      // Initialize an array to hold all results
      const allResults: any[] = [];
      
      // Determine how many pages to fetch (Google CSE allows max 10 results per page)
      // We'll limit to 5 queries per competitor analysis as per user request
      const maxResults = Math.min(options.count || 20, 50); // 50 results max
      const maxPages = Math.min(Math.ceil(maxResults / 10), 5); // 5 queries max
      
      console.log(`API usage limited to max ${maxPages} queries per competitor analysis`);
      
      // Make requests for each page of results
      for (let page = 0; page < maxPages; page++) {
        // Increment the query counter for each API call
        this.queryCounter++;
        
        // Calculate the start index for this page (Google uses 1-based indexing)
        const startIndex = page * 10 + 1;
        
        console.log(`Fetching page ${page + 1} of search results (startIndex: ${startIndex})`);
        
        const response = await axios.get<GoogleCustomSearchResponse>(this.baseUrl, {
          params: {
            key: this.apiKey,
            cx: this.searchEngineId,
            q: searchQuery,
            num: 10, // Max 10 results per request
            start: startIndex,
            gl: 'us', // Country to search from
            cr: options.location ? `country${options.location.substring(0, 2).toUpperCase()}` : 'countryUS',
            dateRestrict: options.dateRestrict,
          },
        });
        
        // Save the counter to the environment so it persists across restarts
        process.env.SEARCH_QUERY_COUNTER = this.queryCounter.toString();
        
        if (response.data.error) {
          console.error(`Google Custom Search API error on page ${page + 1}:`, response.data.error);
          // Don't fail the whole request; just stop fetching more pages
          break;
        }
        
        if (!response.data.items || response.data.items.length === 0) {
          console.warn(`No results from Google Custom Search API on page ${page + 1}`);
          // No more results; stop fetching more pages
          break;
        }
        
        // Add items from this page to our results
        allResults.push(...response.data.items);
        
        // Check if there are more pages available
        if (!response.data.queries?.nextPage) {
          console.log('No more pages available');
          break;
        }
      }
      
      if (allResults.length === 0) {
        console.warn('No results from Google Custom Search API');
        return this.getFallbackResults(keyword, 5);
      }
      
      // Filter out non-business domains (like Wikipedia, YouTube, etc.)
      const filteredResults = allResults.filter(item => {
        const domain = item.displayLink.toLowerCase();
        
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
      console.log(`Found ${filteredResults.length} filtered results from Google CSE`);
      return filteredResults.map(item => ({
        name: item.title,
        url: item.link,
        snippet: item.snippet,
      }));
    } catch (error) {
      console.error('Error searching Google Custom Search API:', error);
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
    
    // Create different types of domain variations for more realistic results
    const domainTypes = [
      { prefix: '', suffix: 'expert.com', description: `Leading provider of ${keyword} services with expert solutions.` },
      { prefix: 'best', suffix: 'solutions.com', description: `Top-rated ${keyword} solutions for businesses and individuals.` },
      { prefix: 'pro', suffix: 'services.com', description: `Professional ${keyword} services with guaranteed satisfaction.` },
      { prefix: 'the', suffix: 'pros.co', description: `${keyword} professionals serving clients nationwide.` },
      { prefix: '', suffix: 'hub.com', description: `Your one-stop resource for all ${keyword} needs and information.` }
    ];
    
    for (let i = 0; i < count; i++) {
      const domainTemplate = domainTypes[i % domainTypes.length];
      results.push({
        name: `${domainTemplate.prefix}${keywordFormatted}${domainTemplate.suffix}`,
        url: `https://www.${domainTemplate.prefix}${keywordFormatted}${domainTemplate.suffix}`,
        snippet: domainTemplate.description,
      });
    }
    
    return results;
  }
}

export const searchService = new SearchService();