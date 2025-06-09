import { Router, Request, Response } from 'express';
import { getOpenAIResponse } from '../services/external/openai.service';

const router = Router();

// OpenAI chat endpoint
router.post("/openai-chat", async (req: Request, res: Response) => {
  try {
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7 } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }
    
    console.log(`OpenAI chat request with ${messages.length} messages`);
    
    try {
      // Get response from OpenAI service
      const response = await getOpenAIResponse(messages, model, temperature);
      
      res.json({
        success: true,
        response,
        model,
        timestamp: new Date(),
        messageCount: messages.length
      });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      
      // Return a fallback response if OpenAI fails
      const fallbackResponse = {
        role: 'assistant',
        content: 'I apologize, but I\'m currently unable to process your request. Please try again later or contact support if the issue persists.'
      };
      
      res.json({
        success: false,
        response: fallbackResponse,
        error: 'OpenAI service temporarily unavailable',
        model,
        timestamp: new Date(),
        messageCount: messages.length
      });
    }
    
  } catch (error) {
    console.error("Error in OpenAI chat endpoint:", error);
    res.status(500).json({ error: "Failed to process chat request" });
  }
});

// Chat usage tracking endpoint
router.post("/chat-usage", async (req: Request, res: Response) => {
  try {
    const { tokens, model = 'gpt-3.5-turbo', requestType = 'chat' } = req.body;
    
    if (typeof tokens !== 'number' || tokens < 0) {
      return res.status(400).json({ error: "Valid token count is required" });
    }
    
    console.log(`Chat usage tracking: ${tokens} tokens for model ${model}`);
    
    // Track usage (in a real implementation, this would be stored in database)
    const usageRecord = {
      tokens,
      model,
      requestType,
      timestamp: new Date(),
      cost: calculateCost(tokens, model)
    };
    
    res.json({
      success: true,
      usage: usageRecord,
      message: 'Usage tracked successfully'
    });
    
  } catch (error) {
    console.error("Error tracking chat usage:", error);
    res.status(500).json({ error: "Failed to track usage" });
  }
});

// Helper function to calculate cost based on tokens and model
function calculateCost(tokens: number, model: string): number {
  // Simplified cost calculation based on OpenAI pricing
  const costPerToken = {
    'gpt-3.5-turbo': 0.002 / 1000, // $0.002 per 1K tokens
    'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens
    'gpt-4-turbo': 0.01 / 1000 // $0.01 per 1K tokens
  };
  
  const rate = costPerToken[model as keyof typeof costPerToken] || costPerToken['gpt-3.5-turbo'];
  return tokens * rate;
}

export { router as openaiRoutes };