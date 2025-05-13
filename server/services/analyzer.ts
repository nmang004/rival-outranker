import { SeoAnalysisResult, SeoScore } from '@shared/schema';
import { CrawlerOutput } from '@/lib/types';
import { keywordAnalyzer } from './keywordAnalyzer';
import { pageSpeed } from './pageSpeed';

class Analyzer {
  /**
   * Analyze a webpage and generate a comprehensive SEO assessment report
   */
  async analyzePage(url: string, pageData: CrawlerOutput): Promise<SeoAnalysisResult> {
    try {
      console.log(`Analyzing page: ${url}`);
      
      // Extract primary keyword
      const primaryKeyword = await keywordAnalyzer.extractPrimaryKeyword(pageData);
      
      // Analyze keywords
      const keywordAnalysis = await keywordAnalyzer.analyze(pageData, primaryKeyword);
      
      // Analyze meta tags
      const metaTagsAnalysis = this.analyzeMetaTags(pageData, primaryKeyword);
      
      // Analyze content
      const contentAnalysis = this.analyzeContent(pageData);
      
      // Analyze internal links
      const internalLinksAnalysis = this.analyzeInternalLinks(pageData);
      
      // Analyze images
      const imageAnalysis = this.analyzeImages(pageData);
      
      // Analyze schema markup
      const schemaMarkupAnalysis = this.analyzeSchemaMarkup(pageData);
      
      // Analyze mobile-friendliness
      const mobileAnalysis = this.analyzeMobileFriendliness(pageData);
      
      // Analyze page speed
      const pageSpeedAnalysis = await pageSpeed.analyze(url, pageData);
      
      // Analyze user engagement signals
      const userEngagementAnalysis = this.analyzeUserEngagement(pageData);
      
      // Analyze E-E-A-T factors
      const eatAnalysis = this.analyzeEAT(pageData);
      
      // Calculate overall score based on all factors
      const overallScore = this.calculateOverallScore([
        keywordAnalysis.overallScore,
        metaTagsAnalysis.overallScore,
        contentAnalysis.overallScore,
        internalLinksAnalysis.overallScore,
        imageAnalysis.overallScore,
        schemaMarkupAnalysis.overallScore,
        mobileAnalysis.overallScore,
        pageSpeedAnalysis.overallScore,
        userEngagementAnalysis.overallScore,
        eatAnalysis.overallScore
      ]);
      
      // Generate strengths and weaknesses lists
      const strengths = this.identifyStrengths({
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis
      });
      
      const weaknesses = this.identifyWeaknesses({
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis
      });
      
      // Generate recommendations
      const recommendations = this.generateRecommendations({
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis
      });
      
      // Return the final analysis result
      return {
        url,
        timestamp: new Date(),
        overallScore,
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis,
        strengths,
        weaknesses,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing page:', error);
      throw new Error(`Failed to analyze page: ${error.message}`);
    }
  }

  /**
   * Analyze meta tags (title, description, etc.)
   */
  private analyzeMetaTags(pageData: CrawlerOutput, primaryKeyword: string): any {
    const title = pageData.title || '';
    const description = pageData.meta.description || '';
    
    // Check if primary keyword is in title and at what position
    const titleKeywordPosition = primaryKeyword && title 
      ? title.toLowerCase().indexOf(primaryKeyword.toLowerCase()) + 1
      : undefined;
    
    // Check if primary keyword is in description
    const descriptionHasKeyword = primaryKeyword && description
      ? description.toLowerCase().includes(primaryKeyword.toLowerCase())
      : false;
    
    // Calculate scores
    let score = 50; // Base score
    
    // Title factors
    if (title) {
      score += 10;
      if (title.length >= 30 && title.length <= 60) score += 10;
      if (titleKeywordPosition) {
        score += 5;
        if (titleKeywordPosition <= 5) score += 5; // Bonus for early position
      }
    }
    
    // Description factors
    if (description) {
      score += 10;
      if (description.length >= 70 && description.length <= 160) score += 10;
      if (descriptionHasKeyword) score += 5;
    }
    
    // Other meta tags
    if (pageData.meta.canonical) score += 5;
    if (pageData.meta.robots) score += 5;
    if (Object.keys(pageData.meta.ogTags).length > 0) score += 5;
    if (Object.keys(pageData.meta.twitterTags).length > 0) score += 5;
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    const category = this.getScoreCategory(score);
    
    return {
      title,
      titleLength: title.length,
      titleKeywordPosition,
      description,
      descriptionLength: description ? description.length : 0,
      descriptionHasKeyword,
      hasCanonical: !!pageData.meta.canonical,
      hasRobots: !!pageData.meta.robots,
      hasOpenGraph: Object.keys(pageData.meta.ogTags).length > 0,
      hasTwitterCard: Object.keys(pageData.meta.twitterTags).length > 0,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze content (word count, headings, etc.)
   */
  private analyzeContent(pageData: CrawlerOutput): any {
    const { content, headings } = pageData;
    const wordCount = content.wordCount;
    const paragraphCount = content.paragraphs.length;
    
    // Count different heading levels
    const h1Count = headings.h1.length;
    const h2Count = headings.h2.length;
    const h3Count = headings.h3.length;
    const h4Count = headings.h4.length;
    const h5Count = headings.h5.length;
    const h6Count = headings.h6.length;
    
    // Approximate readability score (simplified calculation)
    // In a real application, we would use a proper readability algorithm like Flesch-Kincaid
    const avgWordsPerSentence = this.estimateAverageWordsPerSentence(content.text);
    const readabilityScore = this.calculateReadabilityScore(avgWordsPerSentence, wordCount, paragraphCount);
    
    // Check for multimedia content (approximation)
    const hasMultimedia = pageData.images.length > 0;
    
    // Calculate score
    let score = 50; // Base score
    
    // Content length factors
    if (wordCount >= 300) score += 10;
    if (wordCount >= 600) score += 10;
    if (wordCount >= 1000) score += 5;
    
    // Heading structure factors
    if (h1Count === 1) score += 10; // Exactly one H1 is best practice
    else if (h1Count > 1) score += 5; // Multiple H1s is not ideal but better than none
    
    if (h2Count > 0) score += 5;
    if (h3Count > 0) score += 3;
    
    // Paragraphs
    if (paragraphCount >= 5) score += 5;
    
    // Readability
    if (readabilityScore >= 60) score += 5;
    if (readabilityScore >= 80) score += 5;
    
    // Multimedia
    if (hasMultimedia) score += 7;
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    const category = this.getScoreCategory(score);
    
    return {
      wordCount,
      paragraphCount,
      headingStructure: {
        h1Count,
        h2Count,
        h3Count,
        h4Count,
        h5Count,
        h6Count
      },
      readabilityScore,
      hasMultimedia,
      overallScore: { score, category }
    };
  }

  /**
   * Estimate average words per sentence
   */
  private estimateAverageWordsPerSentence(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).filter(Boolean).length;
    }, 0);
    
    return totalWords / sentences.length;
  }

