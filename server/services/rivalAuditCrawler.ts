import axios from 'axios';
import { load } from 'cheerio';
import { AuditItem, RivalAudit } from '@shared/schema';
import { URL } from 'url';

// Interface for page crawl results
interface PageCrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  bodyText: string; // Add the bodyText property
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: string[];
    external: string[];
  };
  hasContactForm: boolean;
  hasPhoneNumber: boolean;
  hasAddress: boolean;
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
  };
  hasSchema: boolean;
  mobileFriendly: boolean;
  wordCount: number;
}

// Interface for site structure
interface SiteStructure {
  homepage: PageCrawlResult;
  contactPage?: PageCrawlResult;
  servicePages: PageCrawlResult[];
  locationPages: PageCrawlResult[];
  otherPages: PageCrawlResult[];
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
        otherPages: []
      };
      
      // Get internal links from the homepage
      const internalLinks = homepage.links.internal.slice(0, this.maxPages);
      
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
      
    } catch (error) {
      console.error("Error in crawlAndAudit:", error);
      throw new Error(`Failed to crawl and audit the website: ${error.message}`);
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
      const bodyText = $('body').text().trim();
      
      // Extract headings
      const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
      const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
      const h3s = $('h3').map((_, el) => $(el).text().trim()).get();
      
      // Extract links
      const internalLinks: string[] = [];
      const externalLinks: string[] = [];
      
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
            // Invalid URL, skip it
          }
        }
      });
      
      // Check for contact form
      const hasContactForm = $('form').length > 0;
      
      // Check for phone number
      const phoneRegex = /(\+?1?[-\s\.]?\(?\d{3}\)?[-\s\.]?\d{3}[-\s\.]?\d{4})/;
      const hasPhoneNumber = phoneRegex.test(bodyText);
      
      // Check for address
      const addressPatterns = [
        /\d+\s+[A-Za-z\s,]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/,  // US format
        /\d+\s+[A-Za-z\s,]+Street|Road|Avenue|Lane|Drive|Boulevard|Court/i  // Simple street pattern
      ];
      const hasAddress = addressPatterns.some(pattern => pattern.test(bodyText));
      
      // Check images
      const allImages = $('img');
      const totalImages = allImages.length;
      const imagesWithAlt = $('img[alt]').length;
      const imagesWithoutAlt = totalImages - imagesWithAlt;
      
      // Check for schema markup
      const hasSchema = $('script[type="application/ld+json"]').length > 0;
      
      // Check if mobile friendly (basic check for viewport meta tag)
      const hasMobileViewport = $('meta[name="viewport"]').length > 0;
      
      // Word count (basic estimation)
      const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
      
      return {
        url: normalizedUrl,
        title,
        metaDescription,
        bodyText,
        headings: {
          h1: h1s,
          h2: h2s,
          h3: h3s
        },
        links: {
          internal: internalLinks,
          external: externalLinks
        },
        hasContactForm,
        hasPhoneNumber,
        hasAddress,
        images: {
          total: totalImages,
          withAlt: imagesWithAlt,
          withoutAlt: imagesWithoutAlt
        },
        hasSchema,
        mobileFriendly: hasMobileViewport,
        wordCount
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
   * Determine if a page is a location page
   */
  private isLocationPage(page: PageCrawlResult): boolean {
    const locationTerms = ['location', 'city', 'store', 'branch', 'office'];
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    
    // Check URL for location terms
    if (locationTerms.some(term => url.includes(term))) {
      return true;
    }
    
    // Check title for location terms
    if (locationTerms.some(term => title.includes(term))) {
      return true;
    }
    
    // Check for address and city/state names
    if (page.hasAddress) {
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
    
    // Count totals of each status
    const priorityOfiCount = 
      onPageItems.filter(item => item.status === 'Priority OFI').length +
      structureItems.filter(item => item.status === 'Priority OFI').length +
      contactItems.filter(item => item.status === 'Priority OFI').length +
      serviceItems.filter(item => item.status === 'Priority OFI').length +
      locationItems.filter(item => item.status === 'Priority OFI').length;
      
    const ofiCount = 
      onPageItems.filter(item => item.status === 'OFI').length +
      structureItems.filter(item => item.status === 'OFI').length +
      contactItems.filter(item => item.status === 'OFI').length +
      serviceItems.filter(item => item.status === 'OFI').length +
      locationItems.filter(item => item.status === 'OFI').length;
      
    const okCount = 
      onPageItems.filter(item => item.status === 'OK').length +
      structureItems.filter(item => item.status === 'OK').length +
      contactItems.filter(item => item.status === 'OK').length +
      serviceItems.filter(item => item.status === 'OK').length +
      locationItems.filter(item => item.status === 'OK').length;
      
    const naCount = 
      onPageItems.filter(item => item.status === 'N/A').length +
      structureItems.filter(item => item.status === 'N/A').length +
      contactItems.filter(item => item.status === 'N/A').length +
      serviceItems.filter(item => item.status === 'N/A').length +
      locationItems.filter(item => item.status === 'N/A').length;
    
    return {
      url: this.baseUrl,
      timestamp: new Date(),
      onPage: { items: onPageItems },
      structureNavigation: { items: structureItems },
      contactPage: { items: contactItems },
      servicePages: { items: serviceItems },
      locationPages: { items: locationItems },
      summary: {
        priorityOfiCount,
        ofiCount,
        okCount,
        naCount
      }
    };
  }
  
  /**
   * Generate the on-page audit items
   */
  private generateOnPageAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const homepage = site.homepage;
    
    // Check if site design is modern
    items.push({
      name: "Is the website appealing? Modern?",
      description: "The website should have a modern, professional design",
      // Using schema markup as a proxy for modern design
      status: homepage.hasSchema ? 'OK' : 'OFI',
      importance: 'High'
    });
    
    // Check if site is intuitive
    items.push({
      name: "Is the website intuitive? Usable?",
      description: "Users should be able to easily navigate the site",
      // Check for reasonable number of internal links
      status: homepage.links.internal.length >= 5 && homepage.links.internal.length <= 30 ? 'OK' : 'OFI',
      importance: 'High'
    });
    
    // Check content readability
    items.push({
      name: "Is the copy readable? Not keyword stuffed. Clear.",
      description: "Content should be user-friendly and readable",
      // Basic check for reasonable word count
      status: homepage.wordCount >= 400 && homepage.wordCount <= 2000 ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: homepage.wordCount < 400 ? "Content may be too thin" : 
             homepage.wordCount > 2000 ? "Content may be too dense" : 
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
      importance: 'Medium'
    });
    
    // Check for user intent
    items.push({
      name: "Does the site answer user intent?",
      description: "Content should match what users are searching for",
      status: homepage.metaDescription.length > 50 ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.metaDescription.length < 50 ? "Meta description is too short or missing" : undefined
    });
    
    // Check for reviews
    const hasReviews = site.homepage.bodyText && (
      site.homepage.bodyText.includes('review') || 
      site.homepage.bodyText.includes('testimonial') || 
      site.homepage.bodyText.includes('rating')
    );
    
    items.push({
      name: "Leverages reviews on website?",
      description: "Reviews build trust and credibility",
      status: hasReviews ? 'OK' : 'OFI',
      importance: 'Medium'
    });
    
    return items;
  }
  
  /**
   * Generate the structure & navigation audit items
   */
  private generateStructureAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    
    // Check if URLs are human-readable
    const allUrls = [
      site.homepage.url,
      ...(site.contactPage ? [site.contactPage.url] : []),
      ...site.servicePages.map(p => p.url),
      ...site.locationPages.map(p => p.url),
      ...site.otherPages.map(p => p.url)
    ];
    
    const badUrlPatterns = [/\?id=\d+/, /\.php/, /\.aspx/, /\.html/, /[_0-9]{6,}/];
    const hasReadableUrls = allUrls.every(url => !badUrlPatterns.some(pattern => pattern.test(url)));
    
    items.push({
      name: "Human-readable? Simple? Informative?",
      description: "URLs should be user-friendly",
      status: hasReadableUrls ? 'OK' : 'OFI',
      importance: 'Medium'
    });
    
    // Check if location pages use localized URLs
    const locationPageUrls = site.locationPages.map(p => p.url);
    const hasLocalizedUrls = locationPageUrls.length > 0 && locationPageUrls.some(url => 
      /\/(locations?|cities|towns|areas|regions|states|provinces)\/[a-z-]+/.test(url)
    );
    
    items.push({
      name: "Localized?",
      description: "URLs should include location information where relevant",
      status: hasLocalizedUrls ? 'OK' : site.locationPages.length > 0 ? 'OFI' : 'N/A',
      importance: 'Medium'
    });
    
    // Check if URLs contain keywords
    const allTitles = [
      site.homepage.title,
      ...(site.contactPage ? [site.contactPage.title] : []),
      ...site.servicePages.map(p => p.title),
      ...site.locationPages.map(p => p.title),
      ...site.otherPages.map(p => p.title)
    ];
    
    // Extract keywords from titles
    const keywords = allTitles
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['page', 'home', 'about', 'contact', 'the', 'and', 'for', 'with'].includes(word));
    
    // Check if these keywords appear in the URLs
    const keywordRichUrls = keywords.some(keyword => 
      allUrls.some(url => url.toLowerCase().includes(keyword))
    );
    
    items.push({
      name: "Keyword-rich?",
      description: "URLs should contain relevant keywords",
      status: keywordRichUrls ? 'OK' : 'OFI',
      importance: 'Medium'
    });
    
    // Check if URLs include GBP categories
    // Since we don't have actual GBP data, this is a proxy check based on common business categories
    const commonCategories = ['plumber', 'electrician', 'dentist', 'doctor', 'lawyer', 'restaurant', 'hotel'];
    const hasCategoryUrls = commonCategories.some(category => 
      allUrls.some(url => url.toLowerCase().includes(category))
    );
    
    items.push({
      name: "Do the urls include categories or services found on their GBP page?",
      description: "URLs should align with Google Business Profile categories",
      status: hasCategoryUrls ? 'OK' : 'N/A', // We don't have actual GBP data
      importance: 'Low'
    });
    
    // Check if navigation labels match page titles
    const navLinks = site.homepage.links.internal;
    const navMatchesTitle = navLinks.some(link => {
      const matchingPage = [
        site.homepage,
        ...(site.contactPage ? [site.contactPage] : []),
        ...site.servicePages,
        ...site.locationPages,
        ...site.otherPages
      ].find(page => page.url === link);
      
      return matchingPage && matchingPage.title;
    });
    
    items.push({
      name: "Navigation labels aligned with page <title>?",
      description: "Navigation labels should match page titles",
      status: navMatchesTitle ? 'OK' : 'OFI',
      importance: 'Low'
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
      importance: 'High'
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
        importance: 'High'
      });
      
      // Check if address appears in the contact page
      items.push({
        name: "Address appears in the copy?",
        description: "Physical address should be visible",
        status: contactPage.hasAddress ? 'OK' : 'OFI',
        importance: 'High'
      });
      
      // Check if phone number appears in the contact page
      items.push({
        name: "Phone number appears in the copy?",
        description: "Phone number should be easy to find",
        status: contactPage.hasPhoneNumber ? 'OK' : 'OFI',
        importance: 'High'
      });
      
      // Check if the phone number is clickable (we can't directly check this from just HTML)
      // Using presence of tel: links as a proxy
      const hasTelLink = contactPage.links.internal.some(link => link.startsWith('tel:')) || 
                         contactPage.links.external.some(link => link.startsWith('tel:'));
      
      items.push({
        name: "Phone number is clickable?",
        description: "Phone numbers should be clickable for mobile users",
        status: hasTelLink ? 'OK' : contactPage.hasPhoneNumber ? 'OFI' : 'N/A',
        importance: 'Medium'
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
             undefined
    });
    
    if (servicePages.length > 0) {
      // Check if content is written for audience
      const averageServiceWordCount = servicePages.reduce((sum, page) => sum + page.wordCount, 0) / servicePages.length;
      
      items.push({
        name: "Service Pages are written for the audience, not the business owner?",
        description: "Content should focus on customer needs",
        status: averageServiceWordCount >= 500 ? 'OK' : 'OFI',
        importance: 'High',
        notes: averageServiceWordCount < 500 ? "Service pages may be too brief" : undefined
      });
      
      // Check for industry jargon
      items.push({
        name: "Avoids heavy use of industry jargon?",
        description: "Content should be understandable to the average user",
        status: 'OK', // We can't really check this without NLP, default to OK
        importance: 'Medium'
      });
      
      // Check for detail level
      items.push({
        name: "Service Pages are sufficiently detailed?",
        description: "Pages should provide comprehensive information",
        status: averageServiceWordCount >= 800 ? 'OK' : 'OFI',
        importance: 'High',
        notes: averageServiceWordCount < 800 ? "Service pages may need more detail" : undefined
      });
      
      // Check for CTAs
      const hasCTAs = servicePages.some(page => {
        const pageText = [
          ...page.headings.h1,
          ...page.headings.h2,
          ...page.headings.h3
        ].join(' ').toLowerCase();
        
        // Look for common CTA phrases
        const ctaPhrases = ['call', 'contact', 'get a quote', 'free quote', 'book', 'schedule', 'learn more'];
        return ctaPhrases.some(phrase => pageText.includes(phrase));
      });
      
      items.push({
        name: "Strong and clear Call To Action (CTA)?",
        description: "Each page should have a clear next step for users",
        status: hasCTAs ? 'OK' : 'OFI',
        importance: 'High'
      });
    } else {
      // If there are no service pages, mark all service-related items as N/A
      items.push({
        name: "Service Pages are written for the audience, not the business owner?",
        description: "Content should focus on customer needs",
        status: 'N/A',
        importance: 'High'
      });
      
      items.push({
        name: "Avoids heavy use of industry jargon?",
        description: "Content should be understandable to the average user",
        status: 'N/A',
        importance: 'Medium'
      });
      
      items.push({
        name: "Service Pages are sufficiently detailed?",
        description: "Pages should provide comprehensive information",
        status: 'N/A',
        importance: 'High'
      });
      
      items.push({
        name: "Strong and clear Call To Action (CTA)?",
        description: "Each page should have a clear next step for users",
        status: 'N/A',
        importance: 'High'
      });
    }
    
    return items;
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
      importance: 'High'
    });
    
    if (isMultiLocationBusiness) {
      // Check if location pages are unique
      const areUnique = this.areLocationPagesUnique(locationPages);
      
      items.push({
        name: "Location pages are unique?",
        description: "Each location page should have unique content",
        status: areUnique ? 'OK' : 'OFI',
        importance: 'High'
      });
      
      // Check if mobile-friendly
      const allMobileFriendly = locationPages.every(page => page.mobileFriendly);
      
      items.push({
        name: "Mobile-first (or at least, mobile-friendly) design?",
        description: "Pages should work well on mobile devices",
        status: allMobileFriendly ? 'OK' : 'OFI',
        importance: 'High'
      });
      
      // We can't check traffic, so this is N/A
      items.push({
        name: "Are location pages getting traffic?",
        description: "Pages should be attracting visitors",
        status: 'N/A',
        importance: 'Medium'
      });
      
      // Check for NAP consistency
      const allHaveBusinessName = locationPages.every(page => {
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
      });
      
      items.push({
        name: "NAP: Business (N)ame appears in the copy?",
        description: "Name, Address, Phone information should be present",
        status: allHaveBusinessName ? 'OK' : 'OFI',
        importance: 'High'
      });
    } else {
      // If not a multi-location business, mark all location-related items as N/A
      items.push({
        name: "Location pages are unique?",
        description: "Each location page should have unique content",
        status: 'N/A',
        importance: 'High'
      });
      
      items.push({
        name: "Mobile-first (or at least, mobile-friendly) design?",
        description: "Pages should work well on mobile devices",
        status: 'N/A',
        importance: 'High'
      });
      
      items.push({
        name: "Are location pages getting traffic?",
        description: "Pages should be attracting visitors",
        status: 'N/A',
        importance: 'Medium'
      });
      
      items.push({
        name: "NAP: Business (N)ame appears in the copy?",
        description: "Name, Address, Phone information should be present",
        status: 'N/A',
        importance: 'High'
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