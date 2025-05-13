import * as cheerio from 'cheerio';
import { CrawlerOutput } from '@/lib/types';

// Define interfaces for the deep content analysis
interface ContentStructureMetrics {
  headingStructure: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    headingsWithKeywords: number;
    totalHeadings: number;
  };
  paragraphStructure: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    avgParagraphLength: number;
    shortParagraphCount: number;
    longParagraphCount: number;
    totalParagraphs: number;
  };
  contentDistribution: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    introductionQuality: number;
    bodyContentQuality: number;
    conclusionQuality: number;
  };
}

interface ReadabilityMetrics {
  fleschReadingEase: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    interpretation: string;
  };
  sentenceComplexity: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    avgSentenceLength: number;
    complexSentencePercentage: number;
  };
  wordChoice: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    simpleWordPercentage: number;
    complexWordPercentage: number;
    avgWordLength: number;
  };
}

interface SemanticRelevanceMetrics {
  topicCoverage: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    keyTopics: string[];
    topicDepthScore: number;
  };
  keywordContext: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    keywordInContext: boolean;
    semanticRelevance: number;
  };
  entityAnalysis: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    entities: {
      type: string;
      name: string;
      frequency: number;
    }[];
  };
}

interface ContentEngagementMetrics {
  contentFormats: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    hasLists: boolean;
    hasTables: boolean;
    hasBlockquotes: boolean;
    hasHighlightedText: boolean;
  };
  interactiveElements: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    hasVideos: boolean;
    hasEmbeds: boolean;
    hasInteractiveContent: boolean;
  };
  callsToAction: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
    hasCTA: boolean;
    ctaQuality: number;
    ctaCount: number;
  };
}

interface DeepContentAnalysisResult {
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
  structure: ContentStructureMetrics;
  readability: ReadabilityMetrics;
  semanticRelevance: SemanticRelevanceMetrics;
  engagement: ContentEngagementMetrics;
  recommendations: string[];
}

class DeepContentAnalyzer {
  /**
   * Perform deep content analysis 
   */
  async analyzeContent(
    pageData: CrawlerOutput, 
    primaryKeyword: string
  ): Promise<DeepContentAnalysisResult> {
    try {
      const $ = cheerio.load(pageData.content.text);
      
      // 1. Analyze content structure
      const structureMetrics = this.analyzeContentStructure($, pageData, primaryKeyword);
      
      // 2. Analyze readability
      const readabilityMetrics = this.analyzeReadability(pageData);
      
      // 3. Analyze semantic relevance
      const semanticMetrics = this.analyzeSemanticRelevance(pageData, primaryKeyword);
      
      // 4. Analyze engagement metrics
      const engagementMetrics = this.analyzeContentEngagement($, pageData);
      
      // 5. Generate recommendations
      const recommendations = this.generateRecommendations(
        structureMetrics,
        readabilityMetrics,
        semanticMetrics,
        engagementMetrics
      );
      
      // 6. Calculate overall score
      const overallScore = this.calculateOverallScore(
        structureMetrics,
        readabilityMetrics,
        semanticMetrics,
        engagementMetrics
      );
      
      return {
        overallScore,
        structure: structureMetrics,
        readability: readabilityMetrics,
        semanticRelevance: semanticMetrics,
        engagement: engagementMetrics,
        recommendations
      };
    } catch (error) {
      console.error('Error in deep content analysis:', error);
      
      // Return default result on error
      return this.getDefaultAnalysisResult();
    }
  }
  
