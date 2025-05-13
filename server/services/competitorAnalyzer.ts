import axios from 'axios';
import * as cheerio from 'cheerio';
import { crawler } from './crawler';
import { keywordAnalyzer } from './keywordAnalyzer';

interface Competitor {
  url: string;
  title: string;
  description: string;
  keywordDensity: number;
  contentLength: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  internalLinksCount: number;
  externalLinksCount: number;
  imageCount: number;
  imagesWithAlt: number;
  loadTime?: number;
  pageSize?: number;
  strengths: string[];
  weaknesses: string[];
}

interface CompetitorAnalysisResult {
  keyword: string;
  location: string;
  competitors: Competitor[];
  comparisonMetrics: {
    avgKeywordDensity: number;
    avgContentLength: number;
    avgH1Count: number;
    avgH2Count: number;
    avgImagesWithAlt: number;
    topKeywords: string[];
  };
}

class CompetitorAnalyzer {
  private USER_AGENT = 'SEO-Best-Practices-Assessment-Tool/1.0';
  private REQUEST_TIMEOUT = 15000; // 15 seconds timeout
  private MAX_COMPETITORS = 5;
  
  /**
   * Find and analyze competitors for a given URL and keyword, in a specific location
   */
  async analyzeCompetitors(url: string, primaryKeyword: string, location: string = 'United States'): Promise<CompetitorAnalysisResult> {
    try {
      // Get potential competitors based on keyword similarity and location
      const potentialCompetitors = await this.findPotentialCompetitors(primaryKeyword, location);
      
      // Filter out the original URL from the competitor list
      const competitorsToAnalyze = potentialCompetitors.filter(c => 
        this.normalizeUrl(c) !== this.normalizeUrl(url)
      ).slice(0, this.MAX_COMPETITORS);
      
      // Analyze each competitor
      const competitorPromises = competitorsToAnalyze.map(competitorUrl => 
        this.analyzeCompetitorSite(competitorUrl, primaryKeyword)
      );
      
      const competitors = await Promise.all(competitorPromises);
      const validCompetitors = competitors.filter(Boolean) as Competitor[];
      
      // Calculate average metrics
      const comparisonMetrics = this.calculateComparisonMetrics(validCompetitors);
      
      return {
        keyword: primaryKeyword,
        location: location,
        competitors: validCompetitors,
        comparisonMetrics
      };
    } catch (error) {
      console.error('Error analyzing competitors:', error);
      return {
        keyword: primaryKeyword,
        location: location,
        competitors: [],
        comparisonMetrics: {
          avgKeywordDensity: 0,
          avgContentLength: 0,
          avgH1Count: 0,
          avgH2Count: 0,
          avgImagesWithAlt: 0,
          topKeywords: []
        }
      };
    }
  }
  
  /**
   * Find potential competitors for a given keyword
   */
  private async findPotentialCompetitors(keyword: string): Promise<string[]> {
    try {
      // Approach 1: Try to find related sites using a search engine
      const competitors = await this.findCompetitorsViaBingSearch(keyword);
      if (competitors.length > 0) {
        return competitors;
      }
      
      // Approach 2: If search approach fails, generate a list of common domains
      // that might be competitors in various industries
      return this.getCommonCompetitorDomains(keyword);
    } catch (error) {
      console.error('Error finding potential competitors:', error);
      return this.getCommonCompetitorDomains(keyword);
    }
  }
  
  /**
   * Find competitors via Bing search (which has more lenient robots.txt rules)
   */
  private async findCompetitorsViaBingSearch(keyword: string): Promise<string[]> {
    try {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(keyword)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: this.REQUEST_TIMEOUT
      });
      
      const $ = cheerio.load(response.data);
      const urls: string[] = [];
      
