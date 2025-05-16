import axios from 'axios';

// Function to get an answer from OpenAI for queries outside our knowledge base
export async function getOpenAIResponse(query: string): Promise<string> {
  try {
    const response = await axios.post('/api/openai-chat', {
      message: query,
      context: "You are an SEO expert assistant helping with SEO-related questions. Provide detailed, accurate, and helpful information about search engine optimization techniques, best practices, and strategies. Format your responses with markdown for better readability, using **bold text** for important points, numbered lists, and bullet points where appropriate."
    });
    
    return response.data.answer;
  } catch (error) {
    console.error('Error fetching from OpenAI:', error);
    throw new Error('Unable to get a response from the AI service');
  }
}