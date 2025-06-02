import { Handler } from '@netlify/functions';
import { authenticate } from '../../server/middleware/auth';
import { storage } from '../../server/storage';

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
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
    // Create a mock request object for middleware
    const mockReq: any = {
      headers: event.headers,
      user: null,
    };
    
    const mockRes: any = {
      status: (code: number) => ({
        json: (data: any) => ({ statusCode: code, body: JSON.stringify(data) })
      }),
      json: (data: any) => ({ statusCode: 200, body: JSON.stringify(data) })
    };

    // Check authentication
    return new Promise((resolve) => {
      authenticate(mockReq, mockRes, async () => {
        try {
          if (!mockReq.user?.userId) {
            resolve({
              statusCode: 401,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ message: 'Unauthorized' }),
            });
            return;
          }

          const userId = mockReq.user.userId;
          const user = await storage.getUser(userId);
          
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(user),
          });
        } catch (error) {
          console.error("Error fetching user:", error);
          resolve({
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: "Failed to fetch user" }),
          });
        }
      });
    });
  } catch (error) {
    console.error('Auth error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Authentication failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};