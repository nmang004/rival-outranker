import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze text content using OpenAI's GPT model
 * Includes fallback for API limitations
 */
export async function analyzeTextContent(text: string): Promise<string> {
  try {
    // If text is too long, truncate it to avoid token limits
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '...' : text;
    
    // Attempt to call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { 
          role: "system", 
          content: "You are an expert SEO analyst reviewing a PDF document. Analyze the content and provide a comprehensive yet concise report focusing on SEO metrics, keyword analysis, content quality, and actionable recommendations. Format with proper headings and bullet points." 
        },
        { 
          role: "user", 
          content: `Please analyze this SEO report document and provide key insights:\n\n${truncatedText}` 
        }
      ],
      max_tokens: 1000,
    });

    // Return the generated analysis
    return completion.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Error analyzing content with OpenAI:', error);
    
    // Handle API quota exceeded with detailed error
    if (error.code === 'insufficient_quota') {
      // Provide a helpful message about quota limits
      return "AI analysis unavailable: API usage quota exceeded. The system will use basic document analysis instead. For full AI analysis capabilities, please check API quota limits.";
    }
    
    // Create a fallback analysis based on text length and structure
    const fallbackAnalysis = generateFallbackAnalysis(text);
    
    if (fallbackAnalysis) {
      return fallbackAnalysis;
    }
    
    // If all fallbacks fail, throw a general error
    throw new Error('Failed to analyze content with AI. Please try again.');
  }
}

/**
 * Generate a fallback analysis when OpenAI API is unavailable
 */
function generateFallbackAnalysis(text: string): string {
  // Look for SEO-related terms in the text
  const seoTerms = ['SEO', 'keyword', 'organic', 'ranking', 'metadata', 'backlink', 'traffic', 'SERP'];
  const seoTermsFound = seoTerms.filter(term => text.includes(term));
  
  const wordCount = text.split(/\s+/).length;
  const paragraphCount = text.split(/\n\n+/).length;
  
  let analysis = '## Document Analysis (Local Processing)\n\n';
  analysis += '### Document Overview\n';
  analysis += `* Document length: ${wordCount} words\n`;
  analysis += `* Approximate sections: ${paragraphCount}\n\n`;
  
  if (seoTermsFound.length > 0) {
    analysis += '### SEO Content Detected\n';
    analysis += `* Document contains SEO-related terms: ${seoTermsFound.join(', ')}\n`;
    analysis += '* Appears to be an SEO report or analysis document\n\n';
  }
  
  analysis += '### Key Points\n';
  analysis += '* Basic document structure analysis completed\n';
  analysis += '* For detailed AI analysis, please ensure API quota is available\n';
  analysis += '* This is a fallback analysis due to API limitations\n\n';
  
  analysis += '### Next Steps\n';
  analysis += '* Review the extracted text tab for complete document content\n';
  analysis += '* Consider checking API quota if AI analysis is needed\n';
  
  return analysis;
}

export default {
  analyzeTextContent,
};