import * as cheerio from 'cheerio';
import { CrawlerOutput } from '@/lib/types';
import { contentAnnotationService } from './contentAnnotationService';

/**
 * Deep Content Analyzer provides rich analysis of content structure,
 * readability, semantic relevance, and engagement.
 */
export class DeepContentAnalyzer {
  /**
   * Perform deep content analysis of a webpage
   */
  async analyzeContent(url: string, pageData: CrawlerOutput, primaryKeyword: string = ''): Promise<any> {
    try {
      // Extract primary keyword if not provided
      if (!primaryKeyword && pageData.title) {
        primaryKeyword = this.extractPrimaryKeyword(pageData.title, pageData.content.text);
      }
      
      // Get the categories/sections from the page
      const mainContent = pageData.content.paragraphs || [];
      
      // Analyze structure
      const structure = this.analyzeStructure(pageData, primaryKeyword);
      
      // Analyze readability
      const readability = this.analyzeReadability(pageData);
      
      // Analyze semantic relevance
      const semanticRelevance = this.analyzeSemanticRelevance(pageData, primaryKeyword);
      
      // Analyze engagement elements
      const engagement = this.analyzeEngagement(pageData);
      
      // Generate annotated content
      const annotatedContent = this.generateAnnotatedContent(pageData, primaryKeyword);
      
      // Calculate overall score (weighted average of section scores)
      const structureScore = (structure.headingStructure.score + structure.paragraphStructure.score + structure.contentDistribution.score) / 3;
      const readabilityScore = (readability.fleschReadingEase.score + readability.sentenceComplexity.score + readability.wordChoice.score) / 3;
      const semanticScore = (semanticRelevance.topicCoverage.score + semanticRelevance.keywordContext.score + semanticRelevance.entityAnalysis.score) / 3;
      const engagementScore = (engagement.contentFormats.score + engagement.interactiveElements.score + engagement.callsToAction.score) / 3;
      
      const overallScore = Math.round(
        (structureScore * 0.3) + // Content structure is very important
        (readabilityScore * 0.25) + // Readability is critical
        (semanticScore * 0.25) + // Semantic relevance matters for ranking
        (engagementScore * 0.2) // Engagement elements boost performance
      );
      
      // Generate key recommendations based on the lowest scores
      const recommendations = this.generateRecommendations({
        structure, readability, semanticRelevance, engagement, annotatedContent
      });
      
      return {
        url,
        overallScore: {
          score: overallScore,
          category: this.getScoreCategory(overallScore)
        },
        structure,
        readability,
        semanticRelevance,
        engagement,
        recommendations,
        annotatedContent
      };
    } catch (error) {
      console.error('Error in deep content analysis:', error);
      throw new Error('Failed to analyze content: ' + (error as Error).message);
    }
  }
  
  /**
   * Extract a primary keyword from the title and content
   */
  private extractPrimaryKeyword(title: string, content: string): string {
    // Simple approach: Take the first 2-3 most meaningful words from title
    // Exclude common stop words
    const stopWords = ['a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'by', 'with', 'and', 'or', 'but'];
    
    const titleWords = title.toLowerCase().split(/\s+/);
    const meaningfulWords = titleWords.filter(word => 
      word.length > 3 && !stopWords.includes(word)
    );
    
    if (meaningfulWords.length > 0) {
      // Take the first 2-3 meaningful words
      return meaningfulWords.slice(0, Math.min(3, meaningfulWords.length)).join(' ');
    }
    
    // Fallback: Use the first part of the title
    return title.split(' - ')[0].split('|')[0].slice(0, 30);
  }
  
  /**
   * Analyze the content structure (headings, paragraphs, distribution)
   */
  private analyzeStructure(pageData: CrawlerOutput, primaryKeyword: string): any {
    // Analyze heading structure
    const headingStructure = this.analyzeHeadingStructure(pageData, primaryKeyword);
    
    // Analyze paragraph structure
    const paragraphStructure = this.analyzeParagraphStructure(pageData);
    
    // Analyze content distribution
    const contentDistribution = this.analyzeContentDistribution(pageData, primaryKeyword);
    
    return {
      headingStructure,
      paragraphStructure,
      contentDistribution
    };
  }
  
  /**
   * Analyze heading structure
   */
  private analyzeHeadingStructure(pageData: CrawlerOutput, primaryKeyword: string): any {
    const { h1, h2, h3, h4, h5, h6 } = pageData.headings;
    const allHeadings = [...h1, ...h2, ...h3, ...h4, ...h5, ...h6];
    const totalHeadings = allHeadings.length;
    
    // Check how many headings include the primary keyword
    const headingsWithKeywords = allHeadings.filter(heading => 
      heading.toLowerCase().includes(primaryKeyword.toLowerCase())
    ).length;
    
    // Check if H1 is present
    const hasH1 = h1.length > 0;
    
    // Check if there's a logical hierarchy (H1 > H2 > H3...)
    const hasLogicalHierarchy = 
      (h1.length <= 1) && // Only one H1
      (h2.length >= h1.length) && // More H2s than H1s
      (h3.length >= 0); // H3s are optional
    
    // Score calculation based on multiple factors
    let score = 0;
    
    // Base score for having headings at all
    if (totalHeadings > 0) score += 30;
    
    // Score for headings with keywords
    if (totalHeadings > 0) {
      const keywordRatio = headingsWithKeywords / totalHeadings;
      score += Math.min(30, keywordRatio * 100); // Up to 30 points
    }
    
    // Score for having H1
    if (hasH1) score += 20;
    
    // Score for logical hierarchy
    if (hasLogicalHierarchy) score += 20;
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      headingsWithKeywords,
      totalHeadings
    };
  }
  
