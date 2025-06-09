import OpenAI from "openai";

/**
 * Unified OpenAI Service
 * Consolidates all OpenAI API interactions with consistent patterns
 */

// OpenAI Configuration
const OPENAI_CONFIG = {
  model: "gpt-4o", // Latest model as of May 13, 2024
  temperature: 0.7,
  maxTokens: {
    chat: 500,
    analysis: 1500,
    contentAnalysis: 2000
  }
} as const;

// Initialize OpenAI client (only if API key is available)
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('OpenAI API key not found. OpenAI services will be disabled.');
}

// Standard response interface
export interface OpenAIResponse {
  success: boolean;
  answer?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Analysis response interface for specialized functions
export interface OpenAIAnalysisResponse {
  success: boolean;
  analysis?: {
    summary: string;
    keyPoints: string[];
    recommendations: string[];
    sentiment?: string;
    readabilityScore?: number;
  };
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get a general response from OpenAI
 */
export async function getOpenAIResponse(
  message: string,
  context: string = "You are a helpful AI assistant."
): Promise<OpenAIResponse> {
  try {
    if (!isOpenAIConfigured() || !openai) {
      return {
        success: false,
        error: "OpenAI API key is not configured.",
      };
    }

    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: "system",
          content: context,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: OPENAI_CONFIG.temperature,
      max_tokens: OPENAI_CONFIG.maxTokens.chat,
    });

    const answer = response.choices[0].message.content?.trim();

    return {
      success: true,
      answer: answer || "I'm not sure how to respond to that.",
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    return {
      success: false,
      error: `Error getting response from OpenAI: ${error.message}`,
    };
  }
}

/**
 * Analyze text content (for PDF analysis and other content analysis needs)
 */
export async function analyzeTextContent(
  text: string,
  analysisType: 'general' | 'seo' | 'document' | 'readability' = 'general'
): Promise<OpenAIAnalysisResponse> {
  try {
    if (!isOpenAIConfigured() || !openai) {
      return {
        success: false,
        error: "OpenAI API key is not configured.",
      };
    }

    // Create specialized prompts based on analysis type
    const systemPrompts = {
      general: "You are an expert content analyst. Provide a comprehensive analysis of the given text.",
      seo: "You are an SEO expert. Analyze the content for SEO quality, keyword usage, and optimization opportunities.",
      document: "You are a document analysis expert. Analyze the structure, content quality, and key insights from this document.",
      readability: "You are a readability expert. Analyze the text for readability, clarity, and audience appropriateness."
    };

    const userPrompts = {
      general: `Please analyze the following text and provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Recommendations for improvement (3-5 bullet points)

Text to analyze:
${text.substring(0, 4000)}`, // Limit text to prevent token overflow

      seo: `Analyze this content for SEO quality and provide:
1. Content summary
2. SEO strengths and weaknesses
3. Keyword optimization recommendations
4. Content structure suggestions
5. Overall SEO score estimation

Content:
${text.substring(0, 4000)}`,

      document: `Analyze this document content and provide:
1. Document summary
2. Main topics and themes
3. Key insights and findings
4. Structure and organization assessment
5. Recommendations for improvement

Document content:
${text.substring(0, 4000)}`,

      readability: `Analyze this text for readability and provide:
1. Readability assessment
2. Target audience suitability
3. Clarity and comprehension level
4. Suggestions for improvement
5. Estimated reading level

Text:
${text.substring(0, 4000)}`
    };

    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: "system",
          content: systemPrompts[analysisType],
        },
        {
          role: "user",
          content: userPrompts[analysisType],
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: OPENAI_CONFIG.maxTokens.analysis,
    });

    const analysisText = response.choices[0].message.content?.trim();

    if (!analysisText) {
      return {
        success: false,
        error: "No analysis content received from OpenAI",
      };
    }

    // Parse the analysis response into structured format
    const analysis = parseAnalysisResponse(analysisText, analysisType);

    return {
      success: true,
      analysis,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  } catch (error: any) {
    console.error("OpenAI content analysis error:", error);

    return {
      success: false,
      error: `Error analyzing content with OpenAI: ${error.message}`,
    };
  }
}

