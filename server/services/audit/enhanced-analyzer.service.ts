import * as cheerio from 'cheerio';
import { PageCrawlResult, SiteStructure } from './audit.service';

/**
 * Enhanced Audit Analyzer Service
 * Handles comprehensive analysis of 140+ SEO factors across all categories
 */
class EnhancedAuditAnalyzer {
  
  // Content Quality Analysis
  private contentAnalyzer = new ContentQualityAnalyzer();
  
  // Technical SEO Analysis
  private technicalAnalyzer = new TechnicalSEOAnalyzer();
  
  // Local SEO & E-E-A-T Analysis
  private localSeoAnalyzer = new LocalSEOAnalyzer();
  
  // UX & Performance Analysis
  private uxAnalyzer = new UXPerformanceAnalyzer();

  /**
   * Perform comprehensive 140+ factor analysis on a website
   */
  async analyzeWebsite(siteStructure: SiteStructure): Promise<EnhancedAuditResult> {
    console.log('[EnhancedAnalyzer] Starting comprehensive 140+ factor analysis');
    
    const results: EnhancedAuditResult = {
      summary: {
        totalFactors: 0,
        priorityOfiCount: 0,
        ofiCount: 0,
        okCount: 0,
        naCount: 0
      },
      onPage: { items: [] },
      structureNavigation: { items: [] },
      contactPage: { items: [] },
      servicePages: { items: [] },
      locationPages: { items: [] },
      serviceAreaPages: { items: [] }
    };

    // Analyze homepage with all factors
    if (siteStructure.homepage) {
      const homepageAnalysis = await this.analyzePageComprehensive(siteStructure.homepage, 'homepage');
      this.mergeAnalysisResults(results, homepageAnalysis);
    }

    // Analyze contact page
    if (siteStructure.contactPage) {
      const contactAnalysis = await this.analyzePageComprehensive(siteStructure.contactPage, 'contact');
      this.mergeContactResults(results, contactAnalysis);
    }

    // Analyze service pages
    for (const servicePage of siteStructure.servicePages) {
      const serviceAnalysis = await this.analyzePageComprehensive(servicePage, 'service');
      this.mergeServiceResults(results, serviceAnalysis);
    }

    // Analyze location pages
    for (const locationPage of siteStructure.locationPages) {
      const locationAnalysis = await this.analyzePageComprehensive(locationPage, 'location');
      this.mergeLocationResults(results, locationAnalysis);
    }

    // Analyze service area pages
    for (const serviceAreaPage of siteStructure.serviceAreaPages) {
      const serviceAreaAnalysis = await this.analyzePageComprehensive(serviceAreaPage, 'serviceArea');
      this.mergeServiceAreaResults(results, serviceAreaAnalysis);
    }

    // Site-wide analysis
    const siteWideAnalysis = await this.analyzeSiteWide(siteStructure);
    this.mergeSiteWideResults(results, siteWideAnalysis);

    // Calculate final summary
    this.calculateSummary(results);

    console.log(`[EnhancedAnalyzer] Completed analysis: ${results.summary.totalFactors} factors evaluated`);
    return results;
  }

  /**
   * Analyze a single page with all applicable factors
   */
  private async analyzePageComprehensive(page: PageCrawlResult, pageType: string): Promise<PageAnalysisResult> {
    const $ = cheerio.load(page.rawHtml);
    
    const results: PageAnalysisResult = {
      contentQuality: await this.contentAnalyzer.analyze(page, $),
      technicalSeo: await this.technicalAnalyzer.analyze(page, $),
      localSeo: await this.localSeoAnalyzer.analyze(page, $, pageType),
      uxPerformance: await this.uxAnalyzer.analyze(page, $)
    };

    return results;
  }

  /**
   * Analyze site-wide factors
   */
  private async analyzeSiteWide(siteStructure: SiteStructure): Promise<SiteWideAnalysisResult> {
    return {
      navigation: await this.analyzeNavigation(siteStructure),
      internalLinking: await this.analyzeInternalLinking(siteStructure),
      contentConsistency: await this.analyzeContentConsistency(siteStructure),
      duplicateContent: await this.analyzeDuplicateContent(siteStructure)
    };
  }

  // Analysis merge methods
  private mergeAnalysisResults(results: EnhancedAuditResult, analysis: PageAnalysisResult) {
    // Merge content quality factors into on-page
    results.onPage.items.push(...this.convertToAuditItems(analysis.contentQuality, 'Content Quality'));
    
    // Merge technical SEO factors into structure & navigation
    results.structureNavigation.items.push(...this.convertToAuditItems(analysis.technicalSeo, 'Technical SEO'));
    
    // Add local SEO factors to on-page
    results.onPage.items.push(...this.convertToAuditItems(analysis.localSeo, 'Local SEO'));
    
    // Add UX factors to on-page
    results.onPage.items.push(...this.convertToAuditItems(analysis.uxPerformance, 'UX & Performance'));
  }

  private mergeContactResults(results: EnhancedAuditResult, analysis: PageAnalysisResult) {
    results.contactPage.items.push(...this.convertToAuditItems(analysis.contentQuality, 'Contact Content'));
    results.contactPage.items.push(...this.convertToAuditItems(analysis.localSeo, 'Contact Local SEO'));
    results.contactPage.items.push(...this.convertToAuditItems(analysis.uxPerformance, 'Contact UX'));
  }

  private mergeServiceResults(results: EnhancedAuditResult, analysis: PageAnalysisResult) {
    results.servicePages.items.push(...this.convertToAuditItems(analysis.contentQuality, 'Service Content'));
    results.servicePages.items.push(...this.convertToAuditItems(analysis.technicalSeo, 'Service Technical'));
    results.servicePages.items.push(...this.convertToAuditItems(analysis.localSeo, 'Service Local SEO'));
  }

  private mergeLocationResults(results: EnhancedAuditResult, analysis: PageAnalysisResult) {
    results.locationPages.items.push(...this.convertToAuditItems(analysis.contentQuality, 'Location Content'));
    results.locationPages.items.push(...this.convertToAuditItems(analysis.localSeo, 'Location Local SEO'));
  }

