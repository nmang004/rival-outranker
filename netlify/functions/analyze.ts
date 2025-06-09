import { Handler } from '@netlify/functions';
import { analyzer } from '../../server/services/analysis/analyzer.service';
import { optionalAuth } from '../../server/middleware/auth';
import { trackApiUsage } from '../../server/middleware/apiUsageMiddleware';

// Helper to parse query parameters
const parseQuery = (queryStringParameters: Record<string, string> | null) => {
  if (!queryStringParameters) return {};
  return queryStringParameters;
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    let body: any = {};
    if (event.body) {
      body = JSON.parse(event.body);
    }

    const { url, primaryKeyword } = body;

    if (!url) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'URL is required' }),
      };
    }

    // Perform SEO analysis
    const analysisResult = await analyzer.analyze(url, { forcedPrimaryKeyword: primaryKeyword });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(analysisResult),
    };
  } catch (error) {
    console.error('Analysis error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Analysis failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};