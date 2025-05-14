import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { CrawlerOutput } from '@/lib/types';

class Crawler {
  private MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB limit for HTML content
  private REQUEST_TIMEOUT = 30000; // 30 seconds timeout
  private USER_AGENT = 'SEO-Best-Practices-Assessment-Tool/1.0';

  /**
   * Crawl a webpage and extract its data
   */
  async crawlPage(url: string): Promise<CrawlerOutput> {
    try {
      // Validate and normalize the URL
      const normalizedUrl = this.normalizeUrl(url);
      
      // Fetch the webpage
      console.log(`Crawling page: ${normalizedUrl}`);
      let response;
      
      try {
        response = await axios.get(normalizedUrl, {
          headers: {
            'User-Agent': this.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: this.REQUEST_TIMEOUT,
          maxContentLength: this.MAX_CONTENT_SIZE,
          validateStatus: (status) => status < 500, // Accept 4xx errors to analyze them
        });
      } catch (fetchError) {
        console.error(`Error fetching page ${normalizedUrl}:`, 
          fetchError instanceof Error ? fetchError.message : String(fetchError));
        
        // Return a standardized error output for the analyzer
        return {
          url: normalizedUrl,
          title: "Error Page",
          statusCode: 0,
          meta: { 
            description: "Could not access page content", 
            ogTags: {}, 
            twitterTags: {} 
          },
          content: { text: '', wordCount: 0, paragraphs: [] },
          headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
          links: { internal: [], external: [] },
          images: [],
          schema: [],
          mobileCompatible: false,
          performance: { loadTime: 0 },
          error: fetchError instanceof Error ? fetchError.message : 'Network error occurred'
        };
      }
      
      // Check for successful response
      if (!response || response.status !== 200 || !response.data) {
        return {
          url: normalizedUrl,
          title: "Error Page",
          statusCode: response?.status || 0,
          meta: { 
            description: "Could not access page content", 
            ogTags: {}, 
            twitterTags: {} 
          },
          content: { text: '', wordCount: 0, paragraphs: [] },
          headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
          links: { internal: [], external: [] },
          images: [],
          schema: [],
          mobileCompatible: false,
          performance: { loadTime: 0 },
          error: `HTTP error: ${response?.status || 'unknown'} ${response?.statusText || 'No response'}`
        };
      }
      
      // Parse the HTML
      const $ = cheerio.load(response.data);
      
      // Extract the data
      return {
        url: normalizedUrl,
        statusCode: response.status,
        title: $('title').text().trim(),
        meta: this.extractMetaTags($),
        content: this.extractContent($),
        headings: this.extractHeadings($),
        links: this.extractLinks($, normalizedUrl),
        images: this.extractImages($, normalizedUrl),
        schema: this.extractSchemaMarkup($),
        mobileCompatible: this.checkMobileCompatibility($),
        performance: {
          loadTime: response.headers['x-response-time'] ? 
            parseInt(response.headers['x-response-time'] as string) : 
            undefined
        },
        rawHtml: response.data // Store raw HTML for deep content analysis
      };
    } catch (error) {
      console.error('Error crawling page:', error);
      
      // Create a minimal but valid structure for analysis
      const errorResponse = error as any;
      return {
        url: typeof url === 'string' ? url : 'unknown-url',
        title: "Error Page",
        statusCode: errorResponse?.response?.status || 0,
        meta: { 
          description: "Error crawling page", 
          ogTags: {}, 
          twitterTags: {} 
        },
        content: { 
          text: 'Error crawling page content', 
          wordCount: 3, 
          paragraphs: ['Error crawling page content'] 
        },
        headings: { 
          h1: ['Error Page'], 
          h2: [], h3: [], h4: [], h5: [], h6: [] 
        },
        links: { internal: [], external: [] },
        images: [],
        schema: [],
        mobileCompatible: false,
        performance: { loadTime: 0 },
        error: errorResponse?.message || 'Unknown error occurred while crawling',
        rawHtml: '<html><body>Error crawling page content</body></html>'
      };
    }
  }

  /**
   * Validate and normalize the URL
   */
  private normalizeUrl(url: string): string {
    // Clean up URL string - remove extra spaces
    url = url.trim();
    
    // Handle double protocol issues (e.g., https://https://)
    url = url.replace(/^(https?:\/\/)+/i, '$1');
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Extract meta tags from the HTML
   */
  private extractMetaTags($: cheerio.CheerioAPI): any {
    const meta = {
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'),
      robots: $('meta[name="robots"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      canonical: $('link[rel="canonical"]').attr('href'),
      ogTags: {} as Record<string, string>,
      twitterTags: {} as Record<string, string>,
    };
    
    // Extract Open Graph meta tags
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) {
        meta.ogTags[property.replace('og:', '')] = content;
      }
    });
    
    // Extract Twitter Card meta tags
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) {
        meta.twitterTags[name.replace('twitter:', '')] = content;
      }
    });
    
    return meta;
  }

  /**
   * Extract content from the HTML
   */
  private extractContent($: cheerio.CheerioAPI): any {
    // Remove script and style elements
    $('script, style, noscript, iframe, object, embed').remove();
    
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text) paragraphs.push(text);
    });
    
    // Get all text from the body
    const text = $('body').text().trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    return {
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      paragraphs,
    };
  }

  /**
   * Extract headings from the HTML
   */
  private extractHeadings($: cheerio.CheerioAPI): any {
    const headings = {
      h1: [] as string[],
      h2: [] as string[],
      h3: [] as string[],
      h4: [] as string[],
      h5: [] as string[],
      h6: [] as string[],
    };
    
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      $(tag).each((_, el) => {
        const text = $(el).text().trim();
        if (text) headings[tag as keyof typeof headings].push(text);
      });
    });
    
    return headings;
  }

  /**
   * Extract links from the HTML
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): any {
    const parsedBaseUrl = new URL(baseUrl);
    const baseDomain = parsedBaseUrl.hostname;
    
    const internal: Array<{ url: string, text: string, broken: boolean }> = [];
    const external: Array<{ url: string, text: string }> = [];
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      // Skip empty links, anchors, javascript, and mailto
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }
      
      try {
        // Try to resolve relative URLs
        const resolvedUrl = new URL(href, baseUrl).toString();
        const parsedUrl = new URL(resolvedUrl);
        
        if (parsedUrl.hostname === baseDomain) {
          internal.push({ url: resolvedUrl, text, broken: false });
        } else {
          external.push({ url: resolvedUrl, text });
        }
      } catch (error) {
        // If URL parsing fails, assume it's an internal broken link
        internal.push({ url: href, text, broken: true });
      }
    });
    
    return { internal, external };
  }

  /**
   * Extract images from the HTML
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string): Array<{ url: string, alt?: string, size?: number }> {
    const images: Array<{ url: string, alt?: string, size?: number }> = [];
    
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      const alt = $(el).attr('alt');
      
      if (src) {
        try {
          // Try to resolve relative URLs
          const resolvedUrl = new URL(src, baseUrl).toString();
          images.push({ url: resolvedUrl, alt });
        } catch (error) {
          // If URL parsing fails, use the original src
          images.push({ url: src, alt });
        }
      }
    });
    
    return images;
  }

  /**
   * Extract schema markup from the HTML
   */
  private extractSchemaMarkup($: cheerio.CheerioAPI): Array<{ types: string[], json: string }> {
    const schema: Array<{ types: string[], json: string }> = [];
    
    // Look for JSON-LD script tags
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = $(el).html();
        if (!json) return;
        
        const data = JSON.parse(json);
        let types: string[] = [];
        
        // Handle different schema formats
        if (data['@type']) {
          types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
        } else if (data['@graph'] && Array.isArray(data['@graph'])) {
          // Extract types from graph items
          data['@graph'].forEach((item: any) => {
            if (item['@type']) {
              const itemTypes = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
              types = [...types, ...itemTypes];
            }
          });
        }
        
        // Check for microdata schema
        if (types.length === 0) {
          // Find itemscope elements and get their itemtype
          $('[itemscope]').each((_, el) => {
            const itemtype = $(el).attr('itemtype');
            if (itemtype) {
              types.push(itemtype.split('/').pop() || itemtype);
            }
          });
        }
        
        // Cleanup and de-duplicate types
        types = Array.from(new Set(types.filter(t => t)));
        
        schema.push({ types, json });
      } catch (error) {
        console.error('Error parsing JSON-LD schema:', error);
        // Continue to the next schema
      }
    });
    
    // Also check for RDFa schemas
    $('[property], [typeof]').each((_, el) => {
      try {
        const typeValue = $(el).attr('typeof');
        const property = $(el).attr('property');
        
        if (typeValue || property) {
          const types = typeValue ? [typeValue] : [];
          if (property && property.includes('schema.org')) {
            types.push(property.split('/').pop() || property);
          }
          
          if (types.length > 0) {
            const content = $(el).text().trim();
            schema.push({ 
              types, 
              json: JSON.stringify({ '@type': types[0], content })
            });
          }
        }
      } catch (error) {
        console.error('Error extracting RDFa schema:', error);
      }
    });
    
    return schema;
  }

  /**
   * Check if the page is optimized for mobile
   */
  private checkMobileCompatibility($: cheerio.CheerioAPI): boolean {
    // Check for viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content');
    if (!viewport) return false;
    
    // Check if viewport contains width=device-width
    return viewport.includes('width=device-width');
  }
}

export const crawler = new Crawler();
