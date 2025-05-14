import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlerOutput } from '@/lib/types';
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
   * Find potential competitors for a given keyword in a specific location
   */
  private async findPotentialCompetitors(keyword: string, location: string = 'United States'): Promise<string[]> {
    try {
      // Approach 1: Try to find related sites using a search engine
      const competitors = await this.findCompetitorsViaBingSearch(keyword, location);
      if (competitors.length > 0) {
        return competitors;
      }
      
      // Approach 2: If search approach fails, generate a list of common domains
      // that might be competitors in various industries
      return this.getCommonCompetitorDomains(keyword, location);
    } catch (error) {
      console.error('Error finding potential competitors:', error);
      return this.getCommonCompetitorDomains(keyword, location);
    }
  }
  
  /**
   * Find competitors via intelligent keyword/location selection
   */
  private async findCompetitorsViaBingSearch(keyword: string, location: string): Promise<string[]> {
    try {
      console.log(`Finding competitors for keyword: ${keyword} in ${location}`);
      
      // Parse the keyword to understand what kind of business and location it refers to
      const lowercaseKeyword = keyword.toLowerCase();
      
      // Extract location names for more targeted competitors
      const locationWords = location.split(/[,\s]+/).filter(word => word.length > 1);
      
      // Extract business type
      const businessTypes = {
        'hvac': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace'],
        'plumbing': ['plumbing', 'plumber', 'pipe', 'water heater', 'leak'],
        'electrical': ['electrician', 'electrical', 'wiring', 'lighting', 'power'],
        'roofing': ['roofing', 'roofer', 'roof', 'shingles', 'gutter'],
        'landscaping': ['landscaping', 'lawn', 'garden', 'yard', 'mowing'],
        'cleaning': ['cleaning', 'cleaner', 'maid', 'janitorial', 'housekeeping'],
        'restaurant': ['restaurant', 'dining', 'eatery', 'food', 'cafe', 'bistro'],
        'dental': ['dental', 'dentist', 'teeth', 'orthodontist', 'smile'],
        'medical': ['medical', 'doctor', 'physician', 'clinic', 'healthcare', 'wellness'],
        'legal': ['legal', 'attorney', 'lawyer', 'law firm', 'legal service'],
        'salon': ['salon', 'hair', 'beauty', 'barber', 'stylist', 'spa'],
        'fitness': ['fitness', 'gym', 'workout', 'trainer', 'exercise'],
        'realestate': ['real estate', 'realtor', 'property', 'homes', 'housing'],
        'auto': ['auto', 'car', 'mechanic', 'repair', 'service', 'dealership'],
        'freight': ['freight', 'freight forwarding', 'shipping', 'logistics', 'cargo', 'transport', 'transportation', 'carrier', 'shipment', 'forwarding', 'customs broker']
      };
      
      let identifiedType = '';
      let identifiedCity = '';
      let identifiedState = '';
      
      // Identify business type from keyword
      for (const [type, keywords] of Object.entries(businessTypes)) {
        if (keywords.some(key => lowercaseKeyword.includes(key))) {
          identifiedType = type;
          break;
        }
      }
      
      // Extract city and state from location
      const locationParts = location.split(',').map(part => part.trim());
      if (locationParts.length > 0) {
        identifiedCity = locationParts[0];
        if (locationParts.length > 1) {
          identifiedState = locationParts[1];
        }
      }
      
      // Generate competition sites based on business type and location
      let competitors: string[] = [];
      
      // Home services (HVAC, plumbing, electrical, etc.)
      if (['hvac', 'plumbing', 'electrical', 'roofing', 'landscaping', 'cleaning'].includes(identifiedType)) {
        competitors = [
          // National home service sites
          'https://www.homeadvisor.com',
          'https://www.angi.com',
          'https://www.thumbtack.com',
          'https://www.yelp.com',
          // Major service companies with local branches
          'https://www.servicemasterclean.com',
          'https://www.mrhandyman.com',
          'https://www.mrrooter.com',
          'https://www.aireserv.com',
          'https://www.trugreen.com'
        ];
        
        // Add specialized sites based on business type
        if (identifiedType === 'hvac') {
          competitors.push('https://www.carrier.com');
          competitors.push('https://www.trane.com');
          competitors.push('https://www.lennox.com');
        } else if (identifiedType === 'plumbing') {
          competitors.push('https://www.benjaminfranklinplumbing.com');
          competitors.push('https://www.rotorooter.com');
        } else if (identifiedType === 'electrical') {
          competitors.push('https://www.mrelectric.com');
          competitors.push('https://www.misterSparky.com');
        } else if (identifiedType === 'roofing') {
          competitors.push('https://www.owenscorning.com');
          competitors.push('https://www.gaf.com');
        }
      }
      // Restaurants
      else if (identifiedType === 'restaurant') {
        competitors = [
          'https://www.yelp.com',
          'https://www.tripadvisor.com',
          'https://www.opentable.com',
          'https://www.grubhub.com',
          'https://www.doordash.com',
          'https://www.ubereats.com',
          'https://www.zomato.com'
        ];
      }
      // Medical services
      else if (['dental', 'medical'].includes(identifiedType)) {
        competitors = [
          'https://www.zocdoc.com',
          'https://www.healthgrades.com',
          'https://www.vitals.com',
          'https://www.webmd.com',
          'https://www.mayoclinic.org',
          'https://www.ratemds.com'
        ];
        
        if (identifiedType === 'dental') {
          competitors.push('https://www.aspen.dental');
          competitors.push('https://www.deltadentalins.com');
        }
      }
      // Freight forwarding and logistics
      else if (identifiedType === 'freight') {
        competitors = [
          'https://www.fedex.com',
          'https://www.dhl.com',
          'https://www.maersk.com',
          'https://www.flexport.com',
          'https://www.dbschenker.com',
          'https://www.kuehne-nagel.com',
          'https://www.expeditors.com',
          'https://www.dsv.com',
          'https://www.freightquote.com',
          'https://www.freightos.com'
        ];
        
        // Add country-specific competitors based on location
        const detectedCountryCode = this.getCountryCode(location);
        
        // US-specific competitors
        if (detectedCountryCode === 'US') {
          competitors.push('https://www.chrobinson.com');
          competitors.push('https://www.upsfreight.com');
          competitors.push('https://ltl.xpo.com');
          competitors.push('https://www.hubgroup.com');
        }
      }
      // Default local business sites with review/directory focus
      else {
        competitors = [
          'https://www.yelp.com',
          'https://www.yellowpages.com',
          'https://www.bbb.org',
          'https://www.superpages.com',
          'https://www.manta.com',
          'https://www.tripadvisor.com',
          'https://www.google.com/maps',
          'https://www.facebook.com/business'
        ];
      }
      
      // Add local chamber of commerce and local newspaper sites if we have state info
      if (identifiedState) {
        const stateAbbrev = this.getStateAbbreviation(identifiedState);
        if (stateAbbrev) {
          competitors.push(`https://www.${identifiedCity.toLowerCase().replace(/\s+/g, '')}.${stateAbbrev.toLowerCase()}.gov`);
          competitors.push(`https://www.${identifiedCity.toLowerCase().replace(/\s+/g, '')}chamber.com`);
        }
      }
      
      // Make URLs unique and take random selection
      const uniqueCompetitors: string[] = [];
      for (const competitor of competitors) {
        if (!uniqueCompetitors.includes(competitor)) {
          uniqueCompetitors.push(competitor);
        }
      }
      
      // Shuffle the array
      const shuffled = uniqueCompetitors.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, this.MAX_COMPETITORS);
    } catch (error) {
      console.error('Error finding competitors:', error);
      return this.getCommonCompetitorDomains(keyword, location);
    }
  }
  
  /**
   * Get state abbreviation from state name
   */
  private getStateAbbreviation(stateName: string): string | undefined {
    const stateMap: Record<string, string> = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY',
      'al': 'AL', 'ak': 'AK', 'az': 'AZ', 'ar': 'AR', 'ca': 'CA', 'co': 'CO',
      'ct': 'CT', 'de': 'DE', 'fl': 'FL', 'ga': 'GA', 'hi': 'HI', 'id': 'ID',
      'il': 'IL', 'in': 'IN', 'ia': 'IA', 'ks': 'KS', 'ky': 'KY', 'la': 'LA',
      'me': 'ME', 'md': 'MD', 'ma': 'MA', 'mi': 'MI', 'mn': 'MN', 'ms': 'MS',
      'mo': 'MO', 'mt': 'MT', 'ne': 'NE', 'nv': 'NV', 'nh': 'NH', 'nj': 'NJ',
      'nm': 'NM', 'ny': 'NY', 'nc': 'NC', 'nd': 'ND', 'oh': 'OH', 'ok': 'OK',
      'or': 'OR', 'pa': 'PA', 'ri': 'RI', 'sc': 'SC', 'sd': 'SD', 'tn': 'TN',
      'tx': 'TX', 'ut': 'UT', 'vt': 'VT', 'va': 'VA', 'wa': 'WA', 'wv': 'WV',
      'wi': 'WI', 'wy': 'WY'
    };
    
    return stateMap[stateName.toLowerCase()];
  }
  
  /**
   * Get a two-letter country code for a location string
   */
  private getCountryCode(location: string): string {
    const lowercaseLocation = location.toLowerCase();
    
    // Map common locations to country codes
    const countryCodeMap: Record<string, string> = {
      'united states': 'US',
      'usa': 'US',
      'us': 'US',
      'america': 'US',
      'united kingdom': 'GB',
      'uk': 'GB',
      'great britain': 'GB',
      'england': 'GB',
      'canada': 'CA',
      'australia': 'AU',
      'france': 'FR',
      'germany': 'DE',
      'spain': 'ES',
      'italy': 'IT',
      'japan': 'JP',
      'india': 'IN',
      'china': 'CN',
      'brazil': 'BR',
      'mexico': 'MX',
      'russia': 'RU'
    };
    
    // Check for exact location matches
    for (const [key, code] of Object.entries(countryCodeMap)) {
      if (lowercaseLocation.includes(key)) {
        return code;
      }
    }
    
    // Check for city matches
    if (lowercaseLocation.includes('new york') || 
        lowercaseLocation.includes('los angeles') || 
        lowercaseLocation.includes('chicago')) {
      return 'US';
    }
    
    if (lowercaseLocation.includes('london') || 
        lowercaseLocation.includes('manchester') || 
        lowercaseLocation.includes('birmingham')) {
      return 'GB';
    }
    
    if (lowercaseLocation.includes('toronto') || 
        lowercaseLocation.includes('vancouver') || 
        lowercaseLocation.includes('montreal')) {
      return 'CA';
    }
    
    // Default to US if no match found
    return 'US';
  }
  
  /**
   * Get an example IP address for a given location
   * Note: This is used to give context to the search engine about location
   * but doesn't actually spoof our IP address (which would be against TOS)
   */
  private getIpForLocation(location: string): string {
    // These are examples only and are not actual usable IPs
    const locationIpMap: Record<string, string> = {
      'US': '8.8.8.8', // United States (Google DNS)
      'GB': '2.16.10.10', // UK
      'CA': '99.236.0.0', // Canada
      'AU': '1.1.1.1', // Australia (Cloudflare DNS)
      'DE': '3.3.3.3', // Germany
      'FR': '5.5.5.5', // France
      'JP': '7.7.7.7', // Japan
      'IN': '9.9.9.9' // India (Quad9 DNS)
    };
    
    const countryCode = this.getCountryCode(location);
    return locationIpMap[countryCode] || '8.8.8.8'; // Default to US
  }

  /**
   * Get a list of common competitor domains as fallback
   */
  private getCommonCompetitorDomains(keyword: string, location: string): string[] {
    // Determine industry based on keyword to provide relevant competitors
    const lowercaseKeyword = keyword.toLowerCase();
    const countryCode = this.getCountryCode(location);
    const countryTLD = this.getTldForCountry(countryCode);
    
    // Parse location to get city and state
    const locationParts = location.split(',').map(part => part.trim());
    const city = locationParts[0];
    const state = locationParts.length > 1 ? locationParts[1] : '';
    const stateAbbrev = state ? this.getStateAbbreviation(state) : '';
    
    // For certain countries, use the local version of sites
    const shouldUseLocalDomains = ['GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'ES', 'IT', 'BR', 'MX', 'IN'].includes(countryCode);
    
    // E-commerce domains
    if (this.containsAny(lowercaseKeyword, ['shop', 'product', 'buy', 'store', 'retail', 'price'])) {
      if (shouldUseLocalDomains) {
        return [
          `https://www.amazon${countryTLD}`,
          `https://www.ebay${countryTLD}`,
          `https://www.etsy${countryTLD}`,
          'https://www.shopify.com',
          this.getLocalRetailer(countryCode),
          this.getLocalMarketplace(countryCode)
        ];
      } else {
        return [
          'https://www.amazon.com',
          'https://www.ebay.com',
          'https://www.etsy.com',
          'https://www.walmart.com',
          'https://www.shopify.com',
          'https://www.target.com'
        ];
      }
    }
    
    // Tech domains - generally less localized
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
        this.getLocalNewsSource(countryCode),
        `https://www.bbc${countryCode === 'GB' ? '.co.uk' : '.com'}`,
        this.getLocalNewsSource(countryCode, 2),
        'https://www.reuters.com',
        this.getLocalNewsSource(countryCode, 3),
        'https://www.medium.com'
      ];
    }
    
    // HVAC, Plumbing and other home services
    if (this.containsAny(lowercaseKeyword, ['hvac', 'heating', 'air conditioning', 'cooling', 'furnace', 'plumbing', 'plumber', 'pipe', 'electrical', 'electrician', 'roofing', 'roofer', 'contractor', 'repair'])) {
      const homeServiceSites = [
        'https://www.homeadvisor.com',
        'https://www.angi.com', 
        'https://www.thumbtack.com',
        'https://www.yelp.com',
        'https://www.bbb.org'
      ];
      
      // Industry-specific sites
      if (lowercaseKeyword.includes('hvac') || lowercaseKeyword.includes('heating') || lowercaseKeyword.includes('air conditioning')) {
        homeServiceSites.push('https://www.carrier.com');
        homeServiceSites.push('https://www.trane.com');
        homeServiceSites.push('https://www.lennox.com');
        homeServiceSites.push('https://www.aireserv.com');
      } else if (lowercaseKeyword.includes('plumbing') || lowercaseKeyword.includes('plumber')) {
        homeServiceSites.push('https://www.mrrooter.com');
        homeServiceSites.push('https://www.benjaminfranklinplumbing.com');
        homeServiceSites.push('https://www.rotorooter.com');
      } else if (lowercaseKeyword.includes('electrical') || lowercaseKeyword.includes('electrician')) {
        homeServiceSites.push('https://www.mrelectric.com');
        homeServiceSites.push('https://www.mistersparky.com');
      } else if (lowercaseKeyword.includes('roofing') || lowercaseKeyword.includes('roofer')) {
        homeServiceSites.push('https://www.owenscorning.com');
        homeServiceSites.push('https://www.gaf.com');
      }
      
      // Add local directories if we have city/state info
      if (city && stateAbbrev) {
        // Sanitize city name for URL
        const sanitizedCity = city.toLowerCase().replace(/\s+/g, '');
        
        // Add local service directory links
        homeServiceSites.push(`https://www.yelp.com/search?find_desc=${encodeURIComponent(keyword)}&find_loc=${encodeURIComponent(city)}%2C+${stateAbbrev}`);
        homeServiceSites.push(`https://www.yellowpages.com/search?search_terms=${encodeURIComponent(keyword)}&geo_location_terms=${encodeURIComponent(city)}%2C+${stateAbbrev}`);
        
        // Chamber of commerce 
        homeServiceSites.push(`https://www.${sanitizedCity}chamber.com`);
      }
      
      return homeServiceSites.slice(0, this.MAX_COMPETITORS);
    }
    
    // Travel domains
    if (this.containsAny(lowercaseKeyword, ['travel', 'vacation', 'hotel', 'flight', 'booking', 'tourism'])) {
      if (shouldUseLocalDomains) {
        return [
          `https://www.booking${countryTLD}`,
          `https://www.tripadvisor${countryTLD}`,
          `https://www.airbnb${countryTLD}`,
          `https://www.expedia${countryTLD}`,
          this.getLocalTravelSite(countryCode),
          `https://www.hotels${countryTLD}`
        ];
      } else {
        return [
          'https://www.expedia.com',
          'https://www.booking.com',
          'https://www.tripadvisor.com',
          'https://www.airbnb.com',
          'https://www.kayak.com',
          'https://www.hotels.com'
        ];
      }
    }
    
    // Health domains
    if (this.containsAny(lowercaseKeyword, ['health', 'medical', 'doctor', 'wellness', 'fitness', 'diet'])) {
      if (shouldUseLocalDomains) {
        return [
          this.getLocalHealthSite(countryCode),
          'https://www.mayoclinic.org',
          'https://www.healthline.com',
          this.getLocalHealthAuthority(countryCode),
          'https://www.medicalnewstoday.com',
          this.getLocalHealthSite(countryCode, 2)
        ];
      } else {
        return [
          'https://www.webmd.com',
          'https://www.mayoclinic.org',
          'https://www.healthline.com',
          'https://www.cdc.gov',
          'https://www.medicalnewstoday.com',
          'https://www.nih.gov'
        ];
      }
    }
    
    // Default: general high-traffic sites
    if (shouldUseLocalDomains) {
      return [
        'https://www.wikipedia.org',
        `https://www.google${countryTLD}`,
        this.getLocalBusinessSite(countryCode),
        this.getLocalSocialSite(countryCode),
        `https://www.linkedin${countryTLD}`,
        this.getLocalBusinessSite(countryCode, 2)
      ];
    } else {
      return [
        'https://www.wikipedia.org',
        'https://www.reddit.com',
        'https://www.linkedin.com',
        'https://www.forbes.com',
        'https://www.entrepreneur.com',
        'https://www.businessinsider.com'
      ];
    }
  }
  
  /**
   * Get appropriate TLD for a country
   */
  private getTldForCountry(countryCode: string): string {
    const tldMap: Record<string, string> = {
      'US': '.com',
      'GB': '.co.uk',
      'CA': '.ca',
      'AU': '.com.au',
      'DE': '.de',
      'FR': '.fr',
      'ES': '.es',
      'IT': '.it',
      'JP': '.co.jp',
      'IN': '.in',
      'BR': '.com.br',
      'MX': '.com.mx',
      'CN': '.cn',
      'RU': '.ru'
    };
    
    return tldMap[countryCode] || '.com';
  }
  
  /**
   * Get local retailer based on country
   */
  private getLocalRetailer(countryCode: string): string {
    const retailerMap: Record<string, string> = {
      'US': 'https://www.walmart.com',
      'GB': 'https://www.tesco.com',
      'CA': 'https://www.canadiantire.ca',
      'AU': 'https://www.woolworths.com.au',
      'DE': 'https://www.otto.de',
      'FR': 'https://www.carrefour.fr',
      'ES': 'https://www.elcorteingles.es',
      'IT': 'https://www.esselunga.it',
      'JP': 'https://www.rakuten.co.jp',
      'IN': 'https://www.flipkart.com',
      'BR': 'https://www.americanas.com.br',
      'MX': 'https://www.liverpool.com.mx'
    };
    
    return retailerMap[countryCode] || 'https://www.walmart.com';
  }
  
  /**
   * Get local marketplace based on country
   */
  private getLocalMarketplace(countryCode: string): string {
    const marketplaceMap: Record<string, string> = {
      'US': 'https://www.target.com',
      'GB': 'https://www.argos.co.uk',
      'CA': 'https://www.bestbuy.ca',
      'AU': 'https://www.kogan.com',
      'DE': 'https://www.zalando.de',
      'FR': 'https://www.cdiscount.com',
      'ES': 'https://www.aliexpress.es',
      'IT': 'https://www.subito.it',
      'JP': 'https://www.yahoo.co.jp',
      'IN': 'https://www.snapdeal.com',
      'BR': 'https://www.mercadolivre.com.br',
      'MX': 'https://www.mercadolibre.com.mx'
    };
    
    return marketplaceMap[countryCode] || 'https://www.target.com';
  }
  
  /**
   * Get local news source based on country
   */
  private getLocalNewsSource(countryCode: string, variant: number = 1): string {
    if (variant === 1) {
      const newsMap: Record<string, string> = {
        'US': 'https://www.cnn.com',
        'GB': 'https://www.theguardian.co.uk',
        'CA': 'https://www.cbc.ca',
        'AU': 'https://www.abc.net.au',
        'DE': 'https://www.spiegel.de',
        'FR': 'https://www.lemonde.fr',
        'ES': 'https://www.elpais.com',
        'IT': 'https://www.corriere.it',
        'JP': 'https://www.nhk.or.jp',
        'IN': 'https://www.ndtv.com',
        'BR': 'https://www.globo.com',
        'MX': 'https://www.eluniversal.com.mx'
      };
      return newsMap[countryCode] || 'https://www.cnn.com';
    } else if (variant === 2) {
      const newsMap: Record<string, string> = {
        'US': 'https://www.nytimes.com',
        'GB': 'https://www.dailymail.co.uk',
        'CA': 'https://www.globeandmail.com',
        'AU': 'https://www.news.com.au',
        'DE': 'https://www.faz.net',
        'FR': 'https://www.lefigaro.fr',
        'ES': 'https://www.elmundo.es',
        'IT': 'https://www.repubblica.it',
        'JP': 'https://www.asahi.com',
        'IN': 'https://www.indiatimes.com',
        'BR': 'https://www.uol.com.br',
        'MX': 'https://www.excelsior.com.mx'
      };
      return newsMap[countryCode] || 'https://www.nytimes.com';
    } else {
      const newsMap: Record<string, string> = {
        'US': 'https://www.washingtonpost.com',
        'GB': 'https://www.telegraph.co.uk',
        'CA': 'https://www.nationalpost.com',
        'AU': 'https://www.smh.com.au',
        'DE': 'https://www.zeit.de',
        'FR': 'https://www.liberation.fr',
        'ES': 'https://www.abc.es',
        'IT': 'https://www.lastampa.it',
        'JP': 'https://www.yomiuri.co.jp',
        'IN': 'https://timesofindia.indiatimes.com',
        'BR': 'https://www.folha.uol.com.br',
        'MX': 'https://www.jornada.com.mx'
      };
      return newsMap[countryCode] || 'https://www.washingtonpost.com';
    }
  }
  
  /**
   * Get local travel site based on country
   */
  private getLocalTravelSite(countryCode: string): string {
    const travelMap: Record<string, string> = {
      'US': 'https://www.kayak.com',
      'GB': 'https://www.skyscanner.net',
      'CA': 'https://www.flightcentre.ca',
      'AU': 'https://www.webjet.com.au',
      'DE': 'https://www.ab-in-den-urlaub.de',
      'FR': 'https://www.voyages-sncf.com',
      'ES': 'https://www.rumbo.es',
      'IT': 'https://www.volagratis.com',
      'JP': 'https://www.jalan.net',
      'IN': 'https://www.makemytrip.com',
      'BR': 'https://www.decolar.com',
      'MX': 'https://www.bestday.com.mx'
    };
    
    return travelMap[countryCode] || 'https://www.kayak.com';
  }
  
  /**
   * Get local health site based on country
   */
  private getLocalHealthSite(countryCode: string, variant: number = 1): string {
    if (variant === 1) {
      const healthMap: Record<string, string> = {
        'US': 'https://www.webmd.com',
        'GB': 'https://www.nhs.uk',
        'CA': 'https://www.healthlinkbc.ca',
        'AU': 'https://www.healthdirect.gov.au',
        'DE': 'https://www.gesundheit.de',
        'FR': 'https://www.doctissimo.fr',
        'ES': 'https://www.cuidateplus.com',
        'IT': 'https://www.paginemediche.it',
        'JP': 'https://www.health.goo.ne.jp',
        'IN': 'https://www.practo.com',
        'BR': 'https://www.minhavida.com.br',
        'MX': 'https://www.medicinapreventiva.com.mx'
      };
      return healthMap[countryCode] || 'https://www.webmd.com';
    } else {
      const healthMap: Record<string, string> = {
        'US': 'https://www.health.com',
        'GB': 'https://www.bupa.co.uk',
        'CA': 'https://www.medbroadcast.com',
        'AU': 'https://www.betterhealth.vic.gov.au',
        'DE': 'https://www.netdoktor.de',
        'FR': 'https://www.e-sante.fr',
        'ES': 'https://www.webconsultas.com',
        'IT': 'https://www.my-personaltrainer.it',
        'JP': 'https://www.kenko.com',
        'IN': 'https://www.healthkart.com',
        'BR': 'https://www.tuasaude.com',
        'MX': 'https://www.salud.carlosslim.org'
      };
      return healthMap[countryCode] || 'https://www.health.com';
    }
  }
  
  /**
   * Get local health authority based on country
   */
  private getLocalHealthAuthority(countryCode: string): string {
    const authorityMap: Record<string, string> = {
      'US': 'https://www.cdc.gov',
      'GB': 'https://www.nhs.uk',
      'CA': 'https://www.canada.ca/en/health-canada.html',
      'AU': 'https://www.health.gov.au',
      'DE': 'https://www.bundesgesundheitsministerium.de',
      'FR': 'https://solidarites-sante.gouv.fr',
      'ES': 'https://www.mscbs.gob.es',
      'IT': 'https://www.salute.gov.it',
      'JP': 'https://www.mhlw.go.jp',
      'IN': 'https://www.mohfw.gov.in',
      'BR': 'https://www.gov.br/saude/pt-br',
      'MX': 'https://www.gob.mx/salud'
    };
    
    return authorityMap[countryCode] || 'https://www.cdc.gov';
  }
  
  /**
   * Get local business site based on country
   */
  private getLocalBusinessSite(countryCode: string, variant: number = 1): string {
    if (variant === 1) {
      const businessMap: Record<string, string> = {
        'US': 'https://www.forbes.com',
        'GB': 'https://www.ft.com',
        'CA': 'https://www.theglobeandmail.com/business',
        'AU': 'https://www.afr.com',
        'DE': 'https://www.handelsblatt.com',
        'FR': 'https://www.lesechos.fr',
        'ES': 'https://www.expansion.com',
        'IT': 'https://www.ilsole24ore.com',
        'JP': 'https://www.nikkei.com',
        'IN': 'https://economictimes.indiatimes.com',
        'BR': 'https://www.valor.com.br',
        'MX': 'https://www.eleconomista.com.mx'
      };
      return businessMap[countryCode] || 'https://www.forbes.com';
    } else {
      const businessMap: Record<string, string> = {
        'US': 'https://www.businessinsider.com',
        'GB': 'https://www.thisismoney.co.uk',
        'CA': 'https://www.bnn.ca',
        'AU': 'https://www.businessnews.com.au',
        'DE': 'https://www.wiwo.de',
        'FR': 'https://www.latribune.fr',
        'ES': 'https://cincodias.elpais.com',
        'IT': 'https://www.milanofinanza.it',
        'JP': 'https://www.bloomberg.co.jp',
        'IN': 'https://www.business-standard.com',
        'BR': 'https://exame.com',
        'MX': 'https://www.elfinanciero.com.mx'
      };
      return businessMap[countryCode] || 'https://www.businessinsider.com';
    }
  }
  
  /**
   * Get local social site based on country
   */
  private getLocalSocialSite(countryCode: string): string {
    const socialMap: Record<string, string> = {
      'US': 'https://www.reddit.com',
      'GB': 'https://www.reddit.com/r/unitedkingdom',
      'CA': 'https://www.reddit.com/r/canada',
      'AU': 'https://www.reddit.com/r/australia',
      'DE': 'https://www.gutefrage.net',
      'FR': 'https://www.jeuxvideo.com/forums.htm',
      'ES': 'https://www.meneame.net',
      'IT': 'https://www.reddit.com/r/italy',
      'JP': 'https://www.5ch.net',
      'IN': 'https://www.quora.com/topic/India',
      'BR': 'https://www.reddit.com/r/brasil',
      'MX': 'https://www.reddit.com/r/mexico'
    };
    
    return socialMap[countryCode] || 'https://www.reddit.com';
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
      
      // Get the title and description from the crawled data
      const title = pageData.title || '';
      const description = pageData.meta.description || '';
      
      // Count headings
      const h1Count = pageData.headings.h1.length;
      const h2Count = pageData.headings.h2.length;
      const h3Count = pageData.headings.h3.length;
      
      // Count links
      const internalLinksCount = pageData.links.internal.length;
      const externalLinksCount = pageData.links.external.length;
      
      // Image analysis
      const images = pageData.images || [];
      const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
      
      // Content length
      const contentLength = pageData.content.text.length;
      
      // Calculate keyword density (since keywordAnalyzer might not be available)
      let keywordDensity = 0;
      if (primaryKeyword && pageData.content.text) {
        const keywordRegex = new RegExp(primaryKeyword, 'gi');
        const matches = pageData.content.text.match(keywordRegex) || [];
        const wordCount = pageData.content.wordCount || 1;
        keywordDensity = (matches.length / wordCount) * 100;
      }
      
      // Generate strengths and weaknesses based on the analysis
      const analysisData = {
        h1Count,
        h2Count,
        contentLength,
        imagesWithAlt,
        imageCount: images.length,
        keywordDensity,
        title,
        description,
        primaryKeyword
      };
      
      const strengths = this.identifyStrengths(analysisData);
      const weaknesses = this.identifyWeaknesses(analysisData);
      
      return {
        url,
        title,
        description,
        keywordDensity,
        contentLength,
        h1Count,
        h2Count,
        h3Count,
        internalLinksCount,
        externalLinksCount,
        imageCount: images.length,
        imagesWithAlt,
        loadTime,
        pageSize: pageData.rawHtml?.length || 0,
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