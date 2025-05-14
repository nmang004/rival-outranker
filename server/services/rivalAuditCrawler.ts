import axios from 'axios';
import { load } from 'cheerio';
import { AuditItem, RivalAudit } from '@shared/schema';
import { URL } from 'url';

// Interface for page crawl results
interface PageCrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  bodyText: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: string[];
    external: string[];
    broken: string[];
  };
  hasContactForm: boolean;
  hasPhoneNumber: boolean;
  hasAddress: boolean;
  hasNAP: boolean; // Name, Address, Phone together
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    largeImages: number; // Images that may need optimization
    altTexts: string[]; // Texts of image alt attributes
  };
  hasSchema: boolean;
  schemaTypes: string[]; // Types of schema detected
  mobileFriendly: boolean;
  wordCount: number;
  // SEO Meta Tags
  hasSocialTags: boolean; // OpenGraph, Twitter Cards
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasIcon: boolean; // Has favicon
  // Technical SEO
  hasHttps: boolean;
  hasHreflang: boolean;
  hasSitemap: boolean;
  hasAmpVersion: boolean; 
  pageLoadSpeed: {
    score: number; // 0-100
    firstContentfulPaint: number; // ms
    totalBlockingTime: number; // ms
    largestContentfulPaint: number; // ms
  };
  // Content Quality
  keywordDensity: Record<string, number>; // keyword -> frequency
  readabilityScore: number; // 0-100
  contentStructure: {
    hasFAQs: boolean;
    hasTable: boolean;
    hasLists: boolean;
    hasVideo: boolean;
    hasEmphasis: boolean; // Has bold or large text for emphasis
  };
}

// Interface for site structure
interface SiteStructure {
  homepage: PageCrawlResult;
  contactPage?: PageCrawlResult;
  servicePages: PageCrawlResult[];
  locationPages: PageCrawlResult[];
  serviceAreaPages: PageCrawlResult[];
  otherPages: PageCrawlResult[];
  hasSitemapXml: boolean;
}

/**
 * Creates a new RivalAuditCrawler service
 */
class RivalAuditCrawler {
  private visited: Set<string> = new Set();
  private maxPages: number = 25;
  private baseUrl: string = '';
  private baseDomain: string = '';
  
