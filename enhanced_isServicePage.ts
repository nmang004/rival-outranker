/**
 * Enhanced isServicePage method with additional detection criteria:
 * 1. Location/service area detection
 * 2. FAQ content detection
 * 3. Process content detection
 * 4. Staff/team bios detection
 * 5. Schema markup detection
 */
private isServicePage(page: PageCrawlResult): boolean {
  const url = page.url.toLowerCase();
  const title = page.title.toLowerCase();
  const path = new URL(page.url).pathname.toLowerCase();
  const pathSegments = path.split('/').filter(Boolean);
  const bodyText = page.bodyText.toLowerCase();
  
  // Define comprehensive service directory and term lists for accurate detection
  const serviceDirectories = [
    'services', 'service', 'products', 'solutions', 'offerings', 
    'capabilities', 'what-we-do', 'what-we-offer', 'our-services'
  ];
  
  const specificServiceTerms = [
    // HVAC specific service terms
    'ac-repair', 'ac-installation', 'ac-replacement', 'ac-maintenance', 'ac-tune-up',
    'air-conditioning', 'air-conditioner', 'cooling', 'a/c', 'hvac', 'ac',
    'furnace', 'heating', 'heat-pump', 'boiler', 'heater', 'thermostat',
    'indoor-air-quality', 'air-purifier', 'air-cleaner', 'air-filtration',
    'duct', 'duct-cleaning', 'ductwork', 'duct-sealing', 'duct-repair',
    'commercial-hvac', 'residential-hvac', 'emergency', '24-hour', 'same-day',
    'plumbing', 'electrical', 'water-heater', 'water-filtration', 'sump-pump',
    'generator', 'humidifier', 'dehumidifier', 'mini-split', 'ductless', 
    'zoning', 'zone-control', 'smart-home', 'thermostat', 'heat-repair',
    'cooling-repair', 'ac-service', 'heat-service', 'system-repair',
    
    // General service-related terms
    'repair', 'repairs', 'installation', 'installations', 'replacement', 'replacements', 
    'maintenance', 'service', 'services', 'install', 'replaced', 'replacing',
    'tune-up', 'tuneup', 'tune', 'inspection', 'cleaning', 'assessment', 'evaluation',
    'design', 'upgrade', 'conversion', 'retrofit', 'renovation', 'fix', 'fixing',
    
    // Common product/solution terms
    'system', 'unit', 'equipment', 'appliance', 'product', 'solution',
    'mini-split', 'central-air', 'zoned', 'multi-zone', 'smart', 'wifi'
  ];
  
  // Pattern 1: Direct service directory structure
  // Example: /services/*, /products/*, etc.
  if (pathSegments.length >= 1 && serviceDirectories.includes(pathSegments[0])) {
    // If it's in a service directory but doesn't contain location indicators,
    // it's likely a service page
    if (!this.containsLocationIndicator(path)) {
      return true;
    }
  }
  
  // Pattern 2: Specific service in URL that's not in a location-based path
  // Example: /ac-repair/, /furnace-installation/, etc.
  if (pathSegments.length >= 1 && 
      !this.containsLocationIndicator(path) &&
      specificServiceTerms.some(term => path.includes(term))) {
    
    // Additional check: if this is a deep path but not in a cities-served or locations directory
    if (!path.includes('cities-served') && 
        !path.includes('service-area') && 
        !path.includes('locations')) {
      return true;
    }
  }
  
  // Pattern 3: Check for service-oriented titles that aren't location-specific
  const serviceTitlePatterns = [
    /\b(hvac|ac|air conditioning|heating|cooling|furnace|boiler) (repair|service|installation|replacement|maintenance)\b/i,
    /\b(repair|install|replace|service|maintain) your (hvac|ac|furnace|heat pump|system|unit)\b/i,
    /\b(professional|expert|reliable|trusted|affordable|emergency) (hvac|ac|heating|cooling) (service|repair|installation)\b/i,
    /\b(24\/7|24-hour|same-day|emergency) (service|repair|assistance|help)\b/i,
    /\b(free|complimentary) (estimate|consultation|quote|assessment|evaluation|inspection)\b/i
  ];
  
  if (serviceTitlePatterns.some(pattern => pattern.test(title)) && 
      !this.containsLocationIndicator(title)) {
    return true;
  }
  
  // Pattern 4: Check for location/service area information - NEW
  const locationPhrases = [
    /serving/i, /service area/i, /areas we serve/i,
    /throughout/i, /across/i, /region/i, /county/i, /counties/i
  ];
  
  if (locationPhrases.some(pattern => pattern.test(bodyText)) &&
      specificServiceTerms.some(term => bodyText.includes(term))) {
    return true;
  }
  
  // Pattern 5: Check for FAQ content - NEW
  if (page.headings && page.headings.h2 && page.headings.h3) {
    const faqPatterns = [
      /frequently asked questions/i, /faqs/i, /common questions/i,
      /questions/i, /faq/i
    ];
    
    if ((page.headings.h2 && page.headings.h2.some(h2 => faqPatterns.some(pattern => pattern.test(h2)))) || 
        (page.headings.h3 && page.headings.h3.some(h3 => faqPatterns.some(pattern => pattern.test(h3))))) {
      return true;
    }
  }
  
  // Pattern 6: Check for process content - NEW
  if (page.headings) {
    const processPatterns = [
      /our process/i, /how (we|it) works/i, /steps/i, /procedure/i,
      /what to expect/i, /workflow/i, /how we/i, /process works/i,
      /(step [0-9]|first step|next step|final step)/i,
      /installation process/i, /repair process/i, /service process/i
    ];
    
    if ((page.headings.h2 && page.headings.h2.some(h2 => processPatterns.some(pattern => pattern.test(h2)))) || 
        (page.headings.h3 && page.headings.h3.some(h3 => processPatterns.some(pattern => pattern.test(h3))))) {
      return true;
    }
  }
  
  // Pattern 7: Check for staff/team bios - NEW
  if (page.headings) {
    const bioPatterns = [
      /our team/i, /our staff/i, /our technicians/i, /our experts/i,
      /meet (our|the) team/i, /about (our|the) team/i,
      /certified/i, /licensed/i, /experienced/i, /professional/i
    ];
    
    if ((page.headings.h2 && page.headings.h2.some(h2 => bioPatterns.some(pattern => pattern.test(h2)))) || 
        (page.headings.h3 && page.headings.h3.some(h3 => bioPatterns.some(pattern => pattern.test(h3))))) {
      return true;
    }
  }
  
  // Pattern 8: Check for schema markup related to services - NEW
  if (page.hasSchema && page.schemaTypes && 
      page.schemaTypes.some(schema => 
        schema.includes('Service') || schema.includes('Product') || 
        schema.includes('Offer') || schema.includes('FAQ'))) {
    return true;
  }
  
  // Pattern 9: Check the headings for service indicators 
  const serviceHeadingTerms = [
    'repair', 'installation', 'maintenance', 'service', 'replacement',
    'tune-up', 'ac', 'hvac', 'heating', 'cooling', 'furnace', 'air conditioning'
  ];
  
  // Look for service terms in h1, h2, and h3 headings
  const allHeadings = page.headings ? [
    ...(page.headings.h1 || []), 
    ...(page.headings.h2 || []), 
    ...(page.headings.h3 || [])
  ].map(h => h.toLowerCase()) : [];
  
  // If a heading contains service terms but not location terms, likely a service page
  for (const heading of allHeadings) {
    if (serviceHeadingTerms.some(term => heading.includes(term)) && 
        !this.containsLocationIndicator(heading)) {
      return true;
    }
  }
  
  // Pattern 10: Check for pricing patterns typical in service pages
  const pricingPatterns = [
    /\$\d+/,
    /starting at/i,
    /price/i,
    /cost/i,
    /estimate/i,
    /quote/i,
    /free consultation/i
  ];
  
  if (pricingPatterns.some(pattern => pattern.test(bodyText)) &&
      !this.containsLocationIndicator(title)) {
    return true;
  }
  
  // Pattern 11: Check for benefits sections typical in service pages
  const benefitPatterns = [
    /benefits/i,
    /advantages/i,
    /why choose/i
  ];
  
  if (benefitPatterns.some(pattern => pattern.test(bodyText)) &&
      specificServiceTerms.some(term => bodyText.includes(term))) {
    return true;
  }

  return false;
}