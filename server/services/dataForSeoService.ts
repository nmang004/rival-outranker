import axios from 'axios';

// DataForSEO API authentication
const API_LOGIN = process.env.DATAFORSEO_API_LOGIN;
const API_PASSWORD = process.env.DATAFORSEO_API_PASSWORD;

// Create authenticated axios instance
const dataForSeoClient = axios.create({
  baseURL: 'https://api.dataforseo.com',
  auth: {
    username: API_LOGIN || '',
    password: API_PASSWORD || ''
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interface for keyword data
export interface KeywordData {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: string;
  competition?: number;
  trend?: number[];
  relatedKeywords?: RelatedKeyword[];
}

export interface RelatedKeyword {
  id?: number;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: string;
  relevance?: number;
}

/**
 * Get keyword data from DataForSEO
 * @param keyword The keyword to research
 * @param location Location code (default: 2840 for United States)
 * @returns KeywordData object with metrics
 */
export async function getKeywordData(keyword: string, location: number = 2840): Promise<KeywordData> {
  try {
    console.log(`Fetching keyword data for "${keyword}" from DataForSEO...`);
    
    // Request body for Keywords Data API
    const requestData = {
      "keyword": keyword,
      "location_code": location,
      "language_code": "en",
      "include_serp_info": true,
      "include_trends_info": true,
      "depth": 10
    };
    
    const keywordDataResponse = await dataForSeoClient.post(
      '/v3/keywords_data/google/search_volume/live',
      [requestData]
    );
    
    // Process the response
    const results = keywordDataResponse.data?.tasks?.[0]?.result?.[0] || {};
    
    // Extract trend data (if available)
    const trend = results.monthly_searches?.map((month: any) => month.search_volume) || [];
    
    // Gather related keyword data
    const relatedKeywordsResponse = await dataForSeoClient.post(
      '/v3/keywords_data/google/keywords_for_keywords/live',
      [{
        "keyword": keyword,
        "location_code": location,
        "language_code": "en",
        "limit": 10
      }]
    );
    
    // Process related keywords
    const relatedResults = relatedKeywordsResponse.data?.tasks?.[0]?.result?.[0]?.keywords || [];
    const relatedKeywords = relatedResults.map((item: any) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume || undefined,
      difficulty: Math.round(item.keyword_difficulty || 0),
      cpc: item.cpc ? `$${parseFloat(item.cpc).toFixed(2)}` : undefined
    }));

    // Get difficulty data from separate API endpoint
    const difficultyResponse = await dataForSeoClient.post(
      '/v3/keywords_data/google/keyword_difficulty/live',
      [{
        "keywords": [keyword],
        "location_code": location,
        "language_code": "en"
      }]
    );
    
    const difficultyResult = difficultyResponse.data?.tasks?.[0]?.result?.[0] || {};
    const difficultyScore = Math.round(difficultyResult.keyword_difficulty || 0);
    
    // Construct the result
    return {
      keyword,
      searchVolume: results.search_volume || 0,
      difficulty: difficultyScore,
      cpc: results.cpc ? `$${parseFloat(results.cpc).toFixed(2)}` : undefined,
      competition: results.competition || 0,
      trend,
      relatedKeywords
    };
  } catch (error) {
    console.error('Error fetching keyword data from DataForSEO:', error);
    
    // Return basic structure with the keyword in case of error
    return {
      keyword,
      searchVolume: 0,
      difficulty: 0,
      cpc: '$0.00',
      competition: 0,
      trend: [],
      relatedKeywords: []
    };
  }
}

/**
 * Get competitor ranking data
 * @param keyword The keyword to check
 * @param website Your website domain
 * @param competitorDomains Array of competitor domains to check
 * @param location Location code (default: 2840 for United States)
 * @returns Object with ranking positions and URLs
 */
export async function getCompetitorRankings(
  keyword: string, 
  website: string,
  competitorDomains: string[],
  location: number = 2840
) {
  try {
    console.log(`Fetching competitor rankings for "${keyword}" from DataForSEO...`);
    
    // Request body for SERP API
    const requestData = {
      "keyword": keyword,
      "location_code": location,
      "language_code": "en",
      "depth": 100 // Check deeper to find all competitors
    };
    
    const serpResponse = await dataForSeoClient.post(
      '/v3/serp/google/organic/live/regular',
      [requestData]
    );
    
    // Get organic results
    const results = serpResponse.data?.tasks?.[0]?.result?.[0]?.items || [];
    
    // Normalize domains for comparison (removing www., http://, etc.)
    const normalizeDomain = (url: string) => {
      try {
        let domain = url.toLowerCase();
        // Remove protocol
        domain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '');
        // Get domain part only
        domain = domain.split('/')[0];
        return domain;
      } catch (e) {
        return url;
      }
    };
    
    const normalizedWebsite = normalizeDomain(website);
    const normalizedCompetitors = competitorDomains.map(normalizeDomain);
    
    // Find rankings for the target website and competitors
    let websiteRanking = { position: 0, url: '' };
    const competitorRankings = [];
    
    for (const result of results) {
      const resultDomain = normalizeDomain(result.url);
      
      // Check if this is the target website
      if (resultDomain.includes(normalizedWebsite)) {
        websiteRanking = {
          position: result.rank_position,
          url: result.url
        };
      }
      
      // Check if this is a competitor
      for (const competitor of normalizedCompetitors) {
        if (resultDomain.includes(competitor)) {
          competitorRankings.push({
            competitorUrl: competitor,
            position: result.rank_position,
            url: result.url
          });
          break;
        }
      }
    }
    
    return {
      keyword,
      websiteRanking,
      competitorRankings
    };
  } catch (error) {
    console.error('Error fetching competitor rankings from DataForSEO:', error);
    
    // Return basic structure in case of error
    return {
      keyword,
      websiteRanking: { position: 0, url: '' },
      competitorRankings: []
    };
  }
}

/**
 * Get suggested keywords based on seed keyword
 * @param keyword The seed keyword
 * @param location Location code (default: 2840 for United States)
 * @returns Array of related keywords with metrics
 */
export async function getKeywordSuggestions(keyword: string, location: number = 2840): Promise<RelatedKeyword[]> {
  try {
    console.log(`Fetching keyword suggestions for "${keyword}" from DataForSEO...`);
    
    // Get suggestions from DataForSEO
    const suggestionsResponse = await dataForSeoClient.post(
      '/v3/keywords_data/google/keywords_for_keywords/live',
      [{
        "keyword": keyword,
        "location_code": location,
        "language_code": "en",
        "limit": 15
      }]
    );
    
    // Process the suggestions
    const results = suggestionsResponse.data?.tasks?.[0]?.result?.[0]?.keywords || [];
    
    return results.map((item: any, index: number) => ({
      id: index + 1,
      keyword: item.keyword,
      searchVolume: item.search_volume || 0,
      difficulty: Math.round(item.keyword_difficulty || 0),
      cpc: item.cpc ? `$${parseFloat(item.cpc).toFixed(2)}` : '$0.00',
      relevance: Math.round((1 - (index / 15)) * 100) // Higher relevance for earlier results
    }));
  } catch (error) {
    console.error('Error fetching keyword suggestions from DataForSEO:', error);
    return [];
  }
}

/**
 * Check API health
 * Returns true if the API is functioning
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await dataForSeoClient.get('/v3/merchant/api_status');
    return response.status === 200;
  } catch (error) {
    console.error('DataForSEO API health check failed:', error);
    return false;
  }
}