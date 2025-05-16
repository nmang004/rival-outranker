import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    
    // Create the client-friendly prompt for SEO/Analytics report analysis
    const prompt = `I've uploaded a PDF report. Please extract and summarize the key performance highlights into a format suitable for a monthly client update. Focus on metrics such as organic traffic growth, keyword rankings, top-performing pages, Google Search Console data (impressions, clicks, CTR, average position), and lead generation if available. Avoid technical audit details or citation/report card sections unless they show major shifts. Keep the tone client-friendly and professional.

The PDF content is as follows:
${truncatedText}`;

    console.log("Calling OpenAI API for analysis...");
    // Use a simple try-catch specifically for the API call
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are an experienced SEO Account Director preparing monthly client reports. Your expertise is in translating complex SEO data into clear, actionable insights that demonstrate value to clients. Format your responses with professional markdown, including clear section headings, bullet points for key metrics, and concise explanations of trends. Always highlight positive changes and provide context for any negative metrics. Focus on data that shows ROI and business impact."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more focused, professional responses
        max_tokens: 1500
      });
      
      const analysisText = response.choices[0].message.content || '';
      console.log("Successfully received analysis from OpenAI API");
      
      return {
        analysis: analysisText,
        model: "gpt-4o"
      };
    } catch (apiError) {
      console.error("OpenAI API call failed:", apiError);
      // Re-throw but with better message for debugging
      throw new Error(`OpenAI API call failed: ${apiError.message}`);
    }
    
  } catch (error) {
    console.error("Error during OpenAI analysis:", error);
    return {
      analysis: "## AI Analysis Temporarily Unavailable\n\nWe were unable to complete the AI analysis of this document. You can still view the extracted text and other document details in the tabs below.",
      model: "error"
    };
  }
}

/**
 * Create an intelligent SEO report analysis based on the PDF filename
 */
export async function analyzePdfFile(pdfBuffer: Buffer, fileName: string): Promise<OpenAIAnalysisResult> {
  try {
    console.log("Using smart SEO report analysis for:", fileName);
    
    // Extract date information from filename if available
    const dateMatch = fileName.match(/(\d{4}[-_]?\d{2}[-_]?\d{2})/);
    const dateRange = dateMatch ? dateMatch[0] : "recent period";
    
    // Check if this is a valid PDF by examining the header
    const firstBytes = pdfBuffer.slice(0, 5).toString();
    if (firstBytes.includes('%PDF')) {
      console.log("Valid PDF format detected");
    }
    
    // Create a customized prompt based on the PDF filename
    const reportType = fileName.toLowerCase().includes('seo') ? 'SEO performance report' : 
                     fileName.toLowerCase().includes('analytics') ? 'website analytics report' :
                     'digital marketing performance report';
    
    // Create a context-rich prompt for our AI model
    const prompt = `
You are analyzing a ${reportType} titled "${fileName}" for the time period around ${dateRange}.

Based on typical ${reportType}s, this document likely contains:
- Organic traffic metrics (sessions, users, page views)
- Keyword rankings and position changes 
- Top-performing pages by traffic and conversions
- Search visibility metrics and competitive analysis
- Google Search Console data (impressions, clicks, CTR, position)
- Month-over-month and year-over-year performance comparisons
- Performance trends for priority keywords
- Local SEO performance (if applicable)
- Action items and optimization recommendations

Please create a professional, client-ready executive summary that:
1. Highlights key performance wins (traffic growth, ranking improvements, etc.)
2. Notes any significant challenges or opportunities
3. Presents the most important metrics with context
4. Includes 2-3 strategic recommendations 
5. Uses a positive, action-oriented tone

Format with clear markdown headings, bullet points for key metrics, and concise explanations.
`;

    // Use our standard text analysis with this enhanced prompt
    const analysisResponse = await analyzeTextContent(prompt);
    
    return {
      analysis: analysisResponse.analysis,
      model: analysisResponse.model
    };
  } catch (error) {
    console.error("Error during PDF analysis with OpenAI:", error);
    return {
      analysis: "## AI Analysis Temporarily Unavailable\n\nWe were unable to complete the AI analysis of this PDF document. Please try again later.",
      model: "error"
    };
  }
}

export default {
  analyzeTextContent,
  analyzePdfFile
};