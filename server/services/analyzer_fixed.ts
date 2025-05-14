import { SeoAnalysisResult, SeoScore } from '@shared/schema';
import { CrawlerOutput } from '@/lib/types';
import { keywordAnalyzer } from './keywordAnalyzer';
import { pageSpeed } from './pageSpeed';
import { contentOptimizationAnalyzer } from './contentOptimizationAnalyzer';
import { technicalSeoAnalyzer } from './technicalSeoAnalyzer';

class Analyzer {
  /**
   * Extract keyword from URL as a fallback
   */
  private extractKeywordFromUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
      
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        // Remove file extensions and convert dashes/underscores to spaces
        return lastSegment
          .replace(/\.(html|php|aspx|htm)$/, '')
          .replace(/[-_]/g, ' ')
          .trim();
      }
      
      // If no path segments, use the hostname without TLD
      return parsedUrl.hostname.split('.')[0];
    } catch (error) {
      console.error("Error extracting keyword from URL:", error);
      return "";
    }
  }

  /**
   * Create default error analysis result when analysis fails
   */
  private createErrorAnalysisResult(url: string, errorMessage: string): SeoAnalysisResult {
    return {
      url,
      timestamp: new Date().toISOString(),
      overallScore: { score: 50, category: 'needs-work' },
      strengths: [],
      weaknesses: [errorMessage || "Analysis could not be completed. Please try again."],
      keywordAnalysis: this.createDefaultKeywordAnalysis(""),
      metaTagsAnalysis: this.createDefaultMetaTagsAnalysis(),
      contentAnalysis: this.createDefaultContentAnalysis(),
      internalLinksAnalysis: this.createDefaultInternalLinksAnalysis(),
      imageAnalysis: this.createDefaultImageAnalysis(),
      schemaMarkupAnalysis: this.createDefaultSchemaMarkupAnalysis(),
      mobileAnalysis: this.createDefaultMobileAnalysis(),
      pageSpeedAnalysis: this.createDefaultPageSpeedAnalysis(),
      userEngagementAnalysis: this.createDefaultUserEngagementAnalysis(),
      eatAnalysis: this.createDefaultEATAnalysis(),
      technicalSeoAnalysis: {
        securityIssues: { score: 50, hasHttps: true, hasMixedContent: false, hasSecurityHeaders: false },
        indexability: { score: 50, hasRobotsTxt: false, hasNoindexTag: false, hasCanonicalTag: true },
        mobileFriendliness: { score: 50, isMobileFriendly: true, hasViewport: true, hasResponsiveDesign: true },
        structuredData: { score: 50, hasStructuredData: false, hasSchema: false, hasMicrodata: false },
        canonicalIssues: { score: 50, hasCanonical: true, hasMultipleCanonicals: false, hasCanonicalLoop: false },
        performance: { score: 50, loadTime: 3.0, resourceCount: 50, resourceSize: 2000 },
        serverConfig: { score: 50, statusCode: 200, hasGzip: true, hasHttp2: false }
      },
      enhancedContentAnalysis: {
        headingStructure: { score: 50, hasH1: true, hasProperHierarchy: true, avgWordCount: 5 },
        keywordUsage: { score: 50, density: 1.5, inTitle: true, inHeadings: true, inFirstParagraph: true },
        readability: { score: 50, fleschKincaid: 60, avgSentenceLength: 15, avgParagraphLength: 2 },
        contentQuality: { score: 50, hasOriginalContent: true, hasThinContent: false },
        contentStructure: { score: 50, hasBulletLists: true, hasNumberedLists: true, hasSections: true },
        contentIssues: ["Analysis could not be completed"],
        contentRecommendations: ["Retry analysis with a valid URL"]
      }
    };
  }

  /**
   * Create default keyword analysis
   */
  private createDefaultKeywordAnalysis(primaryKeyword: string) {
    return {
      primaryKeyword: primaryKeyword || "",
      density: 0,
      relatedKeywords: [],
      titlePresent: false,
      descriptionPresent: false,
      h1Present: false,
      headingsPresent: false,
      urlPresent: false,
      contentPresent: false,
      altTextPresent: false,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default meta tags analysis
   */
  private createDefaultMetaTagsAnalysis() {
    return {
      title: "",
      titleLength: 0,
      titleContainsKeyword: false,
      description: "",
      descriptionLength: 0,
      descriptionContainsKeyword: false,
      hasOpenGraph: false,
      hasTwitterCards: false,
      hasMeta: false,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default content analysis
   */
  private createDefaultContentAnalysis() {
    return {
      wordCount: 0,
      paragraphCount: 0,
      avgWordsPerParagraph: 0,
      headingCount: 0,
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      keywordDensity: 0,
      readabilityScore: 50,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default internal links analysis
   */
  private createDefaultInternalLinksAnalysis() {
    return {
      count: 0,
      uniqueCount: 0,
      hasProperAnchors: false,
      brokenLinksCount: 0,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default image analysis
   */
  private createDefaultImageAnalysis() {
    return {
      count: 0,
      altCount: 0,
      altPercentage: 0,
      sizeOptimized: false,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default schema markup analysis
   */
  private createDefaultSchemaMarkupAnalysis() {
    return {
      hasSchemaMarkup: false,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default mobile analysis
   */
  private createDefaultMobileAnalysis() {
    return {
      isMobileFriendly: false,
      hasViewport: false,
      hasResponsiveDesign: false,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default page speed analysis
   */
  private createDefaultPageSpeedAnalysis() {
    return {
      score: 50,
      fid: 100,
      lcp: 2500,
      cls: 0.1,
      ttfb: 500,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default user engagement analysis
   */
  private createDefaultUserEngagementAnalysis() {
    return {
      estimatedReadTime: 5,
      potentialBounceRate: 50,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Create default EAT analysis
   */
  private createDefaultEATAnalysis() {
    return {
      hasAuthorInfo: false,
      hasExpertise: false,
      hasAuthority: false,
      hasTrustworthiness: false,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }

  /**
   * Analyze a webpage and generate a comprehensive SEO assessment report
   */
  async analyzePage(url: string, pageData: CrawlerOutput): Promise<SeoAnalysisResult> {
    try {
      console.log(`Analyzing page: ${url}`);
      
      // Validate page data
      if (!pageData || !pageData.html) {
        console.error("Invalid page data for analysis");
        return this.createErrorAnalysisResult(url, "Failed to retrieve page content");
      }
      
      // Default values for all analyses in case they fail
      let primaryKeyword = "";
      let keywordAnalysis;
      let metaTagsAnalysis;
      let contentAnalysis;
      let enhancedContentAnalysis;
      let technicalAnalysis;
      let internalLinksAnalysis;
      let imageAnalysis;
      let schemaMarkupAnalysis;
      let mobileAnalysis;
      let pageSpeedAnalysis;
      let userEngagementAnalysis;
      let eatAnalysis;
      
      // Try to extract primary keyword with error handling
      try {
        primaryKeyword = await keywordAnalyzer.extractPrimaryKeyword(pageData);
      } catch (error) {
        console.error("Error extracting primary keyword:", error);
        primaryKeyword = this.extractKeywordFromUrl(url);
      }
      
      // Perform each analysis step with individual error handling
      try {
        keywordAnalysis = await keywordAnalyzer.analyze(pageData, primaryKeyword);
      } catch (error) {
        console.error("Error analyzing keywords:", error);
        keywordAnalysis = this.createDefaultKeywordAnalysis(primaryKeyword);
      }
      
      try {
        metaTagsAnalysis = this.analyzeMetaTags(pageData, primaryKeyword);
      } catch (error) {
        console.error("Error analyzing meta tags:", error);
        metaTagsAnalysis = this.createDefaultMetaTagsAnalysis();
      }
      
      try {
        contentAnalysis = this.analyzeContent(pageData);
      } catch (error) {
        console.error("Error analyzing content:", error);
        contentAnalysis = this.createDefaultContentAnalysis();
      }
      
      try {
        enhancedContentAnalysis = contentOptimizationAnalyzer.analyzeContent(pageData, primaryKeyword);
      } catch (error) {
        console.error("Error in enhanced content analysis:", error);
        enhancedContentAnalysis = { 
          score: 50, 
          assessment: "Needs Work", 
          issues: ["Content analysis could not be completed"], 
          recommendations: ["Try analyzing the page again"] 
        };
      }
      
      try {
        technicalAnalysis = await technicalSeoAnalyzer.analyzeTechnicalSeo(pageData);
      } catch (error) {
        console.error("Error in technical SEO analysis:", error);
        technicalAnalysis = { 
          score: 50, 
          assessment: "Needs Work", 
          issues: ["Technical analysis could not be completed"], 
          recommendations: ["Try analyzing the page again"] 
        };
      }
      
      try {
        internalLinksAnalysis = this.analyzeInternalLinks(pageData);
      } catch (error) {
        console.error("Error analyzing internal links:", error);
        internalLinksAnalysis = this.createDefaultInternalLinksAnalysis();
      }
      
      try {
        imageAnalysis = this.analyzeImages(pageData);
      } catch (error) {
        console.error("Error analyzing images:", error);
        imageAnalysis = this.createDefaultImageAnalysis();
      }
      
      try {
        schemaMarkupAnalysis = this.analyzeSchemaMarkup(pageData);
      } catch (error) {
        console.error("Error analyzing schema markup:", error);
        schemaMarkupAnalysis = this.createDefaultSchemaMarkupAnalysis();
      }
      
      try {
        mobileAnalysis = this.analyzeMobileFriendliness(pageData);
      } catch (error) {
        console.error("Error analyzing mobile friendliness:", error);
        mobileAnalysis = this.createDefaultMobileAnalysis();
      }
      
      try {
        pageSpeedAnalysis = await pageSpeed.analyze(url, pageData);
      } catch (error) {
        console.error("Error analyzing page speed:", error);
        pageSpeedAnalysis = this.createDefaultPageSpeedAnalysis();
      }
      
      try {
        userEngagementAnalysis = this.analyzeUserEngagement(pageData);
      } catch (error) {
        console.error("Error analyzing user engagement:", error);
        userEngagementAnalysis = this.createDefaultUserEngagementAnalysis();
      }
      
      try {
        eatAnalysis = this.analyzeEAT(pageData);
      } catch (error) {
        console.error("Error analyzing E-E-A-T factors:", error);
        eatAnalysis = this.createDefaultEATAnalysis();
      }
      
      // Add enhanced content analysis score and technical analysis score with null checks
      let contentScore: SeoScore = {
        score: 70,
        category: 'good'
      };
      
      if (enhancedContentAnalysis && enhancedContentAnalysis.score !== undefined && enhancedContentAnalysis.assessment) {
        contentScore = {
          score: enhancedContentAnalysis.score,
          category: enhancedContentAnalysis.assessment.toLowerCase() as 'excellent' | 'good' | 'needs-work' | 'poor'
        };
      }
      
      let technicalScore: SeoScore = {
        score: 70,
        category: 'good'
      };
      
      if (technicalAnalysis && technicalAnalysis.score !== undefined && technicalAnalysis.assessment) {
        technicalScore = {
          score: technicalAnalysis.score,
          category: technicalAnalysis.assessment.toLowerCase() as 'excellent' | 'good' | 'needs-work' | 'poor'
        };
      }
      
      // Calculate overall score based on all factors, giving more weight to enhanced analyses
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
        eatAnalysis.overallScore,
        contentScore,
        technicalScore
      ]);
      
      // Identify strengths and weaknesses
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
        eatAnalysis,
        enhancedContentAnalysis,
        technicalAnalysis
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
        eatAnalysis,
        enhancedContentAnalysis,
        technicalAnalysis
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
        eatAnalysis,
        enhancedContentAnalysis,
        technicalAnalysis
      });
      
      // Construct final analysis result
      return {
        url,
        timestamp: new Date().toISOString(),
        overallScore,
        strengths,
        weaknesses,
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
        technicalSeoAnalysis: technicalAnalysis,
        enhancedContentAnalysis
      };
      
    } catch (error) {
      console.error(`Error analyzing page: ${error}`);
      throw new Error(`Failed to analyze page: ${error}`);
    }
  }

  /**
   * Analyze meta tags (title, description, etc.)
   */
  private analyzeMetaTags(pageData: CrawlerOutput, primaryKeyword: string): any {
    const { title, meta } = pageData;
    const { description, ogTags, twitterTags } = meta;
    
    // Check if title contains keyword
    const titleContainsKeyword = title ? title.toLowerCase().includes(primaryKeyword.toLowerCase()) : false;
    
    // Check if description contains keyword
    const descriptionContainsKeyword = description ? description.toLowerCase().includes(primaryKeyword.toLowerCase()) : false;
    
    // Calculate score based on meta tag presence and quality
    let score = 0;
    
    // Title analysis (30% weight)
    if (title) {
      score += 15; // Having a title
      
      if (titleContainsKeyword) {
        score += 10; // Title contains keyword
      }
      
      // Title length analysis
      const titleLength = title.length;
      if (titleLength >= 40 && titleLength <= 60) {
        score += 5; // Optimal title length
      } else if (titleLength > 30 && titleLength < 70) {
        score += 3; // Acceptable title length
      }
    }
    
    // Description analysis (30% weight)
    if (description) {
      score += 15; // Having a description
      
      if (descriptionContainsKeyword) {
        score += 10; // Description contains keyword
      }
      
      // Description length analysis
      const descriptionLength = description.length;
      if (descriptionLength >= 120 && descriptionLength <= 160) {
        score += 5; // Optimal description length
      } else if (descriptionLength > 80 && descriptionLength < 200) {
        score += 3; // Acceptable description length
      }
    }
    
    // Open Graph and Twitter Card analysis (40% weight)
    const hasOpenGraph = Object.keys(ogTags).length > 0;
    const hasTwitterCards = Object.keys(twitterTags).length > 0;
    
    if (hasOpenGraph) {
      score += 20; // Having Open Graph tags
    }
    
    if (hasTwitterCards) {
      score += 20; // Having Twitter Cards
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    const category = this.getScoreCategory(score);
    
    return {
      title: title || "",
      titleLength: title ? title.length : 0,
      titleContainsKeyword,
      description: description || "",
      descriptionLength: description ? description.length : 0,
      descriptionContainsKeyword,
      hasOpenGraph,
      hasTwitterCards,
      hasMeta: !!description,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze content (word count, headings, etc.)
   */
  private analyzeContent(pageData: CrawlerOutput): any {
    const { content, headings } = pageData;
    const { text, wordCount, paragraphs } = content;
    const { h1, h2, h3 } = headings;
    
    // Calculate average words per paragraph
    const paragraphCount = paragraphs.length;
    let avgWordsPerParagraph = 0;
    
    if (paragraphCount > 0) {
      avgWordsPerParagraph = Math.round(wordCount / paragraphCount);
    }
    
    // Calculate readability score
    const avgWordsPerSentence = this.estimateAverageWordsPerSentence(text);
    const readabilityScore = this.calculateReadabilityScore(avgWordsPerSentence, wordCount, paragraphCount);
    
    // Calculate score based on content metrics
    let score = 0;
    
    // Word count (25% weight)
    if (wordCount >= 1500) {
      score += 25; // Excellent content length
    } else if (wordCount >= 800) {
      score += 20; // Good content length
    } else if (wordCount >= 500) {
      score += 15; // Acceptable content length
    } else if (wordCount >= 300) {
      score += 10; // Minimum content length
    } else {
      score += 5; // Poor content length
    }
    
    // Heading structure (25% weight)
    const headingCount = h1.length + h2.length + h3.length;
    const h1Count = h1.length;
    const h2Count = h2.length;
    const h3Count = h3.length;
    
    if (h1Count === 1) {
      score += 10; // One H1 tag (best practice)
    } else if (h1Count > 1) {
      score += 5; // Multiple H1 tags (not ideal)
    }
    
    if (h2Count >= 2 && h3Count >= 1) {
      score += 15; // Good heading structure
    } else if (h2Count >= 1) {
      score += 10; // Basic heading structure
    } else {
      score += 5; // Poor heading structure
    }
    
    // Paragraph structure (25% weight)
    if (avgWordsPerParagraph >= 40 && avgWordsPerParagraph <= 80) {
      score += 25; // Optimal paragraph length
    } else if (avgWordsPerParagraph > 30 && avgWordsPerParagraph < 100) {
      score += 20; // Good paragraph length
    } else if (avgWordsPerParagraph > 15 && avgWordsPerParagraph < 120) {
      score += 15; // Acceptable paragraph length
    } else {
      score += 10; // Poor paragraph length
    }
    
    // Readability (25% weight)
    if (readabilityScore >= 80) {
      score += 25; // Excellent readability
    } else if (readabilityScore >= 60) {
      score += 20; // Good readability
    } else if (readabilityScore >= 40) {
      score += 15; // Acceptable readability
    } else {
      score += 10; // Poor readability
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    const category = this.getScoreCategory(score);
    
    return {
      wordCount,
      paragraphCount,
      avgWordsPerParagraph,
      headingCount,
      h1Count,
      h2Count,
      h3Count,
      keywordDensity: 0, // Calculated in keyword analysis
      readabilityScore,
      overallScore: { score, category }
    };
  }

  /**
   * Estimate average words per sentence
   */
  private estimateAverageWordsPerSentence(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    
    if (sentenceCount === 0) return 0;
    
    let totalWords = 0;
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      totalWords += words.length;
    }
    
    return Math.round(totalWords / sentenceCount);
  }

  /**
   * Calculate readability score using a simplified approach
   */
  private calculateReadabilityScore(avgWordsPerSentence: number, wordCount: number, paragraphCount: number): number {
    // Base score from 0-100
    let score = 100;
    
    // Penalize for very long sentences
    if (avgWordsPerSentence > 25) {
      score -= (avgWordsPerSentence - 25) * 3;
    } else if (avgWordsPerSentence < 10) {
      score -= (10 - avgWordsPerSentence) * 2;
    }
    
    // Penalize for very long paragraphs
    const avgWordsPerParagraph = paragraphCount > 0 ? wordCount / paragraphCount : 0;
    if (avgWordsPerParagraph > 100) {
      score -= (avgWordsPerParagraph - 100) / 10;
    }
    
    // Ensure score is within 0-100 range
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Analyze internal links
   */
  private analyzeInternalLinks(pageData: CrawlerOutput): any {
    const { links } = pageData;
    const { internal } = links;
    
    const count = internal.length;
    const uniqueUrls = new Set(internal.map(link => link.url));
    const uniqueCount = uniqueUrls.size;
    
    // Check for broken links
    const brokenLinks = internal.filter(link => link.broken);
    const brokenLinksCount = brokenLinks.length;
    
    // Check for proper anchor texts (non-generic)
    const genericAnchorTexts = ['click here', 'read more', 'learn more', 'more', 'link', 'here'];
    const genericAnchors = internal.filter(link => {
      const anchorText = link.text.toLowerCase().trim();
      return genericAnchorTexts.includes(anchorText);
    });
    
    const hasProperAnchors = genericAnchors.length === 0;
    
    // Calculate score
    let score = 0;
    
    // Number of internal links (40% weight)
    if (count >= 10) {
      score += 40; // Excellent internal linking
    } else if (count >= 5) {
      score += 30; // Good internal linking
    } else if (count >= 2) {
      score += 20; // Minimal internal linking
    } else if (count >= 1) {
      score += 10; // Poor internal linking
    }
    
    // Unique links ratio (30% weight)
    const uniqueRatio = count > 0 ? uniqueCount / count : 0;
    score += Math.round(uniqueRatio * 30);
    
    // Broken links (20% weight)
    if (brokenLinksCount === 0) {
      score += 20; // No broken links
    } else {
      const brokenRatio = brokenLinksCount / count;
      score += Math.round((1 - brokenRatio) * 20);
    }
    
    // Anchor text quality (10% weight)
    if (hasProperAnchors) {
      score += 10; // All anchors are descriptive
    } else {
      const genericRatio = genericAnchors.length / count;
      score += Math.round((1 - genericRatio) * 10);
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
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
    
    if (count === 0) {
      return {
        count: 0,
        altCount: 0,
        altPercentage: 0,
        sizeOptimized: false,
        overallScore: { score: 50, category: 'needs-work' }
      };
    }
    
    // Check for alt text
    const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0);
    const altCount = imagesWithAlt.length;
    const altPercentage = Math.round((altCount / count) * 100);
    
    // Check for size optimization (assuming size is in KB)
    const largeImages = images.filter(img => img.size && img.size > 200);
    const sizeOptimized = largeImages.length === 0;
    
    // Calculate score
    let score = 0;
    
    // Alt text presence (70% weight)
    score += Math.round(altPercentage * 0.7);
    
    // Size optimization (30% weight)
    if (sizeOptimized) {
      score += 30;
    } else {
      const optimizedRatio = (count - largeImages.length) / count;
      score += Math.round(optimizedRatio * 30);
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    const category = this.getScoreCategory(score);
    
    return {
      count,
      altCount,
      altPercentage,
      sizeOptimized,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze schema markup
   */
  private analyzeSchemaMarkup(pageData: CrawlerOutput): any {
    const { schema } = pageData;
    const hasSchemaMarkup = schema && schema.length > 0;
    
    // Calculate score
    const score = hasSchemaMarkup ? 100 : 50;
    const category = this.getScoreCategory(score);
    
    return {
      hasSchemaMarkup,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze mobile-friendliness
   */
  private analyzeMobileFriendliness(pageData: CrawlerOutput): any {
    const { mobileCompatible } = pageData;
    const { viewport } = pageData.meta;
    
    const isMobileFriendly = mobileCompatible;
    const hasViewport = !!viewport;
    
    // Simplified check for responsive design
    // In a real implementation, this would involve more sophisticated checks
    const hasResponsiveDesign = hasViewport && viewport.includes('width=device-width');
    
    // Calculate score
    let score = 0;
    
    // Mobile compatibility (50% weight)
    if (isMobileFriendly) {
      score += 50;
    }
    
    // Viewport meta tag (30% weight)
    if (hasViewport) {
      score += 30;
    }
    
    // Responsive design (20% weight)
    if (hasResponsiveDesign) {
      score += 20;
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    const category = this.getScoreCategory(score);
    
    return {
      isMobileFriendly,
      hasViewport,
      hasResponsiveDesign,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze page speed
   */
  private analyzePageSpeed(pageData: CrawlerOutput): any {
    // In a real implementation, this would use real page speed metrics
    // For now, we'll use the performance data from the crawler if available
    
    const { performance } = pageData;
    const { loadTime, resourceCount, resourceSize } = performance || {};
    
    // Default values if not available
    const defaultLoadTime = 2.5; // 2.5 seconds
    const defaultResourceCount = 50;
    const defaultResourceSize = 1500; // 1.5 MB
    
    // Use actual values or defaults
    const actualLoadTime = loadTime || defaultLoadTime;
    const actualResourceCount = resourceCount || defaultResourceCount;
    const actualResourceSize = resourceSize || defaultResourceSize;
    
    // Calculate Core Web Vitals estimates
    // These would normally come from real measurements
    const lcp = actualLoadTime * 1000 * 0.8; // LCP in ms
    const fid = actualLoadTime * 50; // FID in ms
    const cls = 0.05; // CLS is unitless
    const ttfb = actualLoadTime * 1000 * 0.2; // TTFB in ms
    
    // Calculate score based on performance metrics
    let score = 100;
    
    // Load time factor (40% weight)
    if (actualLoadTime <= 1) {
      // Excellent: no deduction
    } else if (actualLoadTime <= 2) {
      score -= 5; // Good
    } else if (actualLoadTime <= 3) {
      score -= 15; // Average
    } else if (actualLoadTime <= 5) {
      score -= 25; // Slow
    } else {
      score -= 40; // Very slow
    }
    
    // Resource count factor (30% weight)
    if (actualResourceCount <= 20) {
      // Excellent: no deduction
    } else if (actualResourceCount <= 50) {
      score -= 5; // Good
    } else if (actualResourceCount <= 80) {
      score -= 15; // Average
    } else if (actualResourceCount <= 120) {
      score -= 20; // Many
    } else {
      score -= 30; // Too many
    }
    
    // Resource size factor (30% weight)
    if (actualResourceSize <= 500) {
      // Excellent: no deduction
    } else if (actualResourceSize <= 1000) {
      score -= 5; // Good
    } else if (actualResourceSize <= 2000) {
      score -= 15; // Average
    } else if (actualResourceSize <= 4000) {
      score -= 20; // Large
    } else {
      score -= 30; // Too large
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    const category = this.getScoreCategory(score);
    
    return {
      score,
      lcp,
      fid,
      cls,
      ttfb,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze user engagement signals
   */
  private analyzeUserEngagement(pageData: CrawlerOutput): any {
    const { content } = pageData;
    const { wordCount } = content;
    
    // Estimate reading time (words per minute)
    const wpm = 225; // Average reading speed
    const estimatedReadTime = Math.ceil(wordCount / wpm);
    
    // Estimate potential bounce rate based on content quality
    let potentialBounceRate = 50; // Default rate
    
    if (wordCount >= 1500) {
      potentialBounceRate = 30; // Lower bounce rate for comprehensive content
    } else if (wordCount >= 800) {
      potentialBounceRate = 40; // Moderate bounce rate for good content
    } else if (wordCount < 300) {
      potentialBounceRate = 70; // Higher bounce rate for thin content
    }
    
    // Calculate score
    let score = 100;
    
    // Content length factor (70% weight)
    if (wordCount < 300) {
      score -= 40; // Thin content
    } else if (wordCount < 500) {
      score -= 30; // Minimal content
    } else if (wordCount < 800) {
      score -= 15; // Adequate content
    } else if (wordCount < 1500) {
      score -= 5; // Good content
    } // Else excellent content, no deduction
    
    // Bounce rate factor (30% weight)
    if (potentialBounceRate > 60) {
      score -= 20; // High bounce risk
    } else if (potentialBounceRate > 50) {
      score -= 10; // Moderate bounce risk
    } else if (potentialBounceRate > 40) {
      score -= 5; // Lower bounce risk
    } // Else low bounce risk, no deduction
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    const category = this.getScoreCategory(score);
    
    return {
      estimatedReadTime,
      potentialBounceRate,
      overallScore: { score, category }
    };
  }

  /**
   * Analyze Experience, Expertise, Authoritativeness, Trustworthiness (E-E-A-T)
   */
  private analyzeEAT(pageData: CrawlerOutput): any {
    // In a real implementation, this would involve more sophisticated analysis
    // For now, we'll do a simple check for author information and trust signals
    
    const { content } = pageData;
    const { text } = content;
    
    // Simple checks for E-E-A-T signals
    // These are crude approximations and would require more sophisticated analysis in practice
    
    // Check for author information
    const authorRegex = /author|by\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/i;
    const hasAuthorInfo = authorRegex.test(text);
    
    // Check for expertise signals
    const expertiseRegex = /expert|specialist|professional|certified|qualified|experience|years of|Ph\.?D\.?|M\.?D\.?|professor/i;
    const hasExpertise = expertiseRegex.test(text);
    
    // Check for authority signals
    const authorityRegex = /research|study|survey|according to|cited|published|journal|university|institute/i;
    const hasAuthority = authorityRegex.test(text);
    
    // Check for trustworthiness signals
    const trustRegex = /privacy|secure|trust|guarantee|verified|review|testimonial|rating|accredited|policy/i;
    const hasTrustworthiness = trustRegex.test(text);
    
    // Calculate score
    let score = 0;
    
    // Author information (25% weight)
    if (hasAuthorInfo) {
      score += 25;
    }
    
    // Expertise signals (25% weight)
    if (hasExpertise) {
      score += 25;
    }
    
    // Authority signals (25% weight)
    if (hasAuthority) {
      score += 25;
    }
    
    // Trustworthiness signals (25% weight)
    if (hasTrustworthiness) {
      score += 25;
    }
    
    // Ensure score is within 0-100 range
    score = Math.min(100, Math.max(0, score));
    
    const category = this.getScoreCategory(score);
    
    return {
      hasAuthorInfo,
      hasExpertise,
      hasAuthority,
      hasTrustworthiness,
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
    
    // Filter out any scores that are NaN, null, or undefined
    const validScores = scores.filter(score => 
      score && score.score !== undefined && score.score !== null && !isNaN(score.score)
    );
    
    // If no valid scores, return a default score
    if (validScores.length === 0) {
      return { score: 50, category: 'needs-work' };
    }
    
    const weightArr = Object.values(weights);
    const totalWeight = weightArr.reduce((sum, weight) => sum + weight, 0);
    
    let weightedScore = 0;
    // Only use as many weights as we have scores
    const usableWeights = weightArr.slice(0, validScores.length);
    
    validScores.forEach((score, index) => {
      // Use the corresponding weight or default to 1.0 if we don't have a weight
      const weight = index < usableWeights.length ? usableWeights[index] : 1.0;
      weightedScore += score.score * weight;
    });
    
    // Calculate weighted average and ensure it's not NaN
    const weightTotal = usableWeights.reduce((sum, weight) => sum + weight, 0);
    const finalScore = weightTotal > 0 ? Math.round(weightedScore / weightTotal) : 50;
    
    // Ensure the final score is within 0-100 range and not NaN
    const validFinalScore = isNaN(finalScore) ? 50 : Math.max(0, Math.min(100, finalScore));
    const category = this.getScoreCategory(validFinalScore);
    
    return { score: validFinalScore, category };
  }

  /**
   * Get score category based on numeric score
   */
  private getScoreCategory(score: number): 'excellent' | 'good' | 'needs-work' | 'poor' {
    if (score >= 80) {
      return 'excellent';
    } else if (score >= 60) {
      return 'good';
    } else if (score >= 40) {
      return 'needs-work';
    } else {
      return 'poor';
    }
  }

  /**
   * Identify strengths based on analysis results
   */
  private identifyStrengths(analysis: any): string[] {
    const strengths = [];
    
    // Keyword strengths
    if (analysis.keywordAnalysis?.overallScore.score >= 80) {
      strengths.push("Excellent keyword optimization");
    } else if (analysis.keywordAnalysis?.overallScore.score >= 60) {
      strengths.push("Good keyword usage throughout the page");
    }
    
    // Meta tags strengths
    if (analysis.metaTagsAnalysis?.overallScore.score >= 80) {
      strengths.push("Well-optimized meta tags");
    } else if (analysis.metaTagsAnalysis?.hasOpenGraph && analysis.metaTagsAnalysis?.hasTwitterCards) {
      strengths.push("Good social media metadata with Open Graph and Twitter Cards");
    }
    
    // Content strengths
    if (analysis.contentAnalysis?.overallScore.score >= 80) {
      strengths.push("High-quality, comprehensive content");
    } else if (analysis.contentAnalysis?.wordCount >= 1000) {
      strengths.push("Good content length with " + analysis.contentAnalysis.wordCount + " words");
    }
    
    if (analysis.contentAnalysis?.readabilityScore >= 80) {
      strengths.push("Excellent content readability");
    }
    
    // Internal links strengths
    if (analysis.internalLinksAnalysis?.overallScore.score >= 80) {
      strengths.push("Strong internal linking structure");
    } else if (analysis.internalLinksAnalysis?.count >= 5 && analysis.internalLinksAnalysis?.brokenLinksCount === 0) {
      strengths.push("Good internal linking with no broken links");
    }
    
    // Image strengths
    if (analysis.imageAnalysis?.overallScore.score >= 80) {
      strengths.push("Well-optimized images with proper alt text");
    } else if (analysis.imageAnalysis?.altPercentage >= 80) {
      strengths.push("Good image alt text coverage");
    }
    
    // Schema markup strengths
    if (analysis.schemaMarkupAnalysis?.hasSchemaMarkup) {
      strengths.push("Structured data implemented with schema markup");
    }
    
    // Mobile strengths
    if (analysis.mobileAnalysis?.overallScore.score >= 80) {
      strengths.push("Excellent mobile optimization");
    } else if (analysis.mobileAnalysis?.isMobileFriendly) {
      strengths.push("Mobile-friendly design");
    }
    
    // Page speed strengths
    if (analysis.pageSpeedAnalysis?.overallScore.score >= 80) {
      strengths.push("Fast page loading speed");
    } else if (analysis.pageSpeedAnalysis?.score >= 60) {
      strengths.push("Good page performance");
    }
    
    // User engagement strengths
    if (analysis.userEngagementAnalysis?.overallScore.score >= 80) {
      strengths.push("Excellent user engagement potential");
    } else if (analysis.userEngagementAnalysis?.potentialBounceRate <= 40) {
      strengths.push("Low potential bounce rate");
    }
    
    // E-E-A-T strengths
    if (analysis.eatAnalysis?.overallScore.score >= 80) {
      strengths.push("Strong expertise, authoritativeness, and trustworthiness signals");
    } else if (analysis.eatAnalysis?.hasAuthorInfo && analysis.eatAnalysis?.hasExpertise) {
      strengths.push("Good author information with expertise signals");
    }
    
    // Enhanced content analysis strengths
    if (analysis.enhancedContentAnalysis?.score >= 80) {
      strengths.push("Excellent content optimization");
    } else if (analysis.enhancedContentAnalysis?.score >= 60) {
      if (analysis.enhancedContentAnalysis?.headingStructure?.hasProperHierarchy) {
        strengths.push("Well-structured headings with proper hierarchy");
      }
      if (analysis.enhancedContentAnalysis?.keywordUsage?.inTitle && analysis.enhancedContentAnalysis?.keywordUsage?.inHeadings) {
        strengths.push("Good keyword placement in title and headings");
      }
    }
    
    // Technical SEO strengths
    if (analysis.technicalAnalysis?.score >= 80) {
      strengths.push("Excellent technical SEO implementation");
    } else if (analysis.technicalAnalysis?.score >= 60) {
      if (analysis.technicalAnalysis?.securityIssues?.hasHttps) {
        strengths.push("Secure HTTPS implementation");
      }
      if (analysis.technicalAnalysis?.mobileFriendliness?.isMobileFriendly) {
        strengths.push("Good mobile optimization");
      }
    }
    
    return strengths.slice(0, 5); // Limit to top 5 strengths
  }

  /**
   * Identify weaknesses based on analysis results
   */
  private identifyWeaknesses(analysis: any): string[] {
    const weaknesses = [];
    
    // Keyword weaknesses
    if (analysis.keywordAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor keyword optimization");
    } else if (analysis.keywordAnalysis?.overallScore.score < 60) {
      weaknesses.push("Insufficient keyword usage throughout the page");
    }
    
    // Meta tags weaknesses
    if (analysis.metaTagsAnalysis?.overallScore.score < 40) {
      weaknesses.push("Missing or poorly optimized meta tags");
    } else if (!analysis.metaTagsAnalysis?.hasOpenGraph || !analysis.metaTagsAnalysis?.hasTwitterCards) {
      weaknesses.push("Incomplete social media metadata");
    }
    
    // Content weaknesses
    if (analysis.contentAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor content quality or insufficient length");
    } else if (analysis.contentAnalysis?.wordCount < 500) {
      weaknesses.push("Thin content with only " + analysis.contentAnalysis.wordCount + " words");
    }
    
    if (analysis.contentAnalysis?.readabilityScore < 40) {
      weaknesses.push("Poor content readability, may be difficult for users to understand");
    }
    
    // Internal links weaknesses
    if (analysis.internalLinksAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor internal linking structure");
    } else if (analysis.internalLinksAnalysis?.brokenLinksCount > 0) {
      weaknesses.push("Contains " + analysis.internalLinksAnalysis.brokenLinksCount + " broken internal links");
    }
    
    // Image weaknesses
    if (analysis.imageAnalysis?.overallScore.score < 40) {
      weaknesses.push("Images missing alt text or poorly optimized");
    } else if (analysis.imageAnalysis?.altPercentage < 50) {
      weaknesses.push("Less than 50% of images have alt text");
    }
    
    // Schema markup weaknesses
    if (!analysis.schemaMarkupAnalysis?.hasSchemaMarkup) {
      weaknesses.push("No structured data/schema markup implemented");
    }
    
    // Mobile weaknesses
    if (analysis.mobileAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor mobile optimization");
    } else if (!analysis.mobileAnalysis?.isMobileFriendly) {
      weaknesses.push("Not mobile-friendly");
    }
    
    // Page speed weaknesses
    if (analysis.pageSpeedAnalysis?.overallScore.score < 40) {
      weaknesses.push("Very slow page loading speed");
    } else if (analysis.pageSpeedAnalysis?.score < 60) {
      weaknesses.push("Suboptimal page performance");
    }
    
    // User engagement weaknesses
    if (analysis.userEngagementAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor user engagement potential");
    } else if (analysis.userEngagementAnalysis?.potentialBounceRate >= 60) {
      weaknesses.push("High potential bounce rate");
    }
    
    // E-E-A-T weaknesses
    if (analysis.eatAnalysis?.overallScore.score < 40) {
      weaknesses.push("Weak expertise, authoritativeness, and trustworthiness signals");
    } else if (!analysis.eatAnalysis?.hasAuthorInfo) {
      weaknesses.push("Missing author information");
    }
    
    // Enhanced content analysis weaknesses
    if (analysis.enhancedContentAnalysis?.score < 40) {
      weaknesses.push("Poorly optimized content");
    } else if (analysis.enhancedContentAnalysis?.score < 60) {
      if (analysis.enhancedContentAnalysis?.issues?.length > 0) {
        weaknesses.push(analysis.enhancedContentAnalysis.issues[0]);
      }
    }
    
    // Technical SEO weaknesses
    if (analysis.technicalAnalysis?.score < 40) {
      weaknesses.push("Poor technical SEO implementation");
    } else if (analysis.technicalAnalysis?.score < 60) {
      if (analysis.technicalAnalysis?.issues?.length > 0) {
        weaknesses.push(analysis.technicalAnalysis.issues[0]);
      }
    }
    
    return weaknesses.slice(0, 5); // Limit to top 5 weaknesses
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations = [];
    
    // Keyword recommendations
    if (analysis.keywordAnalysis?.overallScore.score < 60) {
      if (!analysis.keywordAnalysis?.titlePresent) {
        recommendations.push("Include the primary keyword in the page title");
      }
      if (!analysis.keywordAnalysis?.descriptionPresent) {
        recommendations.push("Add the primary keyword to the meta description");
      }
      if (!analysis.keywordAnalysis?.h1Present) {
        recommendations.push("Include the primary keyword in the H1 heading");
      }
    }
    
    // Meta tags recommendations
    if (analysis.metaTagsAnalysis?.overallScore.score < 60) {
      if (!analysis.metaTagsAnalysis?.title) {
        recommendations.push("Add a descriptive title tag with the primary keyword");
      } else if (analysis.metaTagsAnalysis?.titleLength < 30 || analysis.metaTagsAnalysis?.titleLength > 60) {
        recommendations.push("Optimize title tag length to be between 30-60 characters");
      }
      
      if (!analysis.metaTagsAnalysis?.description) {
        recommendations.push("Add a compelling meta description with the primary keyword");
      } else if (analysis.metaTagsAnalysis?.descriptionLength < 80 || analysis.metaTagsAnalysis?.descriptionLength > 160) {
        recommendations.push("Optimize meta description length to be between 80-160 characters");
      }
      
      if (!analysis.metaTagsAnalysis?.hasOpenGraph) {
        recommendations.push("Implement Open Graph tags for better social media sharing");
      }
      
      if (!analysis.metaTagsAnalysis?.hasTwitterCards) {
        recommendations.push("Add Twitter Card markup for better Twitter sharing");
      }
    }
    
    // Content recommendations
    if (analysis.contentAnalysis?.overallScore.score < 60) {
      if (analysis.contentAnalysis?.wordCount < 500) {
        recommendations.push("Expand content to at least 500 words for better topic coverage");
      } else if (analysis.contentAnalysis?.wordCount < 1000) {
        recommendations.push("Consider adding more comprehensive content with at least 1000 words");
      }
      
      if (analysis.contentAnalysis?.h1Count === 0) {
        recommendations.push("Add an H1 heading with the primary keyword");
      } else if (analysis.contentAnalysis?.h1Count > 1) {
        recommendations.push("Use only one H1 heading per page for proper hierarchy");
      }
      
      if (analysis.contentAnalysis?.h2Count < 2) {
        recommendations.push("Structure content with more H2 headings to improve organization");
      }
      
      if (analysis.contentAnalysis?.readabilityScore < 60) {
        recommendations.push("Improve readability with shorter sentences and paragraphs");
      }
    }
    
    // Internal links recommendations
    if (analysis.internalLinksAnalysis?.overallScore.score < 60) {
      if (analysis.internalLinksAnalysis?.count < 3) {
        recommendations.push("Add more internal links to improve site structure and user navigation");
      }
      
      if (analysis.internalLinksAnalysis?.brokenLinksCount > 0) {
        recommendations.push("Fix broken internal links");
      }
      
      if (!analysis.internalLinksAnalysis?.hasProperAnchors) {
        recommendations.push("Use descriptive anchor text instead of generic phrases like 'click here'");
      }
    }
    
    // Image recommendations
    if (analysis.imageAnalysis?.overallScore.score < 60) {
      if (analysis.imageAnalysis?.altPercentage < 80) {
        recommendations.push("Add alt text to all images for better accessibility and SEO");
      }
      
      if (!analysis.imageAnalysis?.sizeOptimized) {
        recommendations.push("Optimize image sizes to improve page load speed");
      }
    }
    
    // Schema markup recommendations
    if (!analysis.schemaMarkupAnalysis?.hasSchemaMarkup) {
      recommendations.push("Implement schema markup to enhance search engine understanding of your content");
    }
    
    // Mobile recommendations
    if (analysis.mobileAnalysis?.overallScore.score < 60) {
      if (!analysis.mobileAnalysis?.isMobileFriendly) {
        recommendations.push("Make the page mobile-friendly");
      }
      
      if (!analysis.mobileAnalysis?.hasViewport) {
        recommendations.push("Add a viewport meta tag for proper mobile rendering");
      }
      
      if (!analysis.mobileAnalysis?.hasResponsiveDesign) {
        recommendations.push("Implement responsive design for better mobile experience");
      }
    }
    
    // Page speed recommendations
    if (analysis.pageSpeedAnalysis?.overallScore.score < 60) {
      recommendations.push("Improve page loading speed");
      
      if (analysis.pageSpeedAnalysis?.lcp > 2500) {
        recommendations.push("Optimize Largest Contentful Paint (LCP) to be under 2.5 seconds");
      }
      
      if (analysis.pageSpeedAnalysis?.fid > 100) {
        recommendations.push("Improve First Input Delay (FID) to be under 100ms");
      }
    }
    
    // User engagement recommendations
    if (analysis.userEngagementAnalysis?.overallScore.score < 60) {
      recommendations.push("Enhance content quality and engagement to reduce bounce rate");
    }
    
    // E-E-A-T recommendations
    if (analysis.eatAnalysis?.overallScore.score < 60) {
      if (!analysis.eatAnalysis?.hasAuthorInfo) {
        recommendations.push("Add author information to improve credibility");
      }
      
      if (!analysis.eatAnalysis?.hasExpertise) {
        recommendations.push("Include expertise signals such as credentials, experience, or qualifications");
      }
      
      if (!analysis.eatAnalysis?.hasAuthority) {
        recommendations.push("Add authority signals like citations, research, or references");
      }
      
      if (!analysis.eatAnalysis?.hasTrustworthiness) {
        recommendations.push("Enhance trustworthiness with privacy policy, contact information, and testimonials");
      }
    }
    
    // Enhanced content analysis recommendations
    if (analysis.enhancedContentAnalysis?.recommendations?.length > 0) {
      recommendations.push(...analysis.enhancedContentAnalysis.recommendations.slice(0, 3));
    }
    
    // Technical SEO recommendations
    if (analysis.technicalAnalysis?.recommendations?.length > 0) {
      recommendations.push(...analysis.technicalAnalysis.recommendations.slice(0, 3));
    }
    
    return recommendations.slice(0, 15);
  }
}

export const analyzer = new Analyzer();