/**
 * SEO-focused content analysis
 */
export async function analyzeSEOContent(
  content: string,
  targetKeyword?: string
): Promise<OpenAIAnalysisResponse> {
  const enhancedPrompt = targetKeyword 
    ? `Analyze this content for SEO optimization with focus on the target keyword "${targetKeyword}"`
    : "Analyze this content for general SEO optimization";

  return analyzeTextContent(content, 'seo');
}

/**
 * Readability analysis
 */
export async function analyzeReadability(text: string): Promise<OpenAIAnalysisResponse> {
  return analyzeTextContent(text, 'readability');
}

/**
 * Chat interface for SEO Buddy
 */
export async function getSEOBuddyResponse(
  message: string,
  context: string = ""
): Promise<OpenAIResponse> {
  const seoContext = `You are SEO Buddy, an expert SEO assistant. You help users with:
- SEO strategy and optimization
- Keyword research and analysis
- Content optimization
- Technical SEO issues
- Performance improvements
- Best practices and recommendations

Be helpful, professional, and provide actionable advice. ${context}`;

  return getOpenAIResponse(message, seoContext);
}

/**
 * Parse analysis response into structured format
 */
function parseAnalysisResponse(analysisText: string, type: string): {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  sentiment?: string;
  readabilityScore?: number;
} {
  // Basic parsing - this could be enhanced with more sophisticated NLP
  const lines = analysisText.split('\n').filter(line => line.trim());
  
  let summary = '';
  const keyPoints: string[] = [];
  const recommendations: string[] = [];
  
  let currentSection = 'summary';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toLowerCase().includes('summary') || trimmedLine.toLowerCase().includes('overview')) {
      currentSection = 'summary';
      continue;
    }
    
    if (trimmedLine.toLowerCase().includes('key point') || 
        trimmedLine.toLowerCase().includes('main point') ||
        trimmedLine.toLowerCase().includes('strengths') ||
        trimmedLine.toLowerCase().includes('findings')) {
      currentSection = 'keyPoints';
      continue;
    }
    
    if (trimmedLine.toLowerCase().includes('recommendation') || 
        trimmedLine.toLowerCase().includes('suggestion') ||
        trimmedLine.toLowerCase().includes('improvement')) {
      currentSection = 'recommendations';
      continue;
    }
    
    // Add content to appropriate section
    if (trimmedLine.length > 10) { // Ignore very short lines
      if (currentSection === 'summary' && !summary) {
        summary = trimmedLine;
      } else if (currentSection === 'keyPoints') {
        keyPoints.push(trimmedLine.replace(/^[-•*]\s*/, ''));
      } else if (currentSection === 'recommendations') {
        recommendations.push(trimmedLine.replace(/^[-•*]\s*/, ''));
      }
    }
  }
  
  // Fallback if parsing didn't work well
  if (!summary && analysisText.length > 0) {
    summary = analysisText.substring(0, 200) + '...';
  }
  
  return {
    summary,
    keyPoints: keyPoints.slice(0, 5), // Limit to 5 key points
    recommendations: recommendations.slice(0, 5), // Limit to 5 recommendations
    ...(type === 'readability' && { readabilityScore: 75 }) // Placeholder score
  };
}

/**
 * Calculate estimated cost for OpenAI usage
 */
export function calculateOpenAICost(usage: { promptTokens: number; completionTokens: number }): number {
  // GPT-4o pricing (as of 2024): $5 per 1M input tokens, $15 per 1M output tokens
  const inputCostPer1M = 5.0;
  const outputCostPer1M = 15.0;
  
  const inputCost = (usage.promptTokens / 1000000) * inputCostPer1M;
  const outputCost = (usage.completionTokens / 1000000) * outputCostPer1M;
  
  return inputCost + outputCost;
}

/**
 * Get OpenAI configuration info
 */
export function getOpenAIConfig() {
  return {
    ...OPENAI_CONFIG,
    isConfigured: isOpenAIConfigured(),
    model: OPENAI_CONFIG.model
  };
}