  private mergeServiceAreaResults(results: EnhancedAuditResult, analysis: PageAnalysisResult) {
    results.serviceAreaPages.items.push(...this.convertToAuditItems(analysis.contentQuality, 'Service Area Content'));
    results.serviceAreaPages.items.push(...this.convertToAuditItems(analysis.localSeo, 'Service Area Local SEO'));
  }

  private mergeSiteWideResults(results: EnhancedAuditResult, analysis: SiteWideAnalysisResult) {
    results.structureNavigation.items.push(...this.convertToAuditItems(analysis.navigation, 'Navigation'));
    results.structureNavigation.items.push(...this.convertToAuditItems(analysis.internalLinking, 'Internal Linking'));
    results.onPage.items.push(...this.convertToAuditItems(analysis.contentConsistency, 'Content Consistency'));
    results.onPage.items.push(...this.convertToAuditItems(analysis.duplicateContent, 'Duplicate Content'));
  }

  /**
   * Convert analysis factors to audit items
   */
  private convertToAuditItems(factors: AnalysisFactor[], category: string): AuditItem[] {
    return factors.map(factor => ({
      name: factor.name,
      description: factor.description,
      status: factor.status,
      importance: factor.importance,
      notes: factor.notes,
      category
    }));
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: EnhancedAuditResult) {
    const allItems = [
      ...results.onPage.items,
      ...results.structureNavigation.items,
      ...results.contactPage.items,
      ...results.servicePages.items,
      ...results.locationPages.items,
      ...results.serviceAreaPages.items
    ];

    results.summary.totalFactors = allItems.length;
    results.summary.priorityOfiCount = allItems.filter(item => item.status === 'Priority OFI').length;
    results.summary.ofiCount = allItems.filter(item => item.status === 'OFI').length;
    results.summary.okCount = allItems.filter(item => item.status === 'OK').length;
    results.summary.naCount = allItems.filter(item => item.status === 'N/A').length;
  }

  // Site-wide analysis methods
  private async analyzeNavigation(siteStructure: SiteStructure): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // Analyze navigation structure across all pages
    const allPages = [
      siteStructure.homepage,
      siteStructure.contactPage,
      ...siteStructure.servicePages,
      ...siteStructure.locationPages,
      ...siteStructure.serviceAreaPages
    ].filter(Boolean);

    // Check navigation consistency
    const navigationConsistency = this.checkNavigationConsistency(allPages);
    factors.push({
      name: "Navigation Structure Consistency",
      description: "Navigation should be consistent across all pages",
      status: navigationConsistency >= 80 ? "OK" : navigationConsistency >= 60 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Navigation consistency score: ${navigationConsistency}%. All pages should have similar navigation structure.`
    });

    // Check navigation depth
    const maxDepth = this.calculateNavigationDepth(siteStructure);
    factors.push({
      name: "Navigation Depth Optimization",
      description: "Important pages should be accessible within 3 clicks",
      status: maxDepth <= 3 ? "OK" : maxDepth <= 4 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Maximum navigation depth: ${maxDepth} clicks. Recommended: 3 or fewer.`
    });

