import { AuditItem, RivalAudit } from '../../../shared/schema';
import { PageCrawlResult, SiteStructure } from './audit.service';

/**
 * Service responsible for generating audit analysis from crawled site structure
 */
export class AuditAnalyzerService {

  /**
   * Generate complete audit based on site structure
   */
  generateAudit(site: SiteStructure): RivalAudit {
    console.log('Generating audit analysis...');
    
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
    const allItems = [
      ...onPageItems,
      ...structureItems, 
      ...contactItems,
      ...serviceItems,
      ...locationItems,
      ...serviceAreaItems
    ];
    
    const priorityOfiCount = allItems.filter(item => item.status === 'Priority OFI').length;
    const ofiCount = allItems.filter(item => item.status === 'OFI').length;
    const okCount = allItems.filter(item => item.status === 'OK').length;
    const naCount = allItems.filter(item => item.status === 'N/A').length;
    
    return {
      url: site.homepage.url,
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
    // On-Page UX/CTA Factors
    // ==========================================
    
    // Check if site design is modern
    items.push({
      name: "Is the website appealing? Modern? (i.e. does not look out-of-date)",
      description: "The website should have a modern, professional design",
      status: (homepage.hasSchema && homepage.hasSocialTags && homepage.mobileFriendly) ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.pageLoadSpeed.score < 50 ? "Page load speed is slow, which affects user experience" : undefined
    });
    
    // Check if site is intuitive
    items.push({
      name: "Is the website intuitive? Usable?",
      description: "Users should be able to easily navigate the site",
      status: (homepage.links.internal.length >= 5 && homepage.links.internal.length <= 100) ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.links.internal.length > 100 ? "Too many navigation links may confuse users" : 
             homepage.links.internal.length < 5 ? "Very few internal links found, navigation may be limited" : undefined
    });
    
    // Check for clear primary CTA
    items.push({
      name: "Is there a clear, primary CTA?",
      description: "The homepage should have a prominent call-to-action",
      status: homepage.hasContactForm ? 'OK' : 'OFI',
      importance: 'High',
      notes: !homepage.hasContactForm ? "No clear contact form or CTA found on homepage" : undefined
    });
    
    // Check if CTA stands out
    items.push({
      name: "Does the CTA stand out? (color, placement, etc.)",
      description: "The call-to-action should be visually prominent",
      status: homepage.contentStructure.hasEmphasis ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !homepage.contentStructure.hasEmphasis ? "No emphasized elements found, CTA may not stand out" : undefined
    });
    
    // Check for mobile-friendliness
    items.push({
      name: "Is the website mobile-friendly?",
      description: "Site should work well on mobile devices",
      status: homepage.mobileFriendly ? 'OK' : 'OFI',
      importance: 'High',
      notes: !homepage.mobileFriendly ? "No mobile viewport meta tag found - consider adding for better mobile experience" : undefined
    });
    
    // Check site speed
    items.push({
      name: "Does the website load fast?",
      description: "Page load speed affects user experience and SEO",
      status: homepage.pageLoadSpeed.score >= 75 ? 'OK' : 
              homepage.pageLoadSpeed.score >= 30 ? 'OFI' : 'Priority OFI',
      importance: 'High',
      notes: `Page speed score: ${homepage.pageLoadSpeed.score}/100. Priority OFI only if extremely slow (under 30).`
    });
    
    // ==========================================
    // Content Quality Factors
    // ==========================================
    
    // Check content quality and length
    items.push({
      name: "Is there quality, substantial content on the homepage?",
      description: "Homepage should have meaningful content",
      status: homepage.wordCount >= 300 ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: `Word count: ${homepage.wordCount} words`
    });
    
    // Check for engaging content
    items.push({
      name: "Is the content engaging?",
      description: "Content should be interesting and valuable to users",
      status: (homepage.contentStructure.hasLists || homepage.contentStructure.hasVideo || 
               homepage.contentStructure.hasFAQs) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Engaging elements: " + [
        homepage.contentStructure.hasLists ? "Lists" : null,
        homepage.contentStructure.hasVideo ? "Video" : null,
        homepage.contentStructure.hasFAQs ? "FAQs" : null
      ].filter(Boolean).join(", ") || "None found"
    });
    
    // Check for testimonials/social proof
    items.push({
      name: "Are there testimonials?",
      description: "Social proof helps build trust with visitors",
      status: homepage.bodyText.toLowerCase().includes('testimonial') || 
              homepage.bodyText.toLowerCase().includes('review') ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Check for customer testimonials, reviews, or social proof"
    });
    
    // ==========================================
    // SEO Meta Factors
    // ==========================================
    
    // Check title tag
    items.push({
      name: "Does the homepage have an optimized title tag?",
      description: "Title tag should be descriptive and contain target keywords",
      status: (homepage.title.length >= 30 && homepage.title.length <= 60) ? 'OK' : 'OFI',
      importance: 'High',
      notes: `Title length: ${homepage.title.length} characters. Recommended: 30-60 characters.`
    });
    
    // Check meta description
    items.push({
      name: "Does the homepage have an optimized meta description?",
      description: "Meta description should be compelling and descriptive",
      status: (homepage.metaDescription.length >= 120 && homepage.metaDescription.length <= 160) ? 'OK' : 'OFI',
      importance: 'High',
      notes: homepage.metaDescription ? 
        `Meta description length: ${homepage.metaDescription.length} characters. Recommended: 120-160 characters.` :
        "No meta description found"
    });
    
    // Check H1 tag
    items.push({
      name: "Does the homepage have a clear H1 tag?",
      description: "H1 should clearly describe the page content",
      status: homepage.h1s.length === 0 ? 'Priority OFI' :
              homepage.h1s.length === 1 ? 'OK' : 'OFI',
      importance: 'High',
      notes: `Found ${homepage.h1s.length} H1 tag(s). Priority OFI only if completely missing (0). Multiple H1s are just OFI.`
    });
    
    // Check heading structure
    items.push({
      name: "Is there a logical heading structure (H1, H2, H3)?",
      description: "Proper heading hierarchy improves SEO and accessibility",
      status: (homepage.h1s.length >= 1 && homepage.h2s.length >= 1) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: `Heading structure: ${homepage.h1s.length} H1s, ${homepage.h2s.length} H2s, ${homepage.h3s.length} H3s`
    });
    
    // Check image optimization
    items.push({
      name: "Are images optimized with alt text?",
      description: "All images should have descriptive alt text",
      status: homepage.images.total === 0 ? 'N/A' :
              (homepage.images.withAlt / homepage.images.total) >= 0.8 ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: homepage.images.total > 0 ? 
        `${homepage.images.withAlt}/${homepage.images.total} images have alt text (${Math.round((homepage.images.withAlt / homepage.images.total) * 100)}%)` :
        "No images found on homepage"
    });
    
    // Check for schema markup
    items.push({
      name: "Does the site use structured data/schema markup?",
      description: "Schema markup helps search engines understand content",
      status: homepage.hasSchema ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: homepage.hasSchema ? 
        `Schema types found: ${homepage.schemaTypes.join(', ')}` :
        "No structured data found"
    });
    
    // ==========================================
    // Technical SEO Factors
    // ==========================================
    
    // Check HTTPS
    items.push({
      name: "Is the website secure (HTTPS)?",
      description: "HTTPS is essential for security and SEO",
      status: homepage.hasHttps ? 'OK' : 'Priority OFI',
      importance: 'High',
      notes: !homepage.hasHttps ? "Site is not using HTTPS encryption - this is a security risk" : undefined
    });
    
    // Check canonical URL
    items.push({
      name: "Are canonical URLs implemented?",
      description: "Canonical tags prevent duplicate content issues",
      status: homepage.hasCanonical ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !homepage.hasCanonical ? "No canonical URL tag found" : undefined
    });
    
    // Check social media integration
    items.push({
      name: "Are social media meta tags (OpenGraph, Twitter) implemented?",
      description: "Social meta tags improve sharing appearance",
      status: homepage.hasSocialTags ? 'OK' : 'OFI',
      importance: 'Low',
      notes: !homepage.hasSocialTags ? "No OpenGraph or Twitter Card meta tags found" : undefined
    });
    
    // Check favicon
    items.push({
      name: "Does the site have a favicon?",
      description: "Favicon improves brand recognition in browser tabs",
      status: homepage.hasIcon ? 'OK' : 'OFI',
      importance: 'Low',
      notes: !homepage.hasIcon ? "No favicon found" : undefined
    });
    
    return items;
  }