  /**
   * Analyze paragraph structure
   */
  private analyzeParagraphStructure(pageData: CrawlerOutput): any {
    const paragraphs = pageData.content.paragraphs || [];
    const totalParagraphs = paragraphs.length;
    
    if (totalParagraphs === 0) {
      return {
        score: 0,
        category: 'poor',
        avgParagraphLength: 0,
        shortParagraphCount: 0,
        longParagraphCount: 0,
        totalParagraphs: 0
      };
    }
    
    // Calculate average paragraph length
    const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
    const avgParagraphLength = paragraphLengths.reduce((sum, len) => sum + len, 0) / totalParagraphs;
    
    // Count short and long paragraphs
    const shortParagraphCount = paragraphLengths.filter(len => len < 40).length; // Less than 40 words
    const longParagraphCount = paragraphLengths.filter(len => len > 150).length; // More than 150 words
    
    // Calculate scores
    let score = 50; // Start at 50
    
    // Ideal paragraph length is between 40-100 words
    if (avgParagraphLength >= 40 && avgParagraphLength <= 100) {
      score += 25;
    } else if (avgParagraphLength > 100 && avgParagraphLength <= 150) {
      score += 15; // A bit too long
    } else if (avgParagraphLength < 40 && avgParagraphLength >= 20) {
      score += 15; // A bit too short
    } else {
      score -= 10; // Far from ideal
    }
    
    // Penalize for too many long paragraphs
    if (longParagraphCount > 0) {
      const longRatio = longParagraphCount / totalParagraphs;
      score -= Math.min(30, longRatio * 100); // Penalty up to 30 points
    }
    
    // Slight reward for having some short paragraphs (improves readability)
    if (shortParagraphCount > 0 && shortParagraphCount < totalParagraphs * 0.7) {
      const shortRatio = shortParagraphCount / totalParagraphs;
      score += Math.min(15, shortRatio * 50); // Bonus up to 15 points
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      avgParagraphLength,
      shortParagraphCount,
      longParagraphCount,
      totalParagraphs
    };
  }
  
