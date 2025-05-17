/**
 * Cost Estimation Service
 * 
 * This service calculates estimated costs for various API providers based on their 
 * pricing models. These are estimates and may not perfectly reflect actual billing.
 */

interface CostEstimationRules {
  [provider: string]: {
    baseRate?: number; // Base rate per request in USD
    tierRates?: {
      [tier: string]: {
        threshold: number;
        rate: number;
      }
    };
    tokenCost?: {
      input?: number;
      output?: number;
    };
    metricMultipliers?: {
      [metric: string]: number;
    };
  }
}

interface UsageMetrics {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  requestSize?: number; // in bytes or other measurement
  responseSize?: number; // in bytes or other measurement
  customMetric?: {
    [key: string]: number;
  };
}

const API_COST_RULES: CostEstimationRules = {
  'OpenAI': {
    // Based on typical OpenAI API pricing
    tokenCost: {
      input: 0.0000005, // $0.0005 per 1000 input tokens (GPT-4)
      output: 0.000005, // $0.005 per 1000 output tokens (GPT-4)
    }
  },
  'Google Ads API': {
    // Google Ads API pricing structure
    baseRate: 0.025, // Base cost per thousand operations
    metricMultipliers: {
      keywordSuggestion: 1.5,
      searchVolume: 2.0,
      performanceData: 1.75
    }
  },
  'DataForSEO': {
    // DataForSEO pricing estimates
    baseRate: 0.01, // Base cost per request
    metricMultipliers: {
      serp: 2.0,
      keywordData: 1.5,
      competitorAnalysis: 3.0
    }
  },
  'Internal API': {
    // Our internal API has no direct cost
    baseRate: 0
  }
};

/**
 * Estimates the cost of an API call based on provider and usage metrics
 * 
 * @param provider The API provider (e.g., 'OpenAI', 'Google Ads API')
 * @param endpoint The specific endpoint called
 * @param metrics Usage metrics for more accurate cost calculation
 * @returns Estimated cost in USD
 */
export function estimateCost(
  provider: string,
  endpoint: string,
  metrics?: UsageMetrics
): number {
  // Default to 0 if provider not found
  if (!API_COST_RULES[provider]) {
    return 0;
  }

  const rules = API_COST_RULES[provider];
  let estimatedCost = 0;

  // Apply base rate if it exists
  if (rules.baseRate !== undefined) {
    estimatedCost += rules.baseRate;
  }

  // Apply token-based costs for providers like OpenAI
  if (rules.tokenCost && metrics) {
    if (rules.tokenCost.input && metrics.inputTokens) {
      estimatedCost += metrics.inputTokens * rules.tokenCost.input;
    }
    
    if (rules.tokenCost.output && metrics.outputTokens) {
      estimatedCost += metrics.outputTokens * rules.tokenCost.output;
    }
    
    // If only total tokens is provided
    if (!metrics.inputTokens && !metrics.outputTokens && metrics.totalTokens) {
      // Estimate a 70/30 split for input/output if detailed breakout isn't available
      const inputEst = metrics.totalTokens * 0.7;
      const outputEst = metrics.totalTokens * 0.3;
      
      if (rules.tokenCost.input) {
        estimatedCost += inputEst * rules.tokenCost.input;
      }
      
      if (rules.tokenCost.output) {
        estimatedCost += outputEst * rules.tokenCost.output;
      }
    }
  }

  // Apply multipliers based on endpoint or specific metrics
  if (rules.metricMultipliers) {
    // Extract the relevant part of the endpoint for multiplier lookup
    const endpointType = getEndpointType(endpoint, provider);
    
    if (rules.metricMultipliers[endpointType]) {
      estimatedCost *= rules.metricMultipliers[endpointType];
    }
    
    // Apply custom metrics if available
    if (metrics?.customMetric) {
      Object.entries(metrics.customMetric).forEach(([metric, value]) => {
        if (rules.metricMultipliers?.[metric]) {
          estimatedCost += value * rules.metricMultipliers[metric];
        }
      });
    }
  }

  // Round to 6 decimal places for readability
  return Math.round(estimatedCost * 1000000) / 1000000;
}

/**
 * Extract the type of endpoint for more accurate cost estimation
 */
function getEndpointType(endpoint: string, provider: string): string {
  // For Google Ads API
  if (provider === 'Google Ads API') {
    if (endpoint.includes('keyword')) return 'keywordSuggestion';
    if (endpoint.includes('performance')) return 'performanceData';
    if (endpoint.includes('search')) return 'searchVolume';
    return 'standard';
  }
  
  // For DataForSEO
  if (provider === 'DataForSEO') {
    if (endpoint.includes('serp')) return 'serp';
    if (endpoint.includes('keyword')) return 'keywordData';
    if (endpoint.includes('competitor')) return 'competitorAnalysis';
    return 'standard';
  }

  // For OpenAI - model-based pricing could be extracted here
  if (provider === 'OpenAI') {
    if (endpoint.includes('gpt-4')) return 'gpt4';
    if (endpoint.includes('gpt-3.5')) return 'gpt35';
    return 'standard';
  }
  
  return 'standard';
}

/**
 * Determines usage metrics based on request and response data
 */
export function extractUsageMetrics(
  provider: string,
  requestData: any,
  responseData: any
): UsageMetrics {
  const metrics: UsageMetrics = {};
  
  // Handle OpenAI-specific metrics
  if (provider === 'OpenAI') {
    // Extract token counts from OpenAI response if available
    if (responseData?.usage) {
      metrics.inputTokens = responseData.usage.prompt_tokens;
      metrics.outputTokens = responseData.usage.completion_tokens;
      metrics.totalTokens = responseData.usage.total_tokens;
    } else if (requestData?.messages) {
      // Rough estimation: ~1 token per 4 characters if usage not provided
      const totalChars = requestData.messages.reduce(
        (sum: number, msg: any) => sum + (msg.content?.length || 0), 
        0
      );
      metrics.inputTokens = Math.ceil(totalChars / 4);
    }
  }
  
  // Handle Google Ads API metrics
  if (provider === 'Google Ads API') {
    if (requestData?.keywords?.length) {
      metrics.customMetric = {
        keywordSuggestion: requestData.keywords.length
      };
    }
  }
  
  // Handle DataForSEO metrics
  if (provider === 'DataForSEO') {
    if (responseData?.tasks?.length) {
      metrics.customMetric = {
        serp: responseData.tasks.length
      };
    }
  }
  
  return metrics;
}