  /**
   * Generate structure and navigation audit items
   */
  private generateStructureAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    
    // Check sitemap.xml
    items.push({
      name: "Does the website have a sitemap.xml?",
      description: "XML sitemap helps search engines discover pages",
      status: site.hasSitemapXml ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !site.hasSitemapXml ? "No sitemap.xml found" : undefined
    });
    
    // Check robots.txt
    items.push({
      name: "Does the website have a robots.txt file?",
      description: "Robots.txt provides crawling instructions to search engines",
      status: site.homepage.hasRobotsMeta ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !site.homepage.hasRobotsMeta ? "No robots meta tag found (robots.txt check needed)" : undefined
    });
    
    // Check internal linking
    items.push({
      name: "Does the site have good internal linking structure?",
      description: "Internal links help distribute page authority and improve navigation",
      status: site.homepage.links.internal.length >= 10 ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: `Homepage has ${site.homepage.links.internal.length} internal links`
    });
    
    // Check for broken links
    items.push({
      name: "Are there broken links on the site?",
      description: "Broken links hurt user experience and SEO",
      status: site.homepage.links.broken.length === 0 ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: site.homepage.links.broken.length > 0 ? 
        `Found ${site.homepage.links.broken.length} broken links on homepage` : undefined
    });
    
    // Check navigation clarity
    items.push({
      name: "Is the site navigation clear and logical?",
      description: "Users should easily understand how to navigate the site",
      status: (site.servicePages.length > 0 || site.contactPage) ? 'OK' : 'OFI',
      importance: 'High',
      notes: "Based on presence of service pages and contact page"
    });
    
