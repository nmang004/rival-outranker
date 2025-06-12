/**
 * CMS Detection Service
 * Handles CMS and framework detection, fingerprinting, and optimization strategies
 */

export interface CMSFingerprint {
  hasWordPress: boolean;
  hasShopify: boolean;
  hasSquarespace: boolean;
  hasWix: boolean;
  hasJoomla: boolean;
  hasDrupal: boolean;
  hasCustom: boolean;
  framework?: string;
}

export interface CMSOptimizations {
  priorityPatterns: string[];
  skipPatterns: string[];
  maxDepth: number;
  specialHandling: string[];
}

export class CMSDetectionService {
  private detectedCMS: string | null = null;
  private siteFingerprint: CMSFingerprint = {
    hasWordPress: false,
    hasShopify: false,
    hasSquarespace: false,
    hasWix: false,
    hasJoomla: false,
    hasDrupal: false,
    hasCustom: true
  };

  /**
   * Detect CMS and site architecture from homepage content and headers
   */
  detectCMSAndFingerprint(html: string, headers: any, url: string): CMSFingerprint {
    const htmlLower = html.toLowerCase();
    
    // Reset fingerprint for new detection
    this.siteFingerprint = {
      hasWordPress: false,
      hasShopify: false,
      hasSquarespace: false,
      hasWix: false,
      hasJoomla: false,
      hasDrupal: false,
      hasCustom: true
    };
    
    // WordPress detection
    if (htmlLower.includes('/wp-content/') || 
        htmlLower.includes('/wp-includes/') ||
        htmlLower.includes('wp-json') ||
        htmlLower.includes('wordpress') ||
        headers['x-powered-by']?.includes('WordPress')) {
      this.siteFingerprint.hasWordPress = true;
      this.detectedCMS = 'WordPress';
    }
    
    // Shopify detection
    if (htmlLower.includes('shopify') ||
        htmlLower.includes('cdn.shopify.com') ||
        headers['x-shopid'] ||
        headers['x-shopify-shop']) {
      this.siteFingerprint.hasShopify = true;
      this.detectedCMS = 'Shopify';
    }
    
    // Squarespace detection
    if (htmlLower.includes('squarespace') ||
        htmlLower.includes('assets.squarespace.com') ||
        htmlLower.includes('static1.squarespace.com')) {
      this.siteFingerprint.hasSquarespace = true;
      this.detectedCMS = 'Squarespace';
    }
    
    // Wix detection
    if (htmlLower.includes('wix.com') ||
        htmlLower.includes('static.wixstatic.com') ||
        htmlLower.includes('wix-code')) {
      this.siteFingerprint.hasWix = true;
      this.detectedCMS = 'Wix';
    }
    
    // Joomla detection
    if (htmlLower.includes('joomla') ||
        htmlLower.includes('/components/com_') ||
        htmlLower.includes('mootools') ||
        headers['x-content-encoded-by']?.includes('Joomla')) {
      this.siteFingerprint.hasJoomla = true;
      this.detectedCMS = 'Joomla';
    }
    
    // Drupal detection
    if (htmlLower.includes('drupal') ||
        htmlLower.includes('/sites/default/files/') ||
        htmlLower.includes('drupal.js') ||
        headers['x-generator']?.includes('Drupal')) {
      this.siteFingerprint.hasDrupal = true;
      this.detectedCMS = 'Drupal';
    }
    
    // Framework detection
    if (htmlLower.includes('react') || htmlLower.includes('_reactroot')) {
      this.siteFingerprint.framework = 'React';
    } else if (htmlLower.includes('angular') || htmlLower.includes('ng-app')) {
      this.siteFingerprint.framework = 'Angular';
    } else if (htmlLower.includes('vue') || htmlLower.includes('vue.js')) {
      this.siteFingerprint.framework = 'Vue.js';
    }
    
    // If no CMS detected, mark as custom
    if (!this.detectedCMS) {
      this.siteFingerprint.hasCustom = true;
      this.detectedCMS = 'Custom';
    } else {
      this.siteFingerprint.hasCustom = false;
    }
    
    console.log(`[CMSDetection] 🔍 Site fingerprint detected: ${this.detectedCMS}${this.siteFingerprint.framework ? ` (${this.siteFingerprint.framework})` : ''}`);
    
    return this.siteFingerprint;
  }

