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
 * Analyze a PDF file directly using OpenAI's multimodal capabilities
 */
export async function analyzePdfFile(pdfBuffer: Buffer, fileName: string): Promise<OpenAIAnalysisResult> {
  try {
    // Create a base64 encoding of the PDF
    const base64Pdf = pdfBuffer.toString('base64');
    
    console.log("Calling OpenAI API with direct PDF analysis...");
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are an experienced SEO Account Director preparing monthly client reports. Your expertise is in translating complex SEO data into clear, actionable insights that demonstrate value to clients. Format your responses with professional markdown, including clear section headings, bullet points for key metrics, and concise explanations of trends. Always highlight positive changes and provide context for any negative metrics. Focus on data that shows ROI and business impact."
          },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "I've uploaded a PDF SEO report. Please extract and summarize the key performance highlights into a format suitable for a monthly client update. Focus specifically on: 1) Organic traffic growth, 2) Keyword rankings, 3) Top-performing pages, 4) Google Search Console data (impressions, clicks, CTR, average position), and 5) Lead generation if available. Keep the tone client-friendly and professional. Use clear headers and formatting."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });
      
      const analysisText = response.choices[0].message.content || '';
      console.log("Successfully received PDF analysis from OpenAI API");
      
      return {
        analysis: analysisText,
        model: "gpt-4o"
      };
    } catch (apiError) {
      console.error("OpenAI API call failed for PDF analysis:", apiError);
      throw new Error(`OpenAI API call failed for PDF: ${apiError.message}`);
    }
  } catch (error) {
    console.error("Error during PDF analysis with OpenAI:", error);
    return {
      analysis: "## AI Analysis Temporarily Unavailable\n\nWe were unable to complete the AI analysis of this PDF document. Please try again later.",
      model: "error"
    };
  }
}

export default {
  analyzeTextContent
};