import { BaseCrawlerService, CrawlOptions, CrawlResult, SelectorConfig } from './base-crawler.service.js';

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  selectors: {
    headlines: string;
    links: string;
    dates?: string;
    descriptions?: string;
    authors?: string;
    categories?: string;
  };
  isActive: boolean;
  crawlFrequency: 'hourly' | 'daily' | 'weekly';
  lastCrawled?: Date;
}

export interface NewsArticle {
  title: string;
  url: string;
  description?: string;
  publishedAt?: string;
  author?: string;
  category?: string;
  source: string;
  crawledAt: string;
}

export interface NewsCrawlResult {
  source: string;
  articles: NewsArticle[];
  success: boolean;
  error?: string;
  crawledAt: string;
}

export class NewsCrawlerService extends BaseCrawlerService {
  constructor(options: CrawlOptions = {}) {
    super({
      delay: 2000, // Be respectful to news sites
      maxConcurrency: 3,
      ...options
    });
  }

  async crawlNewsSource(source: NewsSource): Promise<NewsCrawlResult> {
    try {
      const selectors: Record<string, SelectorConfig> = {
        headlines: {
          query: source.selectors.headlines,
          multiple: true,
          innerText: true
        },
        links: {
          query: source.selectors.links,
          multiple: true,
          attribute: 'href'
        }
      };

      // Add optional selectors if provided
      if (source.selectors.dates) {
        selectors.dates = {
          query: source.selectors.dates,
          multiple: true,
          innerText: true
        };
      }

      if (source.selectors.descriptions) {
        selectors.descriptions = {
          query: source.selectors.descriptions,
          multiple: true,
          innerText: true
        };
      }

      if (source.selectors.authors) {
        selectors.authors = {
          query: source.selectors.authors,
          multiple: true,
          innerText: true
        };
      }

      if (source.selectors.categories) {
        selectors.categories = {
          query: source.selectors.categories,
          multiple: true,
          innerText: true
        };
      }

      const result = await this.crawlPage(source.url, selectors);

      if (!result.success) {
        return {
          source: source.name,
          articles: [],
          success: false,
          error: result.error,
          crawledAt: new Date().toISOString()
        };
      }

      const articles = this.processNewsData(result.data, source);

      return {
        source: source.name,
        articles,
        success: true,
        crawledAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Failed to crawl news source ${source.name}:`, error);
      return {
        source: source.name,
        articles: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        crawledAt: new Date().toISOString()
      };
    }
  }

  private processNewsData(data: any, source: NewsSource): NewsArticle[] {
    const articles: NewsArticle[] = [];
    const { headlines = [], links = [], dates = [], descriptions = [], authors = [], categories = [] } = data;

    // Ensure we have at least headlines and links
    if (!headlines.length || !links.length) {
      return articles;
    }

    const maxLength = Math.min(headlines.length, links.length);

    for (let i = 0; i < maxLength; i++) {
      const title = headlines[i];
      let url = links[i];

      // Skip if title or url is missing
      if (!title || !url) continue;

      // Convert relative URLs to absolute
      if (url.startsWith('/')) {
        const baseUrl = new URL(source.url);
        url = `${baseUrl.origin}${url}`;
      } else if (!url.startsWith('http')) {
        const baseUrl = new URL(source.url);
        url = `${baseUrl.origin}/${url}`;
      }

      const article: NewsArticle = {
        title: title.trim(),
        url,
        source: source.name,
        crawledAt: new Date().toISOString()
      };

      // Add optional fields if available
      if (dates[i]) {
        article.publishedAt = this.parseDate(dates[i]);
      }

      if (descriptions[i]) {
        article.description = descriptions[i].trim();
      }

      if (authors[i]) {
        article.author = authors[i].trim();
      }

      if (categories[i]) {
        article.category = categories[i].trim();
      }

      articles.push(article);
    }

    return articles;
  }

  private parseDate(dateString: string): string {
    try {
      // Try to parse various date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If direct parsing fails, try some common formats
        const cleanDate = dateString.replace(/\s+/g, ' ').trim();
        const parsed = new Date(cleanDate);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
        return new Date().toISOString(); // Fallback to current date
      }
      return date.toISOString();
    } catch (error) {
      return new Date().toISOString(); // Fallback to current date
    }
  }

  async crawlMultipleSources(sources: NewsSource[]): Promise<NewsCrawlResult[]> {
    const results: NewsCrawlResult[] = [];
    
    // Process sources in smaller batches to avoid overwhelming servers
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < sources.length; i += batchSize) {
      batches.push(sources.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(source => this.crawlNewsSource(source));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            source: batch[index].name,
            articles: [],
            success: false,
            error: result.reason?.message || 'Unknown error',
            crawledAt: new Date().toISOString()
          });
        }
      });

      // Add delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    return results;
  }

  // Helper method to validate news sources configuration
  validateNewsSource(source: Partial<NewsSource>): string[] {
    const errors: string[] = [];

    if (!source.name?.trim()) {
      errors.push('Source name is required');
    }

    if (!source.url?.trim()) {
      errors.push('Source URL is required');
    } else {
      try {
        new URL(source.url);
      } catch {
        errors.push('Source URL must be a valid URL');
      }
    }

    if (!source.selectors?.headlines?.trim()) {
      errors.push('Headlines selector is required');
    }

    if (!source.selectors?.links?.trim()) {
      errors.push('Links selector is required');
    }

    return errors;
  }
}