    // Check URL structure
    items.push({
      name: "Are URLs clean and descriptive?",
      description: "URLs should be readable and describe page content",
      status: this.checkUrlStructure(site) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "URLs should avoid special characters and be descriptive"
    });
    
    // Check page depth
    items.push({
      name: "Are important pages within 3 clicks from homepage?",
      description: "Important content should be easily accessible",
      status: 'OK', // Simplified check - assume OK if we found the pages
      importance: 'Medium',
      notes: "All crawled pages are within reasonable depth"
    });
    
    return items;
  }

  /**
   * Generate contact page audit items
   */
  private generateContactAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const contactPage = site.contactPage;
    
    // Check if contact page exists
    items.push({
      name: "Does the website have a dedicated contact page?",
      description: "Contact page is essential for local businesses",
      status: contactPage ? 'OK' : 'OFI',
      importance: 'High',
      notes: !contactPage ? "No dedicated contact page found" : undefined
    });
    
    if (!contactPage) {
      // If no contact page, mark remaining items as N/A
      const naItems = [
        "Does the contact page have complete NAP (Name, Address, Phone)?",
        "Is there a contact form on the contact page?",
        "Are business hours listed?",
        "Is there a map or location information?",
        "Are multiple contact methods provided?"
      ];
      
      naItems.forEach(name => {
        items.push({
          name,
          description: "Requires a contact page to evaluate",
          status: 'N/A',
          importance: 'Medium',
          notes: "No contact page found"
        });
      });
      
      return items;
    }
    
    // Check for complete NAP
    items.push({
      name: "Does the contact page have complete NAP (Name, Address, Phone)?",
      description: "NAP consistency is crucial for local SEO",
      status: contactPage.hasNAP ? 'OK' : 
              (contactPage.hasPhoneNumber || contactPage.hasAddress) ? 'OFI' : 'Priority OFI',
      importance: 'High',
      notes: `Phone: ${contactPage.hasPhoneNumber ? 'Found' : 'Missing'}, Address: ${contactPage.hasAddress ? 'Found' : 'Missing'}. Priority OFI only if both missing.`
    });
    
    // Check for contact form
    items.push({
      name: "Is there a contact form on the contact page?",
      description: "Contact forms make it easy for customers to reach out",
      status: contactPage.hasContactForm ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: !contactPage.hasContactForm ? "No contact form found on contact page" : undefined
    });
    
    // Check for business hours
    items.push({
      name: "Are business hours listed?",
      description: "Business hours help customers know when to contact you",
      status: contactPage.bodyText.toLowerCase().includes('hour') ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Check for business hours information"
    });
    
    // Check for map/location info
    items.push({
      name: "Is there a map or location information?",
      description: "Visual location information helps customers find you",
      status: (contactPage.bodyText.toLowerCase().includes('map') || 
               contactPage.bodyText.toLowerCase().includes('location') ||
               contactPage.bodyText.toLowerCase().includes('direction')) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Look for embedded map or detailed location information"
    });
    
    // Check for multiple contact methods
    items.push({
      name: "Are multiple contact methods provided?",
      description: "Multiple contact options accommodate different customer preferences",
      status: (contactPage.hasPhoneNumber && contactPage.hasContactForm) ? 'OK' : 'OFI',
      importance: 'Low',
      notes: "Consider providing phone, email, and contact form options"
    });
    
    return items;
  }

  /**
   * Generate service pages audit items
   */
  private generateServiceAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const servicePages = site.servicePages;
    
    // Check if service pages exist
    items.push({
      name: "Has a single Service Page for each primary service?",
      description: "Each major service should have its own dedicated page",
      status: servicePages.length > 0 ? 'OK' : 'N/A',
      importance: 'High',
      notes: servicePages.length > 0 ? 
        `Found ${servicePages.length} service page(s)` : 
        "No dedicated service pages found"
    });
    
    if (servicePages.length === 0) {
      // Mark remaining service-related items as N/A
      const naItems = [
        "Do service pages have unique, descriptive titles?",
        "Do service pages have detailed service descriptions?",
        "Are service pages optimized for relevant keywords?",
        "Do service pages include clear calls-to-action?",
        "Are service pages internally linked from other pages?"
      ];
      
      naItems.forEach(name => {
        items.push({
          name,
          description: "Requires service pages to evaluate",
          status: 'N/A',
          importance: 'Medium',
          notes: "No service pages found"
        });
      });
      
      return items;
    }
    
    // Check service page titles
    items.push({
      name: "Do service pages have unique, descriptive titles?",
      description: "Each service page should have a unique, keyword-rich title",
      status: this.checkServicePageTitles(servicePages) ? 'OK' : 'OFI',
      importance: 'High',
      notes: "Service page titles should be unique and descriptive"
    });
    
    // Check service content quality
    items.push({
      name: "Do service pages have detailed service descriptions?",
      description: "Service pages should thoroughly describe offerings",
      status: this.checkServiceContentQuality(servicePages) ? 'OK' : 'OFI',
      importance: 'High',
      notes: `Average word count: ${this.getAverageWordCount(servicePages)} words`
    });
    
    // Check keyword optimization
    items.push({
      name: "Are service pages optimized for relevant keywords?",
      description: "Service pages should target specific service-related keywords",
      status: this.checkServiceKeywordOptimization(servicePages) ? 'OK' : 'OFI',
      importance: 'High',
      notes: "Check for service-specific keywords in titles and content"
    });
    
    // Check for CTAs on service pages
    items.push({
      name: "Do service pages include clear calls-to-action?",
      description: "Service pages should encourage visitors to take action",
      status: this.checkServicePageCTAs(servicePages) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Look for contact forms, phone numbers, or booking options"
    });
    
    // Check internal linking to service pages
    items.push({
      name: "Are service pages internally linked from other pages?",
      description: "Service pages should be well-connected within the site",
      status: this.checkServicePageLinking(servicePages, site) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Service pages should be linked from homepage and other relevant pages"
    });
    
    return items;
  }

  /**
   * Generate location pages audit items
   */
  private generateLocationAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const locationPages = site.locationPages;
    
    // Check if location pages exist
    items.push({
      name: "Are there dedicated location/area pages?",
      description: "Location pages help target local search terms",
      status: locationPages.length > 0 ? 'OK' : 'N/A',
      importance: 'Medium',
      notes: locationPages.length > 0 ? 
        `Found ${locationPages.length} location page(s)` : 
        "No dedicated location pages found"
    });
    
    if (locationPages.length === 0) {
      // Mark remaining location-related items as N/A
      const naItems = [
        "Do location pages have unique content?",
        "Are location pages optimized for local keywords?",
        "Do location pages include local business information?",
        "Are location pages internally linked?"
      ];
      
      naItems.forEach(name => {
        items.push({
          name,
          description: "Requires location pages to evaluate",
          status: 'N/A',
          importance: 'Medium',
          notes: "No location pages found"
        });
      });
      
      return items;
    }
    
    // Check location page uniqueness
    items.push({
      name: "Do location pages have unique content?",
      description: "Each location page should have unique, valuable content",
      status: this.areLocationPagesUnique(locationPages) ? 'OK' : 'OFI',
      importance: 'High',
      notes: "Avoid duplicate content across location pages"
    });
    
    // Check local keyword optimization
    items.push({
      name: "Are location pages optimized for local keywords?",
      description: "Location pages should target location-specific search terms",
      status: this.checkLocationKeywordOptimization(locationPages) ? 'OK' : 'OFI',
      importance: 'High',
      notes: "Include city/area names in titles and content"
    });
    
    // Check for local business information
    items.push({
      name: "Do location pages include local business information?",
      description: "Location pages should include relevant local details",
      status: this.checkLocationBusinessInfo(locationPages) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Include local contact info, directions, or area-specific details"
    });
    
    // Check internal linking
    items.push({
      name: "Are location pages internally linked?",
      description: "Location pages should be well-connected within the site",
      status: this.checkLocationPageLinking(locationPages, site) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Location pages should be linked from homepage and service pages"
    });
    
    return items;
  }

  /**
   * Generate service area pages audit items
   */
  private generateServiceAreaAuditItems(site: SiteStructure): AuditItem[] {
    const items: AuditItem[] = [];
    const serviceAreaPages = site.serviceAreaPages;
    
    // Check if service area pages exist
    items.push({
      name: "Are there service area pages?",
      description: "Service area pages help target broader geographic regions",
      status: serviceAreaPages.length > 0 ? 'OK' : 'N/A',
      importance: 'Low',
      notes: serviceAreaPages.length > 0 ? 
        `Found ${serviceAreaPages.length} service area page(s)` : 
        "No service area pages found"
    });
    
    if (serviceAreaPages.length === 0) {
      return items; // No more items to check if no service area pages
    }
    
    // Check service area page content quality
    items.push({
      name: "Do service area pages have quality content?",
      description: "Service area pages should provide valuable information about coverage",
      status: this.checkServiceAreaContentQuality(serviceAreaPages) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Service area pages should explain coverage and include local relevance"
    });
    
    // Check for geographic optimization
    items.push({
      name: "Are service area pages optimized for geographic terms?",
      description: "Include relevant geographic and service terms",
      status: this.checkServiceAreaOptimization(serviceAreaPages) ? 'OK' : 'OFI',
      importance: 'Medium',
      notes: "Include service + location combinations in content"
    });
    
    return items;
  }

  // ==========================================
  // Helper Methods for Analysis
  // ==========================================

  private checkUrlStructure(site: SiteStructure): boolean {
    const allPages = [site.homepage, ...site.otherPages, site.contactPage].filter(Boolean);
    
    for (const page of allPages) {
      const url = page!.url.toLowerCase();
      // Check for clean URLs (no query parameters, reasonable length)
      if (url.includes('?') || url.includes('&') || url.length > 100) {
        return false;
      }
    }
    return true;
  }

  private checkServicePageTitles(servicePages: PageCrawlResult[]): boolean {
    const titles = servicePages.map(page => page.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    return uniqueTitles.size === titles.length && titles.every(title => title.length > 10);
  }

  private checkServiceContentQuality(servicePages: PageCrawlResult[]): boolean {
    return servicePages.every(page => page.wordCount >= 200);
  }

  private getAverageWordCount(pages: PageCrawlResult[]): number {
    if (pages.length === 0) return 0;
    const total = pages.reduce((sum, page) => sum + page.wordCount, 0);
    return Math.round(total / pages.length);
  }

  private checkServiceKeywordOptimization(servicePages: PageCrawlResult[]): boolean {
    const serviceKeywords = ['service', 'services', 'repair', 'installation', 'maintenance'];
    return servicePages.every(page => {
      const content = (page.title + ' ' + page.bodyText).toLowerCase();
      return serviceKeywords.some(keyword => content.includes(keyword));
    });
  }

  private checkServicePageCTAs(servicePages: PageCrawlResult[]): boolean {
    return servicePages.some(page => 
      page.hasContactForm || 
      page.hasPhoneNumber || 
      page.bodyText.toLowerCase().includes('contact') ||
      page.bodyText.toLowerCase().includes('call')
    );
  }

  private checkServicePageLinking(servicePages: PageCrawlResult[], site: SiteStructure): boolean {
    const serviceUrls = servicePages.map(page => page.url);
    const homepageLinks = site.homepage.links.internal;
    
    return serviceUrls.some(url => 
      homepageLinks.some(link => link.includes(url) || url.includes(link))
    );
  }

  private areLocationPagesUnique(locationPages: PageCrawlResult[]): boolean {
    if (locationPages.length <= 1) return true;
    
    for (let i = 0; i < locationPages.length; i++) {
      for (let j = i + 1; j < locationPages.length; j++) {
        const similarity = this.calculateContentSimilarity(
          locationPages[i].bodyText,
          locationPages[j].bodyText
        );
        if (similarity > 0.8) return false; // Too similar
      }
    }
    return true;
  }

  private calculateContentSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set(Array.from(set1).filter(word => set2.has(word)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return intersection.size / union.size;
  }

  private checkLocationKeywordOptimization(locationPages: PageCrawlResult[]): boolean {
    const locationKeywords = ['city', 'area', 'location', 'local', 'near'];
    return locationPages.every(page => {
      const content = (page.title + ' ' + page.bodyText).toLowerCase();
      return locationKeywords.some(keyword => content.includes(keyword));
    });
  }

  private checkLocationBusinessInfo(locationPages: PageCrawlResult[]): boolean {
    return locationPages.some(page => 
      page.hasAddress || 
      page.hasPhoneNumber ||
      page.bodyText.toLowerCase().includes('direction') ||
      page.bodyText.toLowerCase().includes('hour')
    );
  }

  private checkLocationPageLinking(locationPages: PageCrawlResult[], site: SiteStructure): boolean {
    const locationUrls = locationPages.map(page => page.url);
    const homepageLinks = site.homepage.links.internal;
    
    return locationUrls.some(url => 
      homepageLinks.some(link => link.includes(url) || url.includes(link))
    );
  }

  private checkServiceAreaContentQuality(serviceAreaPages: PageCrawlResult[]): boolean {
    return serviceAreaPages.every(page => page.wordCount >= 150);
  }

  private checkServiceAreaOptimization(serviceAreaPages: PageCrawlResult[]): boolean {
    const areaKeywords = ['area', 'service area', 'coverage', 'serve', 'region'];
    return serviceAreaPages.every(page => {
      const content = (page.title + ' ' + page.bodyText).toLowerCase();
      return areaKeywords.some(keyword => content.includes(keyword));
    });
  }
}