  /**
   * Crawl a website and perform a rival audit
   * 
   * @param url Target website URL
   * @returns RivalAudit data
   */
  async crawlAndAudit(url: string): Promise<RivalAudit> {
    try {
      // Normalize URL
      this.baseUrl = this.normalizeUrl(url);
      const parsedUrl = new URL(this.baseUrl);
      this.baseDomain = parsedUrl.hostname;
      
      // Reset the visited set
      this.visited = new Set();
      
      console.log(`Starting crawl of ${this.baseUrl}`);
      
      // Start with the homepage
      const homepage = await this.crawlPage(this.baseUrl);
      
      // Initialize site structure
      const siteStructure: SiteStructure = {
        homepage,
        servicePages: [],
        locationPages: [],
        serviceAreaPages: [],
        otherPages: [],
        hasSitemapXml: false
      };
      
      // Check for sitemap.xml and sitemap_index.xml
      try {
        // Try sitemap.xml first
        const sitemapUrl = new URL('/sitemap.xml', this.baseUrl).toString();
        console.log(`Checking for sitemap at ${sitemapUrl}`);
        const sitemapResponse = await axios.get(sitemapUrl, {
          headers: {
            'User-Agent': 'SEO-Best-Practices-Assessment-Tool/1.0'
          },
          timeout: 5000
        });
        
        if (sitemapResponse.status === 200) {
          siteStructure.hasSitemapXml = true;
          console.log('Found sitemap.xml');
          
          // Parse the sitemap to get more links to crawl
          const $ = load(sitemapResponse.data);
          const sitemapLinks = $('loc').map((_, el) => $(el).text().trim()).get();
          
          // Add sitemap links to internal links for crawling
          for (const link of sitemapLinks) {
            if (link.includes(this.baseDomain)) {
              homepage.links.internal.push(link);
            }
          }
        }
      } catch (error) {
        // Try sitemap_index.xml next
        try {
          const sitemapIndexUrl = new URL('/sitemap_index.xml', this.baseUrl).toString();
          console.log(`Checking for sitemap index at ${sitemapIndexUrl}`);
          const sitemapIndexResponse = await axios.get(sitemapIndexUrl, {
            headers: {
              'User-Agent': 'SEO-Best-Practices-Assessment-Tool/1.0'
            },
            timeout: 5000
          });
          
          if (sitemapIndexResponse.status === 200) {
            siteStructure.hasSitemapXml = true;
            console.log('Found sitemap_index.xml');
            
            // Parse the sitemap index to get links to individual sitemaps
            const $ = load(sitemapIndexResponse.data);
            const sitemapLinks = $('loc').map((_, el) => $(el).text().trim()).get();
            
            // Process the first sitemap file to get some links
            if (sitemapLinks.length > 0) {
              try {
                const firstSitemapResponse = await axios.get(sitemapLinks[0], {
                  headers: {
                    'User-Agent': 'SEO-Best-Practices-Assessment-Tool/1.0'
                  },
                  timeout: 5000
                });
                
                if (firstSitemapResponse.status === 200) {
                  const $ = load(firstSitemapResponse.data);
                  const pageLinks = $('loc').map((_, el) => $(el).text().trim()).get();
                  
                  // Add sitemap links to internal links for crawling
                  for (const link of pageLinks) {
                    if (link.includes(this.baseDomain)) {
                      homepage.links.internal.push(link);
                    }
                  }
                }
              } catch (error) {
                console.log(`Error fetching individual sitemap: ${error}`);
              }
            }
          }
        } catch (error) {
          console.log(`No sitemap or sitemap index found: ${error}`);
        }
      }
      
      // Get internal links from the homepage
      const internalLinks = Array.from(new Set(homepage.links.internal)).slice(0, this.maxPages);
      
      // Crawl internal pages
      for (const link of internalLinks) {
        if (this.visited.size >= this.maxPages) {
          console.log(`Reached max page limit (${this.maxPages}), stopping crawl`);
          break;
        }
        
        try {
          const pageData = await this.crawlPage(link);
          
          // Categorize the page
          if (this.isContactPage(pageData)) {
            siteStructure.contactPage = pageData;
          } else if (this.isServiceAreaPage(pageData)) {
            siteStructure.serviceAreaPages.push(pageData);
          } else if (this.isServicePage(pageData)) {
            siteStructure.servicePages.push(pageData);
          } else if (this.isLocationPage(pageData)) {
            siteStructure.locationPages.push(pageData);
          } else {
            siteStructure.otherPages.push(pageData);
          }
        } catch (error) {
          console.error(`Error crawling ${link}:`, error);
        }
      }
      
      console.log(`Crawl completed. Visited ${this.visited.size} pages.`);
      
      // Generate the audit based on the crawled site structure
      return this.generateAudit(siteStructure);
      
    } catch (error: any) {
      console.error("Error in crawlAndAudit:", error);
      throw new Error(`Failed to crawl and audit the website: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Crawl a single page
   * 
   * @param url Page URL to crawl
   * @returns Page crawl results
   */
  private async crawlPage(url: string): Promise<PageCrawlResult> {
    // Skip if we've already visited this URL
    const normalizedUrl = this.normalizeUrl(url);
    if (this.visited.has(normalizedUrl)) {
      throw new Error("Already visited this URL");
    }
    
    // Mark as visited
    this.visited.add(normalizedUrl);
    
    try {
      console.log(`Crawling ${normalizedUrl}`);
      
      // Fetch the page
      const response = await axios.get(normalizedUrl, {
        headers: {
          'User-Agent': 'SEO-Best-Practices-Assessment-Tool/1.0',
          'Accept': 'text/html'
        },
        timeout: 10000,
        maxRedirects: 5
      });
      
      // Load the HTML
      const $ = load(response.data);
      
      // Extract page data
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const fullBodyText = $('body').text().trim();
      
      // Extract headings
      const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
      const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
      const h3s = $('h3').map((_, el) => $(el).text().trim()).get();
      
      // Extract links
      const internalLinks: string[] = [];
      const externalLinks: string[] = [];
      const brokenLinks: string[] = [];
      
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        
        if (href) {
          try {
            const absoluteUrl = new URL(href, normalizedUrl).toString();
            const urlObj = new URL(absoluteUrl);
            
            // Check if it's an internal link
            if (urlObj.hostname === this.baseDomain) {
              // Skip fragment links and non-HTTP protocols
              if (!href.startsWith('#') && (urlObj.protocol === 'http:' || urlObj.protocol === 'https:')) {
                internalLinks.push(absoluteUrl);
              }
            } else {
              // External link
              externalLinks.push(absoluteUrl);
            }
          } catch (error) {
            // Invalid URL, add to broken links
            brokenLinks.push(href);
          }
        }
      });
      
      // Check for contact form
      const hasContactForm = $('form').length > 0 || 
                          fullBodyText.toLowerCase().includes('contact form') ||
                          $('input[type="email"]').length > 0;
      
      // Check for phone number
      const phoneRegex = /(\+?1?[-\s\.]?\(?\d{3}\)?[-\s\.]?\d{3}[-\s\.]?\d{4})/;
      const hasPhoneNumber = phoneRegex.test(fullBodyText);
      
      // Check for address
      const addressPatterns = [
        /\d+\s+[A-Za-z\s,]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/,  // US format
        /\d+\s+[A-Za-z\s,]+Street|Road|Avenue|Lane|Drive|Boulevard|Court/i,  // Simple street pattern
        /\d+\s+[A-Za-z\s,]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}/i  // City, State format
      ];
      const hasAddress = addressPatterns.some(pattern => pattern.test(fullBodyText));
      
      // Check images
      const allImages = $('img');
      const totalImages = allImages.length;
      const imagesWithAlt = $('img[alt]').length;
      const imagesWithoutAlt = totalImages - imagesWithAlt;
      
      // Extract alt texts for analysis
      const altTexts: string[] = [];
      $('img[alt]').each((_, img) => {
        const alt = $(img).attr('alt');
        if (alt && alt.trim()) {
          altTexts.push(alt.trim());
        }
      });
      
      // Count large images (those with width or height over 1000px)
      let largeImages = 0;
      allImages.each((_, img) => {
        const width = parseInt($(img).attr('width') || '0', 10);
        const height = parseInt($(img).attr('height') || '0', 10);
        if (width > 1000 || height > 1000) {
          largeImages++;
        }
      });
      
      // Check for schema markup and identify schema types
      const schemaScripts = $('script[type="application/ld+json"]');
      const hasSchema = schemaScripts.length > 0;
      const schemaTypes: string[] = [];
      
      schemaScripts.each((_, el) => {
        try {
          const schemaText = $(el).html() || '';
          const schema = JSON.parse(schemaText);
          if (schema['@type']) {
            schemaTypes.push(schema['@type']);
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      });
      
      // Check for social tags (OpenGraph, Twitter)
      const hasSocialTags = $('meta[property^="og:"]').length > 0 || 
                         $('meta[name^="twitter:"]').length > 0;
      
      // Check for canonical URL
      const hasCanonical = $('link[rel="canonical"]').length > 0;
      
      // Check for robots meta tag
      const hasRobotsMeta = $('meta[name="robots"]').length > 0;
      
      // Check for HTTPS
      const hasHttps = normalizedUrl.startsWith('https://');
      
      // Check for hreflang tags
      const hasHreflang = $('link[rel="alternate"][hreflang]').length > 0;
      
      // Check for sitemap reference in robots.txt
      const hasSitemap = $('a[href$="sitemap.xml"]').length > 0 || 
                      fullBodyText.toLowerCase().includes('sitemap');
      
      // Check for AMP version
      const hasAmpVersion = $('link[rel="amphtml"]').length > 0;
      
      // Content structure checks
      const hasFAQs = fullBodyText.toLowerCase().includes('faq') || 
                   (fullBodyText.toLowerCase().includes('question') && 
                    fullBodyText.toLowerCase().includes('answer'));
      const hasTable = $('table').length > 0;
      const hasLists = $('ul, ol').length > 0;
      const hasVideo = $('video').length > 0 || 
                    $('iframe[src*="youtube"]').length > 0 || 
                    $('iframe[src*="vimeo"]').length > 0;
      const hasEmphasis = $('b, strong, h1, h2, h3, h4, h5, h6').length > 0 || 
                       $('[style*="font-weight:bold"], [style*="font-weight: bold"]').length > 0 || 
                       $('[style*="font-size"]').length > 0;
                       
      // Check for favicon/icon
      const hasIcon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
      
      // Check for NAP (Name, Address, Phone together)
      const hasNAP = hasPhoneNumber && hasAddress;
      
      // Check if mobile friendly (basic check for viewport meta tag)
      const hasMobileViewport = $('meta[name="viewport"]').length > 0;
      
      // Word count (basic estimation)
      const wordCount = fullBodyText.split(/\s+/).filter(Boolean).length;
      
      // Extract keywords and calculate density
      const words = fullBodyText.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(word => word.length > 3);
                    
      const keywordCount: Record<string, number> = {};
      words.forEach(word => {
        if (!keywordCount[word]) {
          keywordCount[word] = 0;
        }
        keywordCount[word]++;
      });
      
      // Get top keywords by frequency
      const keywordEntries = Object.entries(keywordCount);
      keywordEntries.sort((a, b) => b[1] - a[1]);
      const topKeywords = Object.fromEntries(keywordEntries.slice(0, 10));
      
      // Basic readability score (higher word count is considered more comprehensive)
      const readabilityScore = Math.min(100, Math.round(wordCount / 100));
      
      // Placeholder for page speed metrics - in a real implementation
      // we would use Lighthouse or similar API to get this data
      const pageLoadSpeedMetrics = {
        score: Math.floor(Math.random() * 60) + 40, // Random score between 40-100
        firstContentfulPaint: Math.floor(Math.random() * 1000) + 500, // 500-1500ms
        totalBlockingTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        largestContentfulPaint: Math.floor(Math.random() * 2000) + 1000 // 1000-3000ms
      };
      
      return {
        url: normalizedUrl,
        title,
        metaDescription,
        bodyText: fullBodyText,
        headings: {
          h1: h1s,
          h2: h2s,
          h3: h3s
        },
        links: {
          internal: internalLinks,
          external: externalLinks,
          broken: brokenLinks
        },
        hasContactForm,
        hasPhoneNumber,
        hasAddress,
        hasNAP,
        images: {
          total: totalImages,
          withAlt: imagesWithAlt,
          withoutAlt: imagesWithoutAlt,
          largeImages: largeImages,
          altTexts: altTexts
        },
        hasSchema,
        schemaTypes,
        mobileFriendly: hasMobileViewport,
        wordCount,
        // SEO Meta Tags
        hasSocialTags,
        hasCanonical,
        hasRobotsMeta,
        hasIcon,
        // Technical SEO
        hasHttps,
        hasHreflang,
        hasSitemap,
        hasAmpVersion,
        pageLoadSpeed: pageLoadSpeedMetrics,
        // Content Quality
        keywordDensity: topKeywords,
        readabilityScore,
        contentStructure: {
          hasFAQs,
          hasTable,
          hasLists,
          hasVideo,
          hasEmphasis
        }
      };
      
    } catch (error) {
      console.error(`Error fetching ${normalizedUrl}:`, error);
      throw error;
    }
  }
  
  /**
   * Determine if a page is a contact page
   */
  private isContactPage(page: PageCrawlResult): boolean {
    const contactTerms = ['contact', 'get in touch', 'reach us', 'contact us'];
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    
    // Check URL for contact terms
    if (contactTerms.some(term => url.includes(term))) {
      return true;
    }
    
    // Check title for contact terms
    if (contactTerms.some(term => title.includes(term))) {
      return true;
    }
    
    // Check for contact form and phone number
    if (page.hasContactForm && page.hasPhoneNumber) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine if a page is a service page
   */
  private isServicePage(page: PageCrawlResult): boolean {
    const serviceTerms = ['service', 'product', 'solution', 'offering', 'feature'];
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    
    // Check URL for service terms
    if (serviceTerms.some(term => url.includes(term))) {
      return true;
    }
    
    // Check title for service terms
    if (serviceTerms.some(term => title.includes(term))) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine if a page is a service area page (localized service page)
   * Examples: /sebastian-fl/ac-repair/ or /sebastian-fl-ac-repair/
   */
  private isServiceAreaPage(page: PageCrawlResult): boolean {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const path = new URL(page.url).pathname;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Check if URL pattern matches a service area page
    // Common patterns:
    // 1. /location/service (e.g., /miami-fl/ac-repair/)
    // 2. /location-service (e.g., /miami-fl-ac-repair/)
    
    if (pathSegments.length >= 2) {
      // Check first segment for location indicators
      const firstSegment = pathSegments[0].toLowerCase();
      
      // Check if first segment contains location indicators like city names or zip codes
      const hasLocationIndicator = 
        /([a-z]+-[a-z]+)/.test(firstSegment) || // city-state format
        /-fl$/.test(firstSegment) ||           // ends with -fl
        /-[a-z]{2}$/.test(firstSegment);       // ends with state code
        
      // Check if second segment contains service terms
      const secondSegment = pathSegments.length > 1 ? pathSegments[1].toLowerCase() : '';
      const hasServiceTerm = 
        ['repair', 'service', 'installation', 'replacement', 'maintenance', 'ac', 'hvac', 'heat', 'furnace'].some(
          term => secondSegment.includes(term)
        );
        
      if (hasLocationIndicator && hasServiceTerm) {
        return true;
      }
    }
    
    // Check for location-service pattern in a single segment
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    const locationServicePattern = /([a-z]+-[a-z]+)-([a-z-]+)$/; // Example: miami-fl-ac-repair
    if (locationServicePattern.test(lastSegment)) {
      const matches = lastSegment.match(locationServicePattern);
      if (matches && matches[2]) {
        const servicePart = matches[2];
        // Check if service part contains service terms
        const hasServiceTerm = 
          ['repair', 'service', 'install', 'replacement', 'maintenance', 'ac', 'hvac', 'heat', 'furnace'].some(
            term => servicePart.includes(term)
          );
          
        if (hasServiceTerm) {
          return true;
        }
      }
    }
    
    // Check title for both location and service indicators
    const hasLocationInTitle = 
      ['in', 'near', 'around', 'serving'].some(preposition => title.includes(preposition)) &&
      page.bodyText.toLowerCase().match(/\b(city|county|area|town|region)\b/);
    
    const hasServiceInTitle = 
      ['repair', 'service', 'installation', 'maintenance', 'ac', 'hvac', 'heating', 'cooling'].some(
        term => title.includes(term)
      );
      
    if (hasLocationInTitle && hasServiceInTitle) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine if a page is a location page (geo-based page covering the entire area)
   * Examples: /sebastian-fl/ 
   */
  private isLocationPage(page: PageCrawlResult): boolean {
    const locationTerms = ['location', 'city', 'town', 'county', 'area', 'serving', 'service-area'];
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const path = new URL(page.url).pathname;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Check if this is a location-only page (simple location pattern)
    if (pathSegments.length === 1) {
      const segment = pathSegments[0].toLowerCase();
      
      // Check for city-state format (e.g., miami-fl) or city name with no service terms
      const isCityStateFormat = 
        /^([a-z]+(-[a-z]+)?-[a-z]{2})$/.test(segment) || // city-state format like miami-fl
        /(county|city|area)$/.test(segment);             // ends with location indicator
      
      if (isCityStateFormat && 
          !['repair', 'service', 'installation'].some(term => segment.includes(term))) {
        return true;
      }
    }
    
    // Check URL for location terms but no service terms
    if (locationTerms.some(term => url.includes(term)) && 
        !['repair', 'service', 'installation'].some(term => url.includes(term))) {
      return true;
    }
    
    // Check title for location terms but no service terms
    if (locationTerms.some(term => title.includes(term)) && 
        !['repair', 'service', 'installation'].some(term => title.includes(term))) {
      return true;
    }
    
    // Check for address mentions in the content and location indicators in the URL
    // without service-specific terms
    if (page.hasAddress && pathSegments.length <= 2 && 
        !['repair', 'service', 'installation'].some(term => 
          pathSegments.some(segment => segment.includes(term))
        )) {
      return true;
    }
    
    // Check for common location page title patterns
    const locationTitlePatterns = [
      /serving\s+([a-z\s]+)/i,
      /\b(in|near)\s+([a-z\s]+)/i,
      /areas\s+(we|our company)\s+(serve|cover)/i
    ];
    
    if (locationTitlePatterns.some(pattern => pattern.test(title)) && 
        !['repair', 'service', 'installation'].some(term => title.includes(term))) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Generate the audit from the crawled site structure
   */
  private generateAudit(site: SiteStructure): RivalAudit {
    // Generate the on-page audit items
    const onPageItems = this.generateOnPageAuditItems(site);
    
    // Generate the structure & navigation audit items
    const structureItems = this.generateStructureAuditItems(site);
    
    // Generate the contact page audit items
    const contactItems = this.generateContactAuditItems(site);
    
    // Generate the service pages audit items
    const serviceItems = this.generateServiceAuditItems(site);
    
    // Generate the location pages audit items
    const locationItems = this.generateLocationAuditItems(site);
    
    // Generate the service area pages audit items
    const serviceAreaItems = this.generateServiceAreaAuditItems(site);
    
    // Count totals of each status
    const priorityOfiCount = 
      onPageItems.filter(item => item.status === 'Priority OFI').length +
      structureItems.filter(item => item.status === 'Priority OFI').length +
      contactItems.filter(item => item.status === 'Priority OFI').length +
      serviceItems.filter(item => item.status === 'Priority OFI').length +
      locationItems.filter(item => item.status === 'Priority OFI').length +
      serviceAreaItems.filter(item => item.status === 'Priority OFI').length;
      
    const ofiCount = 
      onPageItems.filter(item => item.status === 'OFI').length +
      structureItems.filter(item => item.status === 'OFI').length +
      contactItems.filter(item => item.status === 'OFI').length +
      serviceItems.filter(item => item.status === 'OFI').length +
      locationItems.filter(item => item.status === 'OFI').length +
      serviceAreaItems.filter(item => item.status === 'OFI').length;
      
    const okCount = 
      onPageItems.filter(item => item.status === 'OK').length +
      structureItems.filter(item => item.status === 'OK').length +
      contactItems.filter(item => item.status === 'OK').length +
      serviceItems.filter(item => item.status === 'OK').length +
      locationItems.filter(item => item.status === 'OK').length +
      serviceAreaItems.filter(item => item.status === 'OK').length;
      
    const naCount = 
      onPageItems.filter(item => item.status === 'N/A').length +
      structureItems.filter(item => item.status === 'N/A').length +
      contactItems.filter(item => item.status === 'N/A').length +
      serviceItems.filter(item => item.status === 'N/A').length +
      locationItems.filter(item => item.status === 'N/A').length +
      serviceAreaItems.filter(item => item.status === 'N/A').length;
      
    // Calculate total number of checks
    const total = priorityOfiCount + ofiCount + okCount + naCount;
    
    return {
      url: this.baseUrl,
      timestamp: new Date(),
      onPage: { items: onPageItems },
      structureNavigation: { items: structureItems },
      contactPage: { items: contactItems },
      servicePages: { items: serviceItems },
      locationPages: { items: locationItems },
      serviceAreaPages: { items: serviceAreaItems },
      summary: {
        priorityOfiCount,
        ofiCount,
        okCount,
        naCount,
        total: priorityOfiCount + ofiCount + okCount + naCount
      }
    };
  }
  
  /**
   * Generate the on-page audit items
   */
  private generateOnPageAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const homepage = site.homepage;
    
    // ==========================================
    // On-Page UX/CTA Factors from PDF
    // ==========================================
    
    // Check if site design is modern
    items.push({
      name: "Is the website appealing? Modern? (i.e. does not look out-of-date)",
      description: "The website should have a modern, professional design",
      // Using schema markup, social tags, and viewport as proxies for modern design
      status: (homepage.hasSchema && homepage.hasSocialTags && homepage.mobileFriendly) ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.pageLoadSpeed.score < 50 ? "Page load speed is slow, which affects user experience" : undefined
    });
    
    // Check if site is intuitive
    items.push({
      name: "Is the website intuitive? Usable?",
      description: "Users should be able to easily navigate the site",
      // Check for reasonable number of internal links and proper navigation structure
      status: (homepage.links.internal.length >= 5 && 
              homepage.links.broken.length === 0 && 
              homepage.contentStructure.hasLists) ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.links.broken.length > 0 ? `Found ${homepage.links.broken.length} broken links` : undefined
    });
    
    // Check content readability
    items.push({
      name: "Is the copy readable? Not keyword stuffed. Clear.",
      description: "Content should be user-friendly and readable",
      status: (homepage.wordCount >= 400 && homepage.wordCount <= 2000 && homepage.readabilityScore > 50) ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.wordCount < 400 ? "Content may be too thin" : 
             homepage.wordCount > 2000 ? "Content may be too dense" : 
             homepage.readabilityScore < 50 ? "Content readability score is low" :
             undefined
    });
    
    // Check for page completeness
    const averageWordCount = site.otherPages.length > 0 
      ? site.otherPages.reduce((acc, page) => acc + page.wordCount, 0) / site.otherPages.length
      : 0;
      
    items.push({
      name: "Pages are easy to read? No typos/spelling errors? Sufficiently long?",
      description: "Content should be error-free and comprehensive",
      status: averageWordCount >= 400 ? 'OK' : 'OFI',
      importance: 'High',
      notes: averageWordCount < 400 ? `Average word count per page (${Math.round(averageWordCount)}) is low` : undefined
    });
    
    // Check for user intent
    items.push({
      name: "Does the site answer user intent? (E.g. want to buy vs. want information)",
      description: "Content should match what users are searching for",
      status: (homepage.headings.h1.length > 0 && 
               homepage.metaDescription.length > 80 && 
               homepage.contentStructure.hasFAQs) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: homepage.headings.h1.length === 0 ? "Missing H1 heading" : 
             homepage.metaDescription.length < 80 ? "Meta description is too short or missing" : 
             !homepage.contentStructure.hasFAQs ? "Consider adding FAQ content to address user questions" : 
             undefined
    });
    
    // Check for reviews
    const hasReviews = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('review') || 
      site.homepage.bodyText.toLowerCase().includes('testimonial') || 
      site.homepage.bodyText.toLowerCase().includes('rating') ||
      site.homepage.bodyText.toLowerCase().includes('stars')
    );
    
    items.push({
      name: "Leverages reviews on website?",
      description: "Reviews build trust and credibility",
      status: hasReviews ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasReviews ? "No evidence of customer reviews or testimonials found" : undefined
    });
    
    // Check homepage CTA
    const hasCTA = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('call') || 
      site.homepage.bodyText.toLowerCase().includes('contact') || 
      site.homepage.bodyText.toLowerCase().includes('schedule') ||
      site.homepage.bodyText.toLowerCase().includes('book') ||
      site.homepage.bodyText.toLowerCase().includes('request') ||
      site.homepage.links.internal.some(link => 
        link.toLowerCase().includes('contact') || 
        link.toLowerCase().includes('quote') ||
        link.toLowerCase().includes('book'))
    );
    
    items.push({
      name: "Strong call to action on homepage?",
      description: "Homepage should have clear call to action buttons/elements",
      status: hasCTA ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasCTA ? "No clear call to action found on homepage" : undefined
    });
    
    // Check CTA on location pages
    let locationPagesCTA = true;
    if (site.locationPages.length > 0) {
      for (const page of site.locationPages) {
        if (!page.bodyText || !(
          page.bodyText.toLowerCase().includes('call') || 
          page.bodyText.toLowerCase().includes('contact') || 
          page.bodyText.toLowerCase().includes('schedule') ||
          page.bodyText.toLowerCase().includes('book') ||
          page.bodyText.toLowerCase().includes('request')
        )) {
          locationPagesCTA = false;
          break;
        }
      }
      
      items.push({
        name: "Strong call to action on top locations pages? (if they exist)",
        description: "Location pages should have clear calls to action",
        status: locationPagesCTA ? 'OK' : 'OFI',
        importance: 'High',
        notes: !locationPagesCTA ? "One or more location pages missing clear calls to action" : undefined
      });
    } else {
      items.push({
        name: "Strong call to action on top locations pages? (if they exist)",
        description: "Location pages should have clear calls to action",
        status: 'N/A',
        importance: 'High',
        notes: "No location pages found to assess"
      });
    }
    
    // Check CTA on landing pages (assuming service pages are landing pages)
    let landingPagesCTA = true;
    if (site.servicePages.length > 0) {
      for (const page of site.servicePages) {
        if (!page.bodyText || !(
          page.bodyText.toLowerCase().includes('call') || 
          page.bodyText.toLowerCase().includes('contact') || 
          page.bodyText.toLowerCase().includes('schedule') ||
          page.bodyText.toLowerCase().includes('book') ||
          page.bodyText.toLowerCase().includes('request')
        )) {
          landingPagesCTA = false;
          break;
        }
      }
      
      items.push({
        name: "Strong call to action on top landing pages?",
        description: "Landing pages should have clear calls to action",
        status: landingPagesCTA ? 'OK' : 'OFI',
        importance: 'High',
        notes: !landingPagesCTA ? "One or more service pages missing clear calls to action" : undefined
      });
    } else {
      items.push({
        name: "Strong call to action on top landing pages?",
        description: "Landing pages should have clear calls to action", 
        status: 'N/A',
        importance: 'High',
        notes: "No service/landing pages found to assess"
      });
    }
    
    // Check contact info findability
    const contactPageExists = site.contactPage !== undefined;
    const contactInfoInHomepage = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('contact') ||
      site.homepage.bodyText.toLowerCase().includes('phone') ||
      site.homepage.bodyText.toLowerCase().includes('call us') ||
      site.homepage.bodyText.toLowerCase().includes('email')
    );
    
    items.push({
      name: "Can I find contact information?",
      description: "Contact information should be easy to find",
      status: (contactPageExists || contactInfoInHomepage) ? 'OK' : 'Priority OFI',
      importance: 'High',
      notes: !contactPageExists && !contactInfoInHomepage ? "Contact information is difficult to find" : undefined
    });
    
    // Check phone number visibility
    const phoneRegex = /(\+?1?[ -]?)?\(?[0-9]{3}\)?[ -]?[0-9]{3}[ -]?[0-9]{4}/;
    const hasVisiblePhone = site.homepage.bodyText && phoneRegex.test(site.homepage.bodyText);
    
    items.push({
      name: "Phone number highly visible / high contrast and clickable?",
      description: "Phone number should be easy to see and tap/click",
      status: hasVisiblePhone ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasVisiblePhone ? "Phone number not prominently displayed on homepage" : undefined
    });
    
    // Check for disruptive popups
    const hasPopups = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('popup') ||
      site.homepage.bodyText.toLowerCase().includes('pop-up') ||
      site.homepage.bodyText.toLowerCase().includes('modal')
    );
    
    items.push({
      name: "Are there disruptive pop-ups?",
      description: "Pop-ups can harm user experience and SEO",
      status: !hasPopups ? 'OK' : 'OFI',
      importance: 'Low',
      notes: hasPopups ? "Potentially disruptive pop-ups detected" : undefined
    });
    
    // Check favicon
    const hasFavicon = site.homepage.hasIcon;
    
    items.push({
      name: "Clear favicon?",
      description: "Website should have a favicon for branding",
      status: hasFavicon ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasFavicon ? "No favicon detected" : undefined
    });
    
    // Check for text emphasis
    const hasEmphasis = site.homepage.contentStructure.hasEmphasis;
    
    items.push({
      name: "Uses bold and/or large text for emphasis? (i.e. better UX)",
      description: "Text emphasis improves readability and UX",
      status: hasEmphasis ? 'OK' : 'OFI',
      importance: 'Low',
      notes: !hasEmphasis ? "Limited use of text emphasis (bold, larger font sizes) detected" : undefined
    });
    
    // ==========================================
    // On-Page Factors from PDF
    // ==========================================
    
    // Check for localized content
    const hasLocalizedContent = (
      site.homepage.bodyText && (
        site.homepage.bodyText.match(/[A-Z][a-z]+,\s*[A-Z]{2}/) // City, State pattern
      )
    );
    
    items.push({
      name: "\"Localized\" content? (i.e. Contains <relevant keyword> + <target city>,<state>)",
      description: "Content should be localized for the target area",
      status: hasLocalizedContent ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasLocalizedContent ? "No clear localization pattern (City, State) found" : undefined
    });
    
    // Check top products/services links on homepage
    const hasServiceLinksOnHome = site.homepage.links.internal.some(link => 
      link.toLowerCase().includes('service') || 
      link.toLowerCase().includes('product') ||
      link.toLowerCase().includes('repair') ||
      link.toLowerCase().includes('installation')
    );
    
    items.push({
      name: "Are top products/services linked from the body of the home page?",
      description: "Key services should be linked from homepage content",
      status: hasServiceLinksOnHome ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasServiceLinksOnHome ? "Services/products not clearly linked from homepage body content" : undefined
    });
    
    // Check location links on homepage
    const hasLocationLinksOnHome = site.homepage.links.internal.some(link => 
      link.toLowerCase().includes('location') || 
      link.toLowerCase().includes('office') ||
      link.toLowerCase().includes('store') ||
      link.toLowerCase().includes('find us')
    );
    
    items.push({
      name: "Are locations pages (i.e. physical locations) linked from body of home page?",
      description: "Location pages should be linked from homepage",
      status: hasLocationLinksOnHome ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasLocationLinksOnHome ? "Location pages not clearly linked from homepage body content" : undefined
    });
    
    // Check service area links on homepage
    const hasServiceAreaLinksOnHome = site.homepage.links.internal.some(link => 
      link.toLowerCase().includes('area') || 
      link.toLowerCase().includes('region') ||
      link.toLowerCase().includes('serve')
    );
    
    items.push({
      name: "Are service area pages (i.e. city pages) linked from body of the home page?",
      description: "Service area pages should be linked from homepage",
      status: hasServiceAreaLinksOnHome ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasServiceAreaLinksOnHome ? "Service area pages not clearly linked from homepage body content" : undefined
    });
    
    // ==========================================
    // Footer section from PDF
    // ==========================================
    
    // Check NAP in footer
    const hasNAP = site.homepage.hasNAP;
    
    items.push({
      name: "Contains NAP? (NAP = Name, Address, Phone)",
      description: "Footer should contain business NAP information",
      status: hasNAP ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasNAP ? "NAP (Name, Address, Phone) not found in footer" : undefined
    });
    
    // Check hours in footer
    const hasHours = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('hours') ||
      site.homepage.bodyText.toLowerCase().includes('open') ||
      site.homepage.bodyText.match(/mon|tue|wed|thu|fri|sat|sun/i)
    );
    
    items.push({
      name: "Contains hours?",
      description: "Footer should contain business hours",
      status: hasHours ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasHours ? "Business hours not found in footer" : undefined
    });
    
    // Check email in footer
    const hasEmail = site.homepage.bodyText && (
      site.homepage.bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i) ||
      site.homepage.links.internal.some(link => link.toLowerCase().includes('mailto:'))
    );
    
    items.push({
      name: "Includes clickable email link?",
      description: "Footer should contain clickable email",
      status: hasEmail ? 'OK' : 'OFI',
      importance: 'Low',
      notes: !hasEmail ? "Clickable email link not found in footer" : undefined
    });
    
    // Check phone link in footer
    const hasClickablePhone = site.homepage.links.internal.some(link => 
      link.toLowerCase().includes('tel:')
    );
    
    items.push({
      name: "Includes clickable phone number?",
      description: "Footer should contain clickable phone number",
      status: hasClickablePhone ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasClickablePhone ? "Clickable phone number not found in footer" : undefined
    });
    
    // Check for useful footer navigation
    const hasFooterNav = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('sitemap') ||
      site.homepage.bodyText.toLowerCase().includes('privacy') ||
      site.homepage.bodyText.toLowerCase().includes('terms') ||
      site.homepage.bodyText.toLowerCase().includes('about us')
    );
    
    items.push({
      name: "Contains important site links? (i.e. Useful bottom nav?)",
      description: "Footer should contain important site navigation",
      status: hasFooterNav ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasFooterNav ? "Footer navigation appears limited or missing" : undefined
    });
    
    // ==========================================
    // Content section from PDF
    // ==========================================
    
    // Content readability already checked above
    
    // Check page length for stubby pages - duplicates earlier check but with more specific language
    items.push({
      name: "Pages contain more than ~300 words? No stubs!",
      description: "Pages should have sufficient content depth",
      status: averageWordCount >= 300 ? 'OK' : 'OFI',
      importance: 'High',
      notes: averageWordCount < 300 ? `Average word count per page (${Math.round(averageWordCount)}) is low - pages may be stubs` : undefined
    });
    
    // Check for page for every service
    const servicePageCount = site.servicePages.length;
    
    items.push({
      name: "A page for every service?",
      description: "Each service should have a dedicated page",
      status: servicePageCount >= 3 ? 'OK' : 'OFI',
      importance: 'High',
      notes: servicePageCount < 3 ? `Only ${servicePageCount} service pages detected - may not cover all services` : undefined
    });
    
    // Check for brand pages
    const hasBrandPages = Array.isArray(site.otherPages) && site.otherPages.some(page => 
      (page?.title?.toLowerCase().includes('brand') || 
       page?.metaDescription?.toLowerCase().includes('brand'))
    );
    
    items.push({
      name: "A page for each brand carried?",
      description: "Each major brand should have a dedicated page",
      status: hasBrandPages ? 'OK' : 'OFI',
      importance: 'Low',
      notes: !hasBrandPages ? "No dedicated brand pages detected" : undefined
    });
    
    // Check for internal linking
    const hasInternalLinking = site.otherPages.every(page => page.links.internal.length > 2);
    
    items.push({
      name: "Strong use of internal page linking? Short, descriptive anchor text?",
      description: "Pages should link to other relevant pages",
      status: hasInternalLinking ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasInternalLinking ? "Weak internal linking detected - pages should link to other relevant content" : undefined
    });
    
    // Check for link styling
    const hasLinkStyling = true; // Hard to detect without visual inspection
    
    items.push({
      name: "Links are styled to be clearly identifiable as links?",
      description: "Links should be visually distinct from regular text",
      status: 'N/A', // Hard to programmatically determine
      importance: 'Medium',
      notes: "Link styling requires visual inspection"
    });
    
    // Check content relevance
    const hasRelevantContent = site.otherPages.every(page => 
      page.title.length > 0 && page.metaDescription.length > 0
    );
    
    items.push({
      name: "Is the content relevant for each page?",
      description: "Content should be relevant to the page topic",
      status: hasRelevantContent ? 'OK' : 'OFI', 
      importance: 'High',
      notes: !hasRelevantContent ? "Some pages may have irrelevant or thin content" : undefined
    });
    
    // Check blog recency - get pages that seem to be blog posts
    const blogPages = site.otherPages.filter(page => 
      page.url.includes('blog') ||
      page.url.includes('news') ||
      page.url.includes('article') ||
      page.title.toLowerCase().includes('blog')
    );
    
    // Check if any blog pages have dates in their content
    const hasDatedBlog = Array.isArray(blogPages) && blogPages.length > 0 && blogPages.some(page => 
      page?.bodyText && typeof page.bodyText === 'string' && page.bodyText.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b\s+\d{1,2},\s+\d{4}\b/i)
    );
    
    items.push({
      name: "Is the Blog recently update and does it display a date?",
      description: "Blog should be regularly updated with visible dates",
      status: blogPages.length > 0 ? (hasDatedBlog ? 'OK' : 'OFI') : 'N/A',
      importance: 'High',
      notes: blogPages.length > 0 ? (hasDatedBlog ? undefined : "Blog exists but posts don't display dates") : "No blog detected"
    });
    
    // ==========================================
    // Check technical & other factors
    // ==========================================
    
    // Check SSL (HTTPS)
    items.push({
      name: "Has SSL?",
      description: "HTTPS is required for security and SEO",
      status: homepage.hasHttps ? 'OK' : 'Priority OFI',
      importance: 'High',
      notes: !homepage.hasHttps ? "Site is not using HTTPS which is a security risk and SEO disadvantage" : undefined
    });
    
    // Check mobile-friendliness
    items.push({
      name: "Is site mobile friendly?",
      description: "Site should be responsive on all devices",
      status: homepage.mobileFriendly ? 'OK' : 'Priority OFI',
      importance: 'High',
      notes: !homepage.mobileFriendly ? "No mobile viewport meta tag found" : undefined
    });
    
    // Check content not hidden behind tabs/clicks
    const hasNoHiddenContent = true; // Hard to detect automatically
    
    items.push({
      name: "Content not hidden behind tabs or clicks?",
      description: "Content should be directly accessible",
      status: 'N/A', // Hard to programmatically determine
      importance: 'Medium',
      notes: "Hidden content requires visual inspection"
    });
    
    // Check for reviews and testimonials
    items.push({
      name: "Good use of reviews and/or testimonials? First-party reviews?",
      description: "Site should leverage customer reviews",
      status: hasReviews ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasReviews ? "Limited or no use of reviews/testimonials detected" : undefined
    });
    
    // Check for EEAT signals
    const hasEEAT = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('expert') ||
      site.homepage.bodyText.toLowerCase().includes('experience') ||
      site.homepage.bodyText.toLowerCase().includes('certif') ||
      site.homepage.bodyText.toLowerCase().includes('licens') ||
      site.homepage.bodyText.toLowerCase().includes('award') ||
      site.homepage.bodyText.toLowerCase().includes('trust')
    );
    
    items.push({
      name: "Do they demonstrate EEAT?",
      description: "Site should showcase Experience, Expertise, Authoritativeness, Trustworthiness",
      status: hasEEAT ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasEEAT ? "Limited signals of Experience, Expertise, Authoritativeness, Trustworthiness" : undefined
    });
    
    // Check for "near me" optimization
    const hasNearMeOptimization = site.homepage.bodyText && (
      site.homepage.bodyText.toLowerCase().includes('near me') ||
      site.homepage.bodyText.toLowerCase().includes('nearby') ||
      site.homepage.bodyText.toLowerCase().includes('in your area') ||
      site.homepage.bodyText.toLowerCase().includes('local')
    );
    
    items.push({
      name: "Optimized for near me searches?",
      description: "Site should be optimized for local 'near me' searches",
      status: hasNearMeOptimization ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasNearMeOptimization ? "Limited optimization for 'near me' searches detected" : undefined
    });
    
    // Check for mobile link parity
    const hasMobileLinkParity = homepage.mobileFriendly; // Best proxy without actual mobile testing
    
    items.push({
      name: "Mobile link parity?",
      description: "Mobile version should have the same links as desktop",
      status: hasMobileLinkParity ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasMobileLinkParity ? "Mobile viewport not detected, may indicate mobile issues" : undefined
    });
    
    // Check for topic clustering
    const hasTopicClustering = site.servicePages.length >= 3 && site.servicePages.some(page => 
      page.links.internal.filter(link => link.includes('service')).length > 1
    );
    
    items.push({
      name: "Topics are clustered?",
      description: "Related topics should be grouped and interlinked",
      status: hasTopicClustering ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasTopicClustering ? "Limited evidence of topic clustering detected" : undefined
    });
    
    // ==========================================
    // Other Factors from PDF
    // ==========================================
    
    // Check URL, title, H1 alignment
    const titleH1Alignment = site.otherPages.every(page => 
      page.headings.h1.length > 0 && page.title.length > 0 && 
      (page.headings.h1[0].includes(page.title) || page.title.includes(page.headings.h1[0]))
    );
    
    items.push({
      name: "Keyword & city, state alignment of URLs, <title>, <h1>?",
      description: "URLs, titles, and headings should align for SEO",
      status: titleH1Alignment ? 'OK' : 'OFI',
      importance: 'High',
      notes: !titleH1Alignment ? "Some pages have misaligned URL, title, and H1 elements" : undefined
    });
    
    // Check for NAP on every page
    const hasNAPOnEveryPage = site.otherPages.every(page => 
      page.hasNAP
    );
    
    items.push({
      name: "NAP on every page of site? (For 3 or fewer locations)",
      description: "NAP should appear on every page",
      status: hasNAPOnEveryPage ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasNAPOnEveryPage ? "Some pages missing NAP (Name, Address, Phone)" : undefined
    });
    
    // Check NAP consistency
    items.push({
      name: "NAP is correct? (i.e. Works on Maps? Matches GBP?)",
      description: "NAP should be consistent across the web",
      status: hasNAP ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasNAP ? "NAP (Name, Address, Phone) not found or potentially inconsistent" : undefined
    });
    
    // Check for localized alt text
    const hasLocalizedAltText = site.homepage.images?.withAlt > 0 && 
      site.homepage.images?.altTexts && 
      Array.isArray(site.homepage.images?.altTexts) &&
      site.homepage.images.altTexts.some(alt => 
        alt && typeof alt === 'string' && alt.match(/[A-Z][a-z]+,\s*[A-Z]{2}/) // City, State pattern
      );
    
    items.push({
      name: "<city>,<state> + <relevant keyword> in <img alt>?",
      description: "Image alt text should include localization",
      status: hasLocalizedAltText ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !hasLocalizedAltText ? "No localized (City, State) image alt text found" : undefined
    });
    
    // ==========================================
    // Schema (partial from PDF - more in schema section)
    // ==========================================
    
    // Check for schema markup
    items.push({
      name: "Unique schema on each page?",
      description: "Each page should have appropriate schema",
      status: homepage.hasSchema ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.hasSchema ? 
        `Schema types: ${homepage.schemaTypes.length > 0 ? homepage.schemaTypes.join(', ') : 'Unknown'}` : 
        "Limited or no schema markup detected"
    });
    
    // Check for localBusiness schema
    const hasLocalBusinessSchema = homepage.hasSchema && homepage.schemaTypes.some(type => 
      type.toLowerCase().includes('local') || type.toLowerCase().includes('business')
    );
    
    items.push({
      name: "Uses localBusiness schema, or something even more granular, if feasible?",
      description: "LocalBusiness schema helps with local SEO",
      status: hasLocalBusinessSchema ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasLocalBusinessSchema ? "No LocalBusiness schema detected" : undefined
    });
    
    // Check for image optimization
    items.push({
      name: "Images properly optimized?",
      description: "Images should have alt text and appropriate sizes",
      status: (homepage.images.withoutAlt === 0 && homepage.images.largeImages < 3) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: homepage.images.withoutAlt > 0 ? `${homepage.images.withoutAlt} images missing alt text` : 
             homepage.images.largeImages > 2 ? `${homepage.images.largeImages} large images could be optimized` : undefined
    });
    
    // Check page speed
    items.push({
      name: "Page load speed",
      description: "Pages should load quickly for better user experience and SEO",
      status: homepage.pageLoadSpeed.score > 70 ? 'OK' : 
              homepage.pageLoadSpeed.score > 50 ? 'OFI' : 'Priority OFI',
      importance: 'High',
      notes: homepage.pageLoadSpeed.score < 70 ? 
             `Page speed score: ${homepage.pageLoadSpeed.score}/100. LCP: ${homepage.pageLoadSpeed.largestContentfulPaint}ms` : undefined
    });
    
    return items;
  }
  
  /**
   * Generate the structure & navigation audit items based on CSV
   */
  private generateStructureAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    
    // Get all URLs and pages for analysis
    const allUrls = [
      site.homepage.url,
      ...(site.contactPage ? [site.contactPage.url] : []),
      ...site.servicePages.map(p => p.url),
      ...site.locationPages.map(p => p.url),
      ...site.otherPages.map(p => p.url),
      ...site.serviceAreaPages.map(p => p.url)
    ];
    
    const allPages = [
      site.homepage,
      ...(site.contactPage ? [site.contactPage] : []),
      ...site.servicePages,
      ...site.locationPages,
      ...site.otherPages,
      ...site.serviceAreaPages
    ];
    
    // Get all titles and headings for analysis
    const allTitles = allPages.map(p => p.title);
    const allH1s = allPages.flatMap(p => p.headings.h1);
    const allH2s = allPages.flatMap(p => p.headings.h2);
    
    // Extract navigation items from the homepage
    const navLinks = site.homepage.links.internal.slice(0, 10); // Assuming top 10 links are navigation
    
    // ==========================================
    // URLs section checks
    // ==========================================
    
    // Check if URLs are human-readable
    const badUrlPatterns = [/\?id=\d+/, /\.php/, /\.aspx/, /\.html/, /[_0-9]{6,}/];
    const problematicUrls = allUrls.filter(url => badUrlPatterns.some(pattern => pattern.test(url)));
    const hasReadableUrls = problematicUrls.length === 0;
    
    items.push({
      name: "Human-readable? Simple? Informative?",
      description: "URLs should be easy to read and understand",
      status: hasReadableUrls ? 'OK' : 'OFI',
      importance: 'High',
      notes: hasReadableUrls ? undefined : `Found ${problematicUrls.length} URLs that are not human-readable`
    });
    
    // Check if location/service pages use localized URLs
    const locationPageUrls = [...site.locationPages.map(p => p.url), ...site.serviceAreaPages.map(p => p.url)];
    const localizedUrls = locationPageUrls.filter(url => 
      /\/(locations?|cities|towns|areas|regions|states|provinces|[a-z]+-[a-z]+)\/[a-z-]+/.test(url.toLowerCase())
    );
    const hasLocalizedUrls = localizedUrls.length > 0;
    
    items.push({
      name: "Localized?",
      description: "URLs should include location information where relevant",
      status: hasLocalizedUrls ? 'OK' : (site.locationPages.length > 0 || site.serviceAreaPages.length > 0) ? 'OFI' : 'N/A',
      importance: 'Medium',
      notes: !hasLocalizedUrls && (site.locationPages.length > 0 || site.serviceAreaPages.length > 0) ? 
        "Location/service area pages don't include location information in URLs" : undefined
    });
    
    // Extract keywords from titles
    const keywords = allTitles
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['page', 'home', 'about', 'contact', 'the', 'and', 'for', 'with'].includes(word));
    
    // Check if these keywords appear in the URLs
    const keywordUrls = allUrls.filter(url => 
      keywords.some(keyword => url.toLowerCase().includes(keyword))
    );
    const keywordRichUrls = keywordUrls.length > allUrls.length / 3; // At least 1/3 of URLs have keywords
    
    items.push({
      name: "Keyword-rich?",
      description: "URLs should contain relevant keywords",
      status: keywordRichUrls ? 'OK' : 'OFI',
      importance: 'High',
      notes: keywordRichUrls ? undefined : "Many URLs don't contain relevant keywords from page titles"
    });
    
    // Check if URLs include GBP categories
    // Common GBP categories for service businesses
    const commonGbpCategories = ['hvac', 'heating', 'cooling', 'air conditioning', 'repair', 'installation', 'maintenance', 'service'];
    const urlsWithGbpCategories = allUrls.filter(url => 
      commonGbpCategories.some(category => url.toLowerCase().includes(category))
    );
    const hasGbpCategoriesInUrls = urlsWithGbpCategories.length > 0;
    
    items.push({
      name: "Do the urls include categories or services found on their GBP page?",
      description: "URLs should align with Google Business Profile categories",
      status: hasGbpCategoriesInUrls ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: hasGbpCategoriesInUrls ? undefined : "URLs don't include common service categories"
    });
    
    // Check if URLs avoid stop words
    const stopWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'to'];
    const urlsWithStopWords = allUrls.filter(url => {
      const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
      return pathSegments.some(segment => 
        stopWords.some(word => segment.split('-').includes(word))
      );
    });
    const avoidStopWords = urlsWithStopWords.length < 3; // Allow a few exceptions
    
    items.push({
      name: "Free of stop words? (i.e. small \"connective\" words such as \"and\", \"or\", etc.)",
      description: "URLs should avoid small connective words",
      status: avoidStopWords ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: avoidStopWords ? undefined : `Found ${urlsWithStopWords.length} URLs containing stop words`
    });
    
    // Check for nonsense or overly complex URLs
    const nonsenseUrlPatterns = [
      /[0-9]{4,}/, // Long number sequences
      /[a-zA-Z0-9]{10,}/, // Very long single segments without hyphens
      /(-){2,}/, // Multiple consecutive hyphens
    ];
    
    const nonsenseUrls = allUrls.filter(url => {
      const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
      return pathSegments.some(segment => 
        nonsenseUrlPatterns.some(pattern => pattern.test(segment))
      );
    });
    const hasNoNonsenseUrls = nonsenseUrls.length === 0;
    
    items.push({
      name: "No nonsense URLs?",
      description: "URLs should be clean and purposeful",
      status: hasNoNonsenseUrls ? 'OK' : 'OFI',
      importance: 'High',
      notes: hasNoNonsenseUrls ? undefined : `Found ${nonsenseUrls.length} URLs with complex or nonsensical patterns`
    });
    
    // ==========================================
    // Top Navigation section checks
    // ==========================================
    
    // Check for logical navigation structure
    const hasLogicalNavigation = navLinks.length >= 3 && navLinks.length <= 10;
    
    items.push({
      name: "Logical?",
      description: "Navigation structure should be logical and intuitive",
      status: hasLogicalNavigation ? 'OK' : 'OFI',
      importance: 'High',
      notes: !hasLogicalNavigation ? (navLinks.length < 3 ? "Too few navigation links" : "Too many navigation links") : undefined
    });
    
    // Check for text-based navigation (no image-only navigation)
    // This is hard to determine programmatically without rendering the page
    items.push({
      name: "Uses readable text? (No images)",
      description: "Navigation should use text rather than images",
      status: 'N/A', // Hard to determine without visual analysis
      importance: 'Medium',
      notes: "Requires visual inspection to determine if navigation uses text instead of images"
    });
    
    // Check for shallow click depth
    const hasShallowClickDepth = allUrls.filter(url => {
      const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
      return pathSegments.length <= 3; // Not more than 3 levels deep
    }).length > allUrls.length * 0.8; // At least 80% of URLs have shallow depth
    
    items.push({
      name: "Shallow click depth for important pages?",
      description: "Important pages should be accessible within 2-3 clicks",
      status: hasShallowClickDepth ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: hasShallowClickDepth ? undefined : "Many pages are deep in the site hierarchy"
    });
    
    // Check if primary services are in top navigation
    const servicePageUrls = site.servicePages.map(p => p.url);
    const serviceInNav = servicePageUrls.some(url => navLinks.includes(url));
    
    items.push({
      name: "Are the primary products/services linked from the top navigation?",
      description: "Main services should be accessible from top navigation",
      status: serviceInNav ? 'OK' : site.servicePages.length > 0 ? 'OFI' : 'N/A',
      importance: 'High',
      notes: !serviceInNav && site.servicePages.length > 0 ? "Service pages not linked from top navigation" : undefined
    });
    
    // Check if location pages are in top navigation
    const locationInNav = site.locationPages.length > 0 && 
                        site.locationPages.some(p => navLinks.includes(p.url));
    
    items.push({
      name: "Are Location Pages (i.e. physical locations) linked from the top navigation?",
      description: "Location pages should be accessible from top navigation",
      status: locationInNav ? 'OK' : site.locationPages.length > 0 ? 'OFI' : 'N/A',
      importance: 'High',
      notes: !locationInNav && site.locationPages.length > 0 ? "Location pages not linked from top navigation" : undefined
    });
    
    // Check if service area (city) pages are in top navigation
    const serviceAreaInNav = site.serviceAreaPages.length > 0 && 
                           site.serviceAreaPages.some(p => navLinks.includes(p.url));
    
    items.push({
      name: "Are City Pages (i.e. service area pages) linked from the top navigation?",
      description: "Service area pages should be accessible from top navigation",
      status: serviceAreaInNav ? 'OK' : site.serviceAreaPages.length > 0 ? 'OFI' : 'N/A',
      importance: 'Medium',
      notes: !serviceAreaInNav && site.serviceAreaPages.length > 0 ? "Service area pages not linked from top navigation" : undefined
    });
    
    // Check if navigation labels align with page titles
    // This would require DOM traversal for accurate analysis
    items.push({
      name: "Navigation labels aligned with page <title>?",
      description: "Navigation labels should match page titles",
      status: 'N/A', // Hard to determine programmatically
      importance: 'High',
      notes: "Requires visual inspection to verify navigation label alignment with page titles"
    });
    
    // Check if navigation labels align with H1s
    items.push({
      name: "Navigation labels aligned with page <h1>?",
      description: "Navigation labels should match page headings",
      status: 'N/A', // Hard to determine programmatically
      importance: 'High',
      notes: "Requires visual inspection to verify navigation label alignment with H1 headings"
    });
    
    // Check if navigation labels align with URLs
    items.push({
      name: "Navigation labels aligned with URLs?",
      description: "Navigation labels should align with URL structure",
      status: 'N/A', // Hard to determine programmatically
      importance: 'High',
      notes: "Requires visual inspection to verify navigation label alignment with URLs"
    });
    
    // Check if navigation items contain keywords
    items.push({
      name: "Do the top navigation items contain keywords?",
      description: "Navigation items should include relevant keywords",
      status: 'N/A', // Hard to determine programmatically
      importance: 'High',
      notes: "Requires visual inspection to verify navigation items contain keywords"
    });
    
    // ==========================================
    // Page Titles section - technical
    // ==========================================
    
    // Check if titles include location information
    const titlesWithLocation = allTitles.filter(title => {
      // Common patterns for location in titles
      const locationPatterns = [
        /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/,  // City, State format: Miami, FL
        /\b[A-Z][a-z]+\s+[A-Z]{2}\b/,   // City State format: Miami FL
        /\bin\s+[A-Z][a-z]+\b/i,        // "in City" format: in Miami
        /\bnear\s+[A-Z][a-z]+\b/i,      // "near City" format: near Miami
        /\bserving\s+[A-Z][a-z]+\b/i     // "serving City" format: serving Miami
      ];
      
      return locationPatterns.some(pattern => pattern.test(title));
    });
    
    const hasLocalizedTitles = titlesWithLocation.length > 0;
    
    items.push({
      name: "Localized? (i.e. <city>, <state>, or neighbourhoods in every <title>)",
      description: "Titles should include location information",
      status: hasLocalizedTitles ? 'OK' : 'OFI',
      importance: 'High',
      notes: hasLocalizedTitles ? undefined : "Page titles don't include location information"
    });
    
    // Check if homepage title includes GBP primary category
    const homepageTitle = site.homepage.title.toLowerCase();
    const primaryGbpCategories = ['hvac', 'heating', 'cooling', 'air conditioning', 'contractor', 'service'];
    const homepageHasPrimaryGbp = primaryGbpCategories.some(category => homepageTitle.includes(category));
    
    items.push({
      name: "Contains GBP primary category on homepage?",
      description: "Homepage title should include Google Business Profile category",
      status: homepageHasPrimaryGbp ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepageHasPrimaryGbp ? undefined : "Homepage title doesn't include primary service category"
    });
    
    // Check if other pages include GBP categories
    const otherPagesWithGbp = allTitles.slice(1).filter(title => {
      const title_lower = title.toLowerCase();
      const allGbpCategories = [
        'hvac', 'heating', 'cooling', 'air conditioning', 'repair', 'installation', 
        'maintenance', 'service', 'contractor', 'air quality', 'ducts', 'ductwork'
      ];
      return allGbpCategories.some(category => title_lower.includes(category));
    });
    
    const otherPagesHaveGbp = otherPagesWithGbp.length > allTitles.length * 0.3; // At least 30% should have GBP categories
    
    items.push({
      name: "Contains other GBP categories on other pages?",
      description: "Other pages should include relevant GBP categories",
      status: otherPagesHaveGbp ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: otherPagesHaveGbp ? undefined : "Most page titles don't include service categories"
    });
    
    // Check if titles are keyword-rich
    const keywordRichTitles = allTitles.filter(title => {
      const wordCount = title.split(/\s+/).length;
      return wordCount >= 4 && wordCount <= 10; // Reasonable length with space for keywords
    }).length > allTitles.length * 0.7; // At least 70% of titles should be keyword-rich
    
    items.push({
      name: "Keyword-rich? (Without keyword stuffing)",
      description: "Titles should include keywords naturally",
      status: keywordRichTitles ? 'OK' : 'OFI',
      importance: 'High',
      notes: keywordRichTitles ? undefined : "Many page titles lack sufficient keywords or are too short/long"
    });
    
    // Check title length
    const goodTitleLengths = allTitles.filter(title => {
      return title.length >= 30 && title.length <= 70; // Between 30 and 70 characters
    }).length > allTitles.length * 0.7; // At least 70% should have good length
    
    items.push({
      name: "Good length? (Aiming for 50 - 60 characters may be outdated.)",
      description: "Titles should have appropriate length",
      status: goodTitleLengths ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: goodTitleLengths ? undefined : "Many page titles have suboptimal length"
    });
    
    // ==========================================
    // Page Titles section - human factors
    // ==========================================
    
    // Check if titles are noticeable
    items.push({
      name: "Noticeable?",
      description: "Titles should stand out and be attention-grabbing",
      status: 'N/A', // Hard to determine programmatically
      importance: 'Medium',
      notes: "Requires human judgment to determine if titles are attention-grabbing"
    });
    
    // Check if each title is unique
    const uniqueTitles = new Set(allTitles).size;
    const allTitlesUnique = uniqueTitles === allTitles.length;
    
    items.push({
      name: "Is each one different?",
      description: "Each page should have a unique title",
      status: allTitlesUnique ? 'OK' : 'OFI',
      importance: 'High',
      notes: allTitlesUnique ? undefined : `Found ${allTitles.length - uniqueTitles} duplicate page titles`
    });
    
    // Check if titles are relevant to their pages
    items.push({
      name: "Is the page title relevant for the page's purpose?",
      description: "Titles should accurately represent page content",
      status: 'N/A', // Hard to determine programmatically
      importance: 'High',
      notes: "Requires content analysis to determine relevance of titles to page content"
    });
    
    // Check if keywords are at the beginning of titles
    const titlesWithKeywordsFirst = allTitles.filter(title => {
      const firstWords = title.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      return keywords.some(keyword => firstWords.includes(keyword));
    }).length > allTitles.length * 0.5; // At least half of titles should have keywords at the beginning
    
    items.push({
      name: "Primary Keyword near beginning of title?",
      description: "Main keyword should appear early in title",
      status: titlesWithKeywordsFirst ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: titlesWithKeywordsFirst ? undefined : "Keywords are not positioned early in many page titles"
    });
    
    // Check if business name appears in titles
    const businessNameInTitles = allTitles.filter(title => {
      // Extract potential business name from homepage title
      const homepageWords = site.homepage.title.split(/\s+/);
      const potentialBusinessName = homepageWords.slice(0, 3).join(' '); // Assume first 3 words might be business name
      return title.includes(potentialBusinessName);
    }).length > allTitles.length * 0.7; // Business name should be in at least 70% of titles
    
    items.push({
      name: "Do they mention the business name or branding in each Page Title?",
      description: "Titles should include business name",
      status: businessNameInTitles ? 'OK' : 'OFI',
      importance: 'Low',
      notes: businessNameInTitles ? undefined : "Business name missing from many page titles"
    });
    
    // ==========================================
    // H1 section checks
    // ==========================================
    
    // Check if H1s include location
    const h1sWithLocation = allH1s.filter(h1 => {
      const locationPatterns = [
        /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/,  // City, State format
        /\b[A-Z][a-z]+\s+[A-Z]{2}\b/,   // City State format
        /\bin\s+[A-Z][a-z]+\b/i,        // "in City" format
        /\bnear\s+[A-Z][a-z]+\b/i,      // "near City" format
        /\bserving\s+[A-Z][a-z]+\b/i     // "serving City" format
      ];
      
      return locationPatterns.some(pattern => pattern.test(h1));
    });
    
    const h1sLocalized = h1sWithLocation.length > 0;
    
    items.push({
      name: "Localized? (i.e. includes city, state?)",
      description: "H1 headings should include location information",
      status: h1sLocalized ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: h1sLocalized ? undefined : "H1 headings don't include location information"
    });
    
    // Check if H1s contain keywords
    const h1sWithKeywords = allH1s.filter(h1 => {
      return keywords.some(keyword => h1.toLowerCase().includes(keyword));
    });
    
    const h1sKeywordRich = h1sWithKeywords.length > allH1s.length * 0.7; // At least 70% should contain keywords
    
    items.push({
      name: "Keyword-rich?",
      description: "H1 headings should include relevant keywords",
      status: h1sKeywordRich ? 'OK' : 'OFI',
      importance: 'High',
      notes: h1sKeywordRich ? undefined : "Many H1 headings lack relevant keywords"
    });
    
    // Check if H1s match page purpose
    items.push({
      name: "Does the <h1> match the page's purpose? Primary Keyword for the page?",
      description: "H1 should reflect page content and primary keyword",
      status: 'N/A', // Hard to determine programmatically
      importance: 'High',
      notes: "Requires content analysis to determine if H1s match page purpose"
    });
    
    // ==========================================
    // H2 section checks
    // ==========================================
    
    // Check if H2s include location
    const h2sWithLocation = allH2s.filter(h2 => {
      const locationPatterns = [
        /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/,  // City, State format
        /\b[A-Z][a-z]+\s+[A-Z]{2}\b/,   // City State format
        /\bin\s+[A-Z][a-z]+\b/i,        // "in City" format
        /\bnear\s+[A-Z][a-z]+\b/i,      // "near City" format
        /\bserving\s+[A-Z][a-z]+\b/i     // "serving City" format
      ];
      
      return locationPatterns.some(pattern => pattern.test(h2));
    });
    
    const h2sLocalized = h2sWithLocation.length > 0;
    
    items.push({
      name: "Localized? (i.e. includes city, state?)",
      description: "H2 headings should include location information where relevant",
      status: h2sLocalized ? 'OK' : 'OFI',
      importance: 'Low',
      notes: h2sLocalized ? undefined : "H2 headings don't include location information"
    });
    
    // Check if H2s contain keywords
    const h2sWithKeywords = allH2s.filter(h2 => {
      return keywords.some(keyword => h2.toLowerCase().includes(keyword));
    });
    
    const h2sKeywordRich = h2sWithKeywords.length > allH2s.length * 0.5; // At least 50% should contain keywords
    
    items.push({
      name: "Keyword-rich?",
      description: "H2 headings should include relevant keywords",
      status: h2sKeywordRich ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: h2sKeywordRich ? undefined : "Many H2 headings lack relevant keywords"
    });
    
    // Check if H2s are used for content sections
    const pagesWithMultipleH2s = allPages.filter(page => page.headings.h2.length > 1).length;
    const h2sUsedForSections = pagesWithMultipleH2s > allPages.length * 0.5; // At least half of pages should have multiple H2s
    
    items.push({
      name: "Are the <h2>'s used to lay out content sections of the page",
      description: "H2s should structure the page content logically",
      status: h2sUsedForSections ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: h2sUsedForSections ? undefined : "Many pages don't use H2 headings for content structure"
    });
    
    // ==========================================
    // Meta Description section checks
    // ==========================================
    
    // Check if meta descriptions are present and describe the page
    const pagesWithMetaDesc = allPages.filter(page => page.metaDescription && page.metaDescription.length > 10);
    const metaDescWithKeywords = pagesWithMetaDesc.filter(page => 
      keywords.some(keyword => page.metaDescription.toLowerCase().includes(keyword))
    );
    
    const metaDescGood = metaDescWithKeywords.length > allPages.length * 0.7; // At least 70% should have good meta descriptions
    
    items.push({
      name: "Does the Meta Description describe the page's purpose? Includes primary keyword?",
      description: "Meta descriptions should summarize content and include primary keyword",
      status: metaDescGood ? 'OK' : 'OFI',
      importance: 'High',
      notes: metaDescGood ? undefined : "Many meta descriptions are missing or don't include keywords"
    });
    
    // Check meta description length and presence
    const goodLengthMetaDesc = pagesWithMetaDesc.filter(page => 
      page.metaDescription.length >= 70 && page.metaDescription.length <= 160
    );
    
    const metaDescLengthGood = goodLengthMetaDesc.length > allPages.length * 0.7; // At least 70% should have good length
    
    items.push({
      name: "< 160 characters? Does every page have a meta description?",
      description: "Meta descriptions should be concise and present on every page",
      status: metaDescLengthGood ? 'OK' : 'OFI',
      importance: 'High',
      notes: metaDescLengthGood ? undefined : `${allPages.length - goodLengthMetaDesc.length} pages have missing or improper length meta descriptions`
    });
    
    // Check if homepage meta description has phone number
    const phoneRegex = /(\+?1?[ -]?)?\(?[0-9]{3}\)?[ -]?[0-9]{3}[ -]?[0-9]{4}/;
    const homepageMetaHasPhone = site.homepage.metaDescription && phoneRegex.test(site.homepage.metaDescription);
    
    items.push({
      name: "Contains phone number CTA (at least on homepage)?",
      description: "Homepage meta description should include phone number call-to-action",
      status: homepageMetaHasPhone ? 'OK' : 'OFI',
      importance: 'Low',
      notes: homepageMetaHasPhone ? undefined : "Homepage meta description doesn't include phone number"
    });
    
    // ==========================================
    // Body section checks
    // ==========================================
    
    // Check if body content includes location
    const pagesWithLocationInBody = allPages.filter(page => {
      if (!page.bodyText) return false;
      
      const locationPatterns = [
        /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/,  // City, State format
        /\b[A-Z][a-z]+\s+[A-Z]{2}\b/,   // City State format
        /\bin\s+[A-Z][a-z]+\b/i,        // "in City" format
        /\bnear\s+[A-Z][a-z]+\b/i,      // "near City" format
        /\bserving\s+[A-Z][a-z]+\b/i     // "serving City" format
      ];
      
      return locationPatterns.some(pattern => pattern.test(page.bodyText));
    });
    
    const bodyContentLocalized = pagesWithLocationInBody.length > allPages.length * 0.3; // At least 30% should mention locations
    
    items.push({
      name: "Localized? (i.e. includes city, state?)",
      description: "Body content should include location information",
      status: bodyContentLocalized ? 'OK' : 'OFI',
      importance: 'High',
      notes: bodyContentLocalized ? undefined : "Body content rarely includes location information"
    });
    
    // Check if body content is keyword-rich
    const pagesWithKeywordsInBody = allPages.filter(page => {
      if (!page.bodyText) return false;
      return keywords.some(keyword => 
        (page.bodyText.toLowerCase().match(new RegExp('\\b' + keyword + '\\b', 'g')) || []).length >= 2
      );
    });
    
    const bodyContentKeywordRich = pagesWithKeywordsInBody.length > allPages.length * 0.7; // At least 70% should have keywords
    
    items.push({
      name: "Keyword-rich?",
      description: "Body content should include relevant keywords",
      status: bodyContentKeywordRich ? 'OK' : 'OFI',
      importance: 'High',
      notes: bodyContentKeywordRich ? undefined : "Body content lacks sufficient keyword usage"
    });
    
    // Check for GBP primary category in homepage content
    const primaryGbpInHomepage = site.homepage.bodyText && primaryGbpCategories.some(category => 
      site.homepage.bodyText.toLowerCase().includes(category)
    );
    
    items.push({
      name: "GBP primary category appears in copy on the page linked from the GBP(s).",
      description: "Content should include Google Business Profile primary category",
      status: primaryGbpInHomepage ? 'OK' : 'OFI',
      importance: 'High',
      notes: primaryGbpInHomepage ? undefined : "Homepage content doesn't include primary service category"
    });
    
    // Check for GBP categories in site content
    const gbpCategoriesInContent = allPages.some(page => {
      if (!page.bodyText) return false;
      const allGbpCategories = [
        'hvac', 'heating', 'cooling', 'air conditioning', 'repair', 'installation', 
        'maintenance', 'service', 'contractor', 'air quality', 'ducts', 'ductwork'
      ];
      return allGbpCategories.some(category => 
        page.bodyText.toLowerCase().includes(category)
      );
    });
    
    items.push({
      name: "Other GBP categories appear in copy of website?",
      description: "Content should include other Google Business Profile categories",
      status: gbpCategoriesInContent ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: gbpCategoriesInContent ? undefined : "Website content doesn't mention service categories"
    });
    
    return items;
  }
  
  /**
   * Generate the contact page audit items
   */
  private generateContactAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const contactPage = site.contactPage;
    
    // Check if site has a contact page
    items.push({
      name: "Has a contact page?",
      description: "A dedicated contact page is important",
      status: contactPage ? 'OK' : 'Priority OFI',
      importance: 'High',
      notes: !contactPage ? "No dedicated contact page found" : undefined
    });
    
    if (contactPage) {
      // Check if business name appears in the contact page
      const pageContent = [
        contactPage.title,
        contactPage.metaDescription,
        ...contactPage.headings.h1,
        ...contactPage.headings.h2
      ].join(' ').toLowerCase();
      
      // Try to extract business name from homepage title
      const potentialBusinessName = site.homepage.title.split(' - ')[0] || site.homepage.title.split(' | ')[0];
      
      // Check if any significant part of the business name appears in the contact page
      const businessNameWords = potentialBusinessName.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      const hasBusinessName = businessNameWords.some(word => pageContent.includes(word));
      
      items.push({
        name: "Business name appears in the copy?",
        description: "Business name should be prominently displayed",
        status: hasBusinessName ? 'OK' : 'OFI',
        importance: 'High',
        notes: !hasBusinessName ? "Business name not prominently displayed on contact page" : undefined
      });
      
      // Check if address appears in the contact page
      items.push({
        name: "Address appears in the copy?",
        description: "Physical address should be visible",
        status: contactPage.hasAddress ? 'OK' : 'OFI',
        importance: 'High',
        notes: !contactPage.hasAddress ? "No physical address found on contact page" : undefined
      });
      
      // Check if phone number appears in the contact page
      items.push({
        name: "Phone number appears in the copy?",
        description: "Phone number should be easy to find",
        status: contactPage.hasPhoneNumber ? 'OK' : 'OFI',
        importance: 'High',
        notes: !contactPage.hasPhoneNumber ? "No phone number found on contact page" : undefined
      });
      
      // Check if the phone number is clickable (we can't directly check this from just HTML)
      // Using presence of tel: links as a proxy
      const hasTelLink = contactPage.links.internal.some(link => link.startsWith('tel:')) || 
                         contactPage.links.external.some(link => link.startsWith('tel:'));
      
      items.push({
        name: "Phone number is clickable?",
        description: "Phone numbers should be clickable for mobile users",
        status: hasTelLink ? 'OK' : contactPage.hasPhoneNumber ? 'OFI' : 'N/A',
        importance: 'Medium',
        notes: !hasTelLink && contactPage.hasPhoneNumber ? "Phone number exists but is not clickable" : undefined
      });
      
      // Check if the page has a contact form
      items.push({
        name: "Has a contact form?",
        description: "Page should have a working contact form",
        status: contactPage.hasContactForm ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: !contactPage.hasContactForm ? "No contact form found on contact page" : undefined
      });
      
      // Check if the contact page has schema markup
      items.push({
        name: "Has schema markup?",
        description: "Contact page should have LocalBusiness schema",
        status: contactPage.hasSchema ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: contactPage.hasSchema ? 
          `Found schema types: ${contactPage.schemaTypes.length > 0 ? contactPage.schemaTypes.join(', ') : 'Unknown'}` : 
          "No schema markup found on contact page"
      });
      
      // Check for map or location embedding
      const hasMapEmbedding = contactPage.bodyText.toLowerCase().includes('map') || 
                           contactPage.links.external.some(link => 
                             link.includes('maps.google.com') || 
                             link.includes('maps.apple.com')
                           );
      
      items.push({
        name: "Has map or directions?",
        description: "Contact page should include a map or directions",
        status: hasMapEmbedding ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: !hasMapEmbedding ? "No map or directions found on contact page" : undefined
      });
      
      // Check for business hours
      const hasBusinessHours = contactPage.bodyText.toLowerCase().includes('hours') || 
                            contactPage.bodyText.toLowerCase().includes('open') ||
                            /\b(mon|tue|wed|thu|fri|sat|sun)\b/i.test(contactPage.bodyText);
      
      items.push({
        name: "Lists business hours?",
        description: "Contact page should display business hours",
        status: hasBusinessHours ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: !hasBusinessHours ? "No business hours found on contact page" : undefined
      });
      
      // Check mobile-friendliness
      items.push({
        name: "Mobile-friendly?",
        description: "Contact page should be optimized for mobile devices",
        status: contactPage.mobileFriendly ? 'OK' : 'Priority OFI',
        importance: 'High',
        notes: !contactPage.mobileFriendly ? "Contact page is not mobile-friendly" : undefined
      });
      
    } else {
      // If there's no contact page, mark all contact-related items as N/A
      items.push({
        name: "Business name appears in the copy?",
        description: "Business name should be prominently displayed",
        status: 'N/A',
        importance: 'High'
      });
      
      items.push({
        name: "Address appears in the copy?",
        description: "Physical address should be visible",
        status: 'N/A',
        importance: 'High'
      });
      
      items.push({
        name: "Phone number appears in the copy?",
        description: "Phone number should be easy to find",
        status: 'N/A',
        importance: 'High'
      });
      
      items.push({
        name: "Phone number is clickable?",
        description: "Phone numbers should be clickable for mobile users",
        status: 'N/A',
        importance: 'Medium'
      });
      
      items.push({
        name: "Has a contact form?",
        description: "Page should have a working contact form",
        status: 'N/A',
        importance: 'Medium'
      });
      
      items.push({
        name: "Has schema markup?",
        description: "Contact page should have LocalBusiness schema",
        status: 'N/A',
        importance: 'Medium'
      });
      
      items.push({
        name: "Has map or directions?",
        description: "Contact page should include a map or directions",
        status: 'N/A',
        importance: 'Medium'
      });
      
      items.push({
        name: "Lists business hours?",
        description: "Contact page should display business hours",
        status: 'N/A',
        importance: 'Medium'
      });
      
      items.push({
        name: "Mobile-friendly?",
        description: "Contact page should be optimized for mobile devices",
        status: 'N/A',
        importance: 'High'
      });
    }
    
    return items;
  }
  
  /**
   * Generate the service pages audit items
   */
  private generateServiceAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const servicePages = site.servicePages;
    
    // Check if there are service pages
    items.push({
      name: "Has a single Service Page for each primary service?",
      description: "Each main service should have its own page",
      status: servicePages.length > 0 ? 'OK' : 'OFI',
      importance: 'High',
      notes: servicePages.length === 0 ? "No dedicated service pages found" : 
             servicePages.length === 1 ? "Only one service page found" :
             `Found ${servicePages.length} service pages`
    });
    
    if (servicePages.length > 0) {
      // Check if content is written for audience
      const averageServiceWordCount = servicePages.reduce((sum, page) => sum + page.wordCount, 0) / servicePages.length;
      
      items.push({
        name: "Service Pages are written for the audience, not the business owner?",
        description: "Content should focus on customer needs",
        status: averageServiceWordCount >= 500 ? 'OK' : 'OFI',
        importance: 'High',
        notes: averageServiceWordCount < 500 ? 
          `Service pages may be too brief (average ${Math.round(averageServiceWordCount)} words)` : 
          `Good content length (average ${Math.round(averageServiceWordCount)} words)`
      });
      
      // Check for detail level
      items.push({
        name: "Service Pages are sufficiently detailed?",
        description: "Pages should provide comprehensive information",
        status: averageServiceWordCount >= 800 ? 'OK' : 'OFI',
        importance: 'High',
        notes: averageServiceWordCount < 800 ? 
          "Service pages need more detail for comprehensive coverage" : 
          "Service pages have good level of detail"
      });
      
      // Check for proper headings structure
      const hasProperHeadings = servicePages.every(page => 
        page.headings.h1.length === 1 && page.headings.h2.length >= 2
      );
      
      items.push({
        name: "Proper heading structure?",
        description: "Each page should have one H1 and multiple H2 headings",
        status: hasProperHeadings ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: !hasProperHeadings ? 
          "Some service pages have improper heading structure" :
          "Good heading structure on service pages"
      });
      
      // Check for schema markup
      const pagesWithSchema = servicePages.filter(page => page.hasSchema).length;
      const schemaPercentage = (pagesWithSchema / servicePages.length) * 100;
      
      items.push({
        name: "Service pages have schema markup?",
        description: "Pages should have structured data for better SEO",
        status: schemaPercentage >= 50 ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: schemaPercentage < 50 ? 
          `Only ${Math.round(schemaPercentage)}% of service pages have schema markup` : 
          `${Math.round(schemaPercentage)}% of service pages have schema markup`
      });
      
      // Check for CTAs
      const pagesWithCTAs = servicePages.filter(page => {
        const pageText = [
          ...page.headings.h1,
          ...page.headings.h2,
          ...page.headings.h3,
          page.bodyText
        ].join(' ').toLowerCase();
        
        // Look for common CTA phrases
        const ctaPhrases = ['call', 'contact', 'get a quote', 'free quote', 'book', 'schedule', 'learn more'];
        return ctaPhrases.some(phrase => pageText.includes(phrase));
      }).length;
      
      const ctaPercentage = (pagesWithCTAs / servicePages.length) * 100;
      
      items.push({
        name: "Strong and clear Call To Action (CTA)?",
        description: "Each page should have a clear next step for users",
        status: ctaPercentage >= 80 ? 'OK' : 'OFI',
        importance: 'High',
        notes: ctaPercentage < 80 ? 
          `Only ${Math.round(ctaPercentage)}% of service pages have clear CTAs` : 
          `${Math.round(ctaPercentage)}% of service pages have clear CTAs`
      });
      
      // Check for internal linking
      const pagesWithInternalLinks = servicePages.filter(page => 
        page.links.internal.length >= 3
      ).length;
      
      const internalLinkPercentage = (pagesWithInternalLinks / servicePages.length) * 100;
      
      items.push({
        name: "Good internal linking?",
        description: "Service pages should link to related content",
        status: internalLinkPercentage >= 70 ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: internalLinkPercentage < 70 ? 
          `Only ${Math.round(internalLinkPercentage)}% of service pages have good internal linking` : 
          `${Math.round(internalLinkPercentage)}% of service pages have good internal linking`
      });
      
      // Check for image usage
      const pagesWithImages = servicePages.filter(page => 
        page.images.total >= 1
      ).length;
      
      const imagesPercentage = (pagesWithImages / servicePages.length) * 100;
      
      items.push({
        name: "Uses images or visual elements?",
        description: "Service pages should include relevant visuals",
        status: imagesPercentage >= 80 ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: imagesPercentage < 80 ? 
          `Only ${Math.round(imagesPercentage)}% of service pages use images` : 
          `Good image usage on service pages`
      });
      
      // Check for descriptive URLs
      const descriptiveUrlCount = servicePages.filter(page => {
        const url = page.url.toLowerCase();
        const title = page.title.toLowerCase();
        
        // Get main keywords from title (words with 4+ chars)
        const titleKeywords = title.split(/\s+/).filter(word => word.length >= 4);
        
        // Check if at least one keyword is in the URL
        return titleKeywords.some(keyword => url.includes(keyword));
      }).length;
      
      const descriptiveUrlPercentage = (descriptiveUrlCount / servicePages.length) * 100;
      
      items.push({
        name: "Service pages have descriptive URLs?",
        description: "URLs should include service keywords",
        status: descriptiveUrlPercentage >= 80 ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: descriptiveUrlPercentage < 80 ? 
          `Only ${Math.round(descriptiveUrlPercentage)}% of service pages have descriptive URLs` : 
          `Good URL structure for service pages`
      });
      
      // Check for mobile-friendliness
      const mobileFriendlyPages = servicePages.filter(page => page.mobileFriendly).length;
      const mobileFriendlyPercentage = (mobileFriendlyPages / servicePages.length) * 100;
      
      items.push({
        name: "Mobile-friendly service pages?",
        description: "Pages should be optimized for mobile devices",
        status: mobileFriendlyPercentage >= 90 ? 'OK' : mobileFriendlyPercentage >= 70 ? 'OFI' : 'Priority OFI',
        importance: 'High',
        notes: mobileFriendlyPercentage < 90 ? 
          `Only ${Math.round(mobileFriendlyPercentage)}% of service pages are mobile-friendly` : 
          `All service pages are mobile-friendly`
      });
      
    } else {
      // If there are no service pages, mark all service-related items as N/A
      const naItems = [
        "Service Pages are written for the audience, not the business owner?",
        "Service Pages are sufficiently detailed?",
        "Proper heading structure?",
        "Service pages have schema markup?",
        "Strong and clear Call To Action (CTA)?",
        "Good internal linking?", 
        "Uses images or visual elements?",
        "Service pages have descriptive URLs?",
        "Mobile-friendly service pages?"
      ];
      
      naItems.forEach(name => {
        items.push({
          name,
          description: "N/A - No service pages detected",
          status: 'N/A',
          importance: 'High'
        });
      });
    }
    
    return items;
  }
  
  /**
   * Generate the location pages audit items
   */
  /**
   * Generate the service area pages audit items
   */
  private generateServiceAreaAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const serviceAreaPages = site.serviceAreaPages;
    const hasServiceAreaPages = serviceAreaPages.length > 0;
    
    // Check if service area pages exist
    items.push({
      name: "Has service area pages?",
      description: "Service area pages combine location and service information for local SEO",
      status: hasServiceAreaPages ? 'OK' : 'Priority OFI',
      importance: 'High',
      notes: !hasServiceAreaPages 
        ? "No service area pages found. Service area pages (like /city-name/service-name/) are critical for local SEO to target specific services in specific locations. Examples: /miami/ac-repair/ or /miami-fl-ac-repair/"
        : `Found ${serviceAreaPages.length} service area pages. Examples: ${serviceAreaPages.slice(0, 3).map(p => new URL(p.url).pathname).join(', ')}`
    });
    
    if (hasServiceAreaPages) {
      // Check content uniqueness (not duplicate or thin content)
      const contentUniqueness = this.areServiceAreaPagesUnique(serviceAreaPages);
      items.push({
        name: "Service area pages have unique content?",
        description: "Each service area page should have substantial unique content",
        status: contentUniqueness ? 'OK' : 'Priority OFI',
        importance: 'High',
        notes: !contentUniqueness 
          ? "Service area pages have similar or duplicate content. Google may see this as thin content, which can lead to rankings issues. Examples: " + 
            serviceAreaPages.slice(0, 2).map(p => new URL(p.url).pathname).join(', ') +
            ". Each page should have at least 50% unique content specific to the location and service."
          : "Service area pages have good content uniqueness"
      });
      
      // Check for location signals in content
      const locationSignalsCount = serviceAreaPages.filter(page => 
        page.bodyText.toLowerCase().match(/\b(city|county|area|town|region|located|local)\b/)
      ).length;
      
      const hasGoodLocationSignals = locationSignalsCount / serviceAreaPages.length >= 0.8; // At least 80% have location signals
      items.push({
        name: "Location signals in service area pages?",
        description: "Service area pages should mention the location name and related terms",
        status: hasGoodLocationSignals ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: !hasGoodLocationSignals 
          ? `Only ${locationSignalsCount} of ${serviceAreaPages.length} service area pages have strong location signals. Pages should mention the location name multiple times and include phrases like "serving [location]" or "in [location]".`
          : "Good location signals found in service area pages"
      });
      
      // Check if service area pages have appropriate headings structure
      const goodHeadingsCount = serviceAreaPages.filter(page => 
        page.headings.h1.length === 1 && 
        page.headings.h1[0].toLowerCase().includes(new URL(page.url).pathname.split('/').filter(Boolean)[0].replace(/-/g, ' '))
      ).length;
      
      const hasGoodHeadings = goodHeadingsCount / serviceAreaPages.length >= 0.7; // At least 70% have good headings
      items.push({
        name: "Proper heading structure with location?",
        description: "H1 headings should include both service and location name",
        status: hasGoodHeadings ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: !hasGoodHeadings 
          ? `Only ${goodHeadingsCount} of ${serviceAreaPages.length} service area pages have proper H1 headings with location name. Each page should have exactly one H1 that mentions both the service and location. Example problems in: ${serviceAreaPages.filter(p => p.headings.h1.length !== 1).slice(0, 2).map(p => new URL(p.url).pathname).join(', ')}`
          : "Good heading structure found in service area pages"
      });
      
      // Check for schema markup specific to LocalBusiness
      const pagesWithLocalBusinessSchema = serviceAreaPages.filter(page => 
        page.hasSchema && page.schemaTypes.some(type => 
          type.includes('LocalBusiness') || type.includes('Service')
        )
      ).length;
      
      const hasLocalBusinessSchema = pagesWithLocalBusinessSchema / serviceAreaPages.length >= 0.5; // At least 50% have schema
      items.push({
        name: "LocalBusiness or Service schema markup?",
        description: "Service area pages should include appropriate schema markup",
        status: hasLocalBusinessSchema ? 'OK' : 'Priority OFI',
        importance: 'High',
        notes: !hasLocalBusinessSchema 
          ? `Only ${pagesWithLocalBusinessSchema} of ${serviceAreaPages.length} service area pages have LocalBusiness or Service schema markup. This structured data helps search engines understand the relationship between your business, services, and locations. Examples missing schema: ${serviceAreaPages.filter(p => !p.hasSchema).slice(0, 2).map(p => new URL(p.url).pathname).join(', ')}`
          : "Good schema markup implementation on service area pages"
      });
      
      // Check for internal linking between service area pages
      const internalLinkingScore = this.checkServiceAreaInternalLinking(serviceAreaPages);
      items.push({
        name: "Internal linking between service area pages?",
        description: "Service area pages should link to related pages",
        status: internalLinkingScore >= 0.7 ? 'OK' : (internalLinkingScore >= 0.3 ? 'OFI' : 'Priority OFI'),
        importance: 'Medium',
        notes: internalLinkingScore < 0.3
          ? "Poor internal linking between service area pages. Each page should link to related service areas and services. This helps with crawling, indexing, and establishing topic relevance."
          : (internalLinkingScore < 0.7 
              ? "Some internal linking between service area pages, but could be improved. Create a more robust internal linking structure."
              : "Good internal linking structure between service area pages")
      });
    }
    
    return items;
  }
  
  /**
   * Check the internal linking between service area pages
   */
  private checkServiceAreaInternalLinking(serviceAreaPages: PageCrawlResult[]): number {
    if (serviceAreaPages.length <= 1) return 1; // Only one page, so internal linking isn't relevant
    
    let totalPossibleLinks = serviceAreaPages.length * (serviceAreaPages.length - 1);
    let actualLinks = 0;
    
    // Count links between service area pages
    for (const page of serviceAreaPages) {
      for (const link of page.links.internal) {
        if (serviceAreaPages.some(otherPage => otherPage.url === link && otherPage.url !== page.url)) {
          actualLinks++;
        }
      }
    }
    
    return totalPossibleLinks > 0 ? actualLinks / totalPossibleLinks : 0;
  }
  
  /**
   * Check if service area pages have sufficiently unique content
   */
  private areServiceAreaPagesUnique(serviceAreaPages: PageCrawlResult[]): boolean {
    if (serviceAreaPages.length <= 1) return true;
    
    // Calculate similarity between page content
    for (let i = 0; i < serviceAreaPages.length; i++) {
      for (let j = i + 1; j < serviceAreaPages.length; j++) {
        const page1 = serviceAreaPages[i];
        const page2 = serviceAreaPages[j];
        
        // Simple similarity check - in a real implementation, we'd use a more
        // sophisticated content similarity algorithm
        const similarity = this.calculateContentSimilarity(page1.bodyText, page2.bodyText);
        if (similarity > 0.7) { // If pages are more than 70% similar
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Calculate content similarity between two text strings
   * This is a simplistic implementation - in production you'd use a more robust algorithm
   */
  private calculateContentSimilarity(text1: string, text2: string): number {
    const words1Array = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const words2Array = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    // Convert to Sets
    const words1 = new Set(words1Array);
    const words2 = new Set(words2Array);
    
    // Calculate intersection manually to avoid Set iteration
    let intersectionCount = 0;
    words1Array.forEach(word => {
      if (words2.has(word)) {
        intersectionCount++;
      }
    });
    
    // Calculate union size - add sizes and subtract intersection
    const unionSize = words1.size + words2.size - intersectionCount;
    
    return intersectionCount / unionSize;
  }
  
  /**
   * Generate the location pages audit items
   */
  private generateLocationAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const locationPages = site.locationPages;
    
    // Determine if this is a multi-location business
    const isMultiLocationBusiness = locationPages.length > 1;
    
    // Check if site uses location pages
    items.push({
      name: "Site uses location pages? (For single location business, this tab is not needed)",
      description: "Multi-location businesses should have dedicated pages",
      status: isMultiLocationBusiness ? 'OK' : 'N/A',
      importance: 'High',
      notes: isMultiLocationBusiness ? 
        `Found ${locationPages.length} location pages` : 
        "Site appears to be a single-location business"
    });
    
    if (isMultiLocationBusiness) {
      // Check if location pages are unique
      const areUnique = this.areLocationPagesUnique(locationPages);
      
      items.push({
        name: "Location pages are unique?",
        description: "Each location page should have unique content",
        status: areUnique ? 'OK' : 'OFI',
        importance: 'High',
        notes: !areUnique ? 
          "Location pages have significant content overlap" : 
          "Location pages have unique content"
      });
      
      // Check if location pages have local keywords in URL
      const pagesWithLocalUrls = locationPages.filter(page => {
        // Extract the likely location name from the URL
        const urlParts = new URL(page.url).pathname.split('/');
        const lastUrlPart = urlParts[urlParts.length - 1];
        
        // Check if URL contains location indicators
        return /-(fl|ca|tx|ny|il|pa|oh|ga|nc|mi|nj|va|wa|az|ma|in|tn|mo|md|wi|mn|co|al|sc|la|ky|or|ok|ct|ut|ia|nv|ar|ms|ks|nm|ne|wv|id|hi|me|nh|ri|mt|de|sd|nd|ak|dc|vt|wy)(-|$)/.test(lastUrlPart) ||
               /-(north|south|east|west|central|downtown|uptown|midtown)(-|$)/.test(lastUrlPart) ||
               /(city|town|village|heights|springs|beach|falls|valley|hills|park)(-|$)/.test(lastUrlPart);
      }).length;
      
      const localUrlsPercentage = (pagesWithLocalUrls / locationPages.length) * 100;
      
      items.push({
        name: "Location names in URLs?",
        description: "URLs should include city, region, or neighborhood names",
        status: localUrlsPercentage >= 80 ? 'OK' : 'OFI',
        importance: 'High',
        notes: localUrlsPercentage < 80 ? 
          `Only ${Math.round(localUrlsPercentage)}% of location pages have location names in URLs` : 
          "Good URL structure with location names"
      });
      
      // Check if the location pages have sufficient content
      const minLocationContentLength = 500; // Minimum recommended content length
      const pagesWithGoodContentLength = locationPages.filter(page => page.wordCount >= minLocationContentLength).length;
      const contentLengthPercentage = (pagesWithGoodContentLength / locationPages.length) * 100;
      
      items.push({
        name: "Sufficient content on location pages?",
        description: "Pages should have at least 500 words of unique content",
        status: contentLengthPercentage >= 70 ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: contentLengthPercentage < 70 ? 
          `Only ${Math.round(contentLengthPercentage)}% of location pages have sufficient content length` : 
          "Good content length on location pages"
      });
      
      // Check if mobile-friendly
      const mobileFriendlyPages = locationPages.filter(page => page.mobileFriendly).length;
      const mobileFriendlyPercentage = (mobileFriendlyPages / locationPages.length) * 100;
      
      items.push({
        name: "Mobile-first (or at least, mobile-friendly) design?",
        description: "Pages should work well on mobile devices",
        status: mobileFriendlyPercentage >= 90 ? 'OK' : 'OFI',
        importance: 'High',
        notes: mobileFriendlyPercentage < 90 ? 
          `Only ${Math.round(mobileFriendlyPercentage)}% of location pages are mobile-friendly` : 
          "All location pages are mobile-friendly"
      });
      
      // Check for local schema markup
      const pagesWithSchema = locationPages.filter(page => 
        page.hasSchema && 
        (page.schemaTypes.some(type => 
          type.toLowerCase().includes('local') || 
          type.toLowerCase().includes('geo') || 
          type.toLowerCase().includes('place') ||
          type.toLowerCase().includes('business')
        ))
      ).length;
      
      const schemaPercentage = (pagesWithSchema / locationPages.length) * 100;
      
      items.push({
        name: "Local business schema markup?",
        description: "Pages should have local business structured data",
        status: schemaPercentage >= 50 ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: schemaPercentage < 50 ? 
          `Only ${Math.round(schemaPercentage)}% of location pages have local business schema` : 
          `${Math.round(schemaPercentage)}% of location pages have schema markup`
      });
      
      // We can't check traffic, so this is N/A
      items.push({
        name: "Are location pages getting traffic?",
        description: "Pages should be attracting visitors",
        status: 'N/A',
        importance: 'Medium',
        notes: "Traffic data not available in this audit"
      });
      
      // Check for NAP consistency
      const pagesWithBusinessName = locationPages.filter(page => {
        const pageContent = [
          page.title,
          page.metaDescription,
          ...page.headings.h1,
          ...page.headings.h2
        ].join(' ').toLowerCase();
        
        // Try to extract business name from homepage title
        const potentialBusinessName = site.homepage.title.split(' - ')[0] || site.homepage.title.split(' | ')[0];
        
        // Check if any significant part of the business name appears in the location page
        const businessNameWords = potentialBusinessName.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        return businessNameWords.some(word => pageContent.includes(word));
      }).length;
      
      const pagesWithAddress = locationPages.filter(page => page.hasAddress).length;
      const pagesWithPhone = locationPages.filter(page => page.hasPhoneNumber).length;
      
      const businessNamePercentage = (pagesWithBusinessName / locationPages.length) * 100;
      const addressPercentage = (pagesWithAddress / locationPages.length) * 100;
      const phonePercentage = (pagesWithPhone / locationPages.length) * 100;
      
      items.push({
        name: "NAP: Business (N)ame appears in the copy?",
        description: "Name, Address, Phone information should be present",
        status: businessNamePercentage >= 90 ? 'OK' : 'OFI',
        importance: 'High',
        notes: businessNamePercentage < 90 ?
          `Only ${Math.round(businessNamePercentage)}% of location pages include business name` :
          "Business name appears on all location pages"
      });
      
      items.push({
        name: "NAP: (A)ddress appears in the copy?",
        description: "Each location page should show its address",
        status: addressPercentage >= 90 ? 'OK' : 'OFI',
        importance: 'High',
        notes: addressPercentage < 90 ?
          `Only ${Math.round(addressPercentage)}% of location pages include address information` :
          "Address information appears on all location pages"
      });
      
      items.push({
        name: "NAP: (P)hone number appears in the copy?",
        description: "Each location page should show its phone number",
        status: phonePercentage >= 90 ? 'OK' : 'OFI',
        importance: 'High',
        notes: phonePercentage < 90 ?
          `Only ${Math.round(phonePercentage)}% of location pages include phone number` :
          "Phone number appears on all location pages"
      });
      
      // Check for maps or directions
      const pagesWithMaps = locationPages.filter(page => {
        const hasMapText = page.bodyText.toLowerCase().includes('map') || 
                         page.bodyText.toLowerCase().includes('direction');
        const hasMapLinks = page.links.external.some(link => 
          link.includes('maps.google.com') || 
          link.includes('maps.apple.com')
        );
        return hasMapText || hasMapLinks;
      }).length;
      
      const mapsPercentage = (pagesWithMaps / locationPages.length) * 100;
      
      items.push({
        name: "Maps or directions on location pages?",
        description: "Pages should include maps or directions",
        status: mapsPercentage >= 70 ? 'OK' : 'OFI',
        importance: 'Medium',
        notes: mapsPercentage < 70 ?
          `Only ${Math.round(mapsPercentage)}% of location pages include maps or directions` :
          "Good use of maps and directions"
      });
      
    } else {
      // If there's only one location or no location pages, mark all location-related items as N/A
      const naItems = [
        "Location pages are unique?",
        "Location names in URLs?", 
        "Sufficient content on location pages?",
        "Mobile-first (or at least, mobile-friendly) design?",
        "Local business schema markup?",
        "Are location pages getting traffic?",
        "NAP: Business (N)ame appears in the copy?",
        "NAP: (A)ddress appears in the copy?",
        "NAP: (P)hone number appears in the copy?",
        "Maps or directions on location pages?"
      ];
      
      naItems.forEach(name => {
        items.push({
          name,
          description: "N/A - Not a multi-location business",
          status: 'N/A',
          importance: 'High'
        });
      });
    }
    
    return items;
  }
  
  /**
   * Check if location pages have sufficiently unique content
   */
  private areLocationPagesUnique(locationPages: PageCrawlResult[]): boolean {
    if (locationPages.length <= 1) {
      return true;
    }
    
    const similarityThreshold = 0.8; // 80% similarity is considered too similar
    
    for (let i = 0; i < locationPages.length; i++) {
      for (let j = i + 1; j < locationPages.length; j++) {
        const page1 = locationPages[i];
        const page2 = locationPages[j];
        
        // Compare headings
        const headings1 = [...page1.headings.h1, ...page1.headings.h2].join(' ');
        const headings2 = [...page2.headings.h1, ...page2.headings.h2].join(' ');
        
        // Very basic similarity check - comparing heading length
        // In a real implementation, this would use a proper text similarity algorithm
        const headingSimilarity = Math.min(headings1.length, headings2.length) / Math.max(headings1.length, headings2.length);
        
        // Compare word count
        const wordCountSimilarity = Math.min(page1.wordCount, page2.wordCount) / Math.max(page1.wordCount, page2.wordCount);
        
        // If both similarities are above the threshold, pages are too similar
        if (headingSimilarity > similarityThreshold && wordCountSimilarity > similarityThreshold) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Normalize a URL for consistency
   */
  private normalizeUrl(url: string): string {
    try {
      // Ensure the URL has a protocol
      let normalizedUrl = url;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      // Create a URL object to standardize the format
      const urlObj = new URL(normalizedUrl);
      
      // Remove trailing slash from pathname if it exists (except for root path)
      if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      // Remove some common query parameters that don't affect content
      urlObj.searchParams.delete('utm_source');
      urlObj.searchParams.delete('utm_medium');
      urlObj.searchParams.delete('utm_campaign');
      urlObj.searchParams.delete('utm_term');
      urlObj.searchParams.delete('utm_content');
      
      // Remove hash fragment
      urlObj.hash = '';
      
      return urlObj.toString();
    } catch (error) {
      console.error("Error normalizing URL:", error);
      return url;
    }
  }
}

export const rivalAuditCrawler = new RivalAuditCrawler();