import { BaseCrawlerService, CrawlOptions, CrawlResult, SelectorConfig } from './base-crawler.service.js';
import { load } from 'cheerio';

export interface SeoData {
  url: string;
  title?: string;
  metaDescription?: string;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  metaKeywords?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schemaMarkup: any[];
  internalLinks: string[];
  externalLinks: string[];
  images: Array<{ src: string; alt?: string; title?: string }>;
  wordCount: number;
  readingTime: number;
  textToHtmlRatio: number;
  loadTime?: number;
  crawledAt: string;
}

export interface CompetitorData {
  domain: string;
  pages: SeoData[];
  domainAuthority?: number;
  backlinks?: number;
  organicKeywords?: number;
  organicTraffic?: number;
  crawledAt: string;
}

export class SeoCrawlerService extends BaseCrawlerService {
  constructor(options: CrawlOptions = {}) {
    super({
      delay: 1500,
      maxConcurrency: 4,
      timeout: 45000,
      ...options
    });
  }

  async crawlSeoData(url: string): Promise<CrawlResult<SeoData>> {
    const startTime = Date.now();

    try {
      const result = await this.crawlPage(url, {});
      
      if (!result.success) {
        return result as CrawlResult<SeoData>;
      }

      // Get the HTML content for detailed analysis
      const htmlResult = await this.getPageHtml(url);
      if (!htmlResult.success || !htmlResult.data) {
        return result as CrawlResult<SeoData>;
      }

      const loadTime = Date.now() - startTime;
      const seoData = this.extractSeoData(htmlResult.data, url, loadTime);

      return {
        success: true,
        data: seoData,
        metadata: result.metadata
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          url,
          crawledAt: new Date().toISOString(),
          userAgent: this.options.userAgent
        }
      };
    }
  }

  private async getPageHtml(url: string): Promise<CrawlResult<string>> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    
    try {
      await page.setUserAgent(this.options.userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.options.timeout });
      
      const html = await page.content();
      
      return {
        success: true,
        data: html,
        metadata: {
          url,
          crawledAt: new Date().toISOString(),
          userAgent: this.options.userAgent
        }
      };
    } finally {
      await page.close();
    }
  }

  private extractSeoData(html: string, url: string, loadTime: number): SeoData {
    const $ = load(html);
    const domain = new URL(url).origin;

    // Basic meta data
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim();
    const metaKeywords = $('meta[name="keywords"]').attr('content')?.trim();
    const canonicalUrl = $('link[rel="canonical"]').attr('href');
    const metaRobots = $('meta[name="robots"]').attr('content')?.trim();

    // Open Graph data
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
    const ogDescription = $('meta[property="og:description"]').attr('content')?.trim();
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim();

    // Twitter Card data
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim();
    const twitterDescription = $('meta[name="twitter:description"]').attr('content')?.trim();
    const twitterImage = $('meta[name="twitter:image"]').attr('content')?.trim();

    // Heading tags
    const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h2Tags = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h3Tags = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean);

    // Schema markup
    const schemaMarkup: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const schema = JSON.parse($(el).html() || '');
        schemaMarkup.push(schema);
      } catch (error) {
        // Ignore invalid JSON
      }
    });

    // Links analysis
    const internalLinks: string[] = [];
    const externalLinks: string[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      try {
        if (href.startsWith('/')) {
          internalLinks.push(`${domain}${href}`);
        } else if (href.startsWith('http')) {
          const linkDomain = new URL(href).origin;
          if (linkDomain === domain) {
            internalLinks.push(href);
          } else {
            externalLinks.push(href);
          }
        }
      } catch (error) {
        // Ignore invalid URLs
      }
    });

    // Images analysis
    const images: Array<{ src: string; alt?: string; title?: string }> = [];
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (!src) return;

      const alt = $(el).attr('alt')?.trim();
      const titleAttr = $(el).attr('title')?.trim();

      images.push({
        src: src.startsWith('/') ? `${domain}${src}` : src,
        alt,
        title: titleAttr
      });
    });

    // Content analysis
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Assuming 200 WPM reading speed

    // Text to HTML ratio
    const htmlLength = html.length;
    const textLength = bodyText.length;
    const textToHtmlRatio = htmlLength > 0 ? (textLength / htmlLength) * 100 : 0;

    return {
      url,
      title,
      metaDescription,
      h1Tags,
      h2Tags,
      h3Tags,
      metaKeywords,
      canonicalUrl,
      metaRobots,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      schemaMarkup,
      internalLinks: [...new Set(internalLinks)], // Remove duplicates
      externalLinks: [...new Set(externalLinks)], // Remove duplicates
      images,
      wordCount,
      readingTime,
      textToHtmlRatio: Math.round(textToHtmlRatio * 100) / 100,
      loadTime,
      crawledAt: new Date().toISOString()
    };
  }

  async crawlCompetitorSite(domain: string, maxPages: number = 10): Promise<CompetitorData> {
    const startUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    
    try {
      // First, get the homepage
      const homepageResult = await this.crawlSeoData(startUrl);
      const pages: SeoData[] = [];
      
      if (homepageResult.success && homepageResult.data) {
        pages.push(homepageResult.data);
      }

      // Find additional pages to crawl from internal links
      if (homepageResult.success && homepageResult.data) {
        const additionalUrls = homepageResult.data.internalLinks
          .filter(url => this.isValidPageUrl(url))
          .slice(0, maxPages - 1);

        for (const url of additionalUrls) {
          try {
            const pageResult = await this.crawlSeoData(url);
            if (pageResult.success && pageResult.data) {
              pages.push(pageResult.data);
            }
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.warn(`Failed to crawl page ${url}:`, error);
          }
        }
      }

      return {
        domain: new URL(startUrl).hostname,
        pages,
        crawledAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Failed to crawl competitor site ${domain}:`, error);
      return {
        domain: new URL(startUrl).hostname,
        pages: [],
        crawledAt: new Date().toISOString()
      };
    }
  }

  private isValidPageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      // Skip common non-content pages
      const skipPatterns = [
        '/wp-admin', '/admin', '/login', '/register',
        '/search', '/tag/', '/category/', '/author/',
        '/feed', '/rss', '/sitemap', '/robots.txt',
        '.xml', '.pdf', '.doc', '.xls', '.zip',
        '/cart', '/checkout', '/account'
      ];

      return !skipPatterns.some(pattern => path.includes(pattern));
    } catch {
      return false;
    }
  }

  async crawlSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      const result = await this.crawlPage(sitemapUrl, {});
      
      if (!result.success) {
        return [];
      }

      // Get the XML content
      const xmlResult = await this.getPageHtml(sitemapUrl);
      if (!xmlResult.success || !xmlResult.data) {
        return [];
      }

      const $ = load(xmlResult.data);
      const urls: string[] = [];

      // Handle XML sitemaps
      $('url loc').each((_, el) => {
        const url = $(el).text().trim();
        if (url) {
          urls.push(url);
        }
      });

      // Handle sitemap index files
      $('sitemap loc').each((_, el) => {
        const url = $(el).text().trim();
        if (url) {
          urls.push(url);
        }
      });

      return urls;
    } catch (error) {
      console.error(`Failed to crawl sitemap ${sitemapUrl}:`, error);
      return [];
    }
  }

  async batchCrawlSeoData(urls: string[]): Promise<CrawlResult<SeoData>[]> {
    const results: CrawlResult<SeoData>[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.crawlSeoData(url));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            metadata: {
              url: batch[index],
              crawledAt: new Date().toISOString(),
              userAgent: this.options.userAgent
            }
          });
        }
      });

      // Add delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return results;
  }
}