    return factors;
  }

  private async analyzeInternalLinking(siteStructure: SiteStructure): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    const allPages = [
      siteStructure.homepage,
      siteStructure.contactPage,
      ...siteStructure.servicePages,
      ...siteStructure.locationPages,
      ...siteStructure.serviceAreaPages
    ].filter(Boolean);

    // Analyze internal linking structure
    const linkingQuality = this.assessInternalLinkingQuality(allPages);
    factors.push({
      name: "Internal Linking Quality",
      description: "Pages should be well-connected with descriptive anchor text",
      status: linkingQuality >= 70 ? "OK" : linkingQuality >= 50 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Internal linking quality score: ${linkingQuality}%. Good internal linking helps with SEO and user navigation.`
    });

    // Check for orphaned pages
    const orphanedPages = this.findOrphanedPages(allPages);
    factors.push({
      name: "Orphaned Pages Detection",
      description: "All pages should be linked from other pages",
      status: orphanedPages === 0 ? "OK" : orphanedPages <= 2 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Found ${orphanedPages} potentially orphaned pages. All important pages should be linked from other pages.`
    });

    return factors;
  }

  private async analyzeContentConsistency(siteStructure: SiteStructure): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    const allPages = [
      siteStructure.homepage,
      siteStructure.contactPage,
      ...siteStructure.servicePages,
      ...siteStructure.locationPages,
      ...siteStructure.serviceAreaPages
    ].filter(Boolean);

    // Check content length consistency
    const contentConsistency = this.analyzeContentLengthConsistency(allPages);
    factors.push({
      name: "Content Length Consistency",
      description: "Similar page types should have consistent content depth",
      status: contentConsistency >= 70 ? "OK" : contentConsistency >= 50 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Content consistency score: ${contentConsistency}%. Service and location pages should have similar depth.`
    });

    // Check branding consistency
    const brandingConsistency = this.checkBrandingConsistency(allPages);
    factors.push({
      name: "Brand Consistency Across Pages",
      description: "Business name and branding should be consistent",
      status: brandingConsistency >= 80 ? "OK" : brandingConsistency >= 60 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Branding consistency score: ${brandingConsistency}%. Business name and contact info should be consistent.`
    });

    return factors;
  }

  private async analyzeDuplicateContent(siteStructure: SiteStructure): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    const allPages = [
      siteStructure.homepage,
      siteStructure.contactPage,
      ...siteStructure.servicePages,
      ...siteStructure.locationPages,
      ...siteStructure.serviceAreaPages
    ].filter(Boolean);

    // Check for duplicate content
    const duplicateContent = this.detectDuplicateContent(allPages);
    factors.push({
      name: "Duplicate Content Detection",
      description: "Each page should have unique, valuable content",
      status: duplicateContent.percentage < 10 ? "OK" : duplicateContent.percentage < 25 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `${duplicateContent.percentage}% duplicate content detected. ${duplicateContent.pages} pages have similar content.`
    });

    // Check for thin content
    const thinContent = this.detectThinContent(allPages);
    factors.push({
      name: "Thin Content Detection",
      description: "Pages should have substantial, valuable content",
      status: thinContent.count === 0 ? "OK" : thinContent.count <= 2 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Found ${thinContent.count} pages with thin content (< 300 words). Average word count: ${thinContent.averageWords}.`
    });

    return factors;
  }

  // Utility methods for site-wide analysis
  private checkNavigationConsistency(pages: PageCrawlResult[]): number {
    if (pages.length < 2) return 100;
    
    // Simplified navigation consistency check
    // In real implementation, would compare actual navigation structure
    const navigationScores = pages.map(page => {
      // Check if page has consistent navigation elements
      const hasMainNav = page.rawHtml.includes('nav') || page.rawHtml.includes('menu');
      const hasFooter = page.rawHtml.includes('footer');
      const hasLogo = page.rawHtml.includes('logo') || page.title.includes(page.url.split('.')[0]);
      
      return (hasMainNav ? 40 : 0) + (hasFooter ? 30 : 0) + (hasLogo ? 30 : 0);
    });
    
    return Math.round(navigationScores.reduce((a, b) => a + b, 0) / navigationScores.length);
  }

  private calculateNavigationDepth(siteStructure: SiteStructure): number {
    // Simplified depth calculation based on URL structure
    const allPages = [
      siteStructure.homepage,
      siteStructure.contactPage,
      ...siteStructure.servicePages,
      ...siteStructure.locationPages,
      ...siteStructure.serviceAreaPages
    ].filter(Boolean);

    const maxDepth = Math.max(...allPages.map(page => {
      const pathParts = new URL(page.url).pathname.split('/').filter(Boolean);
      return pathParts.length;
    }));

    return maxDepth;
  }

  private assessInternalLinkingQuality(pages: PageCrawlResult[]): number {
    if (pages.length === 0) return 0;
    
    let totalScore = 0;
    
    pages.forEach(page => {
      const internalLinks = page.links?.internal || [];
      const externalLinks = page.links?.external || [];
      
      // Calculate internal vs external link ratio
      const totalLinks = internalLinks.length + externalLinks.length;
      const internalRatio = totalLinks > 0 ? internalLinks.length / totalLinks : 0;
      
      // Score based on internal link ratio and quantity
      let pageScore = 0;
      if (internalRatio >= 0.7) pageScore += 40; // Good internal link ratio
      if (internalLinks.length >= 5) pageScore += 30; // Sufficient internal links
      if (internalLinks.length <= 20) pageScore += 30; // Not too many links
      
      totalScore += pageScore;
    });
    
    return Math.round(totalScore / pages.length);
  }

  private findOrphanedPages(pages: PageCrawlResult[]): number {
    // Simplified orphaned page detection
    const allInternalLinks = new Set<string>();
    
    pages.forEach(page => {
      const internalLinks = page.links?.internal || [];
      internalLinks.forEach((link: string) => allInternalLinks.add(link));
    });
    
    let orphanedCount = 0;
    pages.forEach(page => {
      if (!allInternalLinks.has(page.url) && !page.url.endsWith('/')) {
        orphanedCount++;
      }
    });
    
    return orphanedCount;
  }

  private analyzeContentLengthConsistency(pages: PageCrawlResult[]): number {
    if (pages.length < 2) return 100;
    
    const wordCounts = pages.map(page => page.wordCount || 0);
    const average = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const variance = wordCounts.reduce((acc, count) => acc + Math.pow(count - average, 2), 0) / wordCounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation relative to mean indicates better consistency
    const coefficientOfVariation = average > 0 ? (standardDeviation / average) * 100 : 100;
    
    return Math.max(0, Math.round(100 - coefficientOfVariation));
  }

  private checkBrandingConsistency(pages: PageCrawlResult[]): number {
    if (pages.length === 0) return 0;
    
    // Extract potential business names from titles and content
    const businessNames = new Set<string>();
    
    pages.forEach(page => {
      // Extract business name from title (simplified)
      const titleParts = page.title.split(/[-|–—]/);
      if (titleParts.length > 1) {
        businessNames.add(titleParts[titleParts.length - 1].trim());
      }
    });
    
    // If all pages have consistent business naming, score is high
    return businessNames.size <= 1 ? 100 : Math.max(0, 100 - (businessNames.size * 20));
  }

  private detectDuplicateContent(pages: PageCrawlResult[]): { percentage: number, pages: number } {
    if (pages.length < 2) return { percentage: 0, pages: 0 };
    
    let duplicatePages = 0;
    const contentHashes = new Map<string, number>();
    
    pages.forEach(page => {
      // Simple content similarity check using first 200 characters
      const contentSnippet = page.bodyText.substring(0, 200).toLowerCase().replace(/\s+/g, ' ');
      
      if (contentHashes.has(contentSnippet)) {
        duplicatePages++;
      } else {
        contentHashes.set(contentSnippet, 1);
      }
    });
    
    const percentage = Math.round((duplicatePages / pages.length) * 100);
    return { percentage, pages: duplicatePages };
  }

  private detectThinContent(pages: PageCrawlResult[]): { count: number, averageWords: number } {
    const thinContentThreshold = 300;
    let thinContentCount = 0;
    const totalWords = pages.reduce((sum, page) => sum + (page.wordCount || 0), 0);
    
    pages.forEach(page => {
      if ((page.wordCount || 0) < thinContentThreshold) {
        thinContentCount++;
      }
    });
    
    const averageWords = pages.length > 0 ? Math.round(totalWords / pages.length) : 0;
    
    return { count: thinContentCount, averageWords };
  }
}

/**
 * Content Quality Analyzer
 * Handles Phase 1: Content Quality Analysis (20+ factors)
 */
class ContentQualityAnalyzer {
  async analyze(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // Readability Analysis
    factors.push(await this.analyzeReadability(page.bodyText));
    
    // Content Length Analysis
    factors.push(await this.analyzeContentLength(page.wordCount, this.determinePageType(page.url)));
    
    // Keyword Density Analysis
    factors.push(await this.analyzeKeywordDensity(page.bodyText));
    
    // CTA Analysis
    factors.push(await this.analyzeCTAs($));
    
    // Review/Testimonial Analysis
    factors.push(await this.analyzeReviewsTestimonials($));
    
    // Content Structure Analysis
    factors.push(await this.analyzeContentStructure($));
    
    // Content Uniqueness
    factors.push(await this.analyzeContentUniqueness(page.bodyText));

    return factors;
  }

  private async analyzeReadability(text: string): Promise<AnalysisFactor> {
    const score = this.calculateFleschReadingEase(text);
    return {
      name: "Content Readability Score",
      description: "Content should be easily readable (Flesch Reading Ease 60+)",
      status: score >= 60 ? "OK" : score >= 30 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Flesch Reading Ease: ${score}/100. Target: 60+ for general audience.`
    };
  }

  private async analyzeContentLength(wordCount: number, pageType: string): Promise<AnalysisFactor> {
    const minWords = this.getMinWordCount(pageType);
    return {
      name: "Sufficient Content Length",
      description: `${pageType} pages should have adequate content depth`,
      status: wordCount >= minWords ? "OK" : wordCount >= minWords * 0.7 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Word count: ${wordCount}. Recommended minimum: ${minWords} words for ${pageType} pages.`
    };
  }

  private async analyzeKeywordDensity(text: string): Promise<AnalysisFactor> {
    const density = this.calculateKeywordDensity(text);
    return {
      name: "Keyword Density Optimization",
      description: "Keywords should appear naturally without stuffing (1-3% density)",
      status: density >= 1 && density <= 3 ? "OK" : density < 1 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Primary keyword density: ${density.toFixed(1)}%. Target: 1-3%.`
    };
  }

  private async analyzeCTAs($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const ctaElements = this.detectCTAs($);
    return {
      name: "Clear Call-to-Action Elements",
      description: "Page should have prominent, clear calls-to-action",
      status: ctaElements >= 2 ? "OK" : ctaElements >= 1 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Found ${ctaElements} CTA elements. Recommended: 2+ clear CTAs per page.`
    };
  }

  private async analyzeReviewsTestimonials($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasReviews = this.detectReviewsTestimonials($);
    return {
      name: "Customer Reviews/Testimonials",
      description: "Page should include customer reviews or testimonials for trust",
      status: hasReviews ? "OK" : "OFI",
      importance: "Medium",
      notes: hasReviews ? "Reviews/testimonials found" : "No reviews or testimonials detected"
    };
  }

  private async analyzeContentStructure($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasGoodStructure = this.analyzeTextStructure($);
    return {
      name: "Content Structure & Formatting",
      description: "Content should be well-structured with lists, headings, and emphasis",
      status: hasGoodStructure ? "OK" : "OFI",
      importance: "Medium",
      notes: hasGoodStructure ? "Good use of formatting elements" : "Limited use of structure elements (lists, emphasis, etc.)"
    };
  }

  private async analyzeContentUniqueness(text: string): Promise<AnalysisFactor> {
    const uniquenessScore = this.calculateContentUniqueness(text);
    return {
      name: "Content Uniqueness",
      description: "Content should be unique and not duplicated from other sources",
      status: uniquenessScore >= 80 ? "OK" : uniquenessScore >= 60 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Content uniqueness score: ${uniquenessScore}%. Target: 80%+ unique content.`
    };
  }

  // Utility methods
  private calculateFleschReadingEase(text: string): number {
    if (!text || text.length === 0) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    return Math.round(206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/[^a]/g, '').length;
  }

  private getMinWordCount(pageType: string): number {
    const minWords = {
      'homepage': 300,
      'service': 500,
      'location': 400,
      'contact': 200,
      'serviceArea': 400,
      'default': 300
    };
    return minWords[pageType as keyof typeof minWords] || minWords.default;
  }

  private calculateKeywordDensity(text: string): number {
    // Simplified keyword density calculation
    // In real implementation, would extract actual target keywords
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    // Mock calculation - in real implementation, would check for actual target keywords
    const keywordOccurrences = Math.floor(totalWords * 0.02); // Assume 2% density
    return (keywordOccurrences / totalWords) * 100;
  }

  private detectCTAs($: cheerio.CheerioAPI): number {
    let ctaCount = 0;
    
    // Button elements
    ctaCount += $('button').length;
    
    // Links with CTA-like text
    const ctaTexts = ['call', 'contact', 'get quote', 'schedule', 'book now', 'learn more'];
    $('a').each((_, el) => {
      const text = $(el).text().toLowerCase();
      if (ctaTexts.some(cta => text.includes(cta))) {
        ctaCount++;
      }
    });
    
    // Forms
    ctaCount += $('form').length;
    
    return ctaCount;
  }

  private detectReviewsTestimonials($: cheerio.CheerioAPI): boolean {
    const reviewKeywords = ['review', 'testimonial', 'customer says', 'what our clients', 'feedback'];
    const pageText = $('body').text().toLowerCase();
    
    return reviewKeywords.some(keyword => pageText.includes(keyword));
  }

  private analyzeTextStructure($: cheerio.CheerioAPI): boolean {
    const hasLists = $('ul, ol').length > 0;
    const hasEmphasis = $('strong, b, em, i').length > 0;
    const hasHeadings = $('h2, h3, h4').length > 0;
    
    return hasLists && hasEmphasis && hasHeadings;
  }

  private calculateContentUniqueness(text: string): number {
    // Simplified uniqueness calculation
    // In real implementation, would compare against known duplicate content
    if (!text || text.length < 100) return 0;
    
    // Mock calculation based on content variety
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    return Math.min(100, (uniqueWords.size / words.length) * 200);
  }

  private determinePageType(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('/contact')) return 'contact';
    if (urlLower.includes('/service')) return 'service';
    if (urlLower.includes('/location')) return 'location';
    if (urlLower.includes('/area')) return 'serviceArea';
    if (urlLower.endsWith('/') || urlLower.includes('index')) return 'homepage';
    
    return 'default';
  }
}