  /**
   * Analyze content distribution (intro, body, conclusion)
   */
  private analyzeContentDistribution(pageData: CrawlerOutput, primaryKeyword: string): any {
    const paragraphs = pageData.content.paragraphs || [];
    
    if (paragraphs.length === 0) {
      return {
        score: 0,
        category: 'poor',
        introductionQuality: 0,
        bodyContentQuality: 0,
        conclusionQuality: 0
      };
    }
    
    // Assume introduction is the first 1-2 paragraphs
    const introductionParagraphs = paragraphs.slice(0, Math.min(2, paragraphs.length));
    const introductionText = introductionParagraphs.join('\n\n');
    
    // Assume conclusion is the last 1-2 paragraphs
    const conclusionParagraphs = paragraphs.slice(-Math.min(2, paragraphs.length));
    const conclusionText = conclusionParagraphs.join('\n\n');
    
    // The rest is body content
    const bodyParagraphs = paragraphs.slice(
      Math.min(2, paragraphs.length), 
      paragraphs.length - Math.min(2, paragraphs.length)
    );
    const bodyText = bodyParagraphs.join('\n\n');
    
    // Score introduction (50 base score)
    let introductionQuality = 50;
    
    // Introduction should mention the primary keyword
    if (introductionText.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      introductionQuality += 20;
    }
    
    // Introduction should be reasonably sized
    const introWords = introductionText.split(/\s+/).length;
    if (introWords >= 40 && introWords <= 100) {
      introductionQuality += 20; // Ideal length
    } else if (introWords > 20) {
      introductionQuality += 10; // Acceptable length
    }
    
    // Introduction should have a hook (question or statement)
    if (introductionText.includes('?') || 
        introductionText.includes('!') ||
        /\d+%|\d+\s+out of|\d+\s+of/.test(introductionText)) {
      introductionQuality += 10; // Has a hook
    }
    
    // Score body content (60 base score)
    let bodyContentQuality = 60;
    
    // Body should have substantial content
    if (bodyParagraphs.length >= 3) {
      bodyContentQuality += 20;
    } else if (bodyParagraphs.length > 0) {
      bodyContentQuality += 10;
    } else {
      bodyContentQuality -= 30; // Penalize severely for no body content
    }
    
    // Body should use headings to organize content
    const hasH2orH3 = pageData.headings.h2.length > 0 || pageData.headings.h3.length > 0;
    if (hasH2orH3) {
      bodyContentQuality += 20;
    }
    
    // Score conclusion (50 base score)
    let conclusionQuality = 50;
    
    // Conclusion should summarize or wrap up
    const conclusionIndicators = [
      'in conclusion', 'to summarize', 'to sum up', 'finally', 'in summary',
      'overall', 'in the end', 'as a result', 'ultimately', 'lastly'
    ];
    
    const hasIndicator = conclusionIndicators.some(indicator => 
      conclusionText.toLowerCase().includes(indicator)
    );
    
    if (hasIndicator) {
      conclusionQuality += 20;
    }
    
    // Conclusion should have a call to action
    const ctaIndicators = [
      'contact', 'call', 'email', 'click', 'sign up', 'register',
      'download', 'get', 'try', 'visit', 'learn more'
    ];
    
    const hasCTA = ctaIndicators.some(indicator => 
      conclusionText.toLowerCase().includes(indicator)
    );
    
    if (hasCTA) {
      conclusionQuality += 30;
    }
    
    // Clamp scores between 0-100
    introductionQuality = Math.min(100, Math.max(0, introductionQuality));
    bodyContentQuality = Math.min(100, Math.max(0, bodyContentQuality));
    conclusionQuality = Math.min(100, Math.max(0, conclusionQuality));
    
    // Overall score is weighted average
    const score = Math.round(
      (introductionQuality * 0.3) + 
      (bodyContentQuality * 0.4) + 
      (conclusionQuality * 0.3)
    );
    
    return {
      score,
      category: this.getScoreCategory(score),
      introductionQuality,
      bodyContentQuality,
      conclusionQuality
    };
  }
  
  /**
   * Analyze readability (Flesch Reading Ease, sentence complexity, word choice)
   */
  private analyzeReadability(pageData: CrawlerOutput): any {
    const text = pageData.content.text || '';
    
    // Analyze Flesch Reading Ease
    const fleschReadingEase = this.calculateFleschReadingEase(text);
    
    // Analyze sentence complexity
    const sentenceComplexity = this.analyzeSentenceComplexity(text);
    
    // Analyze word choice
    const wordChoice = this.analyzeWordChoice(text);
    
    return {
      fleschReadingEase,
      sentenceComplexity,
      wordChoice
    };
  }
  
  /**
   * Calculate Flesch Reading Ease score
   * Higher scores = easier to read (90-100: 5th grade, 60-70: 8th-9th grade, 0-30: College graduate)
   */
  private calculateFleschReadingEase(text: string): any {
    if (!text) {
      return {
        score: 0,
        category: 'poor',
        interpretation: 'No text to analyze'
      };
    }
    
    // Count sentences (naively)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = Math.max(1, sentences.length);
    
    // Count words
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const wordCount = Math.max(1, words.length);
    
    // Count syllables (very approximate)
    const syllableCount = this.estimateSyllables(text);
    
    // Calculate Flesch Reading Ease
    // 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
    const wordsPerSentence = wordCount / sentenceCount;
    const syllablesPerWord = syllableCount / wordCount;
    
    let flesch = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
    
    // Clamp to 0-100 range
    flesch = Math.min(100, Math.max(0, flesch));
    
    // Interpret the score
    let interpretation = '';
    let category = '';
    
    if (flesch >= 90) {
      interpretation = 'Very easy to read. Easily understood by an average 11-year-old student.';
      category = 'excellent';
    } else if (flesch >= 80) {
      interpretation = 'Easy to read. Conversational English for consumers.';
      category = 'excellent';
    } else if (flesch >= 70) {
      interpretation = 'Fairly easy to read.';
      category = 'good';
    } else if (flesch >= 60) {
      interpretation = 'Plain English. Easily understood by 13- to 15-year-old students.';
      category = 'good';
    } else if (flesch >= 50) {
      interpretation = 'Fairly difficult to read.';
      category = 'needs-work';
    } else if (flesch >= 30) {
      interpretation = 'Difficult to read, best understood by college graduates.';
      category = 'needs-work';
    } else {
      interpretation = 'Very difficult to read, best understood by university graduates.';
      category = 'poor';
    }
    
    return {
      score: Math.round(flesch),
      category,
      interpretation
    };
  }
  