  /**
   * Calculate readability score using a simplified approach
   */
  private calculateReadabilityScore(avgWordsPerSentence: number, wordCount: number, paragraphCount: number): number {
    // Simplified readability calculation
    // Lower average words per sentence = more readable
    // More paragraphs relative to word count = more readable
    
    let score = 100;
    
    // Penalize for long sentences
    if (avgWordsPerSentence > 20) score -= 20;
    else if (avgWordsPerSentence > 15) score -= 10;
    else if (avgWordsPerSentence > 10) score -= 5;
    
    // Penalize for lack of paragraphs
    const wordsPerParagraph = paragraphCount > 0 ? wordCount / paragraphCount : wordCount;
    if (wordsPerParagraph > 150) score -= 20;
    else if (wordsPerParagraph > 100) score -= 10;
    else if (wordsPerParagraph > 75) score -= 5;
    
    // Cap score between 0 and 100
    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Analyze internal links
   */
  private analyzeInternalLinks(pageData: CrawlerOutput): any {
    const { internal } = pageData.links;
    
    const count = internal.length;
    const uniqueLinks = new Set(internal.map(link => link.url));
    const uniqueCount = uniqueLinks.size;
    const brokenLinksCount = internal.filter(link => link.broken).length;
    
    // Check for proper anchor text (simplified approach)
    const hasProperAnchors = internal.some(link => {
      const anchorText = link.text.trim().toLowerCase();
      // Avoid generic anchor texts like "click here", "read more", etc.
      return anchorText.length > 0 && 
             !['click here', 'read more', 'learn more', 'here', 'link'].includes(anchorText);
    });
    
    // Calculate score
    let score = 50; // Base score
    
    // Link quantity factors
    if (count >= 1) score += 10;
    if (count >= 3) score += 10;
    if (count >= 5) score += 5;
    
    // Link quality factors
    if (uniqueCount >= 3) score += 10;
    if (hasProperAnchors) score += 10;
    
    // Broken links penalty
    if (brokenLinksCount > 0) score -= brokenLinksCount * 5;
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(score, 100));
    
    const category = this.getScoreCategory(score);
    
    return {
      count,
      uniqueCount,
      hasProperAnchors,
      brokenLinksCount,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze images (alt text, etc.)
   */
  private analyzeImages(pageData: CrawlerOutput): any {
    const { images } = pageData;
    
    const count = images.length;
    const withAltCount = images.filter(img => img.alt && img.alt.trim().length > 0).length;
    const withoutAltCount = count - withAltCount;
    
    // Simplified image optimization check (normally would check actual file sizes)
    // For now, we'll assume 50% of images are optimized
    const optimizedCount = Math.round(count * 0.5);
    const unoptimizedCount = count - optimizedCount;
    
    // Calculate score
    let score = 50; // Base score
    
    // Image quantity factors
    if (count > 0) score += 10;
    
    // Alt text factors
    if (count > 0) {
      const altTextPercentage = (withAltCount / count) * 100;
      if (altTextPercentage === 100) score += 25;
      else if (altTextPercentage >= 75) score += 15;
      else if (altTextPercentage >= 50) score += 10;
    }
    
    // Optimization factors (simplified for now)
    if (count > 0) {
      const optimizedPercentage = (optimizedCount / count) * 100;
      if (optimizedPercentage >= 75) score += 15;
      else if (optimizedPercentage >= 50) score += 10;
      else if (optimizedPercentage >= 25) score += 5;
    }
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(score, 100));
    
    const category = this.getScoreCategory(score);
    
    return {
      count,
      withAltCount,
      withoutAltCount,
      optimizedCount,
      unoptimizedCount,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze schema markup
   */
  private analyzeSchemaMarkup(pageData: CrawlerOutput): any {
    const { schema } = pageData;
    
    const hasSchemaMarkup = schema.length > 0;
    
    // Extract all schema types
    let types: string[] = [];
    if (hasSchemaMarkup) {
      schema.forEach(item => {
        if (item.types && item.types.length > 0) {
          types = [...types, ...item.types];
        }
      });
    }
    
    // De-duplicate types
    types = [...new Set(types)];
    
    // Calculate score
    let score = 50; // Base score
    
    if (hasSchemaMarkup) {
      score += 25; // Base points for having any schema
      
      // Additional points for specific schema types
      if (types.some(t => t.includes('Product'))) score += 5;
      if (types.some(t => t.includes('Organization') || t.includes('LocalBusiness'))) score += 5;
      if (types.some(t => t.includes('Article') || t.includes('BlogPosting'))) score += 5;
      if (types.some(t => t.includes('BreadcrumbList'))) score += 5;
      if (types.some(t => t.includes('FAQPage') || t.includes('HowTo'))) score += 5;
    }
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(score, 100));
    
    const category = this.getScoreCategory(score);
    
    return {
      hasSchemaMarkup,
      types: types.length > 0 ? types : undefined,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze mobile-friendliness
   */
  private analyzeMobileFriendliness(pageData: CrawlerOutput): any {
    // Start with basic mobile compatibility check from crawler
    const isMobileFriendly = pageData.mobileCompatible;
    
    // Check for viewport meta tag
    const viewportSet = pageData.meta.viewport ? true : false;
    
    // Simplified checks for text size and tap targets
    // In a real implementation, this would require more sophisticated analysis
    const textSizeAppropriate = true; // Assuming text size is appropriate
    const tapTargetsAppropriate = true; // Assuming tap targets are appropriate
    
    // Calculate score
    let score = 50; // Base score
    
    if (isMobileFriendly) score += 25;
    if (viewportSet) score += 15;
    if (textSizeAppropriate) score += 5;
    if (tapTargetsAppropriate) score += 5;
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(score, 100));
    
    const category = this.getScoreCategory(score);
    
    return {
      isMobileFriendly,
      viewportSet,
      textSizeAppropriate,
      tapTargetsAppropriate,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze user engagement signals
   */
  private analyzeUserEngagement(pageData: CrawlerOutput): any {
    // Predict potential bounce rate based on content quality indicators
    const wordCount = pageData.content.wordCount;
    const hasImages = pageData.images.length > 0;
    const hasProperHeadingStructure = pageData.headings.h1.length > 0 && pageData.headings.h2.length > 0;
    
    // Simplified bounce rate prediction
    let potentialBounceRate = 80; // Start with a pessimistic value
    
    if (wordCount >= 300) potentialBounceRate -= 10;
    if (wordCount >= 600) potentialBounceRate -= 10;
    if (wordCount >= 1000) potentialBounceRate -= 5;
    
    if (hasImages) potentialBounceRate -= 15;
    if (hasProperHeadingStructure) potentialBounceRate -= 10;
    
    // Estimate read time (average reading speed: 200-250 words per minute)
    const estimatedReadTime = Math.ceil(wordCount / 200);
    
    // Calculate score
    let score = 50; // Base score
    
    // Lower bounce rate is better
    if (potentialBounceRate <= 50) score += 20;
    else if (potentialBounceRate <= 60) score += 15;
    else if (potentialBounceRate <= 70) score += 10;
    
    // Content length is a factor in engagement
    if (wordCount >= 600) score += 15;
    else if (wordCount >= 300) score += 10;
    
    // Visual elements help engagement
    if (hasImages) score += 10;
    
    // Structure helps engagement
    if (hasProperHeadingStructure) score += 5;
    
    // Cap score and bounce rate
    score = Math.max(0, Math.min(score, 100));
    potentialBounceRate = Math.max(20, Math.min(potentialBounceRate, 95));
    
    const category = this.getScoreCategory(score);
    
    return {
      potentialBounceRate,
      estimatedReadTime,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze Experience, Expertise, Authoritativeness, Trustworthiness (E-E-A-T)
   */
  private analyzeEAT(pageData: CrawlerOutput): any {
    // Simplified E-E-A-T analysis
    // In reality, this would be much more complex and might require AI to determine
    
    // Look for author information (simplified approach)
    const content = pageData.content.text.toLowerCase();
    const hasAuthorInfo = content.includes('author') || 
                        content.includes('written by') || 
                        content.includes('about me') ||
                        pageData.links.internal.some(link => 
                          link.text.toLowerCase().includes('author') || 
                          link.url.toLowerCase().includes('author'));
    
    // Look for external citations
    const hasExternalCitations = pageData.links.external.length > 0;
    
    // Look for credentials or expertise indicators
    const hasCredentials = content.includes('certified') || 
                         content.includes('expert') || 
                         content.includes('qualification') ||
                         content.includes('years of experience') ||
                         content.includes('degree');
    
    // Calculate score
    let score = 50; // Base score
    
    if (hasAuthorInfo) score += 20;
    if (hasExternalCitations) score += 15;
    if (hasCredentials) score += 15;
    
    // Cap score between 0 and 100
    score = Math.max(0, Math.min(score, 100));
    
    const category = this.getScoreCategory(score);
    
    return {
      hasAuthorInfo,
      hasExternalCitations,
      hasCredentials,
      overallScore: { score, category }
    };
  }

  /**
   * Calculate overall score based on individual scores
   */
  private calculateOverallScore(scores: SeoScore[]): SeoScore {
    // Different weight for different factors
    const weights = {
      keyword: 1.5,
      metaTags: 1.5,
      content: 1.5,
      internalLinks: 1.0,
      images: 1.0,
      schemaMarkup: 1.0,
      mobile: 1.3,
      pageSpeed: 1.3,
      userEngagement: 1.0,
      eat: 0.9
    };
    
    const weightArr = Object.values(weights);
    const totalWeight = weightArr.reduce((sum, weight) => sum + weight, 0);
    
    let weightedScore = 0;
    scores.forEach((score, index) => {
      weightedScore += score.score * weightArr[index];
    });
    
    const finalScore = Math.round(weightedScore / totalWeight);
    const category = this.getScoreCategory(finalScore);
    
    return { score: finalScore, category };
  }

  /**
   * Get score category based on numeric score
   */
  private getScoreCategory(score: number): 'excellent' | 'good' | 'needs-work' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs-work';
    return 'poor';
  }

  /**
   * Identify strengths based on analysis results
   */
  private identifyStrengths(analysis: any): string[] {
    const strengths: string[] = [];
    
    // Keyword optimization strengths
    if (analysis.keywordAnalysis.overallScore.score >= 80) {
      strengths.push('Strong keyword optimization throughout the page');
    } else if (analysis.keywordAnalysis.titlePresent) {
      strengths.push('Primary keyword is present in the title tag');
    }
    
    // Meta tags strengths
    if (analysis.metaTagsAnalysis.overallScore.score >= 80) {
      strengths.push('Well-optimized meta tags');
    } else {
      if (analysis.metaTagsAnalysis.title && analysis.metaTagsAnalysis.titleLength >= 30 && analysis.metaTagsAnalysis.titleLength <= 60) {
        strengths.push('Title tag has optimal length');
      }
      if (analysis.metaTagsAnalysis.description && analysis.metaTagsAnalysis.descriptionLength >= 70 && analysis.metaTagsAnalysis.descriptionLength <= 160) {
        strengths.push('Meta description has optimal length');
      }
      if (analysis.metaTagsAnalysis.hasOpenGraph && analysis.metaTagsAnalysis.hasTwitterCard) {
        strengths.push('Good social media optimization with Open Graph and Twitter Card tags');
      }
    }
    
    // Content strengths
    if (analysis.contentAnalysis.overallScore.score >= 80) {
      strengths.push('High-quality content with good structure');
    } else {
      if (analysis.contentAnalysis.wordCount >= 600) {
        strengths.push('Good content depth with sufficient word count');
      }
      if (analysis.contentAnalysis.headingStructure.h1Count === 1) {
        strengths.push('Proper H1 heading structure');
      }
      if (analysis.contentAnalysis.readabilityScore >= 70) {
        strengths.push('Content has good readability');
      }
    }
    
    // Mobile-friendliness strengths
    if (analysis.mobileAnalysis.overallScore.score >= 80) {
      strengths.push('Excellent mobile responsiveness');
    } else if (analysis.mobileAnalysis.isMobileFriendly) {
      strengths.push('Page is mobile-friendly');
    }
    
    // Page speed strengths
    if (analysis.pageSpeedAnalysis.overallScore.score >= 80) {
      strengths.push('Fast page loading speed');
    }
    
    // Schema markup strengths
    if (analysis.schemaMarkupAnalysis.hasSchemaMarkup) {
      strengths.push('Proper implementation of schema markup');
    }
    
    // Image strengths
    if (analysis.imageAnalysis.count > 0 && analysis.imageAnalysis.withAltCount === analysis.imageAnalysis.count) {
      strengths.push('All images have proper alt text');
    }
    
    // E-E-A-T strengths
    if (analysis.eatAnalysis.overallScore.score >= 70) {
      strengths.push('Strong E-E-A-T signals present on the page');
    } else if (analysis.eatAnalysis.hasAuthorInfo && analysis.eatAnalysis.hasExternalCitations) {
      strengths.push('Good authority signals with author information and citations');
    }
    
    // Internal links strengths
    if (analysis.internalLinksAnalysis.count >= 3 && analysis.internalLinksAnalysis.hasProperAnchors) {
      strengths.push('Good internal linking structure with descriptive anchor text');
    }
    
    // Return a maximum of 5 strengths
    return strengths.slice(0, 5);
  }

  /**
   * Identify weaknesses based on analysis results
   */
  private identifyWeaknesses(analysis: any): string[] {
    const weaknesses: string[] = [];
    
    // Keyword optimization weaknesses
    if (analysis.keywordAnalysis.overallScore.score < 50) {
      weaknesses.push('Poor keyword optimization across the page');
    } else {
      if (!analysis.keywordAnalysis.titlePresent) {
        weaknesses.push('Primary keyword missing from title tag');
      }
      if (!analysis.keywordAnalysis.h1Present) {
        weaknesses.push('Primary keyword missing from H1 heading');
      }
      if (!analysis.keywordAnalysis.altTextPresent && analysis.imageAnalysis.count > 0) {
        weaknesses.push('Images missing keyword-optimized alt text');
      }
    }
    
    // Meta tags weaknesses
    if (!analysis.metaTagsAnalysis.title || analysis.metaTagsAnalysis.titleLength < 30 || analysis.metaTagsAnalysis.titleLength > 60) {
      weaknesses.push('Title tag missing or not optimal length (30-60 characters)');
    }
    if (!analysis.metaTagsAnalysis.description || analysis.metaTagsAnalysis.descriptionLength < 70 || analysis.metaTagsAnalysis.descriptionLength > 160) {
      weaknesses.push('Meta description missing or not optimal length (70-160 characters)');
    }
    
    // Content weaknesses
    if (analysis.contentAnalysis.wordCount < 300) {
      weaknesses.push('Content is too thin (less than 300 words)');
    }
    if (analysis.contentAnalysis.headingStructure.h1Count === 0) {
      weaknesses.push('Missing H1 heading');
    } else if (analysis.contentAnalysis.headingStructure.h1Count > 1) {
      weaknesses.push('Multiple H1 headings (only one recommended)');
    }
    if (analysis.contentAnalysis.headingStructure.h2Count === 0) {
      weaknesses.push('Missing H2 subheadings for content structure');
    }
    
    // Mobile-friendliness weaknesses
    if (!analysis.mobileAnalysis.isMobileFriendly) {
      weaknesses.push('Page is not mobile-friendly');
    }
    
    // Page speed weaknesses
    if (analysis.pageSpeedAnalysis.overallScore.score < 50) {
      weaknesses.push('Slow page loading speed');
    }
    
    // Schema markup weaknesses
    if (!analysis.schemaMarkupAnalysis.hasSchemaMarkup) {
      weaknesses.push('Missing schema markup');
    }
    
    // Image weaknesses
    if (analysis.imageAnalysis.withoutAltCount > 0) {
      weaknesses.push(`${analysis.imageAnalysis.withoutAltCount} images missing alt text`);
    }
    
    // Internal links weaknesses
    if (analysis.internalLinksAnalysis.count < 2) {
      weaknesses.push('Insufficient internal linking');
    }
    if (analysis.internalLinksAnalysis.brokenLinksCount > 0) {
      weaknesses.push(`${analysis.internalLinksAnalysis.brokenLinksCount} broken internal links`);
    }
    
    // E-E-A-T weaknesses
    if (!analysis.eatAnalysis.hasAuthorInfo) {
      weaknesses.push('Missing author information or credentials');
    }
    if (!analysis.eatAnalysis.hasExternalCitations) {
      weaknesses.push('No external citations or references');
    }
    
    // Return a maximum of 5 weaknesses
    return weaknesses.slice(0, 5);
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    // Keyword recommendations
    if (!analysis.keywordAnalysis.titlePresent) {
      recommendations.push(`Add your primary keyword "${analysis.keywordAnalysis.primaryKeyword}" to your title tag, preferably near the beginning`);
    }
    if (!analysis.keywordAnalysis.h1Present) {
      recommendations.push(`Include your primary keyword "${analysis.keywordAnalysis.primaryKeyword}" in your H1 heading`);
    }
    if (!analysis.keywordAnalysis.altTextPresent && analysis.imageAnalysis.count > 0) {
      recommendations.push(`Add alt text containing your primary keyword to relevant images`);
    }
    if (analysis.keywordAnalysis.density < 0.5) {
      recommendations.push(`Increase keyword density slightly (current: ${analysis.keywordAnalysis.density.toFixed(1)}%, recommended: 1-2%)`);
    } else if (analysis.keywordAnalysis.density > 3) {
      recommendations.push(`Reduce keyword density to avoid keyword stuffing (current: ${analysis.keywordAnalysis.density.toFixed(1)}%, recommended: 1-2%)`);
    }
    
    // Meta tags recommendations
    if (!analysis.metaTagsAnalysis.title) {
      recommendations.push('Add a title tag with your primary keyword');
    } else if (analysis.metaTagsAnalysis.titleLength < 30) {
      recommendations.push(`Expand your title tag (currently ${analysis.metaTagsAnalysis.titleLength} characters, aim for 30-60)`);
    } else if (analysis.metaTagsAnalysis.titleLength > 60) {
      recommendations.push(`Shorten your title tag (currently ${analysis.metaTagsAnalysis.titleLength} characters, aim for 30-60)`);
    }
    
    if (!analysis.metaTagsAnalysis.description) {
      recommendations.push('Add a meta description containing your primary keyword');
    } else if (analysis.metaTagsAnalysis.descriptionLength < 70) {
      recommendations.push(`Expand your meta description (currently ${analysis.metaTagsAnalysis.descriptionLength} characters, aim for 70-160)`);
    } else if (analysis.metaTagsAnalysis.descriptionLength > 160) {
      recommendations.push(`Shorten your meta description (currently ${analysis.metaTagsAnalysis.descriptionLength} characters, aim for 70-160)`);
    }
    
    // Content recommendations
    if (analysis.contentAnalysis.wordCount < 300) {
      recommendations.push('Expand your content to at least 300 words for better topic coverage');
    } else if (analysis.contentAnalysis.wordCount < 600) {
      recommendations.push('Consider adding more comprehensive content (aim for 600+ words)');
    }
    
    if (analysis.contentAnalysis.headingStructure.h1Count === 0) {
      recommendations.push('Add an H1 heading to your page that includes your primary keyword');
    } else if (analysis.contentAnalysis.headingStructure.h1Count > 1) {
      recommendations.push('Use only one H1 heading per page, and use H2-H6 for subsections');
    }
    
    if (analysis.contentAnalysis.headingStructure.h2Count === 0) {
      recommendations.push('Add H2 subheadings to structure your content better');
    }
    
    // Mobile recommendations
    if (!analysis.mobileAnalysis.isMobileFriendly) {
      recommendations.push('Make your page mobile-friendly using responsive design techniques');
    }
    if (!analysis.mobileAnalysis.viewportSet) {
      recommendations.push('Add a viewport meta tag to control how your page appears on mobile devices');
    }
    
    // Schema recommendations
    if (!analysis.schemaMarkupAnalysis.hasSchemaMarkup) {
      recommendations.push('Implement schema markup to enhance visibility in search results and potentially earn rich snippets');
    }
    
    // Image recommendations
    if (analysis.imageAnalysis.withoutAltCount > 0) {
      recommendations.push(`Add descriptive alt text to ${analysis.imageAnalysis.withoutAltCount} image(s) that includes relevant keywords`);
    }
    
    // Internal link recommendations
    if (analysis.internalLinksAnalysis.count < 2) {
      recommendations.push('Add more internal links to help users and search engines discover related content');
    }
    if (!analysis.internalLinksAnalysis.hasProperAnchors) {
      recommendations.push('Use descriptive anchor text for internal links instead of generic text like "click here"');
    }
    if (analysis.internalLinksAnalysis.brokenLinksCount > 0) {
      recommendations.push(`Fix ${analysis.internalLinksAnalysis.brokenLinksCount} broken internal link(s)`);
    }
    
    // Page speed recommendations
    if (analysis.pageSpeedAnalysis.overallScore.score < 70) {
      recommendations.push('Improve page loading speed by optimizing images, minifying CSS/JS, and reducing server response time');
    }
    
    // E-E-A-T recommendations
    if (!analysis.eatAnalysis.hasAuthorInfo) {
      recommendations.push('Add author information to establish expertise and authority');
    }
    if (!analysis.eatAnalysis.hasExternalCitations) {
      recommendations.push('Include citations to authoritative external sources to improve trustworthiness');
    }
    
    // Return a maximum of 10 recommendations
    return recommendations.slice(0, 10);
  }
}

export const analyzer = new Analyzer();