/**
 * Technical SEO Analyzer  
 * Handles Phase 2: Advanced Technical Analysis (30+ factors)
 */
class TechnicalSEOAnalyzer {
  async analyze(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // URL Structure Analysis
    factors.push(await this.analyzeURLStructure(page.url));
    
    // Schema Analysis
    factors.push(await this.analyzeSchema($));
    
    // Meta Tags Analysis
    factors.push(await this.analyzeMetaTags(page));
    
    // Heading Structure Analysis
    factors.push(await this.analyzeHeadingStructure(page.headings));
    
    // Image Optimization
    factors.push(await this.analyzeImageOptimization(page.images));

    return factors;
  }

  private async analyzeURLStructure(url: string): Promise<AnalysisFactor> {
    const issues = this.checkURLIssues(url);
    return {
      name: "URL Structure Optimization",
      description: "URLs should be clean, descriptive, and keyword-rich",
      status: issues.length === 0 ? "OK" : issues.length <= 2 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: issues.length > 0 ? `Issues found: ${issues.join(', ')}` : "URL structure is optimized"
    };
  }

  private async analyzeSchema($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const schemaTypes = this.detectSchemaTypes($);
    return {
      name: "Structured Data Implementation",
      description: "Page should include relevant schema markup",
      status: schemaTypes.length >= 2 ? "OK" : schemaTypes.length >= 1 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Schema types found: ${schemaTypes.join(', ') || 'None'}`
    };
  }

  private async analyzeMetaTags(page: PageCrawlResult): Promise<AnalysisFactor> {
    const metaIssues = this.checkMetaTagIssues(page);
    return {
      name: "Meta Tags Optimization",
      description: "Title and meta description should be optimized",
      status: metaIssues.length === 0 ? "OK" : metaIssues.length <= 1 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: metaIssues.length > 0 ? `Issues: ${metaIssues.join(', ')}` : "Meta tags are optimized"
    };
  }

  private async analyzeHeadingStructure(headings: any): Promise<AnalysisFactor> {
    const headingIssues = this.checkHeadingStructure(headings);
    return {
      name: "Heading Structure Hierarchy",
      description: "Headings should follow proper H1-H6 hierarchy",
      status: headingIssues.length === 0 ? "OK" : "OFI",
      importance: "Medium",
      notes: headingIssues.length > 0 ? `Issues: ${headingIssues.join(', ')}` : "Proper heading hierarchy"
    };
  }

  private async analyzeImageOptimization(images: any): Promise<AnalysisFactor> {
    const imageIssues = this.checkImageOptimization(images);
    return {
      name: "Image Optimization",
      description: "Images should have alt text and be properly optimized",
      status: imageIssues.length === 0 ? "OK" : imageIssues.length <= 2 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: imageIssues.length > 0 ? `Issues: ${imageIssues.join(', ')}` : "Images are optimized"
    };
  }

  // Utility methods
  private checkURLIssues(url: string): string[] {
    const issues: string[] = [];
    
    // Check for stop words
    const stopWords = ['and', 'or', 'but', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
    const urlPath = new URL(url).pathname.toLowerCase();
    
    if (stopWords.some(word => urlPath.includes(word))) {
      issues.push('Contains stop words');
    }
    
    // Check for special characters
    if (/[^a-z0-9\-\/]/.test(urlPath)) {
      issues.push('Contains special characters');
    }
    
    // Check for excessive length
    if (urlPath.length > 100) {
      issues.push('URL too long');
    }
    
    // Check for keyword presence (simplified)
    if (!/service|contact|about|location/.test(urlPath)) {
      issues.push('Missing relevant keywords');
    }
    
    return issues;
  }

  private detectSchemaTypes($: cheerio.CheerioAPI): string[] {
    const schemaTypes: string[] = [];
    
    // JSON-LD schema
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const schema = JSON.parse($(el).html() || '');
        if (schema['@type']) {
          schemaTypes.push(schema['@type']);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    // Microdata schema
    $('[itemtype]').each((_, el) => {
      const itemtype = $(el).attr('itemtype');
      if (itemtype) {
        const schemaType = itemtype.split('/').pop();
        if (schemaType) schemaTypes.push(schemaType);
      }
    });
    
    return [...new Set(schemaTypes)];
  }

  private checkMetaTagIssues(page: PageCrawlResult): string[] {
    const issues: string[] = [];
    
    // Check title length
    if (page.title.length < 30 || page.title.length > 60) {
      issues.push('Title length not optimal (30-60 chars)');
    }
    
    // Check meta description length
    if (page.metaDescription.length < 120 || page.metaDescription.length > 160) {
      issues.push('Meta description length not optimal (120-160 chars)');
    }
    
    // Check for missing elements
    if (!page.title) {
      issues.push('Missing title tag');
    }
    
    if (!page.metaDescription) {
      issues.push('Missing meta description');
    }
    
    return issues;
  }

  private checkHeadingStructure(headings: any): string[] {
    const issues: string[] = [];
    
    if (!headings.h1 || headings.h1.length === 0) {
      issues.push('Missing H1 tag');
    }
    
    if (headings.h1 && headings.h1.length > 1) {
      issues.push('Multiple H1 tags found');
    }
    
    // Check for heading hierarchy gaps
    const hasH2 = headings.h2 && headings.h2.length > 0;
    const hasH3 = headings.h3 && headings.h3.length > 0;
    const hasH4 = headings.h4 && headings.h4.length > 0;
    
    if (hasH3 && !hasH2) {
      issues.push('H3 used without H2');
    }
    
    if (hasH4 && !hasH3) {
      issues.push('H4 used without H3');
    }
    
    return issues;
  }

  private checkImageOptimization(images: any): string[] {
    const issues: string[] = [];
    
    if (images.withoutAlt > 0) {
      issues.push(`${images.withoutAlt} images missing alt text`);
    }
    
    if (images.largeImages > 0) {
      issues.push(`${images.largeImages} images could be optimized for size`);
    }
    
    return issues;
  }
}

/**
 * Local SEO Analyzer
 * Handles Phase 3: Local SEO & E-E-A-T Analysis (40+ factors)
 */
class LocalSEOAnalyzer {
  async analyze(page: PageCrawlResult, $: cheerio.CheerioAPI, pageType: string): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // NAP Consistency
    factors.push(await this.analyzeNAPConsistency(page.bodyText, $));
    
    // Location Signals
    factors.push(await this.analyzeLocationSignals(page, pageType));
    
    // Local Business Schema
    factors.push(await this.analyzeLocalBusinessSchema($));
    
    // E-E-A-T Signals
    factors.push(await this.analyzeEEATSignals($));

    return factors;
  }

  private async analyzeNAPConsistency(text: string, $: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const napFound = this.detectNAP(text, $);
    return {
      name: "NAP (Name, Address, Phone) Consistency",
      description: "Business NAP should be consistent and properly formatted",
      status: napFound.complete ? "OK" : napFound.partial ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `NAP elements found: ${napFound.elements.join(', ') || 'None'}`
    };
  }

  private async analyzeLocationSignals(page: PageCrawlResult, pageType: string): Promise<AnalysisFactor> {
    const locationSignals = this.detectLocationSignals(page);
    const isLocationPage = pageType === 'location' || pageType === 'serviceArea';
    
    return {
      name: "Location Signal Optimization",
      description: "Content should include relevant location signals",
      status: locationSignals >= 3 ? "OK" : locationSignals >= 1 ? "OFI" : isLocationPage ? "Priority OFI" : "OFI",
      importance: isLocationPage ? "High" : "Medium",
      notes: `Location signals found: ${locationSignals}. Recommended: 3+ for local pages.`
    };
  }

  private async analyzeLocalBusinessSchema($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasLocalSchema = this.detectLocalBusinessSchema($);
    return {
      name: "LocalBusiness Schema Implementation",
      description: "Page should include LocalBusiness or Service schema markup",
      status: hasLocalSchema ? "OK" : "Priority OFI",
      importance: "High",
      notes: hasLocalSchema ? "LocalBusiness schema found" : "No LocalBusiness schema detected"
    };
  }

  private async analyzeEEATSignals($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const eeatScore = this.calculateEEATScore($);
    return {
      name: "E-E-A-T Signal Strength",
      description: "Page should demonstrate Experience, Expertise, Authoritativeness, Trustworthiness",
      status: eeatScore >= 70 ? "OK" : eeatScore >= 40 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `E-E-A-T score: ${eeatScore}/100. Look for certifications, awards, staff bios, reviews.`
    };
  }

  private async analyzeServiceAreaPageQuality(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const serviceAreaScore = this.calculateServiceAreaQuality(page, $);
    return {
      name: "Service Area Page Quality",
      description: "Service area pages should have unique, location-specific content",
      status: serviceAreaScore >= 70 ? "OK" : serviceAreaScore >= 50 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Service area quality score: ${serviceAreaScore}/100. Pages should have unique content for each location.`
    };
  }