  /**
   * Estimate syllable count (simplified method)
   */
  private estimateSyllables(text: string): number {
    if (!text) return 0;
    
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    
    for (const word of words) {
      if (word.length <= 3) {
        count++; // Assume small words have one syllable
        continue;
      }
      
      // Count vowel groups as syllables
      let wordCount = 0;
      const matches = word.match(/[aeiouy]+/g);
      
      if (matches) {
        wordCount = matches.length;
      }
      
      // Adjust for common patterns
      if (word.endsWith('e')) {
        wordCount--; // Silent e
      }
      
      if (word.endsWith('le') && word.length > 2 && !['a','e','i','o','u'].includes(word[word.length-3])) {
        wordCount++; // Handle "ble", "cle", etc.
      }
      
      if (word.endsWith('es') || word.endsWith('ed')) {
        wordCount--; // Adjust for es/ed endings
      }
      
      // Minimum 1 syllable per word
      count += Math.max(1, wordCount);
    }
    
    return count;
  }
  
  /**
   * Analyze sentence complexity
   */
  private analyzeSentenceComplexity(text: string): any {
    if (!text) {
      return {
        score: 0,
        category: 'poor',
        avgSentenceLength: 0,
        complexSentencePercentage: 0
      };
    }
    
    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    
    if (sentenceCount === 0) {
      return {
        score: 0,
        category: 'poor',
        avgSentenceLength: 0,
        complexSentencePercentage: 0
      };
    }
    
    // Calculate average words per sentence
    const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.trim().length > 0).length);
    const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceCount;
    
    // Calculate complex sentences (more than 20 words)
    const complexSentences = sentenceLengths.filter(len => len > 20);
    const complexSentencePercentage = (complexSentences.length / sentenceCount) * 100;
    
    // Score calculation
    let score = 100;
    
    // Ideal avg sentence length is 15-20 words
    if (avgSentenceLength > 20) {
      score -= (avgSentenceLength - 20) * 3; // Penalty for longer sentences
    } else if (avgSentenceLength < 10) {
      score -= (10 - avgSentenceLength) * 3; // Penalty for very short sentences
    }
    
    // Penalize for high percentage of complex sentences
    score -= complexSentencePercentage * 0.7;
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      avgSentenceLength,
      complexSentencePercentage: Math.round(complexSentencePercentage)
    };
  }
  
  /**
   * Analyze word choice
   */
  private analyzeWordChoice(text: string): any {
    if (!text) {
      return {
        score: 0,
        category: 'poor',
        simpleWordPercentage: 0,
        complexWordPercentage: 0,
        avgWordLength: 0
      };
    }
    
    // Split into words
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const wordCount = words.length;
    
    if (wordCount === 0) {
      return {
        score: 0,
        category: 'poor',
        simpleWordPercentage: 0,
        complexWordPercentage: 0,
        avgWordLength: 0
      };
    }
    
    // Calculate average word length
    const wordLengths = words.map(w => w.length);
    const avgWordLength = wordLengths.reduce((sum, len) => sum + len, 0) / wordCount;
    
    // Define complex words (more than 3 syllables or longer than 10 characters)
    const complexWords = words.filter(word => {
      if (word.length > 10) return true;
      
      // Simplified syllable counting (count vowel groups)
      const matches = word.match(/[aeiouy]+/g);
      const syllables = matches ? matches.length : 1;
      
      return syllables > 3;
    });
    
    const complexWordCount = complexWords.length;
    const complexWordPercentage = (complexWordCount / wordCount) * 100;
    const simpleWordPercentage = 100 - complexWordPercentage;
    
    // Score calculation
    let score = 100;
    
    // Penalize for high percentage of complex words
    if (complexWordPercentage > 15) {
      score -= (complexWordPercentage - 15) * 2;
    }
    
    // Penalize if average word length is too high
    if (avgWordLength > 6) {
      score -= (avgWordLength - 6) * 7;
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      simpleWordPercentage: Math.round(simpleWordPercentage),
      complexWordPercentage: Math.round(complexWordPercentage),
      avgWordLength: Math.round(avgWordLength * 10) / 10 // Round to 1 decimal
    };
  }
  
  /**
   * Analyze semantic relevance (topic coverage, keyword context, entities)
   */
  private analyzeSemanticRelevance(pageData: CrawlerOutput, primaryKeyword: string): any {
    // Analyze topic coverage
    const topicCoverage = this.analyzeTopicCoverage(pageData, primaryKeyword);
    
    // Analyze keyword context
    const keywordContext = this.analyzeKeywordContext(pageData, primaryKeyword);
    
    // Analyze entities
    const entityAnalysis = this.analyzeEntities(pageData);
    
    return {
      topicCoverage,
      keywordContext,
      entityAnalysis
    };
  }
  
  /**
   * Analyze topic coverage
   */
  private analyzeTopicCoverage(pageData: CrawlerOutput, primaryKeyword: string): any {
    const text = pageData.content.text || '';
    
    if (!text) {
      return {
        score: 0,
        category: 'poor',
        keyTopics: [],
        topicDepthScore: 0
      };
    }
    
    // Extract key topics (simple approach)
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = [
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
      'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between',
      'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
      'may', 'might', 'must', 'of', 'that', 'this', 'these', 'those', 'it', 'its'
    ];
    
    // Filter out stop words and count word frequency
    const wordFrequency: Record<string, number> = {};
    
    for (const word of words) {
      if (word.length < 4 || stopWords.includes(word)) continue;
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
    
    // Get the top N frequent words
    const topWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    // Check if primary keyword is in the top words
    const keywordFound = topWords.some(word => 
      word.includes(primaryKeyword.toLowerCase()) || 
      primaryKeyword.toLowerCase().includes(word)
    );
    
    let score = 50; // Base score
    
    // Award points for having the primary keyword in top words
    if (keywordFound) {
      score += 20;
    }
    
    // Award points for having a reasonable number of topics
    if (topWords.length >= 5) {
      score += 15;
    } else if (topWords.length >= 3) {
      score += 10;
    }
    
    // Calculate topic depth (how much content covers each topic)
    const contentWords = words.filter(w => w.length >= 4 && !stopWords.includes(w)).length;
    const topicDepthScore = Math.min(100, (contentWords / 50) * 10); // 10 points per 50 relevant words, max 100
    
    score += Math.min(15, topicDepthScore / 10); // Up to 15 points for depth
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      keyTopics: topWords,
      topicDepthScore: Math.round(topicDepthScore)
    };
  }
  
  /**
   * Analyze keyword context
   */
  private analyzeKeywordContext(pageData: CrawlerOutput, primaryKeyword: string): any {
    const text = pageData.content.text || '';
    
    if (!text || !primaryKeyword) {
      return {
        score: 0,
        category: 'poor',
        keywordInContext: false,
        semanticRelevance: 0
      };
    }
    
    // Check if keyword appears in the text
    const keywordInContext = text.toLowerCase().includes(primaryKeyword.toLowerCase());
    
    // Calculate keyword density
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const wordCount = words.length;
    
    const keywordMatches = (text.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
    const keywordDensity = (keywordMatches / wordCount) * 100;
    
    // Check if keyword appears in important elements
    const keywordInTitle = pageData.title?.toLowerCase().includes(primaryKeyword.toLowerCase()) || false;
    const keywordInH1 = pageData.headings.h1.some(h => h.toLowerCase().includes(primaryKeyword.toLowerCase()));
    const keywordInH2 = pageData.headings.h2.some(h => h.toLowerCase().includes(primaryKeyword.toLowerCase()));
    const keywordInMeta = pageData.meta.description?.toLowerCase().includes(primaryKeyword.toLowerCase()) || false;
    
    // Calculate semantic relevance score
    let score = 0;
    
    // Base score for keyword presence
    if (keywordInContext) {
      score += 30;
    }
    
    // Bonus for optimal keyword density (1-3%)
    if (keywordDensity >= 1 && keywordDensity <= 3) {
      score += 20;
    } else if (keywordDensity > 3 && keywordDensity <= 5) {
      score += 10; // Still acceptable
    } else if (keywordDensity > 5) {
      score -= Math.min(20, (keywordDensity - 5) * 5); // Penalty for keyword stuffing
    }
    
    // Bonus for keyword in important elements
    if (keywordInTitle) score += 15;
    if (keywordInH1) score += 15;
    if (keywordInH2) score += 10;
    if (keywordInMeta) score += 10;
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      keywordInContext,
      semanticRelevance: Math.round(score)
    };
  }
  
  /**
   * Analyze entities (people, places, organizations)
   */
  private analyzeEntities(pageData: CrawlerOutput): any {
    const text = pageData.content.text || '';
    
    if (!text) {
      return {
        score: 0,
        category: 'poor',
        entities: []
      };
    }
    
    // Simple entity extraction - this is a very basic approach
    // A production system would use a proper NLP library for entity extraction
    
    // Extract potential entities (capitalized words not at the start of sentences)
    const sentences = text.split(/[.!?]+/);
    const entities: Record<string, {type: string, count: number}> = {};
    
    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      
      for (let i = 1; i < words.length; i++) { // Skip first word of sentences
        const word = words[i].trim();
        
        // Check if word is capitalized and not a common word
        if (word.length > 1 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
          // Try to determine entity type (very naive approach)
          let type = 'other';
          
          // Look for organization indicators
          if (word.includes('Inc') || word.includes('Corp') || word.includes('LLC') || 
              word.includes('Ltd') || word.includes('Company') || word.includes('Association')) {
            type = 'organization';
          }
          // Look for location indicators
          else if (word.includes('Street') || word.includes('Road') || word.includes('Avenue') || 
                   word.includes('City') || word.includes('County') || word.includes('State') || 
                   word.includes('Country')) {
            type = 'location';
          }
          // Assume people (very naive)
          else if (word.length > 3 && !word.endsWith('ing') && !word.endsWith('ed')) {
            type = 'person';
          }
          
          // Add to entities count
          const key = `${word}:${type}`;
          entities[key] = entities[key] || { type, count: 0 };
          entities[key].count += 1;
        }
      }
    }
    
    // Convert to array and sort by frequency
    const entityArray = Object.entries(entities).map(([key, data]) => {
      const [name] = key.split(':');
      return {
        type: data.type,
        name,
        frequency: data.count
      };
    }).sort((a, b) => b.frequency - a.frequency).slice(0, 10);
    
    // Score based on entity diversity and frequency
    let score = 50; // Base score
    
    // Award points for entity diversity
    const types = new Set(entityArray.map(e => e.type));
    score += Math.min(20, types.size * 10); // Up to 20 points for diverse entity types
    
    // Award points for number of entities
    score += Math.min(30, entityArray.length * 3); // Up to 30 points
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      entities: entityArray
    };
  }
  
  /**
   * Analyze engagement elements (content formats, interactive elements, CTAs)
   */
  private analyzeEngagement(pageData: CrawlerOutput): any {
    // Analyze content formats
    const contentFormats = this.analyzeContentFormats(pageData);
    
    // Analyze interactive elements
    const interactiveElements = this.analyzeInteractiveElements(pageData);
    
    // Analyze calls to action
    const callsToAction = this.analyzeCallsToAction(pageData);
    
    return {
      contentFormats,
      interactiveElements,
      callsToAction
    };
  }
  
  /**
   * Analyze content formats (lists, tables, quotes, etc.)
   */
  private analyzeContentFormats(pageData: CrawlerOutput): any {
    const html = pageData.rawHtml || '';
    
    if (!html) {
      return {
        score: 0,
        category: 'poor',
        hasLists: false,
        hasTables: false,
        hasBlockquotes: false,
        hasHighlightedText: false
      };
    }
    
    // Use cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Check for various content formats
    const hasLists = $('ul, ol').length > 0;
    const hasTables = $('table').length > 0;
    const hasBlockquotes = $('blockquote').length > 0;
    const hasHighlightedText = $('strong, b, em, i, mark, span[style*="color"], span[style*="background"]').length > 0;
    
    // Count images and count images with alt text
    const totalImages = $('img').length;
    const imagesWithAlt = $('img[alt]').length;
    const imageAltRatio = totalImages > 0 ? imagesWithAlt / totalImages : 0;
    
    // Calculate score
    let score = 50; // Base score
    
    // Award points for different content formats
    if (hasLists) score += 10;
    if (hasTables) score += 10;
    if (hasBlockquotes) score += 10;
    if (hasHighlightedText) score += 10;
    
    // Award points for image alt text ratio
    score += Math.round(imageAltRatio * 10);
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      hasLists,
      hasTables,
      hasBlockquotes,
      hasHighlightedText
    };
  }
  
  /**
   * Analyze interactive elements (videos, embeds, etc.)
   */
  private analyzeInteractiveElements(pageData: CrawlerOutput): any {
    const html = pageData.rawHtml || '';
    
    if (!html) {
      return {
        score: 0,
        category: 'poor',
        hasVideos: false,
        hasEmbeds: false,
        hasInteractiveContent: false
      };
    }
    
    // Use cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Check for various interactive elements
    const hasVideos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
    const hasEmbeds = $('iframe').not('iframe[src*="youtube"]').not('iframe[src*="vimeo"]').length > 0;
    
    // Check for interactive content
    const hasInteractiveContent = 
      $('button, input, select, textarea, [onclick], [role="button"], a[href^="#"]').length > 0;
    
    // Calculate score
    let score = 50; // Base score
    
    // Award points for different interactive elements
    if (hasVideos) score += 20;
    if (hasEmbeds) score += 15;
    if (hasInteractiveContent) score += 15;
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      hasVideos,
      hasEmbeds,
      hasInteractiveContent
    };
  }
  
  /**
   * Analyze calls to action
   */
  private analyzeCallsToAction(pageData: CrawlerOutput): any {
    const html = pageData.rawHtml || '';
    const text = pageData.content.text || '';
    
    if (!html || !text) {
      return {
        score: 0,
        category: 'poor',
        hasCTA: false,
        ctaQuality: 0,
        ctaCount: 0
      };
    }
    
    // Use cheerio to parse HTML
    const $ = cheerio.load(html);
    
    // Look for buttons that might be CTAs
    const buttonElements = $('button, .btn, .button, a.cta, a.btn, [role="button"]');
    const buttonCTAs = buttonElements.length;
    
    // Look for text that might be CTAs
    const ctaPhrases = [
      'sign up', 'subscribe', 'register', 'join', 'download', 'get started',
      'try', 'buy now', 'purchase', 'order', 'call', 'contact', 'learn more',
      'read more', 'find out more', 'discover', 'schedule', 'request', 'submit',
      'apply now', 'get quote', 'free trial'
    ];
    
    let textCTACount = 0;
    
    for (const phrase of ctaPhrases) {
      const regex = new RegExp(phrase, 'gi');
      const matches = text.match(regex);
      if (matches) {
        textCTACount += matches.length;
      }
    }
    
    // Total CTA count
    const ctaCount = buttonCTAs + Math.min(5, textCTACount); // Cap text CTAs to avoid overcounting
    
    // Check if there's at least one CTA
    const hasCTA = ctaCount > 0;
    
    // Calculate CTA quality (basic heuristic)
    let ctaQuality = 0;
    
    if (hasCTA) {
      ctaQuality = 50; // Base quality
      
      // Higher quality if there are button CTAs
      if (buttonCTAs > 0) {
        ctaQuality += 20;
      }
      
      // Higher quality if there are multiple CTAs but not too many
      if (ctaCount >= 2 && ctaCount <= 5) {
        ctaQuality += 20;
      } else if (ctaCount > 5) {
        ctaQuality += 10; // Too many CTAs can be overwhelming
      }
      
      // Check for action verbs in button text
      let actionVerbCount = 0;
      buttonElements.each((_, element) => {
        const buttonText = $(element).text().toLowerCase();
        const hasActionVerb = ctaPhrases.some(phrase => buttonText.includes(phrase));
        if (hasActionVerb) actionVerbCount++;
      });
      
      if (actionVerbCount > 0) {
        ctaQuality += Math.min(10, actionVerbCount * 5); // Up to 10 points
      }
    }
    
    // Calculate overall score
    let score = 0;
    
    if (hasCTA) {
      score = 50; // Base score for having a CTA
      
      // Add quality score (weighted)
      score += (ctaQuality * 0.5);
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    ctaQuality = Math.min(100, Math.max(0, ctaQuality));
    
    return {
      score: Math.round(score),
      category: this.getScoreCategory(score),
      hasCTA,
      ctaQuality: Math.round(ctaQuality),
      ctaCount
    };
  }
  
  /**
   * Generate annotated content
   */
  private generateAnnotatedContent(pageData: CrawlerOutput, primaryKeyword: string): any {
    const title = pageData.title || '';
    const paragraphs = pageData.content.paragraphs || [];
    
    if (paragraphs.length === 0) {
      return {
        title,
        introduction: { 
          content: "No content found to analyze", 
          annotations: [{
            content: "No content found",
            issue: "Missing content",
            suggestion: "Add relevant content to your page",
            position: 0,
            severity: 'high',
            type: 'structure'
          }]
        },
        mainContent: [{ 
          content: "No content found to analyze", 
          annotations: [] 
        }],
        conclusion: { 
          content: "No content found to analyze", 
          annotations: [] 
        }
      };
    }
    
    // Identify introduction (first 1-2 paragraphs)
    const { introContent, annotations: introAnnotations } = 
      contentAnnotationService.identifyIntroductionParagraphs(paragraphs, title, primaryKeyword);
    
    // Identify conclusion (last 1-2 paragraphs)
    const { conclusionContent, annotations: conclusionAnnotations } = 
      contentAnnotationService.identifyConclusionParagraphs(paragraphs, primaryKeyword);
    
    // The remaining paragraphs form the main content
    // Group them into sections of 2-3 paragraphs
    const mainParagraphs = paragraphs.slice(
      Math.min(2, paragraphs.length),
      paragraphs.length - Math.min(2, paragraphs.length)
    );
    
    const mainContent = [];
    
    // Group into sections of max 2-3 paragraphs
    const sectionSize = 3;
    
    for (let i = 0; i < mainParagraphs.length; i += sectionSize) {
      const sectionParagraphs = mainParagraphs.slice(i, i + sectionSize);
      const sectionContent = sectionParagraphs.join('\n\n');
      
      // Generate annotations for this section
      const sectionAnnotations = sectionParagraphs.flatMap(paragraph => 
        contentAnnotationService.generateParagraphAnnotations(paragraph, primaryKeyword)
      );
      
      mainContent.push({
        content: sectionContent,
        annotations: sectionAnnotations
      });
    }
    
    return {
      title,
      introduction: {
        content: introContent,
        annotations: introAnnotations
      },
      mainContent,
      conclusion: {
        content: conclusionContent,
        annotations: conclusionAnnotations
      }
    };
  }
  
  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    // Structure recommendations
    if (analysis.structure.headingStructure.score < 70) {
      if (analysis.structure.headingStructure.totalHeadings === 0) {
        recommendations.push("Add hierarchical headings (H1, H2, H3) to organize your content");
      } else if (analysis.structure.headingStructure.headingsWithKeywords === 0) {
        recommendations.push("Include your target keywords in headings to improve SEO");
      } else if (analysis.structure.headingStructure.score < 50) {
        recommendations.push("Improve your heading structure with a clear hierarchy (one H1, multiple H2s, etc.)");
      }
    }
    
    if (analysis.structure.paragraphStructure.score < 70) {
      if (analysis.structure.paragraphStructure.avgParagraphLength > 120) {
        recommendations.push("Break down long paragraphs into smaller, more digestible chunks (40-80 words ideal)");
      } else if (analysis.structure.paragraphStructure.avgParagraphLength < 30) {
        recommendations.push("Expand your paragraphs with more detailed information while maintaining readability");
      }
    }
    
    if (analysis.structure.contentDistribution.score < 70) {
      if (analysis.structure.contentDistribution.introductionQuality < 50) {
        recommendations.push("Strengthen your introduction by clearly stating what the content will cover and including your primary keyword");
      }
      if (analysis.structure.contentDistribution.conclusionQuality < 50) {
        recommendations.push("Add a strong conclusion with a summary of key points and a clear call-to-action");
      }
    }
    
    // Readability recommendations
    if (analysis.readability.fleschReadingEase.score < 60) {
      recommendations.push("Simplify your language to improve readability - use shorter sentences and simpler words");
    }
    
    if (analysis.readability.sentenceComplexity.score < 70) {
      if (analysis.readability.sentenceComplexity.avgSentenceLength > 25) {
        recommendations.push("Shorten your sentences to 15-20 words on average for better readability");
      }
      if (analysis.readability.sentenceComplexity.complexSentencePercentage > 30) {
        recommendations.push("Break down complex sentences into simpler ones to improve reader comprehension");
      }
    }
    
    if (analysis.readability.wordChoice.score < 70) {
      if (analysis.readability.wordChoice.complexWordPercentage > 20) {
        recommendations.push("Replace complex words with simpler alternatives where possible");
      }
    }
    
    // Semantic relevance recommendations
    if (analysis.semanticRelevance.topicCoverage.score < 70) {
      recommendations.push("Expand your content to cover more aspects of your topic in greater depth");
    }
    
    if (analysis.semanticRelevance.keywordContext.score < 70) {
      if (!analysis.semanticRelevance.keywordContext.keywordInContext) {
        recommendations.push("Include your target keyword naturally throughout your content, especially in the introduction and conclusion");
      }
    }
    
    // Engagement recommendations
    if (analysis.engagement.contentFormats.score < 70) {
      const missingFormats = [];
      if (!analysis.engagement.contentFormats.hasLists) missingFormats.push("bullet lists");
      if (!analysis.engagement.contentFormats.hasTables) missingFormats.push("tables");
      if (!analysis.engagement.contentFormats.hasBlockquotes) missingFormats.push("quotes");
      if (!analysis.engagement.contentFormats.hasHighlightedText) missingFormats.push("highlighted text");
      
      if (missingFormats.length > 0) {
        recommendations.push(`Add varied content formats (${missingFormats.join(', ')}) to improve engagement and readability`);
      }
    }
    
    if (analysis.engagement.interactiveElements.score < 70) {
      if (!analysis.engagement.interactiveElements.hasVideos) {
        recommendations.push("Consider adding video content to increase engagement and time on page");
      }
    }
    
    if (analysis.engagement.callsToAction.score < 70) {
      if (!analysis.engagement.callsToAction.hasCTA) {
        recommendations.push("Add clear calls-to-action to guide users on what to do next");
      } else if (analysis.engagement.callsToAction.ctaQuality < 50) {
        recommendations.push("Improve your CTAs with action verbs and clear value propositions");
      }
    }
    
    // Add recommendations based on annotations
    if (analysis.annotatedContent) {
      const allAnnotations = [
        ...analysis.annotatedContent.introduction.annotations || [],
        ...(analysis.annotatedContent.mainContent || []).flatMap(section => section.annotations || []),
        ...analysis.annotatedContent.conclusion.annotations || []
      ];
      
      // Get high severity annotations
      const highSeverityAnnotations = allAnnotations.filter(a => a.severity === 'high');
      
      for (const annotation of highSeverityAnnotations.slice(0, 3)) {
        recommendations.push(annotation.suggestion);
      }
    }
    
    // Ensure we have at least 3 recommendations
    if (recommendations.length < 3) {
      recommendations.push("Add more detailed and comprehensive content to fully address your topic");
      recommendations.push("Include relevant statistics, examples, or case studies to support your points");
      recommendations.push("Break up large text blocks with subheadings to improve scanability");
    }
    
    // Cap at 10 recommendations
    return recommendations.slice(0, 10);
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
}

export const deepContentAnalyzer = new DeepContentAnalyzer();