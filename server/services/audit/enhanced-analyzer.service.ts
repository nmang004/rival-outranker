import * as cheerio from 'cheerio';
import { PageCrawlResult, SiteStructure } from './audit.service';
import { PageIssueSummary } from '../../../shared/schema';
import { PagePriorityService, PagePriority } from './page-priority.service';
import { OFIClassificationService } from './ofi-classification.service';
import {
  ContentQualityAnalyzer,
  TechnicalSEOAnalyzer,
  LocalSEOAnalyzer,
  UXPerformanceAnalyzer,
  type AnalysisFactor
} from './analyzers';

/**
 * Enhanced Audit Analyzer Service
 * Lightweight orchestrator that coordinates specialized analyzers via dependency injection
 * Handles comprehensive analysis of 200+ SEO factors across all categories
 */
class EnhancedAuditAnalyzer {
  
  // Injected specialized analyzers
  private contentAnalyzer: ContentQualityAnalyzer;
  private technicalAnalyzer: TechnicalSEOAnalyzer;
  private localSeoAnalyzer: LocalSEOAnalyzer;
  private uxAnalyzer: UXPerformanceAnalyzer;
  
  // Page Priority Analysis
  private priorityService = new PagePriorityService();

  constructor(
    contentAnalyzer?: ContentQualityAnalyzer,
    technicalAnalyzer?: TechnicalSEOAnalyzer,
    localSeoAnalyzer?: LocalSEOAnalyzer,
    uxAnalyzer?: UXPerformanceAnalyzer
  ) {
    // Use dependency injection with fallback to default instances
    this.contentAnalyzer = contentAnalyzer || new ContentQualityAnalyzer();
    this.technicalAnalyzer = technicalAnalyzer || new TechnicalSEOAnalyzer();
    this.localSeoAnalyzer = localSeoAnalyzer || new LocalSEOAnalyzer();
    this.uxAnalyzer = uxAnalyzer || new UXPerformanceAnalyzer();
  }

  /**
   * Perform comprehensive 200+ factor analysis on a website with priority weighting
   */
  async analyzeWebsite(siteStructure: SiteStructure): Promise<EnhancedAuditResult> {
    console.log('[EnhancedAnalyzer] Starting comprehensive 200+ factor analysis');
    
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
      serviceAreaPages: { items: [] },
      // Enhanced audit categories
      contentQuality: { items: [] },
      technicalSEO: { items: [] },
      localSEO: { items: [] },
      uxPerformance: { items: [] }
    };

    // Analyze homepage with all factors
    if (siteStructure.homepage) {
      const homepageAnalysis = await this.analyzePageComprehensive(siteStructure.homepage, 'homepage');
      const pageInfo = { 
        url: siteStructure.homepage.url, 
        title: siteStructure.homepage.title || 'Homepage', 
        type: 'homepage' 
      };
      this.mergeAnalysisResults(results, homepageAnalysis, pageInfo);
    }

    // Analyze contact page
    if (siteStructure.contactPage) {
      const contactAnalysis = await this.analyzePageComprehensive(siteStructure.contactPage, 'contact');
      const pageInfo = { 
        url: siteStructure.contactPage.url, 
        title: siteStructure.contactPage.title || 'Contact Page', 
        type: 'contact' 
      };
      this.mergeContactResults(results, contactAnalysis, pageInfo);
    }

    // Analyze service pages
    for (const servicePage of siteStructure.servicePages) {
      const serviceAnalysis = await this.analyzePageComprehensive(servicePage, 'service');
      const pageInfo = { 
        url: servicePage.url, 
        title: servicePage.title || 'Service Page', 
        type: 'service' 
      };
      this.mergeServiceResults(results, serviceAnalysis, pageInfo);
    }

    // Analyze location pages
    for (const locationPage of siteStructure.locationPages) {
      const locationAnalysis = await this.analyzePageComprehensive(locationPage, 'location');
      const pageInfo = { 
        url: locationPage.url, 
        title: locationPage.title || 'Location Page', 
        type: 'location' 
      };
      this.mergeLocationResults(results, locationAnalysis, pageInfo);
    }

    // Analyze service area pages
    for (const serviceAreaPage of siteStructure.serviceAreaPages) {
      const serviceAreaAnalysis = await this.analyzePageComprehensive(serviceAreaPage, 'serviceArea');
      const pageInfo = { 
        url: serviceAreaPage.url, 
        title: serviceAreaPage.title || 'Service Area Page', 
        type: 'serviceArea' 
      };
      this.mergeServiceAreaResults(results, serviceAreaAnalysis, pageInfo);
    }

    // CRITICAL FIX: Analyze "other" pages that may contain valuable service content
    // These pages were previously ignored, causing massive data loss
    console.log(`[EnhancedAnalyzer] Processing ${siteStructure.otherPages.length} other pages that may contain service content`);
    for (const otherPage of siteStructure.otherPages) {
      const otherPageAnalysis = await this.analyzePageComprehensive(otherPage, 'other');
      const pageInfo = { 
        url: otherPage.url, 
        title: otherPage.title || 'Other Page', 
        type: 'other' 
      };
      
      // Intelligently classify and merge based on content analysis
      if (this.isLikelyServiceContent(otherPage)) {
        console.log(`[EnhancedAnalyzer] Treating other page as service page: ${otherPage.url}`);
        this.mergeServiceResults(results, otherPageAnalysis, pageInfo);
      } else if (this.isLikelyLocationContent(otherPage)) {
        console.log(`[EnhancedAnalyzer] Treating other page as location page: ${otherPage.url}`);
        this.mergeLocationResults(results, otherPageAnalysis, pageInfo);
      } else {
        console.log(`[EnhancedAnalyzer] Treating other page as general content: ${otherPage.url}`);
        // Merge as general analysis results
        this.mergeAnalysisResults(results, otherPageAnalysis, pageInfo);
      }
    }

    // Site-wide analysis
    const siteWideAnalysis = await this.analyzeSiteWide(siteStructure);
    this.mergeSiteWideResults(results, siteWideAnalysis);

    // Calculate final summary
    this.calculateSummary(results);

    // Generate page issue summaries with priority weighting
    results.pageIssues = this.generatePageIssueSummaries(results, siteStructure);

    // Calculate weighted OFI scores and priority breakdown
    this.calculateWeightedSummary(results, siteStructure);

