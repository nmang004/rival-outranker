import { PageCrawlResult, SiteStructure } from './audit.service';

/**
 * Service responsible for classifying pages by type
 */
export class PageClassificationService {

  /**
   * Classify all pages in the site structure
   */
  async classifyPages(structure: SiteStructure): Promise<SiteStructure> {
    console.log('Classifying pages by type...');
    
    const classified: SiteStructure = {
      ...structure,
      contactPage: undefined,
      servicePages: [],
      locationPages: [],
      serviceAreaPages: [],
      otherPages: []
    };
    
    // Classify all other pages
    for (const page of structure.otherPages) {
      if (this.isContactPage(page)) {
        classified.contactPage = page;
      } else if (this.isServicePage(page)) {
        classified.servicePages.push(page);
      } else if (this.isLocationPage(page)) {
        classified.locationPages.push(page);
      } else if (this.isServiceAreaPage(page)) {
        classified.serviceAreaPages.push(page);
      } else {
        classified.otherPages.push(page);
      }
    }
    
    console.log(`Classification complete:
      - Contact pages: ${classified.contactPage ? 1 : 0}
      - Service pages: ${classified.servicePages.length}
      - Location pages: ${classified.locationPages.length}
      - Service area pages: ${classified.serviceAreaPages.length}
      - Other pages: ${classified.otherPages.length}`);
    
    return classified;
  }

  /**
   * Determine if a page is a contact page
   */
  private isContactPage(page: PageCrawlResult): boolean {
    const contactTerms = ['contact', 'get in touch', 'reach us', 'contact us'];
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const bodyText = page.bodyText.toLowerCase();
    
    // Check URL for contact terms
    if (contactTerms.some(term => url.includes(term))) {
      return true;
    }
    
    // Check title for contact terms
    if (contactTerms.some(term => title.includes(term))) {
      return true;
    }
    
    // Check if page has contact form AND contact-related content
    if (page.hasContactForm && contactTerms.some(term => bodyText.includes(term))) {
      return true;
    }
    
    // Check for strong contact indicators in content
    const strongContactIndicators = [
      'contact form', 'get in touch', 'reach out', 'contact information',
      'business hours', 'office hours', 'call us', 'email us'
    ];
    
    const contactIndicatorCount = strongContactIndicators.filter(indicator => 
      bodyText.includes(indicator)
    ).length;
    
    return contactIndicatorCount >= 2;
  }

