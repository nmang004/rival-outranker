import axios from 'axios';

interface BingSearchResult {
  name: string;
  url: string;
  snippet: string;
  deepLinks?: Array<{
    name: string;
    url: string;
    snippet?: string;
  }>;
}

interface BingSearchResponse {
  webPages?: {
    value: BingSearchResult[];
    totalEstimatedMatches?: number;
  };
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * Service to search Bing Web Search for competitors based on keywords
 */
class BingSearchService {
  // Using a fallback key temporarily - should be replaced with a proper API key
  private apiKey = process.env.BING_SEARCH_API_KEY || 'aa46022c41904007b44b7b1d77bde35e';
  private baseUrl = 'https://api.bing.microsoft.com/v7.0/search';
  private MAX_RESULTS = 5;
  
  /**
   * Search for competitors based on keyword and location
   * @param keyword - The keyword to search for
   * @param location - The location for the search (e.g., 'New York', 'Seattle, WA')
   * @returns Array of competitor details including URL, title, and snippet
   */
  async searchCompetitors(keyword: string, location: string): Promise<Array<{url: string, title: string, snippet: string}>> {
    try {
      console.log(`Searching for competitors with keyword "${keyword}" in ${location}`);
      
      // Add location to search query
      const searchQuery = `${keyword} ${location}`;
      
      // Make request to Bing Search API
      const response = await axios.get(this.baseUrl, {
        params: {
          q: searchQuery,
          count: 10, // Get more results than needed to filter out irrelevant ones
          mkt: 'en-US',
          responseFilter: 'Webpages'
        },
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      });
      
      const data: BingSearchResponse = response.data;
      
      if (!data.webPages || !data.webPages.value || data.webPages.value.length === 0) {
        console.log('No search results found');
        return [];
      }
      
      // Filter out non-business or irrelevant websites
      const filteredResults = data.webPages.value.filter(result => {
        const url = result.url.toLowerCase();
        
        // Skip obvious non-competitors like Wikipedia, YouTube, social media, etc.
        if (
          url.includes('wikipedia.org') ||
          url.includes('youtube.com') ||
          url.includes('facebook.com') ||
          url.includes('twitter.com') ||
          url.includes('linkedin.com') ||
          url.includes('instagram.com') ||
          url.includes('pinterest.com') ||
          url.includes('reddit.com') ||
          url.includes('quora.com') ||
          url.includes('amazon.com') ||
          url.includes('ebay.com') ||
          url.includes('dictionary.com') ||
          url.includes('merriam-webster.com') ||
          url.includes('thesaurus.com') ||
          url.includes('britannica.com')
        ) {
          return false;
        }
        
        return true;
      });
      
      // Map results to the expected format
      return filteredResults.slice(0, this.MAX_RESULTS).map(result => ({
        url: result.url,
        title: result.name,
        snippet: result.snippet
      }));
    } catch (error) {
      console.error('Error searching for competitors:', error);
      // Fallback to empty array on error
      return [];
    }
  }
  
  /**
   * Extract domain name from URL
   * @param url - The URL to extract domain from
   */
  private extractDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    } catch (error) {
      return url;
    }
  }
}

export const bingSearchService = new BingSearchService();