    console.log(`[EnhancedAnalyzer] Completed analysis: ${results.summary.totalFactors} factors evaluated`);
    console.log(`[EnhancedAnalyzer] Enhanced categories: Content Quality (${results.contentQuality?.items.length || 0}), Technical SEO (${results.technicalSEO?.items.length || 0}), Local SEO (${results.localSEO?.items.length || 0}), UX Performance (${results.uxPerformance?.items.length || 0})`);
    return results;
  }

  /**
   * Analyze a single page with all applicable factors
   */
  private async analyzePageComprehensive(page: PageCrawlResult, pageType: string): Promise<PageAnalysisResult> {
    console.log(`[EnhancedAnalyzer] Analyzing ${pageType} page: ${page.url}`);
    const $ = cheerio.load(page.rawHtml);
    
    const results: PageAnalysisResult = {
      contentQuality: await this.contentAnalyzer.analyze(page, $),
      technicalSeo: await this.technicalAnalyzer.analyze(page, $),
      localSeo: await this.localSeoAnalyzer.analyze(page, $, pageType),
      uxPerformance: await this.uxAnalyzer.analyze(page, $)
    };

    console.log(`[EnhancedAnalyzer] Page analysis complete for ${page.url}: Content Quality (${results.contentQuality.length}), Technical SEO (${results.technicalSeo.length}), Local SEO (${results.localSeo.length}), UX Performance (${results.uxPerformance.length})`);
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
  private mergeAnalysisResults(results: EnhancedAuditResult, analysis: PageAnalysisResult, pageInfo: { url: string; title: string; type: string }) {
    console.log(`[EnhancedAnalyzer] Merging analysis results for ${pageInfo.type} page: ${pageInfo.url}`);
    console.log(`[EnhancedAnalyzer] Analysis contains: Content Quality (${analysis.contentQuality.length}), Technical SEO (${analysis.technicalSeo.length}), Local SEO (${analysis.localSeo.length}), UX Performance (${analysis.uxPerformance.length})`);
    
    // Merge factors into their dedicated enhanced categories
    const contentItems = this.convertToAuditItems(analysis.contentQuality, 'Content Quality', pageInfo);
    this.mergeUniqueItems(results.contentQuality.items, contentItems);
    console.log(`[EnhancedAnalyzer] Added ${contentItems.length} content quality factors. Total now: ${results.contentQuality.items.length}`);
    
    const technicalItems = this.convertToAuditItems(analysis.technicalSeo, 'Technical SEO', pageInfo);
    this.mergeUniqueItems(results.technicalSEO.items, technicalItems);
    console.log(`[EnhancedAnalyzer] Added ${technicalItems.length} technical SEO factors. Total now: ${results.technicalSEO.items.length}`);
    
    const localItems = this.convertToAuditItems(analysis.localSeo, 'Local SEO & E-E-A-T', pageInfo);
    this.mergeUniqueItems(results.localSEO.items, localItems);
    console.log(`[EnhancedAnalyzer] Added ${localItems.length} local SEO factors. Total now: ${results.localSEO.items.length}`);
    
    const uxItems = this.convertToAuditItems(analysis.uxPerformance, 'UX & Performance', pageInfo);
    this.mergeUniqueItems(results.uxPerformance.items, uxItems);
    console.log(`[EnhancedAnalyzer] Added ${uxItems.length} UX performance factors. Total now: ${results.uxPerformance.items.length}`);
    
  }

  private mergeContactResults(results: EnhancedAuditResult, analysis: PageAnalysisResult, pageInfo: { url: string; title: string; type: string }) {
    console.log(`[EnhancedAnalyzer] Merging contact page results for: ${pageInfo.url}`);
    
    // For enhanced audits, merge contact page factors into enhanced categories
    const contentItems = this.convertToAuditItems(analysis.contentQuality, 'Content Quality', pageInfo);
    this.mergeUniqueItems(results.contentQuality.items, contentItems);
    console.log(`[EnhancedAnalyzer] Contact page - Added ${contentItems.length} content quality factors`);
    
    const localItems = this.convertToAuditItems(analysis.localSeo, 'Local SEO & E-E-A-T', pageInfo);
    this.mergeUniqueItems(results.localSEO.items, localItems);
    console.log(`[EnhancedAnalyzer] Contact page - Added ${localItems.length} local SEO factors`);
    
    const uxItems = this.convertToAuditItems(analysis.uxPerformance, 'UX & Performance', pageInfo);
    this.mergeUniqueItems(results.uxPerformance.items, uxItems);
    console.log(`[EnhancedAnalyzer] Contact page - Added ${uxItems.length} UX performance factors`);
  }

  private mergeServiceResults(results: EnhancedAuditResult, analysis: PageAnalysisResult, pageInfo: { url: string; title: string; type: string }) {
    // For enhanced audits, merge service page factors into enhanced categories
    this.mergeUniqueItems(results.contentQuality.items, this.convertToAuditItems(analysis.contentQuality, 'Content Quality', pageInfo));
    this.mergeUniqueItems(results.technicalSEO.items, this.convertToAuditItems(analysis.technicalSeo, 'Technical SEO', pageInfo));
    this.mergeUniqueItems(results.localSEO.items, this.convertToAuditItems(analysis.localSeo, 'Local SEO & E-E-A-T', pageInfo));
    this.mergeUniqueItems(results.uxPerformance.items, this.convertToAuditItems(analysis.uxPerformance, 'UX & Performance', pageInfo));
  }

  private mergeLocationResults(results: EnhancedAuditResult, analysis: PageAnalysisResult, pageInfo: { url: string; title: string; type: string }) {
    // For enhanced audits, merge location page factors into enhanced categories
    this.mergeUniqueItems(results.contentQuality.items, this.convertToAuditItems(analysis.contentQuality, 'Content Quality', pageInfo));
    this.mergeUniqueItems(results.technicalSEO.items, this.convertToAuditItems(analysis.technicalSeo, 'Technical SEO', pageInfo));
    this.mergeUniqueItems(results.localSEO.items, this.convertToAuditItems(analysis.localSeo, 'Local SEO & E-E-A-T', pageInfo));
    this.mergeUniqueItems(results.uxPerformance.items, this.convertToAuditItems(analysis.uxPerformance, 'UX & Performance', pageInfo));
  }

  private mergeServiceAreaResults(results: EnhancedAuditResult, analysis: PageAnalysisResult, pageInfo: { url: string; title: string; type: string }) {
    // For enhanced audits, merge service area page factors into enhanced categories
    this.mergeUniqueItems(results.contentQuality.items, this.convertToAuditItems(analysis.contentQuality, 'Content Quality', pageInfo));
    this.mergeUniqueItems(results.technicalSEO.items, this.convertToAuditItems(analysis.technicalSeo, 'Technical SEO', pageInfo));
    this.mergeUniqueItems(results.localSEO.items, this.convertToAuditItems(analysis.localSeo, 'Local SEO & E-E-A-T', pageInfo));
    this.mergeUniqueItems(results.uxPerformance.items, this.convertToAuditItems(analysis.uxPerformance, 'UX & Performance', pageInfo));
  }

  private mergeSiteWideResults(results: EnhancedAuditResult, analysis: SiteWideAnalysisResult) {
    // Merge site-wide factors into appropriate enhanced categories
    this.mergeUniqueItems(results.technicalSEO.items, this.convertToAuditItems(analysis.navigation, 'Technical SEO'));
    this.mergeUniqueItems(results.technicalSEO.items, this.convertToAuditItems(analysis.internalLinking, 'Technical SEO'));
    this.mergeUniqueItems(results.contentQuality.items, this.convertToAuditItems(analysis.contentConsistency, 'Content Quality'));
    this.mergeUniqueItems(results.technicalSEO.items, this.convertToAuditItems(analysis.duplicateContent, 'Technical SEO'));
    
    // Also merge into legacy categories for backward compatibility
    this.mergeUniqueItems(results.structureNavigation.items, this.convertToAuditItems(analysis.navigation, 'Navigation'));
    this.mergeUniqueItems(results.structureNavigation.items, this.convertToAuditItems(analysis.internalLinking, 'Internal Linking'));
    this.mergeUniqueItems(results.onPage.items, this.convertToAuditItems(analysis.contentConsistency, 'Content Consistency'));
    this.mergeUniqueItems(results.onPage.items, this.convertToAuditItems(analysis.duplicateContent, 'Duplicate Content'));
  }

  /**
   * Convert analysis factors to audit items with page information
   */
  private convertToAuditItems(factors: AnalysisFactor[], category: string, pageInfo?: { url: string; title: string; type: string }): AuditItem[] {
    return factors.map(factor => {
      const auditItem = {
        name: factor.name,
        description: factor.description,
        status: factor.status,
        importance: factor.importance,
        notes: factor.notes,
        category, // Ensure category is always set for proper categorization
        pageUrl: pageInfo?.url,
        pageTitle: pageInfo?.title,
        pageType: pageInfo?.type
      };

      // Enhanced debugging logs for audit item creation and Priority OFI classification
      console.log(`[EnhancedAnalyzer] AUDIT ITEM CREATED:`, {
        name: auditItem.name,
        status: auditItem.status,
        importance: auditItem.importance,
        category: auditItem.category,
        pageType: auditItem.pageType,
        url: pageInfo?.url,
        description: auditItem.description,
        notes: auditItem.notes
      });

      // Special logging for Priority OFI items to debug classification
      if (auditItem.status === 'Priority OFI') {
        console.log(`[EnhancedAnalyzer] 🔴 PRIORITY OFI DETECTED:`, {
          name: auditItem.name,
          status: auditItem.status,
          importance: auditItem.importance,
          pageType: auditItem.pageType,
          url: pageInfo?.url,
          category: auditItem.category,
          description: auditItem.description,
          notes: auditItem.notes
        });
      }

      return auditItem;
    });
  }

  /**
   * Merge audit items while avoiding duplicates based on name
   */
  private mergeUniqueItems(targetItems: AuditItem[], newItems: AuditItem[]) {
    for (const newItem of newItems) {
      // Check if an item with the same name already exists
      const existingIndex = targetItems.findIndex(item => item.name === newItem.name);
      
      if (existingIndex === -1) {
        // Item doesn't exist, add it
        targetItems.push(newItem);
      } else {
        // Item exists, merge the results intelligently
        const existingItem = targetItems[existingIndex];
        
        // Only update notes if existing item doesn't have notes or if new notes are significantly different
        if (!existingItem.notes && newItem.notes) {
          existingItem.notes = newItem.notes;
        } else if (newItem.notes && existingItem.notes && 
                   !existingItem.notes.includes(newItem.notes.substring(0, 50)) &&
                   existingItem.notes.length < 200) {
          // Only append if notes are different and total length is reasonable
          existingItem.notes = `${existingItem.notes} | ${newItem.notes}`;
        }
        
        // Use the worst status (Priority OFI > OFI > OK > N/A)
        const statusPriority = { 'Priority OFI': 0, 'OFI': 1, 'OK': 2, 'N/A': 3 };
        const originalStatus = existingItem.status;
        if (statusPriority[newItem.status] < statusPriority[existingItem.status]) {
          existingItem.status = newItem.status;
          
          // Log status changes, especially Priority OFI promotions
          console.log(`[EnhancedAnalyzer] STATUS CHANGE for "${existingItem.name}": ${originalStatus} -> ${newItem.status}`, {
            name: existingItem.name,
            oldStatus: originalStatus,
            newStatus: newItem.status,
            importance: existingItem.importance,
            pageType: newItem.pageType,
            url: newItem.pageUrl
          });
          
          // Special logging for Priority OFI status changes
          if (newItem.status === 'Priority OFI') {
            console.log(`[EnhancedAnalyzer] 🔴 PRIORITY OFI PROMOTION for "${existingItem.name}": ${originalStatus} -> ${newItem.status}`, {
              name: existingItem.name,
              status: newItem.status,
              importance: existingItem.importance,
              pageType: newItem.pageType,
              url: newItem.pageUrl,
              category: existingItem.category
            });
          }
        }
        
        // Use the highest importance
        const importancePriority = { 'High': 0, 'Medium': 1, 'Low': 2 };
        const originalImportance = existingItem.importance;
        if (importancePriority[newItem.importance] < importancePriority[existingItem.importance]) {
          existingItem.importance = newItem.importance;
          
          // Log importance changes
          console.log(`[EnhancedAnalyzer] IMPORTANCE CHANGE for "${existingItem.name}": ${originalImportance} -> ${newItem.importance}`, {
            name: existingItem.name,
            oldImportance: originalImportance,
            newImportance: newItem.importance,
            status: existingItem.status,
            pageType: newItem.pageType,
            url: newItem.pageUrl
          });
        }
      }
    }
  }

  /**
   * Determine if an "other" page likely contains service content
   */
  private isLikelyServiceContent(page: PageCrawlResult): boolean {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const bodyText = page.bodyText.toLowerCase();
    
    // Check for electrical contractor specific terms
    const electricalTerms = [
      'electrical', 'electrician', 'wiring', 'outlet', 'circuit', 'panel', 
      'lighting', 'generator', 'surge protector', 'electrical repair',
      'electrical installation', 'electrical service', 'commercial electrical',
      'residential electrical', 'electrical contractor', 'licensed electrician'
    ];
    
    // General service terms
    const serviceTerms = [
      'service', 'services', 'repair', 'installation', 'maintenance',
      'professional', 'certified', 'licensed', 'experienced',
      'we provide', 'we offer', 'estimate', 'quote', 'consultation'
    ];
    
    const electricalCount = electricalTerms.filter(term => 
      title.includes(term) || bodyText.includes(term) || url.includes(term)
    ).length;
    
    const serviceCount = serviceTerms.filter(term => 
      title.includes(term) || bodyText.includes(term)
    ).length;
    
    // Consider it service content if it has electrical terms OR multiple service indicators
    return electricalCount >= 1 || serviceCount >= 3;
  }

  /**
   * Determine if an "other" page likely contains location content
   */
  private isLikelyLocationContent(page: PageCrawlResult): boolean {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const bodyText = page.bodyText.toLowerCase();
    
    const locationTerms = [
      'location', 'areas served', 'service area', 'service areas',
      'cities', 'towns', 'neighborhoods', 'regions', 'we serve'
    ];
    
    const locationCount = locationTerms.filter(term => 
      title.includes(term) || bodyText.includes(term) || url.includes(term)
    ).length;
    
    // Check for multiple city mentions or explicit location indicators
    return locationCount >= 2;
  }

  /**
   * Calculate summary statistics for enhanced audit
   */
  private calculateSummary(results: EnhancedAuditResult) {
    let allItems = [];
    
    // For enhanced audits, count factors from enhanced categories
    allItems = [
      ...results.contentQuality.items,
      ...results.technicalSEO.items,
      ...results.localSEO.items,
      ...results.uxPerformance.items
    ];
    
    // CRITICAL: Apply new OFI classification system to ALL items FIRST
    const ofiClassificationService = new OFIClassificationService();
    
    // Apply classification to all enhanced categories BEFORE populating legacy categories
    this.applyNewClassificationToItems(results.contentQuality.items, ofiClassificationService);
    this.applyNewClassificationToItems(results.technicalSEO.items, ofiClassificationService);
    this.applyNewClassificationToItems(results.localSEO.items, ofiClassificationService);
    this.applyNewClassificationToItems(results.uxPerformance.items, ofiClassificationService);

    // FIXED: Populate legacy categories AFTER classification to ensure they get updated Priority OFI statuses
    // This ensures the audit works with both enhanced and legacy UI components
    results.onPage.items = [...results.contentQuality.items, ...results.technicalSEO.items];
    results.structureNavigation.items = [...results.technicalSEO.items].filter(item => 
      item.name.toLowerCase().includes('navigation') || 
      item.name.toLowerCase().includes('link') ||
      item.name.toLowerCase().includes('structure')
    );
    results.contactPage.items = [...results.localSEO.items].filter(item => 
      item.pageType === 'contact' || 
      item.name.toLowerCase().includes('contact')
    );
    results.servicePages.items = [...allItems].filter(item => item.pageType === 'service');
    results.locationPages.items = [...allItems].filter(item => item.pageType === 'location');
    results.serviceAreaPages.items = [...allItems].filter(item => item.pageType === 'serviceArea');
    
    // Recalculate all items after classification
    const allClassifiedItems = [
      ...results.contentQuality.items,
      ...results.technicalSEO.items,
      ...results.localSEO.items,
      ...results.uxPerformance.items
    ];

    // TEMPORARY DEBUG: Log Priority OFI items post-classification
    const priorityOfiItems = allClassifiedItems.filter(item => item.status === 'Priority OFI');
    console.log(`[PRIORITY OFI DEBUG] Post-classification: Found ${priorityOfiItems.length} Priority OFI items`);
    priorityOfiItems.forEach((item, index) => {
      console.log(`[PRIORITY OFI DEBUG] ${index + 1}. ${item.name} (${item.category || 'No category'}) - ${item.pageType || 'No page type'}`);
    });

    // Also log legacy category Priority OFI counts
    const legacyPriorityOfiCounts = {
      onPage: results.onPage.items.filter(item => item.status === 'Priority OFI').length,
      structureNavigation: results.structureNavigation.items.filter(item => item.status === 'Priority OFI').length,
      contactPage: results.contactPage.items.filter(item => item.status === 'Priority OFI').length,
      servicePages: results.servicePages.items.filter(item => item.status === 'Priority OFI').length,
      locationPages: results.locationPages.items.filter(item => item.status === 'Priority OFI').length,
      serviceAreaPages: results.serviceAreaPages.items.filter(item => item.status === 'Priority OFI').length
    };
    console.log(`[PRIORITY OFI DEBUG] Legacy category counts:`, legacyPriorityOfiCounts);

    results.summary.totalFactors = allClassifiedItems.length;
    results.summary.priorityOfiCount = allClassifiedItems.filter(item => item.status === 'Priority OFI').length;
    results.summary.ofiCount = allClassifiedItems.filter(item => item.status === 'OFI').length;
    results.summary.okCount = allClassifiedItems.filter(item => item.status === 'OK').length;
    results.summary.naCount = allClassifiedItems.filter(item => item.status === 'N/A').length;

    // CRITICAL FIX: Calculate categoryScores for Excel export compatibility
    const categoryScores: Record<string, number> = {};
    
    // Calculate score for each enhanced category (0-100 based on completion percentage)
    const categories = [
      { name: 'Content Quality', items: results.contentQuality.items },
      { name: 'Technical SEO', items: results.technicalSEO.items },
      { name: 'Local SEO & E-E-A-T', items: results.localSEO.items },
      { name: 'UX & Performance', items: results.uxPerformance.items }
    ];

    categories.forEach(category => {
      if (category.items.length > 0) {
        // IMPORTANCE-WEIGHTED SCORING: Base score + importance modifier
        let totalWeightedScore = 0;
        
        category.items.forEach(item => {
          let finalScore = 0;
          
          // SIMPLIFIED IMPORTANCE-BASED SCORING
          switch (item.status) {
            case 'OK':
              // OK items are always perfect regardless of importance
              finalScore = 100;
              break;
              
            case 'N/A':
              // N/A items are always perfect (not applicable)
              finalScore = 100;
              break;
              
            case 'OFI':
              // OFI items: Base 60 points, minus importance penalty
              let ofiPenalty = 0;
              switch (item.importance) {
                case 'High':
                  ofiPenalty = 15; // 60 - 15 = 45 points
                  break;
                case 'Medium':
                  ofiPenalty = 10; // 60 - 10 = 50 points
                  break;
                case 'Low':
                  ofiPenalty = 5;  // 60 - 5 = 55 points
                  break;
                default:
                  ofiPenalty = 10; // Default to Medium penalty
              }
              finalScore = 60 - ofiPenalty;
              break;
              
            case 'Priority OFI':
              // Priority OFI items: Base 30 points, minus importance penalty
              let priorityPenalty = 0;
              switch (item.importance) {
                case 'High':
                  priorityPenalty = 15; // 30 - 15 = 15 points
                  break;
                case 'Medium':
                  priorityPenalty = 10; // 30 - 10 = 20 points
                  break;
                case 'Low':
                  priorityPenalty = 5;  // 30 - 5 = 25 points
                  break;
                default:
                  priorityPenalty = 10; // Default to Medium penalty
              }
              finalScore = 30 - priorityPenalty;
              break;
              
            default:
              finalScore = 0;
          }
          
          totalWeightedScore += finalScore;
        });
        
        // Calculate average weighted score for the category
        const averageScore = totalWeightedScore / category.items.length;
        categoryScores[category.name] = Math.round(averageScore);
      } else {
        categoryScores[category.name] = 0;
      }
    });

    // Calculate overall score as weighted average of category scores
    const overallScore = Math.round(
      (categoryScores['Content Quality'] * 0.25) +
      (categoryScores['Technical SEO'] * 0.30) +
      (categoryScores['Local SEO & E-E-A-T'] * 0.25) +
      (categoryScores['UX & Performance'] * 0.20)
    );

    // Add calculated scores to summary for Excel export compatibility
    (results.summary as any).categoryScores = categoryScores;
    (results.summary as any).overallScore = overallScore;

    console.log(`[EnhancedAnalyzer] SIMPLIFIED IMPORTANCE-WEIGHTED SCORES:`, {
      contentQuality: categoryScores['Content Quality'],
      technicalSEO: categoryScores['Technical SEO'],
      localSEO: categoryScores['Local SEO & E-E-A-T'],
      uxPerformance: categoryScores['UX & Performance'],
      overallScore: overallScore,
      scoringMethod: 'Simplified Importance-weighted (Penalty-based)',
      scoreBreakdown: {
        'OK (any importance)': '100pts',
        'OFI High': '60-15=45pts',
        'OFI Medium': '60-10=50pts', 
        'OFI Low': '60-5=55pts',
        'Priority OFI High': '30-15=15pts',
        'Priority OFI Medium': '30-10=20pts',
        'Priority OFI Low': '30-5=25pts',
        'N/A (any importance)': '100pts'
      }
    });
  }

  /**
   * Apply new OFI classification system to items
   */
  private applyNewClassificationToItems(items: any[], ofiClassificationService: any): void {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Reclassify both OFI and Priority OFI items - let OK and N/A items stay as they are
      if (item.status === 'OFI' || item.status === 'Priority OFI') {
        const classificationResult = ofiClassificationService.classifyAuditItem(item);
        
        // Update status based on new classification
        const newStatus = classificationResult.classification === 'Priority OFI' ? 'Priority OFI' : 'OFI';
        const wasDowngraded = item.status === 'Priority OFI' && newStatus === 'OFI';
        
        item.status = newStatus;
        
        // Add actionable improvement recommendations instead of classification details
        if (classificationResult.classification === 'Priority OFI') {
          item.notes = this.generateActionableNotes(item, 'Priority OFI');
        } else if (wasDowngraded) {
          item.notes = this.generateActionableNotes(item, 'OFI') + ' [Auto-downgraded: Did not meet critical priority criteria]';
        } else {
          item.notes = this.generateActionableNotes(item, 'OFI');
        }
      }
    }
  }

  /**
   * Generate actionable, specific improvement recommendations for audit items
   * Following the 'What, Why, and How' template for user-centric advice
   */
  private generateActionableNotes(item: any, status: string): string {
    const name = item.name.toLowerCase();
    const description = item.description.toLowerCase();
    
    // Generate specific recommendations based on the item name and context
    let recommendation = '';
    
    // Content Quality recommendations
    if (name.includes('content length') || name.includes('sufficient content')) {
      recommendation = 'What: Your page content is too brief to effectively communicate with visitors and search engines.\n\nWhy: Detailed content establishes expertise, helps visitors understand your services, and gives search engines more context to rank your pages.\n\nHow: Expand your content to 300-500 words minimum by adding service benefits, process explanations, and local expertise details.';
    } else if (name.includes('keyword density')) {
      recommendation = 'What: Your target keywords are either missing or used unnaturally throughout the content.\n\nWhy: Proper keyword usage helps search engines understand your page topic while maintaining readability for visitors.\n\nHow: Naturally integrate your main keywords 2-3 times throughout the content, using semantic variations and related terms.';
    } else if (name.includes('call-to-action') || name.includes('cta')) {
      recommendation = 'What: The page lacks strong, action-oriented call-to-action (CTA) buttons.\n\nWhy: Prominent CTAs like "Get Free Quote" or "Call Now" guide users toward conversion and are critical for turning visitors into customers.\n\nHow: Add clear, clickable buttons in key locations (header, near service descriptions, bottom of page) with action-oriented language.';
    } else if (name.includes('brand consistency')) {
      recommendation = 'What: Your business information appears inconsistently across different pages.\n\nWhy: Consistent branding builds trust with visitors and helps search engines understand your business identity.\n\nHow: Ensure your business name, logo, and contact information appear identically on every page, using the same phone number format.';
    } else if (name.includes('reviews') || name.includes('testimonials')) {
      recommendation = 'What: Customer testimonials and reviews are not prominently displayed on your website.\n\nWhy: Social proof from satisfied customers builds trust and credibility, significantly influencing visitor decisions.\n\nHow: Add customer testimonials to your homepage and service pages, including names, photos, and specific project details.';
    } else if (name.includes('heading') || name.includes('h1') || name.includes('h2')) {
      recommendation = 'What: Page headings are missing, unclear, or not properly structured with target keywords.\n\nWhy: Clear headings help visitors scan content quickly and tell search engines what each section covers.\n\nHow: Use descriptive headings that include target keywords, with H1 for the main title and H2 for major sections.';
    } else if (name.includes('image') || name.includes('alt')) {
      recommendation = 'What: Images on your website lack descriptive alt text or have generic descriptions.\n\nWhy: Alt text helps visually impaired users understand images and gives search engines context about your visual content.\n\nHow: Add specific alt text to all images describing what they show, including location and service keywords where relevant.';
    }
    
    // Technical SEO recommendations
    else if (name.includes('url structure')) {
      recommendation = 'What: Your website URLs are not user-friendly or descriptive (e.g., "/page123" instead of clear names).\n\nWhy: Clean URLs are easier for users to remember and share, and help search engines understand page content.\n\nHow: Create descriptive URLs like "/plumbing-services" or "/emergency-repair" that include relevant keywords in the path.';
    } else if (name.includes('schema') || name.includes('structured data')) {
      recommendation = 'What: Your website lacks structured data markup that helps search engines understand your business.\n\nWhy: Schema markup enables rich search results and helps search engines display your business information more prominently.\n\nHow: Add local business schema markup including your NAP (name, address, phone), hours, services, and service areas.';
    } else if (name.includes('meta') || name.includes('title tag')) {
      recommendation = 'What: Page titles and meta descriptions are missing, generic, or too long for search results.\n\nWhy: These elements appear in search results and significantly impact click-through rates from Google.\n\nHow: Write compelling meta titles (under 60 characters) and descriptions that include your main keywords and location.';
    } else if (name.includes('mobile') || name.includes('responsive')) {
      recommendation = 'What: Your website does not display properly on mobile devices or tablets.\n\nWhy: Over 60% of searches happen on mobile devices, and Google prioritizes mobile-friendly websites in rankings.\n\nHow: Test your website on various device sizes and ensure buttons, forms, and navigation work smoothly on mobile.';
    } else if (name.includes('page speed') || name.includes('performance')) {
      recommendation = 'What: Your website loads slowly, taking more than 3 seconds to fully display.\n\nWhy: Slow loading speeds frustrate visitors (causing them to leave) and negatively impact search rankings.\n\nHow: Optimize images, enable compression, and minimize unnecessary code to achieve under 3-second load times.';
    } else if (name.includes('ssl') || name.includes('https')) {
      recommendation = 'What: Your website is not secured with an SSL certificate (not using HTTPS).\n\nWhy: SSL certificates protect visitor data and are required by Google for good search rankings and user trust.\n\nHow: Install an SSL certificate through your web host to secure your website and enable HTTPS.';
    }
    
    // Local SEO recommendations  
    else if (name.includes('nap consistency') || name.includes('business information')) {
      recommendation = 'What: Your business name, address, and phone number (NAP) are displayed inconsistently across pages.\n\nWhy: Consistent NAP information builds trust with search engines and customers, improving local search rankings.\n\nHow: Display your complete business information identically on every page, matching your Google Business Profile exactly.';
    } else if (name.includes('location') || name.includes('service area')) {
      recommendation = 'What: Your website lacks dedicated pages for the specific cities or areas you serve.\n\nWhy: Location-specific pages help you rank for local searches and show potential customers you serve their area.\n\nHow: Create individual pages for each city/area you serve, including local landmarks, zip codes, and area-specific content.';
    } else if (name.includes('google business') || name.includes('gmb')) {
      recommendation = 'What: Your Google Business Profile is incomplete or not optimized for local search.\n\nWhy: A complete Google Business Profile significantly improves local search visibility and customer trust.\n\nHow: Fill out all profile sections, add regular posts and photos, respond to reviews, and encourage satisfied customers to leave reviews.';
    } else if (name.includes('local link') || name.includes('citations')) {
      recommendation = 'What: Your business is not listed in relevant local directories and citation sources.\n\nWhy: Local directory listings (citations) improve search engine trust and help customers find your business.\n\nHow: Get listed in directories like Yelp, Angie\'s List, and industry-specific directories, ensuring consistent NAP information.';
    } else if (name.includes('expertise') || name.includes('authority')) {
      recommendation = 'What: Your website does not adequately showcase your professional credentials and expertise.\n\nWhy: Demonstrating expertise builds customer confidence and helps search engines recognize you as an authoritative source.\n\nHow: Add sections highlighting certifications, years of experience, completed projects, team bios, and professional credentials.';
    } else if (name.includes('community') || name.includes('local involvement')) {
      recommendation = 'What: Your website does not highlight your local community involvement or connections.\n\nWhy: Local community ties build trust with potential customers and strengthen your local search relevance.\n\nHow: Feature your community involvement, local sponsorships, partnerships, and customer success stories from your area.';
    }
    
    // UX & Performance recommendations
    else if (name.includes('navigation') || name.includes('menu')) {
      recommendation = 'What: Your website navigation is confusing or cluttered, making it hard for visitors to find what they need.\n\nWhy: Clear navigation keeps visitors on your site longer and guides them toward taking action.\n\nHow: Simplify your main menu to key pages (Services, About, Contact) and add a prominent "Get Quote" button in the header.';
    } else if (name.includes('form') || name.includes('contact form')) {
      recommendation = 'What: Your contact forms are too long, confusing, or not working properly on mobile devices.\n\nWhy: Simple, working forms are essential for capturing leads and converting visitors into customers.\n\nHow: Streamline forms to essential fields only, add clear labels, and test functionality on mobile devices.';
    } else if (name.includes('accessibility') || name.includes('contrast')) {
      recommendation = 'What: Your website has accessibility issues like poor color contrast or unclear navigation.\n\nWhy: Accessible websites serve all users better and are favored by search engines for providing good user experiences.\n\nHow: Ensure sufficient color contrast, enable keyboard navigation, and use descriptive link text instead of "click here".';
    } else if (name.includes('search') || name.includes('site search')) {
      recommendation = 'What: Your website lacks a search function to help visitors find specific information quickly.\n\nWhy: Site search helps visitors find what they need faster, reducing bounce rates and improving user experience.\n\nHow: Add a prominent search box to your header or main navigation to help visitors quickly locate specific services or information.';
    } else if (name.includes('breadcrumb')) {
      recommendation = 'What: Your website is missing breadcrumb navigation showing users their current location.\n\nWhy: Breadcrumbs help users understand site structure and provide search engines with additional context about page relationships.\n\nHow: Add breadcrumb navigation (Home > Services > Plumbing) to help users navigate and improve SEO structure.';
    }
    
    // Generic fallback recommendations
    else {
      if (name.includes('optimization')) {
        recommendation = 'What: This SEO element requires attention to meet current best practices.\n\nWhy: Proper optimization of all SEO elements is necessary for good search rankings and user experience.\n\nHow: Review and improve this element following current SEO guidelines, focusing on both user experience and search engine visibility.';
      } else if (description.includes('should')) {
        const cleanDescription = description.replace('should', 'needs to').replace('page should', 'your page needs to').replace('site should', 'your website needs to');
        recommendation = `What: ${cleanDescription}.\n\nWhy: This improvement is necessary for better search engine visibility and user experience.\n\nHow: Address this issue by implementing the recommended changes to meet SEO best practices.`;
      } else {
        recommendation = 'What: This element needs attention to improve your website\'s performance.\n\nWhy: All website elements should be optimized to provide the best experience for visitors and search engines.\n\nHow: Review this item and implement improvements based on current SEO and user experience best practices.';
      }
    }
    
    // Add priority context for high priority items only
    if (status === 'Priority OFI') {
      recommendation = '🚨 HIGH PRIORITY: ' + recommendation + '\n\nIMPORTANT: This issue significantly impacts your search rankings and should be addressed immediately for maximum benefit.';
    }
    
    return recommendation;
  }

  /**
   * Calculate weighted OFI summary with priority breakdown
   */
  private calculateWeightedSummary(results: EnhancedAuditResult, siteStructure: SiteStructure): void {
    if (!results.pageIssues || results.pageIssues.length === 0) {
      return;
    }

    // Prepare data for weighted calculation
    const pageResults = results.pageIssues.map(page => ({
      priority: page.priority || PagePriority.TIER_3,
      priorityOfiCount: page.priorityOfiCount,
      ofiCount: page.ofiCount,
      okCount: page.okCount,
      naCount: page.naCount,
      score: page.score || 0
    }));

    // Calculate weighted OFI
    const weightedOFI = this.priorityService.calculateWeightedOFI(pageResults);
    
    // Calculate priority-weighted overall score
    const weightedScore = this.priorityService.calculatePriorityWeightedScore(
      pageResults.map(page => ({
        priority: page.priority,
        score: page.score
      }))
    );

    // Update summary with weighted calculations including normalization
    (results.summary as any).weightedOverallScore = weightedScore.weightedScore;
    (results.summary as any).priorityBreakdown = {
      tier1: weightedOFI.breakdown.tier1,
      tier2: weightedOFI.breakdown.tier2,
      tier3: weightedOFI.breakdown.tier3,
      totalWeightedOFI: weightedOFI.weightedOFI,
      normalizedOFI: weightedOFI.normalizedOFI,
      sizeAdjustedOFI: weightedOFI.sizeAdjustedOFI,
      confidence: weightedScore.confidence,
      normalizationFactors: weightedOFI.normalizationFactors
    };

    console.log(`[EnhancedAnalyzer] Priority Breakdown:
      - Tier 1 (High Priority): ${weightedOFI.breakdown.tier1.pages} pages, ${weightedOFI.breakdown.tier1.ofi} OFI issues
      - Tier 2 (Medium Priority): ${weightedOFI.breakdown.tier2.pages} pages, ${weightedOFI.breakdown.tier2.ofi} OFI issues  
      - Tier 3 (Low Priority): ${weightedOFI.breakdown.tier3.pages} pages, ${weightedOFI.breakdown.tier3.ofi} OFI issues
      - Weighted Overall Score: ${weightedScore.weightedScore}% (confidence: ${Math.round(weightedScore.confidence * 100)}%)
      - Size-Adjusted OFI: ${Math.round(weightedOFI.sizeAdjustedOFI * 100) / 100}
      - Normalization Factors: Size(${weightedOFI.normalizationFactors.sizeNormalization}), Balance(${Math.round(weightedOFI.normalizationFactors.distributionBalance * 100) / 100}), Representation(${weightedOFI.normalizationFactors.tierRepresentation})`);
  }

  /**
   * Generate page-specific issue summaries for the dropdown with priority weighting
   */
  private generatePageIssueSummaries(results: EnhancedAuditResult, siteStructure: SiteStructure): PageIssueSummary[] {
    const allItems = [
      ...results.onPage.items,
      ...results.structureNavigation.items,
      ...results.contactPage.items,
      ...results.servicePages.items,
      ...results.locationPages.items,
      ...results.serviceAreaPages.items
    ];

    console.log(`[PageIssueSummaries] Processing ${allItems.length} total items`);
    console.log(`[PageIssueSummaries] Items with pageUrl: ${allItems.filter(item => item.pageUrl).length}`);

    // Group items by page URL
    const pageGroups = new Map<string, AuditItem[]>();
    
    allItems.forEach(item => {
      if (item.pageUrl) {
        if (!pageGroups.has(item.pageUrl)) {
          pageGroups.set(item.pageUrl, []);
        }
        pageGroups.get(item.pageUrl)!.push(item);
      }
    });

    console.log(`[PageIssueSummaries] Grouped into ${pageGroups.size} pages`);

    // Generate summaries for each page
    const pageSummaries: PageIssueSummary[] = [];
    
    pageGroups.forEach((items, pageUrl) => {
      const priorityOfiCount = items.filter(item => item.status === 'Priority OFI').length;
      const ofiCount = items.filter(item => item.status === 'OFI').length;
      const okCount = items.filter(item => item.status === 'OK').length;
      const naCount = items.filter(item => item.status === 'N/A').length;
      const totalIssues = priorityOfiCount + ofiCount;

      console.log(`[PageIssueSummaries] Page ${pageUrl}: ${totalIssues} issues (${priorityOfiCount} Priority OFI, ${ofiCount} OFI)`);
      
      // Only include pages that have issues to fix
      if (totalIssues > 0) {
        const firstItem = items[0]; // Get page info from first item
        const issueItems = items.filter(item => item.status === 'Priority OFI' || item.status === 'OFI');
        
        // Get top 3 most critical issues
        const topIssues = issueItems
          .sort((a, b) => {
            // Sort by status priority first (Priority OFI > OFI), then by importance
            const statusPriority: Record<string, number> = { 'Priority OFI': 0, 'OFI': 1, 'OK': 2, 'N/A': 3 };
            const importancePriority: Record<string, number> = { 'High': 0, 'Medium': 1, 'Low': 2 };
            
            if (statusPriority[a.status] !== statusPriority[b.status]) {
              return statusPriority[a.status] - statusPriority[b.status];
            }
            return importancePriority[a.importance] - importancePriority[b.importance];
          })
          .slice(0, 3)
          .map(item => ({
            name: item.name,
            status: item.status,
            importance: item.importance,
            category: item.category
          }));

        // Determine page priority
        const pageData = this.findPageInStructure(pageUrl, siteStructure);
        const pageType = firstItem.pageType || 'unknown';
        const priority = pageData ? this.priorityService.getPagePriority(pageData, pageType) : PagePriority.TIER_3;
        const priorityWeight = this.priorityService.getPriorityWeight(priority);
        
        // Calculate basic page score (percentage of OK items)
        const totalFactors = priorityOfiCount + ofiCount + okCount + naCount;
        const score = totalFactors > 0 ? Math.round((okCount / totalFactors) * 100) : 0;
        
        // Calculate weighted score (applying priority weight but normalizing back to 0-100)
        const weightedScore = Math.min(100, score * (priorityWeight / 2)); // Normalize weight impact

        pageSummaries.push({
          pageUrl,
          pageTitle: firstItem.pageTitle || 'Untitled Page',
          pageType,
          priority,
          priorityWeight,
          priorityOfiCount,
          ofiCount,
          okCount,
          naCount,
          totalIssues,
          score,
          weightedScore,
          topIssues
        });
      }
    });

    console.log(`[PageIssueSummaries] Generated ${pageSummaries.length} page summaries with issues`);
    
    // Sort by priority weight first, then by total issues
    return pageSummaries.sort((a, b) => {
      // Sort by priority (higher priority first), then Priority OFI count, then total issues
      if (a.priority !== b.priority) {
        return a.priority! - b.priority!; // Lower number = higher priority
      }
      if (a.priorityOfiCount !== b.priorityOfiCount) {
        return b.priorityOfiCount - a.priorityOfiCount;
      }
      return b.totalIssues - a.totalIssues;
    });
  }

  /**
   * Find a page in the site structure by URL
   */
  private findPageInStructure(url: string, siteStructure: SiteStructure): PageCrawlResult | null {
    // Check homepage
    if (siteStructure.homepage?.url === url) {
      return siteStructure.homepage;
    }
    
    // Check contact page
    if (siteStructure.contactPage?.url === url) {
      return siteStructure.contactPage;
    }
    
    // Check service pages
    const servicePage = siteStructure.servicePages.find(page => page.url === url);
    if (servicePage) return servicePage;
    
    // Check location pages
    const locationPage = siteStructure.locationPages.find(page => page.url === url);
    if (locationPage) return locationPage;
    
    // Check service area pages
    const serviceAreaPage = siteStructure.serviceAreaPages.find(page => page.url === url);
    if (serviceAreaPage) return serviceAreaPage;
    
    // Check other pages
    const otherPage = siteStructure.otherPages.find(page => page.url === url);
    if (otherPage) return otherPage;
    
    return null;
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
    ].filter(Boolean) as PageCrawlResult[];

    // Check navigation consistency
    const navigationConsistency = this.checkNavigationConsistency(allPages);
    factors.push({
      name: "Navigation Structure Consistency",
      description: "Navigation should be consistent across all pages",
      status: navigationConsistency >= 80 ? "OK" : "OFI",
      importance: "High",
      notes: `Navigation consistency score: ${navigationConsistency}%. All pages should have similar navigation structure.`
    });

    // Check navigation depth
    const maxDepth = this.calculateNavigationDepth(siteStructure);
    factors.push({
      name: "Navigation Depth Optimization", 
      description: "Important pages should be accessible within 3 clicks",
      status: maxDepth <= 3 ? "OK" : "OFI",
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
    ].filter(Boolean) as PageCrawlResult[];

    // Analyze internal linking structure
    const linkingQuality = this.assessInternalLinkingQuality(allPages);
    factors.push({
      name: "Internal Linking Quality",
      description: "Pages should be well-connected with descriptive anchor text",
      status: linkingQuality >= 70 ? "OK" : linkingQuality >= 40 ? "OFI" : "Priority OFI",
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
    ].filter(Boolean) as PageCrawlResult[];

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
    ].filter(Boolean) as PageCrawlResult[];

    // Check for duplicate content
    const duplicateContent = this.detectDuplicateContent(allPages);
    factors.push({
      name: "Duplicate Content Detection",
      description: "Each page should have unique, valuable content",
      status: duplicateContent.percentage < 10 ? "OK" : duplicateContent.percentage < 30 ? "OFI" : "Priority OFI",
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
    ].filter(Boolean) as PageCrawlResult[];

    const maxDepth = Math.max(...allPages.map(page => {
      if (!page) return 0;
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
  // Enhanced audit categories - made required to ensure they're always populated
  contentQuality: { items: AuditItem[] };
  technicalSEO: { items: AuditItem[] };
  localSEO: { items: AuditItem[] };
  uxPerformance: { items: AuditItem[] };
  pageIssues?: PageIssueSummary[];
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


interface AuditItem {
  name: string;
  description: string;
  status: 'OK' | 'OFI' | 'Priority OFI' | 'N/A';
  importance: 'High' | 'Medium' | 'Low';
  notes: string;
  category: string;
  pageUrl?: string;
  pageTitle?: string;
  pageType?: string;
}

export { EnhancedAuditAnalyzer, type EnhancedAuditResult, type AuditItem };