  /**
   * Determine if a page is a service page
   */
  private isServicePage(page: PageCrawlResult): boolean {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const bodyText = page.bodyText.toLowerCase();
    
    // Direct service URL patterns
    const serviceUrlPatterns = [
      /\/service[s]?\//, /\/what-we-do/, /\/our-service[s]?/,
      /\/offering[s]?/, /\/solution[s]?/, /\/product[s]?/
    ];
    
    if (serviceUrlPatterns.some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Service-related keywords in title
    const serviceTitleKeywords = [
      'service', 'services', 'repair', 'installation', 'maintenance',
      'hvac', 'plumbing', 'electrical', 'roofing', 'cleaning',
      'landscaping', 'construction', 'renovation', 'remodeling'
    ];
    
    if (serviceTitleKeywords.some(keyword => title.includes(keyword))) {
      return true;
    }
    
    // Service indicators in content
    const serviceContentIndicators = [
      'we provide', 'we offer', 'our service', 'our services',
      'professional', 'certified', 'licensed', 'experienced',
      'installation', 'repair', 'maintenance', 'replacement',
      'inspection', 'consultation', 'estimate', 'quote'
    ];
    
    const serviceIndicatorCount = serviceContentIndicators.filter(indicator => 
      bodyText.includes(indicator)
    ).length;
    
    // Industry-specific service terms
    const industryServiceTerms = [
      // HVAC
      'air conditioning', 'heating', 'cooling', 'furnace', 'heat pump',
      'ductwork', 'ventilation', 'thermostat',
      // Plumbing
      'plumbing', 'drain cleaning', 'pipe repair', 'water heater',
      'leak detection', 'bathroom remodel', 'kitchen remodel',
      // Electrical
      'electrical', 'wiring', 'outlet', 'circuit breaker', 'panel upgrade',
      'lighting', 'electrical repair',
      // General contractor
      'roofing', 'siding', 'windows', 'doors', 'flooring',
      'painting', 'drywall', 'insulation',
      // Cleaning
      'house cleaning', 'office cleaning', 'carpet cleaning',
      'pressure washing', 'window cleaning',
      // Landscaping
      'lawn care', 'tree service', 'landscape design',
      'irrigation', 'hardscaping'
    ];
    
    const industryTermCount = industryServiceTerms.filter(term => 
      bodyText.includes(term)
    ).length;
    
    // Enhanced detection for electrical contractor pages
    const electricalSpecificTerms = [
      'electrical', 'electrician', 'wiring', 'outlet', 'circuit', 'panel',
      'lighting installation', 'generator', 'surge protector', 'electrical repair',
      'electrical installation', 'electrical service', 'commercial electrical',
      'residential electrical', 'electrical contractor', 'licensed electrician'
    ];
    
    const electricalTermCount = electricalSpecificTerms.filter(term => 
      bodyText.includes(term) || title.includes(term) || url.includes(term)
    ).length;
    
    // A page is considered a service page if it has:
    // - Multiple service indicators, OR
    // - Some service indicators AND industry terms, OR
    // - Strong industry presence, OR
    // - Any electrical contractor terms (more lenient for electrical contractors)
    // - URL patterns that suggest services (even without strong content)
    const hasServiceUrlPattern = url.includes('/') && url.split('/').some(segment => 
      serviceTitleKeywords.some(keyword => segment.includes(keyword)) ||
      industryServiceTerms.some(term => segment.includes(term.replace(' ', '-')))
    );
    
    return serviceIndicatorCount >= 3 || 
           (serviceIndicatorCount >= 1 && industryTermCount >= 2) ||
           industryTermCount >= 4 ||
           electricalTermCount >= 1 ||
           hasServiceUrlPattern;
  }

  /**
   * Determine if a page is a location page
   */
  private isLocationPage(page: PageCrawlResult): boolean {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const bodyText = page.bodyText.toLowerCase();
    
    // Direct location URL patterns
    const locationUrlPatterns = [
      /\/location[s]?\//,
      /\/area[s]?\//,
      /\/cities?\//,
      /\/town[s]?\//,
      /\/[a-z]+-[a-z]+\//, // city-state pattern
      /\/[a-z]+-(city|town|area)\//, // location-type pattern
    ];
    
    if (locationUrlPatterns.some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Check for US city/state patterns in URL
    if (this.containsLocationIndicator(url)) {
      return true;
    }
    
    // Location indicators in title
    const locationTitleKeywords = [
      'location', 'areas served', 'service area', 'service areas',
      'cities', 'towns', 'neighborhoods', 'regions'
    ];
    
    if (locationTitleKeywords.some(keyword => title.includes(keyword))) {
      return true;
    }
    
    // Check for multiple city/state mentions in content
    const locationMentions = this.countLocationMentions(bodyText);
    
    // Location content indicators
    const locationContentIndicators = [
      'we serve', 'serving', 'service area', 'service areas',
      'areas served', 'locations', 'cities we serve',
      'coverage area', 'service region'
    ];
    
    const locationIndicatorCount = locationContentIndicators.filter(indicator => 
      bodyText.includes(indicator)
    ).length;
    
    // A page is considered a location page if it has:
    // - Multiple location indicators, OR
    // - Location indicators AND multiple location mentions
    return locationIndicatorCount >= 2 || 
           (locationIndicatorCount >= 1 && locationMentions >= 3);
  }

  /**
   * Determine if a page is a service area page
   */
  private isServiceAreaPage(page: PageCrawlResult): boolean {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const bodyText = page.bodyText.toLowerCase();
    
    // Service area specific URL patterns
    const serviceAreaUrlPatterns = [
      /\/service-area[s]?\//, /\/coverage-area/, /\/we-serve/,
      /\/area[s]?-served/, /\/service-location[s]?/
    ];
    
    if (serviceAreaUrlPatterns.some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Service area title indicators
    const serviceAreaTitleKeywords = [
      'service area', 'service areas', 'areas served', 'coverage area',
      'service locations', 'we serve', 'serving areas'
    ];
    
    if (serviceAreaTitleKeywords.some(keyword => title.includes(keyword))) {
      return true;
    }
    
    // Service area content indicators with geographic context
    const serviceAreaIndicators = [
      'service area', 'service areas', 'areas served', 'we serve',
      'coverage area', 'service coverage', 'service territory',
      'service locations', 'service region', 'service zone'
    ];
    
    const serviceAreaCount = serviceAreaIndicators.filter(indicator => 
      bodyText.includes(indicator)
    ).length;
    
    // Must also have location mentions
    const locationMentions = this.countLocationMentions(bodyText);
    
    // Must have distance/radius mentions
    const distanceKeywords = ['mile', 'miles', 'radius', 'within', 'kilometer', 'km'];
    const hasDistanceMentions = distanceKeywords.some(keyword => bodyText.includes(keyword));
    
    return serviceAreaCount >= 1 && locationMentions >= 2 && hasDistanceMentions;
  }

  /**
   * Check if text contains location indicators
   */
  private containsLocationIndicator(text: string): boolean {
    // US state abbreviations
    const stateAbbreviations = [
      'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga',
      'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md',
      'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
      'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc',
      'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'
    ];
    
    // Check for state patterns
    const statePattern = new RegExp(`\\\\b(${stateAbbreviations.join('|')})\\\\b`, 'i');
    if (statePattern.test(text)) {
      return true;
    }
    
    // Check for city-like patterns
    const cityPatterns = [
      /\\b[a-z]+ville\\b/i, // Somethingville
      /\\b[a-z]+town\\b/i,  // Somethingtown
      /\\b[a-z]+burg\\b/i,  // Somethingburg
      /\\b[a-z]+field\\b/i, // Somethingfield
      /\\b[a-z]+ford\\b/i,  // Somethingford
    ];
    
    return cityPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Count location mentions in text
   */
  private countLocationMentions(text: string): number {
    const commonLocationKeywords = [
      'city', 'cities', 'town', 'towns', 'county', 'counties',
      'state', 'area', 'areas', 'region', 'regions', 'neighborhood',
      'neighborhoods', 'district', 'districts', 'suburb', 'suburbs',
      'metro', 'metropolitan', 'local', 'nearby'
    ];
    
    let count = 0;
    commonLocationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\\\b${keyword}\\\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  }
}