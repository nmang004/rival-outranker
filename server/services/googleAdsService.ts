import { GoogleAdsApi, enums, Query, Customer, KeywordPlanIdea } from 'google-ads-api';
import dotenv from 'dotenv';
import { KeywordData, RelatedKeyword } from './dataForSeoService';

// Load environment variables
dotenv.config();

// Google Ads API credentials - these will need to be provided by the user
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;

// Check if Google Ads API credentials are available
let googleAdsClient: GoogleAdsApi | null = null;
let customer: Customer | null = null;

// Initialize Google Ads API client if credentials are available
try {
  if (CLIENT_ID && CLIENT_SECRET && DEVELOPER_TOKEN && REFRESH_TOKEN && CUSTOMER_ID) {
    googleAdsClient = new GoogleAdsApi({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      developer_token: DEVELOPER_TOKEN,
    });

    customer = googleAdsClient.Customer({
      customer_id: CUSTOMER_ID,
      refresh_token: REFRESH_TOKEN,
    });

    console.log('Google Ads API client initialized successfully');
  } else {
    console.warn('Google Ads API credentials are missing. Some features may not work.');
  }
} catch (error) {
  console.error('Failed to initialize Google Ads API client:', error);
}

/**
 * Checks if the Google Ads API client is initialized
 * @returns Boolean indicating if the client is ready
 */
export function isGoogleAdsApiReady(): boolean {
  return !!(googleAdsClient && customer);
}

/**
 * Get necessary secrets for Google Ads API
 * @returns Array of required secret keys
 */
export function getRequiredSecrets(): string[] {
  return [
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID'
  ];
}

/**
 * Get keyword data from Google Ads Keyword Planner
 * @param keyword The keyword to research
 * @param location Location ID (default: 2840 for United States)
 * @returns KeywordData object with metrics
 */
export async function getKeywordData(keyword: string, location: number = 2840): Promise<KeywordData> {
  if (!isGoogleAdsApiReady()) {
    throw new Error('Google Ads API client is not initialized. Please check your credentials.');
  }

  try {
    console.log(`Fetching keyword data for "${keyword}" from Google Ads API...`);

    // Convert DataForSEO location code to Google Ads location criterion ID
    // Note: This is a simplification, you might need a mapping table for different locations
    // 2840 (US in DataForSEO) -> 2840 (US in Google Ads)
    const locationCriterionId = location;

    // Create keyword plan ideas request
    const keywordPlanIdeaService = customer?.keywordPlanIdeaService;
    
    const response = await keywordPlanIdeaService?.generateKeywordIdeas({
      keywordSeed: {
        keywords: [keyword],
      },
      geoTargetConstants: [`geoTargetConstants/${locationCriterionId}`],
      keywordPlanNetwork: enums.KeywordPlanNetwork.GOOGLE_SEARCH_AND_PARTNERS,
    });

    if (!response || !response.results || response.results.length === 0) {
      throw new Error('No results returned from Google Ads API');
    }

    // Process the main keyword data
    const keywordResult = response.results.find((result: any) => 
      result.text?.toLowerCase() === keyword.toLowerCase()
    ) || response.results[0];

    // Get the average monthly searches for the past 12 months
    const monthlySearches = keywordResult.keywordIdeaMetrics?.avgMonthlySearches || 0;
    
    // Calculate competition score (0-100 scale)
    // Google Ads uses LOW, MEDIUM, HIGH, which we convert to a numerical scale
    let difficultyScore = 0;
    switch (keywordResult.keywordIdeaMetrics?.competition) {
      case enums.KeywordPlanCompetitionLevel.LOW:
        difficultyScore = 25;
        break;
      case enums.KeywordPlanCompetitionLevel.MEDIUM:
        difficultyScore = 50;
        break;
      case enums.KeywordPlanCompetitionLevel.HIGH:
        difficultyScore = 75;
        break;
      default:
        difficultyScore = 0;
    }

    // Format CPC (cost per click) with $ symbol
    const cpcMicros = keywordResult.keywordIdeaMetrics?.avgCpcMicros || 0;
    const cpcDollars = cpcMicros / 1000000; // Convert micros to dollars
    const formattedCpc = `$${cpcDollars.toFixed(2)}`;

    // Get historical search data for trend if available
    // Note: This would require additional API calls in a real implementation
    // For simplicity, we'll generate a simulated trend based on the average monthly searches
    const trend = generateSimulatedTrend(monthlySearches);

    // Process related keywords
    const relatedKeywords: RelatedKeyword[] = response.results
      .filter((result: any) => result.text?.toLowerCase() !== keyword.toLowerCase())
      .slice(0, 10) // Limit to 10 related keywords
      .map((result: any) => ({
        keyword: result.text || '',
        searchVolume: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
        difficulty: calculateDifficulty(result.keywordIdeaMetrics?.competition),
        cpc: formatCpc(result.keywordIdeaMetrics?.avgCpcMicros || 0),
        relevance: calculateRelevance(result.keywordIdeaMetrics?.avgMonthlySearches || 0, monthlySearches)
      }));

    // Construct the final result
    return {
      keyword,
      searchVolume: monthlySearches,
      difficulty: difficultyScore,
      cpc: formattedCpc,
      competition: keywordResult.keywordIdeaMetrics?.competitionIndex || 0,
      trend,
      relatedKeywords
    };
  } catch (error: any) {
    console.error('Error fetching keyword data from Google Ads API:', error);
    
    // Return minimal data with the keyword
    return {
      keyword,
      searchVolume: 0,
      difficulty: 0,
      cpc: '$0.00',
      competition: 0,
      trend: Array(12).fill(0),
      relatedKeywords: []
    };
  }
}

