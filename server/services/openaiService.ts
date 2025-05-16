import OpenAI from 'openai';

// Create the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIAnalysisResult {
  analysis: string;
  model: string;
}

/**
 * Analyze text content using OpenAI
 */
export async function analyzeTextContent(text: string): Promise<OpenAIAnalysisResult> {
  try {
    // Truncate text if it's too long to avoid token limits
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) : text;
    
    // Create the prompt for SEO/Analytics report analysis
    const prompt = `You are an SEO analyst examining a PDF document. The document likely contains SEO or analytics data, performance metrics, and visualizations.

Your task:
1. Identify the main purpose of the document
2. Extract and summarize key metrics
3. Note any significant trends (positive or negative)
4. Identify the timeframe covered by the report
5. Format your response in markdown with sections organized by topic
6. Use bullet points for key findings

Ensure your analysis is concise but comprehensive, focusing on the most important information that would be valuable to a marketing director or account manager who needs to report to a client.

Here is the document text:
${truncatedText}`;

    console.log("Calling OpenAI API for analysis...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful SEO analyst assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });
    
    const analysisText = response.choices[0].message.content || '';
    console.log("Successfully received analysis from OpenAI API");
    
    return {
      analysis: analysisText,
      model: "gpt-4o"
    };
    
  } catch (error) {
    console.error("Error during OpenAI analysis:", error);
    return {
      analysis: "## AI Analysis Temporarily Unavailable\n\nWe were unable to complete the AI analysis of this document. You can still view the extracted text and other document details in the tabs below.",
      model: "error"
    };
  }
}

export default {
  analyzeTextContent
};