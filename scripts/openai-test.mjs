// Simple script to test OpenAI API connection
import 'dotenv/config';
import OpenAI from 'openai';

async function testOpenAI() {
  try {
    // Log the key length for debugging (not the actual key)
    console.log(`OpenAI API key found (length: ${process.env.OPENAI_API_KEY.length})`);
    
    // Create the OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Attempting to connect to OpenAI API...');
    
    // Make a simple test call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Please respond with "OpenAI API is working correctly!" if you receive this message.' }
      ],
      max_tokens: 50
    });

    // Log the response
    console.log('OpenAI API Response:');
    console.log(response.choices[0].message.content);
    console.log('API call was successful!');
    
  } catch (error) {
    console.error('Error testing OpenAI API:');
    console.error(error);
  }
}

testOpenAI();