  /**
   * Analyze content structure metrics
   */
  private analyzeContentStructure(
    $: cheerio.CheerioAPI, 
    pageData: CrawlerOutput, 
    primaryKeyword: string
  ): ContentStructureMetrics {
    // Heading structure analysis
    const headings = {
      h1: pageData.headings.h1,
      h2: pageData.headings.h2,
      h3: pageData.headings.h3,
      h4: pageData.headings.h4,
      h5: pageData.headings.h5,
      h6: pageData.headings.h6
    };
    
    const totalHeadings = 
      headings.h1.length + 
      headings.h2.length + 
      headings.h3.length + 
      headings.h4.length + 
      headings.h5.length + 
      headings.h6.length;
    
    // Count headings with the primary keyword
    const lowercaseKeyword = primaryKeyword.toLowerCase();
    const headingsWithKeywords = [
      ...headings.h1,
      ...headings.h2,
      ...headings.h3,
      ...headings.h4,
      ...headings.h5,
      ...headings.h6
    ].filter(heading => heading.toLowerCase().includes(lowercaseKeyword)).length;
    
    const headingScore = this.calculateHeadingScore(
      headings,
      totalHeadings,
      headingsWithKeywords
    );
    
    // Paragraph structure analysis
    const paragraphs = pageData.content.paragraphs;
    const totalParagraphs = paragraphs.length;
    
    // Calculate avg paragraph length (words)
    const avgParagraphLength = paragraphs.reduce(
      (sum, p) => sum + (p.match(/\S+/g) || []).length, 0
    ) / (totalParagraphs || 1);
    
    // Count short paragraphs (< 20 words) and long paragraphs (> 200 words)
    const shortParagraphCount = paragraphs.filter(
      p => (p.match(/\S+/g) || []).length < 20
    ).length;
    
    const longParagraphCount = paragraphs.filter(
      p => (p.match(/\S+/g) || []).length > 200
    ).length;
    
    const paragraphScore = this.calculateParagraphScore(
      avgParagraphLength,
      shortParagraphCount,
      longParagraphCount,
      totalParagraphs
    );
    
    // Content distribution analysis
    const contentLength = pageData.content.text.length;
    const wordCount = pageData.content.wordCount;
    
    // Estimate intro, body, conclusion quality
    const hasIntro = paragraphs.length >= 1;
    const hasConclusion = paragraphs.length >= 3;
    const introQuality = hasIntro ? this.estimateIntroQuality(paragraphs[0], primaryKeyword) : 0;
    
    const conclusionQuality = hasConclusion 
      ? this.estimateConclusionQuality(paragraphs[paragraphs.length - 1], primaryKeyword)
      : 0;
    
    const bodyContentQuality = this.estimateBodyContentQuality(
      wordCount,
      headings,
      totalParagraphs
    );
    
    const contentDistributionScore = this.calculateContentDistributionScore(
      introQuality,
      bodyContentQuality,
      conclusionQuality
    );
    
    return {
      headingStructure: {
        score: headingScore,
        category: this.getScoreCategory(headingScore),
        headingsWithKeywords,
        totalHeadings,
      },
      paragraphStructure: {
        score: paragraphScore,
        category: this.getScoreCategory(paragraphScore),
        avgParagraphLength,
        shortParagraphCount,
        longParagraphCount,
        totalParagraphs,
      },
      contentDistribution: {
        score: contentDistributionScore,
        category: this.getScoreCategory(contentDistributionScore),
        introductionQuality: introQuality,
        bodyContentQuality,
        conclusionQuality,
      }
    };
  }
  