      // Extract URLs from search results
      $('a[href^="http"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && 
            !href.includes('bing.com') && 
            !href.includes('microsoft.com') &&
            !href.includes('live.com') &&
            !href.includes('google.com') &&
            !urls.includes(href)) {
          urls.push(href);
        }
      });
      
      return urls.slice(0, this.MAX_COMPETITORS * 2); // Get more than needed in case some fail
    } catch (error) {
      console.error('Error in Bing search for competitors:', error);
      return [];
    }
  }
  
  /**
   * Get a list of common competitor domains as fallback
   */
  private getCommonCompetitorDomains(keyword: string): string[] {
    // Determine industry based on keyword to provide relevant competitors
    const lowercaseKeyword = keyword.toLowerCase();
    
    // E-commerce domains
    if (this.containsAny(lowercaseKeyword, ['shop', 'product', 'buy', 'store', 'retail', 'price'])) {
      return [
        'https://www.amazon.com',
        'https://www.ebay.com',
        'https://www.etsy.com',
        'https://www.walmart.com',
        'https://www.shopify.com',
        'https://www.target.com'
      ];
    }
    
    // Tech domains
    if (this.containsAny(lowercaseKeyword, ['tech', 'software', 'app', 'digital', 'code', 'program'])) {
      return [
        'https://www.techcrunch.com',
        'https://www.wired.com',
        'https://www.theverge.com',
        'https://www.cnet.com',
        'https://www.github.com',
        'https://www.stackoverflow.com'
      ];
    }
    
    // News/Media domains
    if (this.containsAny(lowercaseKeyword, ['news', 'article', 'blog', 'media', 'story', 'report'])) {
      return [
        'https://www.cnn.com',
        'https://www.bbc.com',
        'https://www.nytimes.com',
        'https://www.reuters.com',
        'https://www.washingtonpost.com',
        'https://www.medium.com'
      ];
    }
    
    // Travel domains
    if (this.containsAny(lowercaseKeyword, ['travel', 'vacation', 'hotel', 'flight', 'booking', 'tourism'])) {
      return [
        'https://www.expedia.com',
        'https://www.booking.com',
        'https://www.tripadvisor.com',
        'https://www.airbnb.com',
        'https://www.kayak.com',
        'https://www.hotels.com'
      ];
    }
    
    // Health domains
    if (this.containsAny(lowercaseKeyword, ['health', 'medical', 'doctor', 'wellness', 'fitness', 'diet'])) {
      return [
        'https://www.webmd.com',
        'https://www.mayoclinic.org',
        'https://www.healthline.com',
        'https://www.cdc.gov',
        'https://www.medicalnewstoday.com',
        'https://www.nih.gov'
      ];
    }
    
    // Default: general high-traffic sites
    return [
      'https://www.wikipedia.org',
      'https://www.reddit.com',
      'https://www.linkedin.com',
      'https://www.forbes.com',
      'https://www.entrepreneur.com',
      'https://www.businessinsider.com'
    ];
  }
  
  /**
   * Check if a string contains any of the words in an array
   */
  private containsAny(str: string, words: string[]): boolean {
    return words.some(word => str.includes(word));
  }
  
  /**
   * Analyze a competitor's website
   */
  private async analyzeCompetitorSite(url: string, primaryKeyword: string): Promise<Competitor | null> {
    try {
      const startTime = Date.now();
      
      // Crawl the competitor site
      const pageData = await crawler.crawlPage(url);
      
      // Calculate load time
      const loadTime = Date.now() - startTime;
      
      // Extract key information
      const $ = cheerio.load(pageData.html);
      const title = pageData.metaTags.title || $('title').text() || '';
      const description = pageData.metaTags.description || $('meta[name="description"]').attr('content') || '';
      
      // Count headings
      const h1Count = $('h1').length;
      const h2Count = $('h2').length;
      const h3Count = $('h3').length;
      
      // Count links
      const internalLinks = pageData.links.filter(link => link.isInternal);
      const externalLinks = pageData.links.filter(link => !link.isInternal);
      
      // Image analysis
      const images = pageData.images || [];
      const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
      
      // Content length
      const contentLength = pageData.content.text.length;
      
      // Keyword analysis
      const keywordAnalysisResult = await keywordAnalyzer.analyze(pageData, primaryKeyword);
      const keywordDensity = keywordAnalysisResult.primaryKeywordDensity || 0;
      
      // Identify strengths and weaknesses
      const strengths = this.identifyStrengths({
        h1Count,
        h2Count,
        contentLength,
        imagesWithAlt,
        imageCount: images.length,
        keywordDensity,
        title,
        description,
        primaryKeyword
      });
      
      const weaknesses = this.identifyWeaknesses({
        h1Count,
        h2Count,
        contentLength,
        imagesWithAlt,
        imageCount: images.length,
        keywordDensity,
        title,
        description,
        primaryKeyword
      });
      
      return {
        url,
        title,
        description,
        keywordDensity,
        contentLength,
        h1Count,
        h2Count,
        h3Count,
        internalLinksCount: internalLinks.length,
        externalLinksCount: externalLinks.length,
        imageCount: images.length,
        imagesWithAlt,
        loadTime,
        pageSize: pageData.html.length,
        strengths,
        weaknesses
      };
    } catch (error) {
      console.error(`Error analyzing competitor site ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Identify strengths of a competitor
   */
  private identifyStrengths(data: any): string[] {
    const strengths: string[] = [];
    
    // Check title and description
    if (data.title.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      strengths.push('Keyword in page title');
    }
    
    if (data.description.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      strengths.push('Keyword in meta description');
    }
    
    // Check content length
    if (data.contentLength > 1500) {
      strengths.push('Long-form content (1500+ characters)');
    }
    
    // Check heading structure
    if (data.h1Count === 1) {
      strengths.push('Proper H1 usage (exactly one H1)');
    }
    
    if (data.h2Count >= 2) {
      strengths.push('Good heading structure with multiple H2s');
    }
    
    // Check keyword density
    if (data.keywordDensity >= 0.5 && data.keywordDensity <= 2.5) {
      strengths.push('Optimal keyword density');
    }
    
    // Check images
    if (data.imageCount > 0 && data.imagesWithAlt / data.imageCount > 0.8) {
      strengths.push('Most images have descriptive alt text');
    }
    
    return strengths;
  }
  
  /**
   * Identify weaknesses of a competitor
   */
  private identifyWeaknesses(data: any): string[] {
    const weaknesses: string[] = [];
    
    // Check title and description
    if (!data.title.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      weaknesses.push('Keyword missing in page title');
    }
    
    if (!data.description.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      weaknesses.push('Keyword missing in meta description');
    }
    
    // Check content length
    if (data.contentLength < 500) {
      weaknesses.push('Thin content (less than 500 characters)');
    }
    
    // Check heading structure
    if (data.h1Count === 0) {
      weaknesses.push('Missing H1 heading');
    } else if (data.h1Count > 1) {
      weaknesses.push('Multiple H1 headings (should have exactly one)');
    }
    
    if (data.h2Count === 0) {
      weaknesses.push('No H2 headings for content structure');
    }
    
    // Check keyword density
    if (data.keywordDensity < 0.3) {
      weaknesses.push('Low keyword density');
    } else if (data.keywordDensity > 3) {
      weaknesses.push('Potential keyword stuffing');
    }
    
    // Check images
    if (data.imageCount > 0 && data.imagesWithAlt / data.imageCount < 0.5) {
      weaknesses.push('Many images missing alt text');
    }
    
    return weaknesses;
  }
  
  /**
   * Calculate comparison metrics from competitors
   */
  private calculateComparisonMetrics(competitors: Competitor[]): any {
    if (competitors.length === 0) {
      return {
        avgKeywordDensity: 0,
        avgContentLength: 0,
        avgH1Count: 0,
        avgH2Count: 0,
        avgImagesWithAlt: 0,
        topKeywords: []
      };
    }
    
    // Calculate averages
    const avgKeywordDensity = competitors.reduce((sum, comp) => sum + comp.keywordDensity, 0) / competitors.length;
    const avgContentLength = Math.floor(competitors.reduce((sum, comp) => sum + comp.contentLength, 0) / competitors.length);
    const avgH1Count = competitors.reduce((sum, comp) => sum + comp.h1Count, 0) / competitors.length;
    const avgH2Count = competitors.reduce((sum, comp) => sum + comp.h2Count, 0) / competitors.length;
    
    const avgImagesWithAlt = competitors.reduce((sum, comp) => {
      if (comp.imageCount === 0) return sum;
      return sum + (comp.imagesWithAlt / comp.imageCount);
    }, 0) / competitors.length;
    
    // Get common strengths as "top keywords"
    const allStrengths = competitors.flatMap(comp => comp.strengths);
    const strengthCounts: Record<string, number> = {};
    
    allStrengths.forEach(strength => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });
    
    const topKeywords = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
    
    return {
      avgKeywordDensity,
      avgContentLength,
      avgH1Count,
      avgH2Count,
      avgImagesWithAlt,
      topKeywords
    };
  }
  
  /**
   * Normalize a URL by removing protocol, www, and trailing slash
   */
  private normalizeUrl(url: string): string {
    try {
      // Remove protocol
      let normalized = url.replace(/^(https?:\/\/)/, '');
      // Remove www.
      normalized = normalized.replace(/^www\./, '');
      // Remove trailing slash
      normalized = normalized.replace(/\/$/, '');
      return normalized.toLowerCase();
    } catch (error) {
      return url.toLowerCase();
    }
  }
}

export const competitorAnalyzer = new CompetitorAnalyzer();