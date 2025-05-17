import { db } from "./db";
import { apiUsage } from "../shared/schema";

async function populateSampleData() {
  console.log("Populating API usage tracking table with sample data...");
  
  // Create sample API providers
  const providers = ['google-ads', 'dataforseo', 'openai', 'internal'];
  
  // Create sample endpoints
  const endpoints = [
    '/api/keyword-research', 
    '/api/analyze', 
    '/api/deep-content', 
    '/api/competitors', 
    '/api/rival-audit',
    '/api/backlinks',
    '/api/openai-chat'
  ];
  
  // Create sample methods
  const methods = ['GET', 'POST'];
  
  // Create sample status codes with different distributions
  const statusCodes = [
    200, 200, 200, 200, 200, 200, 200, 200, 200, 200, // 10x 200 for high success rate
    400, 400, 401, 403, 404, 429, 500               // Some errors for realistic data
  ];
  
  // Sample API usage records to create
  const records = [];
  
  // Current date
  const now = new Date();
  
  // Generate data for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Create different amounts of API calls per day
    const callsPerDay = Math.floor(Math.random() * 20) + 30; // 30-50 calls per day
    
    for (let j = 0; j < callsPerDay; j++) {
      // Randomly distribute throughout the day
      const timestamp = new Date(date);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));
      timestamp.setSeconds(Math.floor(Math.random() * 60));
      
      // Select random provider
      const provider = providers[Math.floor(Math.random() * providers.length)];
      
      // Select random endpoint
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      // Select random method
      const method = methods[Math.floor(Math.random() * methods.length)];
      
      // Select random status code
      const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      
      // Generate response time between 50-500ms
      const responseTime = Math.floor(Math.random() * 450) + 50;
      
      // Calculate estimated cost based on provider
      let estimatedCost = 0;
      if (provider === 'google-ads') {
        estimatedCost = Math.random() * 0.05 + 0.01; // $0.01-$0.06 per call
      } else if (provider === 'dataforseo') {
        estimatedCost = Math.random() * 0.08 + 0.02; // $0.02-$0.10 per call
      } else if (provider === 'openai') {
        estimatedCost = Math.random() * 0.12 + 0.03; // $0.03-$0.15 per call
      }
      
      // Sample request data
      const requestData = {
        query: endpoint.includes('keyword') ? 'hvac repair near me' : 
               endpoint.includes('analyze') ? 'https://example.com' :
               endpoint.includes('content') ? 'heating and cooling' :
               endpoint.includes('competitors') ? 'competitor analysis' :
               endpoint.includes('audit') ? 'SEO audit' :
               endpoint.includes('backlinks') ? 'domain authority' :
               'AI assistant query'
      };
      
      // Sample response data for successful requests
      const responseData = statusCode >= 200 && statusCode < 300 ? {
        success: true,
        data: endpoint.includes('keyword') ? { keywords: ['hvac repair', 'ac repair', 'heating repair'] } :
              endpoint.includes('analyze') ? { score: 78 } :
              endpoint.includes('content') ? { wordCount: 1250 } :
              endpoint.includes('competitors') ? { competitors: 5 } :
              endpoint.includes('audit') ? { issues: 12 } :
              endpoint.includes('backlinks') ? { backlinks: 230 } :
              { message: 'AI response generated' }
      } : null;
      
      // Sample error message for failed requests
      const errorMessage = statusCode >= 400 ? 
                         statusCode === 400 ? 'Bad request: Invalid parameters' :
                         statusCode === 401 ? 'Unauthorized: Authentication required' :
                         statusCode === 403 ? 'Forbidden: Insufficient permissions' :
                         statusCode === 404 ? 'Not found: Resource does not exist' :
                         statusCode === 429 ? 'Rate limit exceeded' :
                         'Internal server error' : null;
                         
      // Sample usage metrics                    
      const usageMetrics = provider === 'openai' ? { tokens: Math.floor(Math.random() * 1000) + 200 } : 
                          provider === 'dataforseo' ? { credits: Math.floor(Math.random() * 5) + 1 } :
                          provider === 'google-ads' ? { operations: 1 } :
                          null;
      
      // Create the record
      records.push({
        endpoint,
        method,
        statusCode,
        responseTime,
        timestamp,
        apiProvider: provider,
        requestData,
        responseData,
        errorMessage,
        ipAddress: '127.0.0.1',
        userAgent: 'API Usage Sample Generator',
        estimatedCost,
        usageMetrics
      });
    }
  }
  
  // Insert records in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await db.insert(apiUsage).values(batch);
    console.log(`Inserted ${i + batch.length} of ${records.length} records...`);
  }
  
  console.log(`Successfully inserted ${records.length} sample API usage records!`);
}

// Run the population script
populateSampleData()
  .then(() => {
    console.log('Database population completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error populating database:', error);
    process.exit(1);
  });