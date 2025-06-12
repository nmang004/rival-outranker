import puppeteer, { Browser, Page } from 'puppeteer';
import robotsParser from 'robots-parser';
import { URL } from 'url';

export interface CrawlOptions {
  maxConcurrency?: number;
  delay?: number;
  timeout?: number;
  retryAttempts?: number;
  respectRobots?: boolean;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface SelectorConfig {
  query: string;
  multiple?: boolean;
  attribute?: string;
  innerText?: boolean;
}

export interface CrawlResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    url: string;
    crawledAt: string;
    title?: string;
    userAgent: string;
    statusCode?: number;
    responseHeaders?: Record<string, string>;
  };
}

export class BaseCrawlerService {
  protected options: Required<CrawlOptions>;
  protected browser: Browser | null = null;
  private activePages = 0;
  private robotsCache = new Map<string, any>();

  constructor(options: CrawlOptions = {}) {
    this.options = {
      maxConcurrency: 5,
      delay: 1000,
      timeout: 30000,
      retryAttempts: 3,
      respectRobots: true,
      userAgent: 'RivalOutranker/1.0 (+https://rivaloutranker.com/bot)',
      headers: {},
      ...options
    };
  }

  async initialize(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  async checkRobots(url: string): Promise<boolean> {
    if (!this.options.respectRobots) return true;

    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.origin}/robots.txt`;
      
      if (!this.robotsCache.has(robotsUrl)) {
        const response = await fetch(robotsUrl, {
          headers: { 'User-Agent': this.options.userAgent }
        });
        
        if (response.ok) {
          const robotsTxt = await response.text();
          const robots = robotsParser(robotsUrl, robotsTxt);
          this.robotsCache.set(robotsUrl, robots);
        } else {
          // If robots.txt doesn't exist, assume crawling is allowed
          this.robotsCache.set(robotsUrl, { isAllowed: () => true });
        }
      }
      
      const robots = this.robotsCache.get(robotsUrl);
      return robots.isAllowed(url, this.options.userAgent);
    } catch (error) {
      console.warn(`Failed to check robots.txt for ${url}:`, error);
      return true; // Default to allowing if check fails
    }
  }

  async crawlPage<T = any>(
    url: string, 
    selectors: Record<string, SelectorConfig> = {}
  ): Promise<CrawlResult<T>> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.options.retryAttempts) {
      try {
        return await this.performCrawl<T>(url, selectors);
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < this.options.retryAttempts) {
          const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.delay(delayMs);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
      metadata: {
        url,
        crawledAt: new Date().toISOString(),
        userAgent: this.options.userAgent
      }
    };
  }

  private async performCrawl<T>(
    url: string, 
    selectors: Record<string, SelectorConfig>
  ): Promise<CrawlResult<T>> {
    if (!(await this.checkRobots(url))) {
      throw new Error(`Crawling not allowed by robots.txt: ${url}`);
    }

    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    
    try {
      this.activePages++;
      
      // Set user agent and headers
      await page.setUserAgent(this.options.userAgent);
      if (Object.keys(this.options.headers).length > 0) {
        await page.setExtraHTTPHeaders(this.options.headers);
      }

      // Navigate to the page
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.options.timeout 
      });

      if (!response) {
        throw new Error('Failed to load page');
      }

      // Extract data based on selectors
      const data = await page.evaluate((selectors) => {
        const result: any = {};
        
        for (const [key, selector] of Object.entries(selectors)) {
          try {
            if (selector.multiple) {
              const elements = Array.from(document.querySelectorAll(selector.query));
              result[key] = elements.map(el => {
                if (selector.attribute) {
                  return el.getAttribute(selector.attribute);
                } else {
                  return selector.innerText ? el.innerText?.trim() : el.textContent?.trim();
                }
              }).filter(Boolean);
            } else {
              const element = document.querySelector(selector.query);
              if (element) {
                if (selector.attribute) {
                  result[key] = element.getAttribute(selector.attribute);
                } else {
                  result[key] = selector.innerText ? element.innerText?.trim() : element.textContent?.trim();
                }
              } else {
                result[key] = null;
              }
            }
          } catch (error) {
            console.warn(`Failed to extract data for selector ${key}:`, error);
            result[key] = null;
          }
        }
        
        return result;
      }, selectors);

      // Get page metadata
      const title = await page.title();
      const statusCode = response.status();
      const responseHeaders = response.headers();

      const cleanedData = this.validateAndCleanData(data);

      return {
        success: true,
        data: cleanedData as T,
        metadata: {
          url,
          crawledAt: new Date().toISOString(),
          title,
          userAgent: this.options.userAgent,
          statusCode,
          responseHeaders
        }
      };
      
    } finally {
      await page.close();
      this.activePages--;
    }
  }

  private validateAndCleanData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed) {
            cleaned[key] = trimmed;
          }
        } else if (Array.isArray(value)) {
          const filteredArray = value
            .filter(item => item !== null && item !== undefined && item !== '')
            .map(item => typeof item === 'string' ? item.trim() : item)
            .filter(item => item !== '');
          
          if (filteredArray.length > 0) {
            cleaned[key] = filteredArray;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  async crawlMultiple<T = any>(
    urls: string[],
    selectors: Record<string, SelectorConfig> = {}
  ): Promise<CrawlResult<T>[]> {
    const results: CrawlResult<T>[] = [];
    const semaphore = new Array(this.options.maxConcurrency).fill(null);
    
    const crawlWithSemaphore = async (url: string): Promise<CrawlResult<T>> => {
      await this.delay(this.options.delay);
      return this.crawlPage<T>(url, selectors);
    };

    const chunks = this.chunkArray(urls, this.options.maxConcurrency);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(url => crawlWithSemaphore(url))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getStats() {
    return {
      activePages: this.activePages,
      robotsCacheSize: this.robotsCache.size,
      isInitialized: !!this.browser
    };
  }
}