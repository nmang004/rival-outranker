import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze text content using OpenAI
 * @param text - Text content to analyze
 * @returns Analysis results with SEO insights
 */
export async function analyzeTextContent(text: string) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert analyzing document content. Extract key SEO insights, identify issues, and provide recommendations."
        },
        {
          role: "user",
          content: `Analyze the following content from an SEO perspective. Extract key insights related to SEO practices, identify potential issues, and provide specific recommendations for improvement. Focus on meta tags, keywords, content structure, and other SEO elements.\n\nCONTENT TO ANALYZE:\n${text.slice(0, 10000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return {
      analysis: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    };
  } catch (error) {
    console.error('Error analyzing content with OpenAI:', error);
    throw new Error('Failed to analyze content with AI. Please try again.');
  }
}

/**
 * Analyze chart or image data
 * @param chartData - Chart metadata and extracted values
 * @param imgText - OCR extracted text from the image
 * @returns Analysis of chart data with insights
 */
export async function analyzeChartData(chartData: any, imgText: string) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO data visualization expert. Your task is to analyze chart data and provide meaningful insights."
        },
        {
          role: "user",
          content: `Analyze this chart data from an SEO perspective. The chart type is: ${chartData.chartType || "unknown"}. 
          Number of data points: ${chartData.dataPoints || 0}. 
          Extracted values: ${JSON.stringify(chartData.extractedValues || [])}. 
          Extracted labels: ${JSON.stringify(chartData.extractedLabels || [])}. 
          OCR text from image: "${imgText}".
          
          Provide insights about what this data means for SEO, identify trends if any, and suggest what actions should be taken based on this data.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return {
      analysis: response.choices[0].message.content,
      model: response.model
    };
  } catch (error) {
    console.error('Error analyzing chart with OpenAI:', error);
    throw new Error('Failed to analyze chart data with AI. Please try again.');
  }
}

/**
 * Generate summarized SEO recommendations
 * @param analysisResults - Full analysis results
 * @returns Prioritized recommendations
 */
export async function generateRecommendations(analysisResults: any) {
  try {
    // Create a condensed version of the analysis
    const analysisData = {
      metaTags: analysisResults.metaTags || [],
      keywords: analysisResults.keywords || [],
      contentStructure: analysisResults.contentStructure || {},
      chartInsights: analysisResults.chartInsights || '',
      extractedText: ((analysisResults.extractedText || '') as string).slice(0, 1000) + '...'
    };

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO strategist who prioritizes actionable recommendations based on document analysis."
        },
        {
          role: "user",
          content: `Based on this SEO analysis data, provide the top 5 most critical and actionable recommendations. 
          Prioritize recommendations that would have the biggest impact on search visibility and user experience.
          Present recommendations in order of importance.
          
          ANALYSIS DATA:
          ${JSON.stringify(analysisData, null, 2)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const content = response.choices[0].message.content || '{"recommendations":[]}';
    const recommendations = JSON.parse(content);
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations with OpenAI:', error);
    throw new Error('Failed to generate recommendations with AI. Please try again.');
  }
}

export default {
  analyzeTextContent,
  analyzeChartData,
  generateRecommendations
};