  /**
   * Get CMS-specific crawling optimizations
   */
  getCMSOptimizations(): CMSOptimizations {
    const baseConfig: CMSOptimizations = {
      priorityPatterns: ['/contact', '/about', '/services'],
      skipPatterns: ['/wp-admin', '/wp-content/uploads'],
      maxDepth: 4,
      specialHandling: []
    };
    
    switch (this.detectedCMS) {
      case 'WordPress':
        return {
          priorityPatterns: ['/contact', '/about', '/services', '/shop', '/blog'],
          skipPatterns: [
            '/wp-admin', '/wp-content/uploads', '/wp-includes',
            '/feed', '?replytocom=', '?preview=', '/tag/', '/category/',
            '/author/', '/page/', '?m=', '?paged='
          ],
          maxDepth: 3,
          specialHandling: ['wp-json', 'wp-sitemap']
        };
        
      case 'Shopify':
        return {
          priorityPatterns: ['/products', '/collections', '/pages/contact', '/pages/about'],
          skipPatterns: [
            '/admin', '/cart', '/account', '/collections/all',
            '/search', '?sort_by=', '?page=', '/blogs/news/tagged/'
          ],
          maxDepth: 3,
          specialHandling: ['collections.json', 'products.json']
        };
        
      case 'Squarespace':
        return {
          priorityPatterns: ['/contact', '/about', '/work', '/services'],
          skipPatterns: ['/config', '/universal', '?format=json'],
          maxDepth: 3,
          specialHandling: ['squarespace-headers']
        };
        
      case 'Wix':
        return {
          priorityPatterns: ['/contact', '/about', '/services'],
          skipPatterns: ['/_api/', '/wix-blog-backend'],
          maxDepth: 2, // Wix sites tend to be simpler
          specialHandling: ['wix-public-html-info-webapp']
        };
        
      default:
        return baseConfig;
    }
  }

  /**
   * Apply CMS-specific URL filtering
   */
  applyCMSFiltering(urls: string[]): string[] {
    const optimizations = this.getCMSOptimizations();
    
    // Filter out CMS-specific skip patterns
    const filteredUrls = urls.filter(url => {
      const urlLower = url.toLowerCase();
      return !optimizations.skipPatterns.some(pattern => 
        urlLower.includes(pattern.toLowerCase())
      );
    });
    
    console.log(`[CMSDetection] 🎯 CMS filtering (${this.detectedCMS}): ${urls.length} → ${filteredUrls.length} URLs (removed ${urls.length - filteredUrls.length} CMS-specific URLs)`);
    
    return filteredUrls;
  }

  /**
   * Get detected CMS type
   */
  getDetectedCMS(): string | null {
    return this.detectedCMS;
  }

  /**
   * Get complete site fingerprint
   */
  getSiteFingerprint(): CMSFingerprint {
    return { ...this.siteFingerprint };
  }

  /**
   * Reset detection state for new site analysis
   */
  reset(): void {
    this.detectedCMS = null;
    this.siteFingerprint = {
      hasWordPress: false,
      hasShopify: false,
      hasSquarespace: false,
      hasWix: false,
      hasJoomla: false,
      hasDrupal: false,
      hasCustom: true
    };
  }

  /**
   * Check if site uses a specific CMS
   */
  isCMS(cmsType: string): boolean {
    return this.detectedCMS?.toLowerCase() === cmsType.toLowerCase();
  }

  /**
   * Check if site uses any detected CMS (not custom)
   */
  hasKnownCMS(): boolean {
    return this.detectedCMS !== null && this.detectedCMS !== 'Custom';
  }
}