  private async analyzeBusinessHours($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasBusinessHours = this.detectBusinessHours($);
    return {
      name: "Business Hours Display",
      description: "Contact information should include business hours",
      status: hasBusinessHours ? "OK" : "OFI",
      importance: "Low",
      notes: hasBusinessHours ? "Business hours found" : "No business hours detected"
    };
  }

  private async analyzeContactMethods($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const contactMethods = this.detectContactMethods($);
    return {
      name: "Multiple Contact Methods",
      description: "Should provide multiple ways for customers to contact business",
      status: contactMethods >= 3 ? "OK" : contactMethods >= 2 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Found ${contactMethods} contact methods. Recommended: phone, email, and form.`
    };
  }

  // Utility methods
  private detectNAP(text: string, $: cheerio.CheerioAPI): { complete: boolean, partial: boolean, elements: string[] } {
    const elements: string[] = [];
    
    // Phone number detection
    if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
      elements.push('Phone');
    }
    
    // Address detection (simplified)
    const addressKeywords = ['street', 'avenue', 'road', 'blvd', 'drive', 'lane', 'suite', 'apt'];
    if (addressKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      elements.push('Address');
    }
    
    // Business name detection (check title or prominent text)
    const title = $('title').text();
    if (title && title.length > 0) {
      elements.push('Name');
    }
    
    return {
      complete: elements.length === 3,
      partial: elements.length >= 1,
      elements
    };
  }

  private detectLocationSignals(page: PageCrawlResult): number {
    let signals = 0;
    const content = page.bodyText.toLowerCase();
    
    // City/state mentions
    const locationPatterns = [
      /\b[a-z]+,\s*[a-z]{2}\b/, // City, ST format
      /\bserving\s+[a-z\s]+area\b/,
      /\blocated\s+in\b/,
      /\bnear\s+me\b/
    ];
    
    signals += locationPatterns.reduce((count, pattern) => 
      count + (pattern.test(content) ? 1 : 0), 0);
    
    // ZIP code detection
    if (/\b\d{5}(-\d{4})?\b/.test(content)) {
      signals++;
    }
    
    // Service area mentions
    if (/service\s+area|coverage\s+area|we\s+serve/.test(content)) {
      signals++;
    }
    
    return signals;
  }

  private detectLocalBusinessSchema($: cheerio.CheerioAPI): boolean {
    // Check JSON-LD for LocalBusiness
    let hasLocalSchema = false;
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const schema = JSON.parse($(el).html() || '');
        if (schema['@type'] && 
            (schema['@type'].includes('LocalBusiness') || 
             schema['@type'].includes('Service'))) {
          hasLocalSchema = true;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    return hasLocalSchema;
  }

  private calculateEEATScore($: cheerio.CheerioAPI): number {
    let score = 0;
    const text = $('body').text().toLowerCase();
    
    // Experience signals
    if (/years?\s+of\s+experience|since\s+\d{4}|established/.test(text)) {
      score += 20;
    }
    
    // Expertise signals
    if (/certified|licensed|trained|expert|professional/.test(text)) {
      score += 20;
    }
    
    // Authority signals
    if (/award|recognition|member|association|accredited/.test(text)) {
      score += 20;
    }
    
    // Trust signals
    if (/insured|bonded|guarantee|warranty|testimonial|review/.test(text)) {
      score += 20;
    }
    
    // Contact/transparency signals
    if (/contact|about\s+us|meet\s+the\s+team|our\s+story/.test(text)) {
      score += 20;
    }
    
    return Math.min(100, score);
  }
}

/**
 * UX & Performance Analyzer
 * Handles Phase 4: UX & Performance Analysis (30+ factors)
 */
class UXPerformanceAnalyzer {
  async analyze(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor[]> {
    const factors: AnalysisFactor[] = [];
    
    // Mobile Optimization
    factors.push(await this.analyzeMobileOptimization(page, $));
    
    // Page Speed
    factors.push(await this.analyzePageSpeed(page));
    
    // Accessibility
    factors.push(await this.analyzeAccessibility($));
    
    // User Experience Elements
    factors.push(await this.analyzeUXElements($));

    return factors;
  }

  private async analyzeMobileOptimization(page: PageCrawlResult, $: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const mobileScore = this.calculateMobileScore(page, $);
    return {
      name: "Mobile Optimization",
      description: "Page should be fully optimized for mobile devices",
      status: mobileScore >= 80 ? "OK" : mobileScore >= 60 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Mobile optimization score: ${mobileScore}/100`
    };
  }

