import { Handler } from '@netlify/functions';
import { keywordService } from '../../server/services/keywordService';

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

    const { keyword, includeSearchVolume = false } = body;

    if (!keyword) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Keyword is required' }),
      };
    }

    // Get keyword data using the service
    const keywordData = await keywordService.getKeywordData(keyword, includeSearchVolume);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(keywordData),
    };
  } catch (error) {
    console.error('Keyword research error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Keyword research failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};