  /**
   * Calculate heading structure score
   */
  private calculateHeadingScore(
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
      h4: string[];
      h5: string[];
      h6: string[];
    },
    totalHeadings: number,
    headingsWithKeywords: number
  ): number {
    let score = 0;
    
    // Check if there's exactly one H1
    if (headings.h1.length === 1) {
      score += 20;
    } else if (headings.h1.length > 1) {
      score += 5; // Penalty for multiple H1s
    }
    
    // Check for H2s
    if (headings.h2.length >= 2) {
      score += 20;
    } else if (headings.h2.length === 1) {
      score += 10;
    }
    
    // Check for H3s
    if (headings.h3.length >= 2) {
      score += 10;
    } else if (headings.h3.length === 1) {
      score += 5;
    }
    
    // Check heading hierarchy (H2s should follow H1, etc.)
    const hasProperHierarchy = 
      (headings.h1.length === 0 || 
       (headings.h1.length > 0 && headings.h2.length > 0)) &&
      (headings.h2.length === 0 || 
       (headings.h2.length > 0 && (headings.h3.length > 0 || headings.h1.length > 0)));
    
    if (hasProperHierarchy) {
      score += 20;
    }
    
    // Check keyword presence in headings
    if (totalHeadings > 0) {
      const keywordHeadingRatio = headingsWithKeywords / totalHeadings;
      if (keywordHeadingRatio >= 0.5) {
        score += 30;
      } else if (keywordHeadingRatio >= 0.3) {
        score += 20;
      } else if (keywordHeadingRatio > 0) {
        score += 10;
      }
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate paragraph structure score
   */
  private calculateParagraphScore(
    avgParagraphLength: number,
    shortParagraphCount: number,
    longParagraphCount: number,
    totalParagraphs: number
  ): number {
    let score = 0;
    
    // Optimal paragraph length (40-120 words)
    if (avgParagraphLength >= 40 && avgParagraphLength <= 120) {
      score += 30;
    } else if (avgParagraphLength >= 20 && avgParagraphLength <= 150) {
      score += 20;
    } else if (avgParagraphLength > 0) {
      score += 10;
    }
    
    // Penalty for too many short paragraphs
    if (totalParagraphs > 0) {
      const shortParagraphRatio = shortParagraphCount / totalParagraphs;
      if (shortParagraphRatio <= 0.2) {
        score += 20;
      } else if (shortParagraphRatio <= 0.4) {
        score += 10;
      }
    }
    
    // Penalty for too many long paragraphs
    if (totalParagraphs > 0) {
      const longParagraphRatio = longParagraphCount / totalParagraphs;
      if (longParagraphRatio <= 0.1) {
        score += 20;
      } else if (longParagraphRatio <= 0.2) {
        score += 10;
      }
    }
    
    // Bonus for good paragraph count
    if (totalParagraphs >= 5 && totalParagraphs <= 20) {
      score += 30;
    } else if (totalParagraphs > 20) {
      score += 20;
    } else if (totalParagraphs > 0) {
      score += 10;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Estimate introduction quality
   */
  private estimateIntroQuality(introText: string, primaryKeyword: string): number {
    if (!introText) {
      return 0;
    }
    
    let score = 0;
    const words = introText.match(/\S+/g) || [];
    
    // Length check
    if (words.length >= 30 && words.length <= 100) {
      score += 30;
    } else if (words.length > 100) {
      score += 15;
    } else if (words.length > 0) {
      score += 10;
    }
    
    // Keyword presence
    if (introText.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      score += 40;
    }
    
    // Hook presence (questions, stats, quotes, etc.)
    if (
      introText.includes('?') || 
      /\d+%/.test(introText) || 
      introText.includes('"') || 
      /^\W/.test(introText)
    ) {
      score += 30;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Estimate conclusion quality
   */
  private estimateConclusionQuality(conclusionText: string, primaryKeyword: string): number {
    if (!conclusionText) {
      return 0;
    }
    
    let score = 0;
    const words = conclusionText.match(/\S+/g) || [];
    
    // Length check
    if (words.length >= 30 && words.length <= 100) {
      score += 30;
    } else if (words.length > 100) {
      score += 15;
    } else if (words.length > 0) {
      score += 10;
    }
    
    // Keyword presence
    if (conclusionText.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      score += 30;
    }
    
    // Conclusion indicators
    const conclusionIndicators = [
      'in conclusion', 'to summarize', 'to sum up', 'finally', 'in summary',
      'overall', 'in the end', 'as a result', 'ultimately', 'in closing'
    ];
    
    const hasIndicator = conclusionIndicators.some(indicator => 
      conclusionText.toLowerCase().includes(indicator)
    );
    
    if (hasIndicator) {
      score += 20;
    }
    
    // Call to action
    if (
      conclusionText.includes('contact') || 
      conclusionText.includes('call') || 
      conclusionText.includes('email') || 
      conclusionText.includes('click') || 
      conclusionText.includes('buy') || 
      conclusionText.includes('visit') || 
      conclusionText.includes('download')
    ) {
      score += 20;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Estimate body content quality
   */
  private estimateBodyContentQuality(
    wordCount: number,
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
      h4: string[];
      h5: string[];
      h6: string[];
    },
    totalParagraphs: number
  ): number {
    let score = 0;
    
    // Content length
    if (wordCount >= 1000) {
      score += 30;
    } else if (wordCount >= 500) {
      score += 20;
    } else if (wordCount >= 300) {
      score += 10;
    }
    
    // Heading usage
    const h2Count = headings.h2.length;
    const h3Count = headings.h3.length;
    
    if (h2Count >= 2 && h3Count >= 3) {
      score += 40;
    } else if (h2Count >= 2 || h3Count >= 3) {
      score += 20;
    } else if (h2Count > 0 || h3Count > 0) {
      score += 10;
    }
    
    // Paragraph count
    if (totalParagraphs >= 10) {
      score += 30;
    } else if (totalParagraphs >= 5) {
      score += 20;
    } else if (totalParagraphs > 0) {
      score += 10;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate content distribution score
   */
  private calculateContentDistributionScore(
    introQuality: number,
    bodyContentQuality: number,
    conclusionQuality: number
  ): number {
    // Weighted average with higher weight for body content
    return Math.round(
      (introQuality * 0.25) + 
      (bodyContentQuality * 0.5) + 
      (conclusionQuality * 0.25)
    );
  }
  
  /**
   * Analyze readability metrics
   */
  private analyzeReadability(pageData: CrawlerOutput): ReadabilityMetrics {
    const text = pageData.content.text;
    const wordCount = pageData.content.wordCount;
    
    // Sentences analysis
    const sentences = this.extractSentences(text);
    const sentenceCount = sentences.length;
    
    // Calculate Flesch Reading Ease
    const avgSentenceLength = sentenceCount > 0 
      ? wordCount / sentenceCount 
      : 0;
    
    const syllableCount = this.countSyllables(text);
    const avgSyllablesPerWord = wordCount > 0 
      ? syllableCount / wordCount 
      : 0;
    
    const fleschScore = this.calculateFleschReadingEase(
      avgSentenceLength, 
      avgSyllablesPerWord
    );
    
    const fleschInterpretation = this.getFleschInterpretation(fleschScore);
    
    // Sentence complexity analysis
    const complexSentences = sentences.filter(sentence => 
      (sentence.match(/\S+/g) || []).length > 20 || 
      sentence.includes(',') || 
      sentence.includes(';')
    );
    
    const complexSentencePercentage = sentenceCount > 0 
      ? (complexSentences.length / sentenceCount) * 100 
      : 0;
    
    const sentenceComplexityScore = this.calculateSentenceComplexityScore(
      avgSentenceLength,
      complexSentencePercentage
    );
    
    // Word choice analysis
    const words = text.match(/\S+/g) || [];
    const complexWords = words.filter(word => this.isComplexWord(word));
    const complexWordPercentage = wordCount > 0 
      ? (complexWords.length / wordCount) * 100 
      : 0;
    const simpleWordPercentage = 100 - complexWordPercentage;
    
    const avgWordLength = words.reduce(
      (sum, word) => sum + word.length, 0
    ) / (words.length || 1);
    
    const wordChoiceScore = this.calculateWordChoiceScore(
      simpleWordPercentage,
      avgWordLength
    );
    
    return {
      fleschReadingEase: {
        score: fleschScore,
        category: this.getReadabilityCategory(fleschScore),
        interpretation: fleschInterpretation
      },
      sentenceComplexity: {
        score: sentenceComplexityScore,
        category: this.getScoreCategory(sentenceComplexityScore),
        avgSentenceLength,
        complexSentencePercentage
      },
      wordChoice: {
        score: wordChoiceScore,
        category: this.getScoreCategory(wordChoiceScore),
        simpleWordPercentage,
        complexWordPercentage,
        avgWordLength
      }
    };
  }
  
  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    // Basic sentence extraction with regex
    // This won't be perfect but should work for most cases
    return text
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .filter(sentence => sentence.trim().length > 0);
  }
  
  /**
   * Count syllables in text
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    return words.reduce((total, word) => {
      // Common approach for syllable counting
      word = word.toLowerCase().replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      
      const syllableMatches = word.match(/[aeiouy]{1,2}/g);
      const count = syllableMatches ? syllableMatches.length : 1;
      
      return total + count;
    }, 0);
  }
  
  /**
   * Calculate Flesch Reading Ease score
   */
  private calculateFleschReadingEase(
    avgSentenceLength: number, 
    avgSyllablesPerWord: number
  ): number {
    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Clamp between 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Get interpretation for Flesch Reading Ease score
   */
  private getFleschInterpretation(score: number): string {
    if (score >= 90) return "Very easy to read, understood by average 11-year-old student";
    if (score >= 80) return "Easy to read, conversational English";
    if (score >= 70) return "Fairly easy to read";
    if (score >= 60) return "Plain English, understood by 13-15 year old students";
    if (score >= 50) return "Fairly difficult to read";
    if (score >= 30) return "Difficult to read, best understood by college graduates";
    return "Very difficult to read, best understood by university graduates";
  }
  
  /**
   * Get readability category from Flesch score
   */
  private getReadabilityCategory(score: number): 'excellent' | 'good' | 'needs-work' | 'poor' {
    if (score >= 70) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 30) return 'needs-work';
    return 'poor';
  }
  
  /**
   * Check if a word is complex
   */
  private isComplexWord(word: string): boolean {
    // Complex words have 3+ syllables
    const syllableCount = this.countSyllables(word);
    return syllableCount >= 3;
  }
  
  /**
   * Calculate sentence complexity score
   */
  private calculateSentenceComplexityScore(
    avgSentenceLength: number,
    complexSentencePercentage: number
  ): number {
    let score = 0;
    
    // Optimal average sentence length (15-20 words)
    if (avgSentenceLength >= 15 && avgSentenceLength <= 20) {
      score += 50;
    } else if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      score += 30;
    } else if (avgSentenceLength > 0) {
      score += 10;
    }
    
    // Complex sentence percentage (lower is better)
    if (complexSentencePercentage <= 20) {
      score += 50;
    } else if (complexSentencePercentage <= 40) {
      score += 30;
    } else if (complexSentencePercentage <= 60) {
      score += 10;
    }
    
    return score;
  }
  
  /**
   * Calculate word choice score
   */
  private calculateWordChoiceScore(
    simpleWordPercentage: number,
    avgWordLength: number
  ): number {
    let score = 0;
    
    // Simple word percentage (higher is better)
    if (simpleWordPercentage >= 80) {
      score += 50;
    } else if (simpleWordPercentage >= 70) {
      score += 40;
    } else if (simpleWordPercentage >= 60) {
      score += 30;
    } else if (simpleWordPercentage >= 50) {
      score += 20;
    } else {
      score += 10;
    }
    
    // Average word length (4-6 characters is optimal)
    if (avgWordLength >= 4 && avgWordLength <= 6) {
      score += 50;
    } else if (avgWordLength > 0) {
      score += 25;
    }
    
    return score;
  }
  
  /**
   * Analyze semantic relevance
   */
  private analyzeSemanticRelevance(
    pageData: CrawlerOutput, 
    primaryKeyword: string
  ): SemanticRelevanceMetrics {
    const text = pageData.content.text;
    
    // Topic coverage analysis
    const keyTopics = this.extractKeyTopics(text, primaryKeyword);
    const topicDepthScore = this.calculateTopicDepthScore(text, keyTopics);
    
    const topicCoverageScore = topicDepthScore;
    
    // Keyword context analysis
    const keywordInContext = text.toLowerCase().includes(primaryKeyword.toLowerCase());
    const semanticRelevance = this.calculateSemanticRelevance(text, primaryKeyword);
    
    const keywordContextScore = keywordInContext ? 60 + (semanticRelevance * 40) : semanticRelevance * 30;
    
    // Entity analysis
    const entities = this.extractEntities(text);
    
    const entityScore = Math.min(100, entities.length * 10);
    
    return {
      topicCoverage: {
        score: topicCoverageScore,
        category: this.getScoreCategory(topicCoverageScore),
        keyTopics,
        topicDepthScore
      },
      keywordContext: {
        score: keywordContextScore,
        category: this.getScoreCategory(keywordContextScore),
        keywordInContext,
        semanticRelevance
      },
      entityAnalysis: {
        score: entityScore,
        category: this.getScoreCategory(entityScore),
        entities
      }
    };
  }
  
  /**
   * Extract key topics from text
   */
  private extractKeyTopics(text: string, primaryKeyword: string): string[] {
    // Split text into words and count frequency
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const wordCounts: Record<string, number> = {};
    
    words.forEach(word => {
      if (this.isStopWord(word)) {
        return;
      }
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Get top 5 words by frequency
    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
      .filter(word => word !== primaryKeyword.toLowerCase());
    
    return topWords.slice(0, 5);
  }
  
  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'but', 'for', 'nor', 'yet', 'so', 'such', 'than',
      'a', 'an', 'that', 'this', 'it', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'to',
      'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'onto', 'with',
      'without', 'within'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }
  
  /**
   * Calculate topic depth score
   */
  private calculateTopicDepthScore(text: string, keyTopics: string[]): number {
    // Count mentions of key topics
    let totalMentions = 0;
    
    keyTopics.forEach(topic => {
      const regex = new RegExp(`\\b${this.escapeRegExp(topic)}\\b`, 'gi');
      const matches = text.match(regex) || [];
      totalMentions += matches.length;
    });
    
    // Score based on mentions and topic count
    const score = Math.min(100, (totalMentions * 5) + (keyTopics.length * 10));
    
    return score;
  }
  
  /**
   * Escape string for use in RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Calculate semantic relevance score
   */
  private calculateSemanticRelevance(text: string, primaryKeyword: string): number {
    // This is a simplified version - in real life we'd use more NLP
    
    // Look for semantically related terms
    const keywordParts = primaryKeyword.toLowerCase().split(/\s+/);
    
    // Check if keyword parts appear near each other
    let nearMatches = 0;
    keywordParts.forEach(part => {
      if (text.toLowerCase().includes(part)) {
        nearMatches++;
      }
    });
    
    const keywordPartRatio = keywordParts.length > 0 
      ? nearMatches / keywordParts.length 
      : 0;
    
    return keywordPartRatio;
  }
  
  /**
   * Extract entities from text
   */
  private extractEntities(text: string): { type: string; name: string; frequency: number }[] {
    // This is a simplified approach without a proper NLP engine
    
    const entities: { type: string; name: string; frequency: number }[] = [];
    
    // Person detection (Mr./Mrs./Dr. followed by capitalized words)
    const personRegex = /\b(Mr\.|Mrs\.|Dr\.|Prof\.|Sir|Miss|Ms\.|Lord|Lady)\s+([A-Z][a-z]+)\b/g;
    let personMatch;
    while ((personMatch = personRegex.exec(text)) !== null) {
      const name = personMatch[1] + " " + personMatch[2];
      const existingEntity = entities.find(e => e.name === name && e.type === 'person');
      
      if (existingEntity) {
        existingEntity.frequency += 1;
      } else {
        entities.push({ type: 'person', name, frequency: 1 });
      }
    }
    
    // Organization detection (consecutive capitalized words)
    const orgRegex = /\b([A-Z][a-z]*\s+){1,3}(Inc\.|Corp\.|LLC|Ltd\.|Company|Association|Organization|Group)\b/g;
    let orgMatch;
    while ((orgMatch = orgRegex.exec(text)) !== null) {
      const name = orgMatch[0];
      const existingEntity = entities.find(e => e.name === name && e.type === 'organization');
      
      if (existingEntity) {
        existingEntity.frequency += 1;
      } else {
        entities.push({ type: 'organization', name, frequency: 1 });
      }
    }
    
    // Location detection (common location indicators)
    const locationRegex = /\b([A-Z][a-z]+\s)?(City|Street|Avenue|Road|Boulevard|Lane|Drive|Place|Square|Park|Bridge|River|Lake|Mountain|Forest|Desert|Beach|Ocean|Sea|Town|Village|Country)\b/g;
    let locationMatch;
    while ((locationMatch = locationRegex.exec(text)) !== null) {
      const name = locationMatch[0];
      const existingEntity = entities.find(e => e.name === name && e.type === 'location');
      
      if (existingEntity) {
        existingEntity.frequency += 1;
      } else {
        entities.push({ type: 'location', name, frequency: 1 });
      }
    }
    
    // Date detection
    const dateRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?,\s+\d{4}\b/g;
    let dateMatch;
    while ((dateMatch = dateRegex.exec(text)) !== null) {
      const name = dateMatch[0];
      const existingEntity = entities.find(e => e.name === name && e.type === 'date');
      
      if (existingEntity) {
        existingEntity.frequency += 1;
      } else {
        entities.push({ type: 'date', name, frequency: 1 });
      }
    }
    
    // Limit to top entities by frequency
    return entities
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }
  
  /**
   * Analyze content engagement metrics
   */
  private analyzeContentEngagement(
    $: cheerio.CheerioAPI, 
    pageData: CrawlerOutput
  ): ContentEngagementMetrics {
    // Content formats analysis
    const hasLists = $('ul, ol').length > 0;
    const hasTables = $('table').length > 0;
    const hasBlockquotes = $('blockquote').length > 0;
    const hasHighlightedText = $('strong, b, em, i, mark').length > 0;
    
    const contentFormatsScore = this.calculateContentFormatsScore(
      hasLists,
      hasTables,
      hasBlockquotes,
      hasHighlightedText
    );
    
    // Interactive elements analysis
    const hasVideos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
    const hasEmbeds = $('iframe:not([src*="youtube"]):not([src*="vimeo"]), embed, object').length > 0;
    const hasInteractiveContent = $('button, input, select, textarea').length > 0;
    
    const interactiveScore = this.calculateInteractiveScore(
      hasVideos,
      hasEmbeds,
      hasInteractiveContent
    );
    
    // CTA analysis
    const ctaPatterns = [
      /\b(click|tap|submit|subscribe|sign up|join|download|get|buy|purchase|order|book|register)\b/i,
      /\b(call|contact|email|send)\b/i,
      /\b(now|today|immediately|instantly)\b/i,
      /[!]\s*$/,
      /\b(free|discount|sale|offer|deal|limited time|exclusive)\b/i
    ];
    
    const ctaCount = ctaPatterns.reduce((count, pattern) => {
      const matches = (pageData.content.text.match(pattern) || []).length;
      return count + matches;
    }, 0);
    
    const hasCTA = ctaCount > 0;
    const ctaQuality = this.calculateCTAQuality(ctaCount, pageData.content.text.length);
    
    const ctaScore = this.calculateCTAScore(hasCTA, ctaQuality, ctaCount);
    
    return {
      contentFormats: {
        score: contentFormatsScore,
        category: this.getScoreCategory(contentFormatsScore),
        hasLists,
        hasTables,
        hasBlockquotes,
        hasHighlightedText
      },
      interactiveElements: {
        score: interactiveScore,
        category: this.getScoreCategory(interactiveScore),
        hasVideos,
        hasEmbeds,
        hasInteractiveContent
      },
      callsToAction: {
        score: ctaScore,
        category: this.getScoreCategory(ctaScore),
        hasCTA,
        ctaQuality,
        ctaCount
      }
    };
  }
  
  /**
   * Calculate content formats score
   */
  private calculateContentFormatsScore(
    hasLists: boolean,
    hasTables: boolean,
    hasBlockquotes: boolean,
    hasHighlightedText: boolean
  ): number {
    let score = 0;
    
    if (hasLists) score += 25;
    if (hasTables) score += 25;
    if (hasBlockquotes) score += 25;
    if (hasHighlightedText) score += 25;
    
    return score;
  }
  
  /**
   * Calculate interactive elements score
   */
  private calculateInteractiveScore(
    hasVideos: boolean,
    hasEmbeds: boolean,
    hasInteractiveContent: boolean
  ): number {
    let score = 0;
    
    if (hasVideos) score += 40;
    if (hasEmbeds) score += 30;
    if (hasInteractiveContent) score += 30;
    
    return score;
  }
  
  /**
   * Calculate CTA quality
   */
  private calculateCTAQuality(ctaCount: number, textLength: number): number {
    if (textLength === 0) return 0;
    
    // Density of CTAs (optimal is about 1 per 500 characters)
    const ctaDensity = (ctaCount / textLength) * 1000;
    
    if (ctaDensity >= 0.5 && ctaDensity <= 3) {
      return 100; // Good density
    } else if (ctaDensity > 0 && ctaDensity < 0.5) {
      return 50; // Too few CTAs
    } else if (ctaDensity > 3) {
      return 25; // Too many CTAs
    }
    
    return 0;
  }
  
  /**
   * Calculate CTA score
   */
  private calculateCTAScore(
    hasCTA: boolean,
    ctaQuality: number,
    ctaCount: number
  ): number {
    if (!hasCTA) return 0;
    
    let score = 0;
    
    // Base score for having CTAs
    score += 40;
    
    // Quality factor
    score += ctaQuality * 0.4;
    
    // Bonus for having optimal number of CTAs (2-5)
    if (ctaCount >= 2 && ctaCount <= 5) {
      score += 20;
    } else if (ctaCount > 5) {
      score += 10;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    structure: ContentStructureMetrics,
    readability: ReadabilityMetrics,
    semanticRelevance: SemanticRelevanceMetrics,
    engagement: ContentEngagementMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    // Structure recommendations
    if (structure.headingStructure.score < 70) {
      if (structure.headingStructure.totalHeadings === 0) {
        recommendations.push("Add heading tags (H1, H2, H3) to structure your content and improve readability.");
      } else if (structure.headingStructure.headingsWithKeywords / structure.headingStructure.totalHeadings < 0.3) {
        recommendations.push("Include your target keyword in more headings to improve keyword relevance.");
      }
    }
    
    if (structure.paragraphStructure.score < 70) {
      if (structure.paragraphStructure.avgParagraphLength > 120) {
        recommendations.push("Break up long paragraphs into smaller chunks of 3-5 sentences to improve readability.");
      } else if (structure.paragraphStructure.avgParagraphLength < 40) {
        recommendations.push("Expand very short paragraphs to provide more context and depth to your content.");
      }
    }
    
    // Readability recommendations
    if (readability.fleschReadingEase.score < 50) {
      recommendations.push("Simplify your language. Use shorter sentences and less complex words to improve readability.");
    }
    
    if (readability.sentenceComplexity.score < 70) {
      if (readability.sentenceComplexity.avgSentenceLength > 20) {
        recommendations.push("Shorten your sentences. Aim for an average of 15-20 words per sentence.");
      }
      if (readability.sentenceComplexity.complexSentencePercentage > 40) {
        recommendations.push("Reduce complex sentences with multiple clauses and commas. Split them into shorter, clearer statements.");
      }
    }
    
    if (readability.wordChoice.score < 70) {
      if (readability.wordChoice.complexWordPercentage > 30) {
        recommendations.push("Use simpler words where possible. Replace complex multi-syllable words with shorter alternatives.");
      }
    }
    
    // Semantic recommendations
    if (semanticRelevance.topicCoverage.score < 70) {
      recommendations.push(`Expand your content to include more related topics such as: ${semanticRelevance.topicCoverage.keyTopics.join(', ')}.`);
    }
    
    if (semanticRelevance.keywordContext.score < 70) {
      recommendations.push("Improve the context around your target keyword. Make sure it appears naturally within relevant sentences.");
    }
    
    // Engagement recommendations
    if (engagement.contentFormats.score < 50) {
      let suggestion = "Add more variety to your content format by including ";
      const missing = [];
      if (!engagement.contentFormats.hasLists) missing.push("bullet or numbered lists");
      if (!engagement.contentFormats.hasTables) missing.push("tables for organized data");
      if (!engagement.contentFormats.hasBlockquotes) missing.push("blockquotes for testimonials or important points");
      if (!engagement.contentFormats.hasHighlightedText) missing.push("bold or italic text for emphasis");
      
      suggestion += missing.join(", ") + ".";
      recommendations.push(suggestion);
    }
    
    if (engagement.interactiveElements.score < 50) {
      if (!engagement.interactiveElements.hasVideos) {
        recommendations.push("Add video content to increase engagement and time on page.");
      }
      if (!engagement.interactiveElements.hasInteractiveContent) {
        recommendations.push("Consider adding interactive elements like calculators, quizzes, or forms to engage users.");
      }
    }
    
    if (engagement.callsToAction.score < 50) {
      if (!engagement.callsToAction.hasCTA) {
        recommendations.push("Add clear calls-to-action (CTAs) to guide visitors on what to do next.");
      } else if (engagement.callsToAction.ctaQuality < 50) {
        recommendations.push("Improve your CTAs by making them more specific, action-oriented, and strategically placed.");
      }
    }
    
    return recommendations;
  }
  
  /**
   * Calculate overall score based on all metrics
   */
  private calculateOverallScore(
    structure: ContentStructureMetrics,
    readability: ReadabilityMetrics,
    semanticRelevance: SemanticRelevanceMetrics,
    engagement: ContentEngagementMetrics
  ): { score: number, category: 'excellent' | 'good' | 'needs-work' | 'poor' } {
    // Calculate weighted average of all scores
    const structureAvg = (
      structure.headingStructure.score + 
      structure.paragraphStructure.score + 
      structure.contentDistribution.score
    ) / 3;
    
    const readabilityAvg = (
      readability.fleschReadingEase.score + 
      readability.sentenceComplexity.score + 
      readability.wordChoice.score
    ) / 3;
    
    const semanticAvg = (
      semanticRelevance.topicCoverage.score + 
      semanticRelevance.keywordContext.score + 
      semanticRelevance.entityAnalysis.score
    ) / 3;
    
    const engagementAvg = (
      engagement.contentFormats.score + 
      engagement.interactiveElements.score + 
      engagement.callsToAction.score
    ) / 3;
    
    // Apply weights to each category
    const overallScore = Math.round(
      (structureAvg * 0.3) + 
      (readabilityAvg * 0.3) + 
      (semanticAvg * 0.25) + 
      (engagementAvg * 0.15)
    );
    
    return {
      score: overallScore,
      category: this.getScoreCategory(overallScore)
    };
  }
  
  /**
   * Get score category based on numeric score
   */
  private getScoreCategory(score: number): 'excellent' | 'good' | 'needs-work' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'needs-work';
    return 'poor';
  }
  
  /**
   * Get default analysis result on error
   */
  private getDefaultAnalysisResult(): DeepContentAnalysisResult {
    return {
      overallScore: {
        score: 0,
        category: 'poor'
      },
      structure: {
        headingStructure: {
          score: 0,
          category: 'poor',
          headingsWithKeywords: 0,
          totalHeadings: 0
        },
        paragraphStructure: {
          score: 0,
          category: 'poor',
          avgParagraphLength: 0,
          shortParagraphCount: 0,
          longParagraphCount: 0,
          totalParagraphs: 0
        },
        contentDistribution: {
          score: 0,
          category: 'poor',
          introductionQuality: 0,
          bodyContentQuality: 0,
          conclusionQuality: 0
        }
      },
      readability: {
        fleschReadingEase: {
          score: 0,
          category: 'poor',
          interpretation: "Unable to analyze"
        },
        sentenceComplexity: {
          score: 0,
          category: 'poor',
          avgSentenceLength: 0,
          complexSentencePercentage: 0
        },
        wordChoice: {
          score: 0,
          category: 'poor',
          simpleWordPercentage: 0,
          complexWordPercentage: 0,
          avgWordLength: 0
        }
      },
      semanticRelevance: {
        topicCoverage: {
          score: 0,
          category: 'poor',
          keyTopics: [],
          topicDepthScore: 0
        },
        keywordContext: {
          score: 0,
          category: 'poor',
          keywordInContext: false,
          semanticRelevance: 0
        },
        entityAnalysis: {
          score: 0,
          category: 'poor',
          entities: []
        }
      },
      engagement: {
        contentFormats: {
          score: 0,
          category: 'poor',
          hasLists: false,
          hasTables: false,
          hasBlockquotes: false,
          hasHighlightedText: false
        },
        interactiveElements: {
          score: 0,
          category: 'poor',
          hasVideos: false,
          hasEmbeds: false,
          hasInteractiveContent: false
        },
        callsToAction: {
          score: 0,
          category: 'poor',
          hasCTA: false,
          ctaQuality: 0,
          ctaCount: 0
        }
      },
      recommendations: [
        "Unable to perform deep content analysis. Please try again."
      ]
    };
  }
}

export const deepContentAnalyzer = new DeepContentAnalyzer();