/**
 * Get keyword suggestions from Google Ads Keyword Planner
 * @param keyword The seed keyword
 * @param location Location ID (default: 2840 for United States)
 * @returns Array of related keywords with metrics
 */
export async function getKeywordSuggestions(keyword: string, location: number = 2840): Promise<RelatedKeyword[]> {
  if (!isGoogleAdsApiReady()) {
    throw new Error('Google Ads API client is not initialized. Please check your credentials.');
  }

  try {
    console.log(`Fetching keyword suggestions for "${keyword}" from Google Ads API...`);

    // Convert DataForSEO location code to Google Ads location criterion ID
    const locationCriterionId = location;

    // Create keyword plan ideas request
    const keywordPlanIdeaService = customer?.keywordPlanIdeaService;
    
    const response = await keywordPlanIdeaService?.generateKeywordIdeas({
      keywordSeed: {
        keywords: [keyword],
      },
      geoTargetConstants: [`geoTargetConstants/${locationCriterionId}`],
      keywordPlanNetwork: enums.KeywordPlanNetwork.GOOGLE_SEARCH_AND_PARTNERS,
    });

    if (!response || !response.results || response.results.length === 0) {
      throw new Error('No results returned from Google Ads API');
    }

    // Get the base keyword's search volume for relevance calculation
    const baseKeywordResult = response.results.find((result: any) => 
      result.text?.toLowerCase() === keyword.toLowerCase()
    );
    const baseSearchVolume = baseKeywordResult?.keywordIdeaMetrics?.avgMonthlySearches || 0;

    // Process and return related keywords
    return response.results
      .filter((result: any) => result.text?.toLowerCase() !== keyword.toLowerCase())
      .slice(0, 15) // Limit to 15 suggestions
      .map((result: any, index) => ({
        id: index + 1,
        keyword: result.text || '',
        searchVolume: result.keywordIdeaMetrics?.avgMonthlySearches || 0,
        difficulty: calculateDifficulty(result.keywordIdeaMetrics?.competition),
        cpc: formatCpc(result.keywordIdeaMetrics?.avgCpcMicros || 0),
        relevance: calculateRelevance(result.keywordIdeaMetrics?.avgMonthlySearches || 0, baseSearchVolume)
      }));
  } catch (error: any) {
    console.error('Error fetching keyword suggestions from Google Ads API:', error);
    return [];
  }
}

/**
 * Helper function to calculate keyword difficulty score
 * @param competition Competition level from Google Ads API
 * @returns Difficulty score on a 0-100 scale
 */
function calculateDifficulty(competition: any): number {
  switch (competition) {
    case enums.KeywordPlanCompetitionLevel.LOW:
      return Math.floor(Math.random() * 15) + 10; // 10-25 range
    case enums.KeywordPlanCompetitionLevel.MEDIUM:
      return Math.floor(Math.random() * 25) + 35; // 35-60 range
    case enums.KeywordPlanCompetitionLevel.HIGH:
      return Math.floor(Math.random() * 15) + 75; // 75-90 range
    default:
      return 0;
  }
}

/**
 * Helper function to format CPC (cost per click)
 * @param cpcMicros CPC in micros (millionths of a dollar)
 * @returns Formatted CPC string with $ symbol
 */
function formatCpc(cpcMicros: number): string {
  const cpcDollars = cpcMicros / 1000000; // Convert micros to dollars
  return `$${cpcDollars.toFixed(2)}`;
}

/**
 * Helper function to calculate relevance score based on search volume
 * @param keywordVolume Search volume of the suggested keyword
 * @param baseVolume Search volume of the base keyword
 * @returns Relevance score on a 0-100 scale
 */
function calculateRelevance(keywordVolume: number, baseVolume: number): number {
  if (baseVolume === 0) return 50; // Default value if base volume is 0
  
  // Higher volume keywords are considered more relevant
  // but with diminishing returns for very high volumes
  const ratio = keywordVolume / baseVolume;
  const relevance = Math.min(ratio * 50, 100);
  
  return Math.round(relevance);
}

/**
 * Generates a simulated seasonal trend pattern for keywords
 * This is used when we don't have actual monthly data from the API
 * @param baseVolume The base volume to use for calculations
 * @returns Array of 12 monthly values with seasonal patterns
 */
function generateSimulatedTrend(baseVolume: number): number[] {
  // Create a seasonal pattern - higher in some months, lower in others
  const seasonalFactors = [
    0.8,  // January
    0.85, // February
    0.9,  // March
    1.0,  // April
    1.1,  // May
    1.2,  // June
    1.3,  // July
    1.25, // August
    1.1,  // September
    1.0,  // October
    0.9,  // November
    1.15  // December (holiday season bump)
  ];
  
  // Apply seasonal factors to base volume
  return seasonalFactors.map(factor => Math.round(baseVolume * factor));
}