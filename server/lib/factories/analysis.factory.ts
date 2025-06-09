/**
 * Centralized factory for creating default analysis objects
 * Consolidates all createDefault* methods from various analyzers
 */

import { ScoreUtils } from '../utils/score.utils';

// Type definitions for analysis results
export interface KeywordAnalysis {
  primaryKeyword: string;
  density: number;
  relatedKeywords: string[];
  keywordPlacement: {
    title: boolean;
    h1: boolean;
    h2: boolean;
    metaDescription: boolean;
    firstParagraph: boolean;
    lastParagraph: boolean;
    altText: boolean;
    url: boolean;
  };
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface MetaTagsAnalysis {
  title: {
    content: string;
    length: number;
    hasKeyword: boolean;
    isOptimized: boolean;
  };
  description: {
    content: string;
    length: number;
    hasKeyword: boolean;
    isOptimized: boolean;
  };
  keywords: string[];
  openGraph: {
    hasOgTitle: boolean;
    hasOgDescription: boolean;
    hasOgImage: boolean;
    hasOgUrl: boolean;
  };
  twitterCard: {
    hasTwitterCard: boolean;
    hasTwitterTitle: boolean;
    hasTwitterDescription: boolean;
    hasTwitterImage: boolean;
  };
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface ContentAnalysis {
  wordCount: number;
  uniqueContentPercentage: number;
  readabilityScore: number;
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasProperHierarchy: boolean;
  };
  textToHtmlRatio: number;
  contentDepth: 'shallow' | 'moderate' | 'comprehensive';
  topicCoverage: string[];
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface InternalLinksAnalysis {
  totalInternalLinks: number;
  internalLinksWithAnchor: number;
  hasProperAnchors: boolean;
  internalLinksDiversity: number;
  followVsNofollowRatio: number;
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface ImageAnalysis {
  totalImages: number;
  imagesWithAlt: number;
  imagesOptimized: number;
  sizeOptimized: boolean;
  formatOptimized: boolean;
  hasWebP: boolean;
  averageFileSize: number;
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface SchemaMarkupAnalysis {
  hasSchemaMarkup: boolean;
  schemaTypes: string[];
  structuredDataScore: number;
  errors: string[];
  warnings: string[];
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface MobileAnalysis {
  isMobileFriendly: boolean;
  hasViewportMeta: boolean;
  textSizeOptimal: boolean;
  tapTargetsOptimal: boolean;
  hasFlashContent: boolean;
  mobileUsabilityScore: number;
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface PageSpeedAnalysis {
  score: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  speedIndex?: number;
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface UserEngagementAnalysis {
  estimatedReadTime: number;
  potentialBounceRate: number;
  contentEngagementScore: number;
  socialSignals: {
    hasShareButtons: boolean;
    hasSocialMeta: boolean;
  };
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface EATAnalysis {
  expertise: {
    hasAuthorInfo: boolean;
    hasCredentials: boolean;
    topicalAuthority: number;
  };
  authoritativeness: {
    hasAboutPage: boolean;
    hasContactInfo: boolean;
    hasExternalLinks: boolean;
    domainAuthority: number;
  };
  trustworthiness: {
    hasSSL: boolean;
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    hasReviews: boolean;
  };
  overallScore: {
    score: number;
    category: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

export interface CompetitorAnalysisResult {
  competitors: Array<{
    url: string;
    title: string;
    metaDescription: string;
    position: number;
    score: number;
  }>;
  comparisonMetrics: {
    titleLength: number;
    descriptionLength: number;
    wordCount: number;
    internalLinks: number;
    externalLinks: number;
  };
  allCompetitorUrls: string[];
  meta: {
    keyword: string;
    location: string;
    totalResults: number;
    analyzedResults: number;
    timestamp: string;
  };
}

/**
 * Centralized Analysis Factory
 * Provides consistent default values for all analysis types
 */
export class AnalysisFactory {
  /**
   * Create default keyword analysis
   */
  static createDefaultKeywordAnalysis(primaryKeyword: string = ''): KeywordAnalysis {
    const score = primaryKeyword ? 50 : 40; // Slightly lower if no keyword detected
    
    return {
      primaryKeyword: primaryKeyword || 'no keyword detected',
      density: 0,
      relatedKeywords: [],
      keywordPlacement: {
        title: false,
        h1: false,
        h2: false,
        metaDescription: false,
        firstParagraph: false,
        lastParagraph: false,
        altText: false,
        url: false
      },
      overallScore: ScoreUtils.getScoreResult(score)
    };
  }

  /**
   * Create default meta tags analysis
   */
  static createDefaultMetaTagsAnalysis(): MetaTagsAnalysis {
    return {
      title: {
        content: '',
        length: 0,
        hasKeyword: false,
        isOptimized: false
      },
      description: {
        content: '',
        length: 0,
        hasKeyword: false,
        isOptimized: false
      },
      keywords: [],
      openGraph: {
        hasOgTitle: false,
        hasOgDescription: false,
        hasOgImage: false,
        hasOgUrl: false
      },
      twitterCard: {
        hasTwitterCard: false,
        hasTwitterTitle: false,
        hasTwitterDescription: false,
        hasTwitterImage: false
      },
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default content analysis
   */
  static createDefaultContentAnalysis(): ContentAnalysis {
    return {
      wordCount: 0,
      uniqueContentPercentage: 0,
      readabilityScore: 50,
      headingStructure: {
        h1Count: 0,
        h2Count: 0,
        h3Count: 0,
        hasProperHierarchy: false
      },
      textToHtmlRatio: 0,
      contentDepth: 'shallow',
      topicCoverage: [],
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default internal links analysis
   */
  static createDefaultInternalLinksAnalysis(): InternalLinksAnalysis {
    return {
      totalInternalLinks: 0,
      internalLinksWithAnchor: 0,
      hasProperAnchors: false,
      internalLinksDiversity: 0,
      followVsNofollowRatio: 1.0,
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default image analysis
   */
  static createDefaultImageAnalysis(): ImageAnalysis {
    return {
      totalImages: 0,
      imagesWithAlt: 0,
      imagesOptimized: 0,
      sizeOptimized: false,
      formatOptimized: false,
      hasWebP: false,
      averageFileSize: 0,
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default schema markup analysis
   */
  static createDefaultSchemaMarkupAnalysis(): SchemaMarkupAnalysis {
    return {
      hasSchemaMarkup: false,
      schemaTypes: [],
      structuredDataScore: 0,
      errors: [],
      warnings: [],
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default mobile analysis
   */
  static createDefaultMobileAnalysis(): MobileAnalysis {
    return {
      isMobileFriendly: false,
      hasViewportMeta: false,
      textSizeOptimal: false,
      tapTargetsOptimal: false,
      hasFlashContent: false,
      mobileUsabilityScore: 50,
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default page speed analysis
   */
  static createDefaultPageSpeedAnalysis(): PageSpeedAnalysis {
    return {
      score: 50,
      lcp: 4000, // 4 seconds - needs work
      fid: 200,  // 200ms - needs work
      cls: 0.25, // 0.25 - needs work
      ttfb: 800, // 800ms - needs work
      speedIndex: 5000,
      overallScore: ScoreUtils.getPerformanceScoreResult(50)
    };
  }

  /**
   * Create default user engagement analysis
   */
  static createDefaultUserEngagementAnalysis(): UserEngagementAnalysis {
    return {
      estimatedReadTime: 5,
      potentialBounceRate: 50,
      contentEngagementScore: 50,
      socialSignals: {
        hasShareButtons: false,
        hasSocialMeta: false
      },
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default E-E-A-T analysis
   */
  static createDefaultEATAnalysis(): EATAnalysis {
    return {
      expertise: {
        hasAuthorInfo: false,
        hasCredentials: false,
        topicalAuthority: 50
      },
      authoritativeness: {
        hasAboutPage: false,
        hasContactInfo: false,
        hasExternalLinks: false,
        domainAuthority: 50
      },
      trustworthiness: {
        hasSSL: false,
        hasPrivacyPolicy: false,
        hasTermsOfService: false,
        hasReviews: false
      },
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }

  /**
   * Create default competitor analysis result
   */
  static createDefaultCompetitorAnalysis(
    keyword: string = '',
    location: string = 'United States'
  ): CompetitorAnalysisResult {
    return {
      competitors: [],
      comparisonMetrics: {
        titleLength: 0,
        descriptionLength: 0,
        wordCount: 0,
        internalLinks: 0,
        externalLinks: 0
      },
      allCompetitorUrls: [],
      meta: {
        keyword,
        location,
        totalResults: 0,
        analyzedResults: 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create complete error analysis result
   */
  static createErrorAnalysisResult(url: string, errorMessage: string): any {
    const defaultScore = ScoreUtils.getScoreResult(25); // Lower score for errors
    
    return {
      url,
      timestamp: new Date().toISOString(),
      overallScore: defaultScore,
      
      // All analysis sections with default values
      keywords: this.createDefaultKeywordAnalysis(),
      metaTags: this.createDefaultMetaTagsAnalysis(),
      content: this.createDefaultContentAnalysis(),
      internalLinks: this.createDefaultInternalLinksAnalysis(),
      images: this.createDefaultImageAnalysis(),
      schemaMarkup: this.createDefaultSchemaMarkupAnalysis(),
      mobile: this.createDefaultMobileAnalysis(),
      pageSpeed: this.createDefaultPageSpeedAnalysis(),
      userEngagement: this.createDefaultUserEngagementAnalysis(),
      eat: this.createDefaultEATAnalysis(),
      
      // Error information
      strengths: [],
      weaknesses: [
        'Page analysis failed',
        `Error: ${errorMessage}`,
        'Unable to crawl page content',
        'Check URL accessibility and try again'
      ],
      recommendations: [
        'Verify the URL is correct and accessible',
        'Check if the website is online and responsive',
        'Ensure the page allows crawler access (no robots.txt blocking)',
        'Try analyzing again after fixing accessibility issues'
      ],
      
      error: {
        hasError: true,
        message: errorMessage,
        code: 'ANALYSIS_FAILED'
      }
    };
  }

  /**
   * Create fallback page speed metrics for unified service
   */
  static createFallbackPageSpeedMetrics(): any {
    return {
      score: 50,
      lcp: 4000,
      fid: 200,
      cls: 0.25,
      ttfb: 800,
      speedIndex: 5000,
      source: 'simulation' as const,
      timestamp: new Date().toISOString(),
      overallScore: ScoreUtils.getPerformanceScoreResult(50)
    };
  }

  /**
   * Create default technical SEO analysis
   */
  static createDefaultTechnicalAnalysis(): any {
    return {
      score: 50,
      assessment: ScoreUtils.getAssessment(50),
      issues: [],
      recommendations: [
        'Add proper meta tags',
        'Optimize page loading speed',
        'Implement structured data',
        'Ensure mobile responsiveness'
      ],
      technicalHealth: {
        ssl: false,
        canonical: false,
        robots: false,
        sitemap: false,
        redirects: false
      }
    };
  }

  /**
   * Create default content optimization analysis
   */
  static createDefaultContentOptimization(): any {
    return {
      score: 50,
      assessment: ScoreUtils.getAssessment(50),
      issues: [],
      recommendations: [
        'Increase content length for better coverage',
        'Improve keyword optimization',
        'Add more relevant headings',
        'Enhance content readability'
      ],
      contentQuality: {
        length: 'short',
        depth: 'shallow',
        readability: 'moderate',
        uniqueness: 'unknown'
      }
    };
  }

  /**
   * Get all default analysis components for a complete SEO analysis
   */
  static createCompleteDefaultAnalysis(url: string, primaryKeyword?: string): any {
    return {
      url,
      timestamp: new Date().toISOString(),
      overallScore: ScoreUtils.getScoreResult(50),
      
      keywords: this.createDefaultKeywordAnalysis(primaryKeyword),
      metaTags: this.createDefaultMetaTagsAnalysis(),
      content: this.createDefaultContentAnalysis(),
      internalLinks: this.createDefaultInternalLinksAnalysis(),
      images: this.createDefaultImageAnalysis(),
      schemaMarkup: this.createDefaultSchemaMarkupAnalysis(),
      mobile: this.createDefaultMobileAnalysis(),
      pageSpeed: this.createDefaultPageSpeedAnalysis(),
      userEngagement: this.createDefaultUserEngagementAnalysis(),
      eat: this.createDefaultEATAnalysis(),
      
      strengths: [
        'Basic website structure detected',
        'Page is accessible for analysis'
      ],
      weaknesses: [
        'Limited optimization detected',
        'Multiple areas need improvement',
        'SEO potential not fully realized'
      ],
      recommendations: [
        'Optimize meta tags for target keywords',
        'Improve page loading speed',
        'Enhance content quality and length',
        'Add structured data markup',
        'Implement proper internal linking strategy'
      ]
    };
  }
}

// Export utility functions for backward compatibility
export const createDefaultKeywordAnalysis = AnalysisFactory.createDefaultKeywordAnalysis;
export const createDefaultMetaTagsAnalysis = AnalysisFactory.createDefaultMetaTagsAnalysis;
export const createDefaultContentAnalysis = AnalysisFactory.createDefaultContentAnalysis;
export const createDefaultPageSpeedAnalysis = AnalysisFactory.createDefaultPageSpeedAnalysis;
export const createErrorAnalysisResult = AnalysisFactory.createErrorAnalysisResult;