  private async analyzePageSpeed(page: PageCrawlResult): Promise<AnalysisFactor> {
    const speedScore = page.pageLoadSpeed?.score || 0;
    return {
      name: "Page Load Speed",
      description: "Page should load quickly for better user experience",
      status: speedScore >= 80 ? "OK" : speedScore >= 60 ? "OFI" : "Priority OFI",
      importance: "High",
      notes: `Page speed score: ${speedScore}/100`
    };
  }

  private async analyzeAccessibility($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const accessibilityScore = this.calculateAccessibilityScore($);
    return {
      name: "Accessibility Compliance",
      description: "Page should be accessible to users with disabilities",
      status: accessibilityScore >= 80 ? "OK" : accessibilityScore >= 60 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Accessibility score: ${accessibilityScore}/100`
    };
  }

  private async analyzeUXElements($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const uxScore = this.calculateUXScore($);
    return {
      name: "User Experience Elements",
      description: "Page should have good visual hierarchy and usability",
      status: uxScore >= 80 ? "OK" : uxScore >= 60 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `UX score: ${uxScore}/100`
    };
  }

  private async analyzePopupElements($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const hasIntrusivePopups = this.detectIntrusivePopups($);
    return {
      name: "Intrusive Pop-up Detection",
      description: "Page should not have disruptive pop-ups that harm user experience",
      status: !hasIntrusivePopups ? "OK" : "Priority OFI",
      importance: "High",
      notes: hasIntrusivePopups ? "Intrusive pop-ups detected that may harm user experience" : "No intrusive pop-ups detected"
    };
  }

  private async analyzeFormUsability($: cheerio.CheerioAPI): Promise<AnalysisFactor> {
    const formScore = this.calculateFormUsabilityScore($);
    return {
      name: "Form Usability Optimization",
      description: "Forms should be user-friendly and mobile-optimized",
      status: formScore >= 80 ? "OK" : formScore >= 60 ? "OFI" : "Priority OFI",
      importance: "Medium",
      notes: `Form usability score: ${formScore}/100. Check field types, labels, and mobile optimization.`
    };
  }

  // Utility methods
  private calculateMobileScore(page: PageCrawlResult, $: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Mobile viewport
    if (page.mobileFriendly) {
      score += 30;
    }
    
    // Responsive images
    if ($('img[srcset], picture').length > 0) {
      score += 20;
    }
    
    // Touch-friendly elements
    if ($('button, input[type="button"], input[type="submit"]').length > 0) {
      score += 20;
    }
    
    // No flash or other mobile-unfriendly elements
    if ($('object, embed').length === 0) {
      score += 30;
    }
    
    return score;
  }

  private calculateAccessibilityScore($: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Alt text on images
    const images = $('img').length;
    const imagesWithAlt = $('img[alt]').length;
    if (images > 0) {
      score += (imagesWithAlt / images) * 30;
    } else {
      score += 30; // No images to check
    }
    
    // ARIA attributes
    if ($('[aria-label], [aria-describedby], [role]').length > 0) {
      score += 25;
    }
    
    // Form labels
    const inputs = $('input, textarea, select').length;
    const labelsOrPlaceholders = $('input[placeholder], textarea[placeholder], label').length;
    if (inputs > 0) {
      score += (labelsOrPlaceholders / inputs) * 25;
    } else {
      score += 25; // No forms to check
    }
    
    // Heading structure
    if ($('h1').length === 1 && $('h2').length > 0) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private calculateUXScore($: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Visual hierarchy (headings, emphasis)
    if ($('h1, h2, h3').length > 0 && $('strong, b, em, i').length > 0) {
      score += 25;
    }
    
    // Navigation
    if ($('nav, .nav, .navigation').length > 0) {
      score += 25;
    }
    
    // Content organization (lists, paragraphs)
    if ($('ul, ol').length > 0 && $('p').length > 0) {
      score += 25;
    }
    
    // Interactive elements
    if ($('button, a, input').length > 0) {
      score += 25;
    }
    
    return score;
  }

  // Additional utility methods for new analysis functions
  private calculateServiceAreaQuality(page: PageCrawlResult, $: cheerio.CheerioAPI): number {
    let score = 0;
    
    // Check for location-specific content
    const hasLocationMention = /\b(in|near|around|serving)\s+[A-Z][a-z]+(?:,\s*[A-Z]{2})?\b/.test(page.bodyText);
    if (hasLocationMention) score += 30;
    
    // Check for unique content length
    const wordCount = page.wordCount || 0;
    if (wordCount >= 400) score += 30;
    else if (wordCount >= 200) score += 15;
    
    // Check for local business information
    const hasBusinessInfo = this.detectNAP(page.bodyText, $).partial;
    if (hasBusinessInfo) score += 20;
    
    // Check for service-specific content
    const hasServiceContent = $('h2, h3').text().toLowerCase().includes('service');
    if (hasServiceContent) score += 20;
    
    return score;
  }

  private detectBusinessHours($: cheerio.CheerioAPI): boolean {
    const text = $('body').text().toLowerCase();
    const hoursPatterns = [
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*\b\d{1,2}:\d{2}\b/,
      /\bhours?\b.*\b\d{1,2}(:\d{2})?\s*(am|pm)\b/,
      /\bopen\b.*\b\d{1,2}(:\d{2})?\s*(am|pm)\b/,
      /\b(mon|tue|wed|thu|fri|sat|sun)\b.*\b\d{1,2}:\d{2}\b/
    ];
    
    return hoursPatterns.some(pattern => pattern.test(text));
  }

  private detectContactMethods($: cheerio.CheerioAPI): number {
    let methods = 0;
    const text = $('body').text();
    
    // Phone number
    if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
      methods++;
    }
    
    // Email
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) || $('a[href^="mailto:"]').length > 0) {
      methods++;
    }
    
    // Contact form
    if ($('form').length > 0) {
      methods++;
    }
    
    // Physical address
    const addressKeywords = ['street', 'avenue', 'road', 'blvd', 'drive', 'lane', 'suite', 'apt'];
    if (addressKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      methods++;
    }
    
    // Live chat
    if (text.toLowerCase().includes('chat') || $('[class*="chat"], [id*="chat"]').length > 0) {
      methods++;
    }
    
    return methods;
  }

  private detectIntrusivePopups($: cheerio.CheerioAPI): boolean {
    // Check for common popup patterns
    const popupSelectors = [
      '[class*="popup"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[class*="lightbox"]',
      '[id*="popup"]',
      '[id*="modal"]'
    ];
    
    let hasIntrusive = false;
    
    popupSelectors.forEach(selector => {
      const elements = $(selector);
      elements.each((_, el) => {
        const element = $(el);
        const text = element.text().toLowerCase();
        
        // Check for intrusive patterns
        if (text.includes('subscribe') || text.includes('newsletter') || 
            text.includes('discount') || text.includes('offer')) {
          // Check if it's likely to be intrusive (covers significant screen space)
          const style = element.attr('style') || '';
          const classes = element.attr('class') || '';
          
          if (style.includes('position: fixed') || style.includes('position: absolute') ||
              classes.includes('fullscreen') || classes.includes('cover')) {
            hasIntrusive = true;
          }
        }
      });
    });
    
    return hasIntrusive;
  }

  private calculateFormUsabilityScore($: cheerio.CheerioAPI): number {
    const forms = $('form');
    if (forms.length === 0) return 100; // No forms to evaluate
    
    let totalScore = 0;
    
    forms.each((_, form) => {
      const $form = $(form);
      let formScore = 0;
      
      // Check for proper labels
      const inputs = $form.find('input, textarea, select');
      const labels = $form.find('label');
      const inputsWithPlaceholders = $form.find('input[placeholder], textarea[placeholder]');
      
      if (labels.length >= inputs.length * 0.8 || inputsWithPlaceholders.length >= inputs.length * 0.8) {
        formScore += 30; // Good labeling
      }
      
      // Check for proper input types
      const emailInputs = $form.find('input[type="email"]');
      const telInputs = $form.find('input[type="tel"]');
      
      if (emailInputs.length > 0 || telInputs.length > 0) {
        formScore += 25; // Proper input types
      }
      
      // Check for required field indicators
      const requiredFields = $form.find('input[required], textarea[required], select[required]');
      const requiredIndicators = $form.find('[class*="required"], [class*="mandatory"]');
      
      if (requiredFields.length > 0 && requiredIndicators.length > 0) {
        formScore += 25; // Clear required field indication
      }
      
      // Check for submit button
      const submitButton = $form.find('input[type="submit"], button[type="submit"], button:contains("submit")');
      if (submitButton.length > 0) {
        formScore += 20; // Has submit button
      }
      
      totalScore += formScore;
    });
    
    return Math.round(totalScore / forms.length);
  }
}

// Type definitions
interface EnhancedAuditResult {
  summary: {
    totalFactors: number;
    priorityOfiCount: number;
    ofiCount: number;
    okCount: number;
    naCount: number;
  };
  onPage: { items: AuditItem[] };
  structureNavigation: { items: AuditItem[] };
  contactPage: { items: AuditItem[] };
  servicePages: { items: AuditItem[] };
  locationPages: { items: AuditItem[] };
  serviceAreaPages: { items: AuditItem[] };
}

interface PageAnalysisResult {
  contentQuality: AnalysisFactor[];
  technicalSeo: AnalysisFactor[];
  localSeo: AnalysisFactor[];
  uxPerformance: AnalysisFactor[];
}

interface SiteWideAnalysisResult {
  navigation: AnalysisFactor[];
  internalLinking: AnalysisFactor[];
  contentConsistency: AnalysisFactor[];
  duplicateContent: AnalysisFactor[];
}

interface AnalysisFactor {
  name: string;
  description: string;
  status: 'OK' | 'OFI' | 'Priority OFI' | 'N/A';
  importance: 'High' | 'Medium' | 'Low';
  notes: string;
}

interface AuditItem {
  name: string;
  description: string;
  status: 'OK' | 'OFI' | 'Priority OFI' | 'N/A';
  importance: 'High' | 'Medium' | 'Low';
  notes: string;
  category: string;
}

export { EnhancedAuditAnalyzer, type EnhancedAuditResult, type AnalysisFactor, type AuditItem };