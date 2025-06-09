import { Handler } from '@netlify/functions';
import { competitorAnalyzer } from '../../server/services/competitorAnalyzer';

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { url, competitors = [] } = body;

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

    // Perform competitor analysis
    const analysisResult = await competitorAnalyzer.analyzeCompetitors(url, competitors);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(analysisResult),
    };
  } catch (error) {
    console.error('Competitor analysis error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Competitor analysis failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};