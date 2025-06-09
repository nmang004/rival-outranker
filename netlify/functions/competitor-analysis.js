var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/external/search.service.ts
var search_service_exports = {};
__export(search_service_exports, {
  searchService: () => searchService
});
import axios2 from "axios";
var SearchService, searchService;
var init_search_service = __esm({
  "server/services/external/search.service.ts"() {
    SearchService = class {
      apiKey;
      searchEngineId;
      baseUrl = "https://www.googleapis.com/customsearch/v1";
      queryCounter = 0;
      // Google Custom Search provides 100 free queries per day (default)
      queryLimit = 100;
      constructor() {
        this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
        this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
        this.queryCounter = Number(process.env.SEARCH_QUERY_COUNTER) || 0;
      }
      /**
       * Search for competitors based on keyword and location
       */
      async searchCompetitors(keyword, location, options = {}) {
        if (!this.apiKey || !this.searchEngineId) {
          console.warn("Google Custom Search API configuration is not complete, using fallback data");
          return this.getFallbackResults(keyword, 5);
        }
        try {
          const searchQuery = location ? `${keyword} ${location}` : keyword;
          const allResults = [];
          const maxResults = Math.min(options.count || 20, 50);
          const maxPages = Math.min(Math.ceil(maxResults / 10), 5);
          console.log(`API usage limited to max ${maxPages} queries per competitor analysis`);
          for (let page = 0; page < maxPages; page++) {
            this.queryCounter++;
            const startIndex = page * 10 + 1;
            console.log(`Fetching page ${page + 1} of search results (startIndex: ${startIndex})`);
            const response = await axios2.get(this.baseUrl, {
              params: {
                key: this.apiKey,
                cx: this.searchEngineId,
                q: searchQuery,
                num: 10,
                // Max 10 results per request
                start: startIndex,
                gl: "us",
                // Country to search from
                cr: options.location ? `country${options.location.substring(0, 2).toUpperCase()}` : "countryUS",
                dateRestrict: options.dateRestrict
              }
            });
            process.env.SEARCH_QUERY_COUNTER = this.queryCounter.toString();
            if (response.data.error) {
              console.error(`Google Custom Search API error on page ${page + 1}:`, response.data.error);
              break;
            }
            if (!response.data.items || response.data.items.length === 0) {
              console.warn(`No results from Google Custom Search API on page ${page + 1}`);
              break;
            }
            allResults.push(...response.data.items);
            if (!response.data.queries?.nextPage) {
              console.log("No more pages available");
              break;
            }
          }
          if (allResults.length === 0) {
            console.warn("No results from Google Custom Search API");
            return this.getFallbackResults(keyword, 5);
          }
          const filteredResults = allResults.filter((item) => {
            const domain = item.displayLink.toLowerCase();
            if (domain.includes("wikipedia.org") || domain.includes("youtube.com") || domain.includes("facebook.com") || domain.includes("twitter.com") || domain.includes("instagram.com") || domain.includes("reddit.com") || domain.includes("quora.com") || domain.includes("amazon.com") || domain.includes("yelp.com") || domain.includes("gov") || domain.includes("edu")) {
              return false;
            }
            return true;
          });
          console.log(`Found ${filteredResults.length} filtered results from Google CSE`);
          return filteredResults.map((item) => ({
            name: item.title,
            url: item.link,
            snippet: item.snippet
          }));
        } catch (error) {
          console.error("Error searching Google Custom Search API:", error);
          return this.getFallbackResults(keyword, 5);
        }
      }
      /**
       * Get the current query count
       */
      getQueryCount() {
        return this.queryCounter;
      }
      /**
       * Get the query limit
       */
      getQueryLimit() {
        return this.queryLimit;
      }
      /**
       * Get remaining queries
       */
      getRemainingQueries() {
        return Math.max(0, this.queryLimit - this.queryCounter);
      }
      /**
       * Get fallback results when API is not available
       */
      getFallbackResults(keyword, count) {
        const results = [];
        const keywordFormatted = keyword.toLowerCase().replace(/[^a-z0-9]/g, "");
        const domainTypes = [
          { prefix: "", suffix: "expert.com", description: `Leading provider of ${keyword} services with expert solutions.` },
          { prefix: "best", suffix: "solutions.com", description: `Top-rated ${keyword} solutions for businesses and individuals.` },
          { prefix: "pro", suffix: "services.com", description: `Professional ${keyword} services with guaranteed satisfaction.` },
          { prefix: "the", suffix: "pros.co", description: `${keyword} professionals serving clients nationwide.` },
          { prefix: "", suffix: "hub.com", description: `Your one-stop resource for all ${keyword} needs and information.` }
        ];
        for (let i = 0; i < count; i++) {
          const domainTemplate = domainTypes[i % domainTypes.length];
          results.push({
            name: `${domainTemplate.prefix}${keywordFormatted}${domainTemplate.suffix}`,
            url: `https://www.${domainTemplate.prefix}${keywordFormatted}${domainTemplate.suffix}`,
            snippet: domainTemplate.description
          });
        }
        return results;
      }
    };
    searchService = new SearchService();
  }
});

// server/services/audit/crawler.service.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";
import * as https from "https";
import * as dns from "dns";
import { promisify } from "util";
var dnsLookup = promisify(dns.lookup);
var dnsResolve = promisify(dns.resolve);
var Crawler = class {
  MAX_CONTENT_SIZE = 10 * 1024 * 1024;
  // 10MB limit for HTML content
  REQUEST_TIMEOUT = 45e3;
  // 45 seconds timeout
  USER_AGENT = "SEO-Best-Practices-Assessment-Tool/1.0";
  MAX_REDIRECTS = 10;
  // Maximum number of redirects to follow
  CRAWL_DELAY = 500;
  // Delay between requests in milliseconds
  MAX_PAGES = 50;
  // Maximum pages to crawl per site
  // Map to cache DNS resolutions
  dnsCache = /* @__PURE__ */ new Map();
  // Map to cache HTTP responses (to avoid crawling the same URL twice)
  responseCache = /* @__PURE__ */ new Map();
  // Set to track broken links for verification
  brokenLinks = /* @__PURE__ */ new Set();
  // Crawling state
  crawledUrls = /* @__PURE__ */ new Set();
  pendingUrls = [];
  currentSite = "";
  stats = {
    pagesCrawled: 0,
    pagesSkipped: 0,
    errorsEncountered: 0,
    startTime: 0,
    endTime: 0
  };
  /**
   * Crawl a webpage and extract its data
   */
  async crawlPage(url) {
    try {
      console.log(`[Crawler] Starting crawl for URL: ${url}`);
      const normalizedUrl = this.normalizeUrl(url);
      console.log(`[Crawler] Normalized URL: ${normalizedUrl}`);
      if (this.responseCache.has(normalizedUrl)) {
        console.log(`[Crawler] Using cached response for: ${normalizedUrl}`);
        return this.responseCache.get(normalizedUrl);
      }
      console.log(`[Crawler] Crawling page: ${normalizedUrl}`);
      console.log(`[Crawler] Checking DNS availability for domain...`);
      const dnsResult = await this.checkDomainAvailability(normalizedUrl);
      if (!dnsResult.available) {
        console.error(`[Crawler] DNS resolution failed:`, dnsResult.error);
        const errorOutput = this.createErrorOutput(
          normalizedUrl,
          "DNS Error",
          -1,
          `Domain not available: ${dnsResult.error}`
        );
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      console.log(`[Crawler] DNS resolution successful`);
      const startTime = Date.now();
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        // Allow self-signed certificates
        timeout: this.REQUEST_TIMEOUT
      });
      let response;
      try {
        console.log(`[Crawler] Making HTTP request to ${normalizedUrl}...`);
        response = await axios.get(normalizedUrl, {
          headers: {
            "User-Agent": this.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml",
            "Accept-Language": "en-US,en;q=0.9"
          },
          timeout: this.REQUEST_TIMEOUT,
          maxContentLength: this.MAX_CONTENT_SIZE,
          maxRedirects: this.MAX_REDIRECTS,
          validateStatus: (status) => status < 500,
          // Accept 4xx errors to analyze them
          httpsAgent,
          decompress: true
          // Handle gzip/deflate automatically
        });
      } catch (error) {
        const fetchError = error;
        console.error(
          `[Crawler] ERROR fetching page ${normalizedUrl}:`,
          fetchError instanceof Error ? fetchError.message : String(fetchError)
        );
        console.error(`[Crawler] Error details:`, {
          code: fetchError.code,
          syscall: fetchError.syscall,
          hostname: fetchError.hostname,
          response: fetchError.response?.status,
          responseHeaders: fetchError.response?.headers,
          responseData: fetchError.response?.data?.substring ? fetchError.response.data.substring(0, 200) : fetchError.response?.data
        });
        const status = fetchError.response?.status || 0;
        const errorMessage = fetchError instanceof Error ? fetchError.message : "Network error occurred";
        const errorOutput = this.createErrorOutput(
          normalizedUrl,
          status === 404 ? "Not Found" : "Error Page",
          status,
          errorMessage
        );
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      const loadTime = Date.now() - startTime;
      console.log(`[Crawler] HTTP response received - Status: ${response.status}, Content-Type: ${response.headers["content-type"]}, Load time: ${loadTime}ms, Size: ${response.data.length} bytes`);
      if (!response || response.status !== 200) {
        const errorMessage = this.getStatusCodeDescription(response?.status);
        const errorOutput = this.createErrorOutput(
          normalizedUrl,
          response?.statusText || "Error Page",
          response?.status || 0,
          errorMessage
        );
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      const contentType = response.headers["content-type"] || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        const errorOutput = this.createErrorOutput(
          normalizedUrl,
          "Non-HTML Content",
          response.status,
          `Content type is ${contentType}, not HTML`
        );
        this.responseCache.set(normalizedUrl, errorOutput);
        return errorOutput;
      }
      const responseHeaders = response.headers;
      const $ = cheerio.load(response.data);
      const noindex = this.checkNoindex($);
      const links = this.extractLinks($, normalizedUrl);
      await this.verifyInternalLinks(links.internal, normalizedUrl);
      const resourceSize = Buffer.from(response.data).length;
      const totalResourceCount = $('img, script, link[rel="stylesheet"], source, iframe').length;
      const contentLength = parseInt(responseHeaders["content-length"] || "0", 10) || resourceSize;
      const result = {
        url: normalizedUrl,
        statusCode: response.status,
        title: $("title").text().trim(),
        meta: this.extractMetaTags($),
        content: this.extractContent($),
        headings: this.extractHeadings($),
        links,
        images: this.extractImages($, normalizedUrl),
        schema: this.extractSchemaMarkup($),
        mobileCompatible: this.checkMobileCompatibility($),
        performance: {
          loadTime,
          resourceCount: totalResourceCount,
          resourceSize: contentLength
        },
        security: {
          hasHttps: normalizedUrl.startsWith("https://"),
          hasMixedContent: this.checkMixedContent($, normalizedUrl),
          hasSecurityHeaders: this.checkSecurityHeaders(responseHeaders)
        },
        accessibility: this.checkAccessibility($),
        seoIssues: {
          noindex,
          brokenLinks: links.internal.filter((link) => link.broken).length,
          missingAltText: this.countMissingAltText($),
          duplicateMetaTags: this.checkDuplicateMetaTags($),
          thinContent: this.checkThinContent($),
          missingHeadings: this.checkMissingHeadings($),
          robots: responseHeaders["x-robots-tag"] || $('meta[name="robots"]').attr("content")
        },
        html: response.data,
        // Add html field for the analyzer
        rawHtml: response.data
        // Store raw HTML for deep content analysis
      };
      this.responseCache.set(normalizedUrl, result);
      await new Promise((resolve2) => setTimeout(resolve2, this.CRAWL_DELAY));
      return result;
    } catch (error) {
      console.error("[Crawler] CRITICAL ERROR crawling page:", error);
      console.error("[Crawler] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      const errorResponse = error;
      const errorOutput = this.createErrorOutput(
        typeof url === "string" ? url : "unknown-url",
        "Error Page",
        errorResponse?.response?.status || 0,
        errorResponse?.message || "Unknown error occurred while crawling"
      );
      return errorOutput;
    }
  }
  /**
   * Create standardized error output
   */
  createErrorOutput(url, title, statusCode, errorMessage) {
    return {
      url,
      title,
      statusCode,
      meta: {
        description: "Error accessing page content",
        ogTags: {},
        twitterTags: {}
      },
      content: {
        text: `Error: ${errorMessage}`,
        wordCount: errorMessage.split(/\s+/).length,
        paragraphs: [`Error: ${errorMessage}`]
      },
      headings: {
        h1: [title],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      },
      links: { internal: [], external: [] },
      images: [],
      schema: [],
      mobileCompatible: false,
      performance: { loadTime: 0, resourceCount: 0, resourceSize: 0 },
      security: {
        hasHttps: url.startsWith("https://"),
        hasMixedContent: false,
        hasSecurityHeaders: false
      },
      accessibility: {
        hasAccessibleElements: false,
        missingAltText: 0,
        hasAriaAttributes: false,
        hasProperHeadingStructure: false
      },
      seoIssues: {
        noindex: false,
        brokenLinks: 0,
        missingAltText: 0,
        duplicateMetaTags: false,
        thinContent: true,
        missingHeadings: true,
        robots: null
      },
      error: errorMessage,
      html: `<html><body><h1>${title}</h1><p>${errorMessage}</p></body></html>`,
      rawHtml: `<html><body><h1>${title}</h1><p>${errorMessage}</p></body></html>`
    };
  }
  /**
   * Check domain availability using DNS lookup
   */
  async checkDomainAvailability(url) {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      if (this.dnsCache.has(hostname)) {
        return { available: true };
      }
      const dnsResult = await dnsLookup(hostname).catch((err) => {
        return { error: err.message };
      });
      if ("error" in dnsResult) {
        return { available: false, error: dnsResult.error };
      }
      this.dnsCache.set(hostname, dnsResult.address);
      return { available: true };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : "Unknown DNS error"
      };
    }
  }
  /**
   * Verify internal links to check if they're broken
   */
  async verifyInternalLinks(links, baseUrl) {
    const linksToCheck = links.slice(0, 5);
    const baseDomain = new URL(baseUrl).hostname;
    for (const link of linksToCheck) {
      if (link.broken) continue;
      if (this.brokenLinks.has(link.url)) {
        link.broken = true;
        continue;
      }
      try {
        const parsedUrl = new URL(link.url);
        if (parsedUrl.hostname !== baseDomain) continue;
        const headResponse = await axios.head(link.url, {
          timeout: 5e3,
          maxRedirects: 3,
          validateStatus: () => true
          // Accept all status codes
        }).catch((err) => {
          return { status: 0 };
        });
        if (headResponse.status >= 400) {
          link.broken = true;
          this.brokenLinks.add(link.url);
        }
      } catch (error) {
        link.broken = true;
        this.brokenLinks.add(link.url);
      }
      await new Promise((resolve2) => setTimeout(resolve2, 100));
    }
  }
  /**
   * Check for mixed content issues (HTTP resources on HTTPS page)
   */
  checkMixedContent($, baseUrl) {
    if (!baseUrl.startsWith("https://")) return false;
    const mixedContentSelectors = [
      'img[src^="http:"]',
      'script[src^="http:"]',
      'link[href^="http:"]',
      'iframe[src^="http:"]',
      'object[data^="http:"]',
      'form[action^="http:"]'
    ];
    for (const selector of mixedContentSelectors) {
      if ($(selector).length > 0) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check for important security headers
   */
  checkSecurityHeaders(headers) {
    const securityHeaders = [
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
      "strict-transport-security",
      "x-xss-protection"
    ];
    const normalizedHeaders = Object.keys(headers).map((h) => h.toLowerCase());
    return securityHeaders.filter((h) => normalizedHeaders.includes(h)).length >= 2;
  }
  /**
   * Check for accessibility features
   */
  checkAccessibility($) {
    const missingAltText = this.countMissingAltText($);
    const hasAriaAttributes = $("[aria-label], [aria-describedby], [aria-labelledby], [role]").length > 0;
    const hasH1 = $("h1").length > 0;
    const hasH2AfterH1 = hasH1 && $("h1 ~ h2").length > 0;
    return {
      hasAccessibleElements: hasAriaAttributes || missingAltText === 0,
      missingAltText,
      hasAriaAttributes,
      hasProperHeadingStructure: hasH1 && hasH2AfterH1
    };
  }
  /**
   * Count images missing alt text
   */
  countMissingAltText($) {
    let count = 0;
    $("img").each((_, el) => {
      const alt = $(el).attr("alt");
      if (alt === void 0 || alt.trim() === "") {
        count++;
      }
    });
    return count;
  }
  /**
   * Check for noindex directive in meta tags or headers
   */
  checkNoindex($) {
    const robotsContent = $('meta[name="robots"]').attr("content") || "";
    if (robotsContent.includes("noindex")) {
      return true;
    }
    const googlebotContent = $('meta[name="googlebot"]').attr("content") || "";
    if (googlebotContent.includes("noindex")) {
      return true;
    }
    return false;
  }
  /**
   * Check for duplicate meta tags
   */
  checkDuplicateMetaTags($) {
    const titleCount = $("title").length;
    const descriptionCount = $('meta[name="description"]').length;
    return titleCount > 1 || descriptionCount > 1;
  }
  /**
   * Check for thin content (low word count)
   */
  checkThinContent($) {
    const text = $("body").text().trim().replace(/\s+/g, " ");
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return wordCount < 300;
  }
  /**
   * Check for missing h1 or heading structure issues
   */
  checkMissingHeadings($) {
    return $("h1").length === 0;
  }
  /**
   * Get descriptive message for HTTP status codes
   */
  getStatusCodeDescription(statusCode) {
    if (!statusCode) return "Unknown error: No status code returned";
    const statusMessages = {
      400: "Bad Request - The server could not understand the request",
      401: "Unauthorized - Authentication is required to access this resource",
      403: "Forbidden - The server refuses to fulfill the request",
      404: "Not Found - The requested resource could not be found",
      405: "Method Not Allowed - The request method is not supported",
      406: "Not Acceptable - The server cannot produce a response matching the list of acceptable values",
      407: "Proxy Authentication Required - Authentication with the proxy is required",
      408: "Request Timeout - The server timed out waiting for the request",
      409: "Conflict - The request could not be completed due to a conflict",
      410: "Gone - The requested resource is no longer available",
      429: "Too Many Requests - The user has sent too many requests in a given amount of time",
      500: "Internal Server Error - The server encountered an unexpected condition",
      501: "Not Implemented - The server does not support the functionality required",
      502: "Bad Gateway - The server received an invalid response from an upstream server",
      503: "Service Unavailable - The server is currently unable to handle the request",
      504: "Gateway Timeout - The server did not receive a timely response from an upstream server"
    };
    return statusMessages[statusCode] || `HTTP error ${statusCode}`;
  }
  /**
   * Validate and normalize the URL
   */
  normalizeUrl(url) {
    url = url.trim();
    url = url.replace(/^(https?:\/\/)+/i, "$1");
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
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
  extractMetaTags($) {
    const meta = {
      description: $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content"),
      robots: $('meta[name="robots"]').attr("content"),
      viewport: $('meta[name="viewport"]').attr("content"),
      canonical: $('link[rel="canonical"]').attr("href"),
      ogTags: {},
      twitterTags: {}
    };
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr("property");
      const content = $(el).attr("content");
      if (property && content) {
        meta.ogTags[property.replace("og:", "")] = content;
      }
    });
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr("name");
      const content = $(el).attr("content");
      if (name && content) {
        meta.twitterTags[name.replace("twitter:", "")] = content;
      }
    });
    return meta;
  }
  /**
   * Extract content from the HTML
   */
  extractContent($) {
    $("script, style, noscript, iframe, object, embed").remove();
    const paragraphs = [];
    $("p").each((_, el) => {
      const text2 = $(el).text().trim();
      if (text2) paragraphs.push(text2);
    });
    const text = $("body").text().trim().replace(/\s+/g, " ");
    return {
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      paragraphs
    };
  }
  /**
   * Extract headings from the HTML
   */
  extractHeadings($) {
    const headings = {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: []
    };
    ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
      $(tag).each((_, el) => {
        const text = $(el).text().trim();
        if (text) headings[tag].push(text);
      });
    });
    return headings;
  }
  /**
   * Extract links from the HTML
   */
  extractLinks($, baseUrl) {
    const parsedBaseUrl = new URL(baseUrl);
    const baseDomain = parsedBaseUrl.hostname;
    const internal = [];
    const external = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
        return;
      }
      try {
        const resolvedUrl = new URL(href, baseUrl).toString();
        const parsedUrl = new URL(resolvedUrl);
        if (parsedUrl.hostname === baseDomain) {
          internal.push({ url: resolvedUrl, text, broken: false });
        } else {
          external.push({ url: resolvedUrl, text });
        }
      } catch (error) {
        internal.push({ url: href, text, broken: true });
      }
    });
    return { internal, external };
  }
  /**
   * Extract images from the HTML
   */
  extractImages($, baseUrl) {
    const images = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      const alt = $(el).attr("alt");
      if (src) {
        try {
          const resolvedUrl = new URL(src, baseUrl).toString();
          images.push({ url: resolvedUrl, alt });
        } catch (error) {
          images.push({ url: src, alt });
        }
      }
    });
    return images;
  }
  /**
   * Extract schema markup from the HTML
   */
  extractSchemaMarkup($) {
    const schema = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = $(el).html();
        if (!json) return;
        const data = JSON.parse(json);
        let types = [];
        if (data["@type"]) {
          types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
        } else if (data["@graph"] && Array.isArray(data["@graph"])) {
          data["@graph"].forEach((item) => {
            if (item["@type"]) {
              const itemTypes = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
              types = [...types, ...itemTypes];
            }
          });
        }
        if (types.length === 0) {
          $("[itemscope]").each((_2, el2) => {
            const itemtype = $(el2).attr("itemtype");
            if (itemtype) {
              types.push(itemtype.split("/").pop() || itemtype);
            }
          });
        }
        types = Array.from(new Set(types.filter((t) => t)));
        schema.push({ types, json });
      } catch (error) {
        console.error("Error parsing JSON-LD schema:", error);
      }
    });
    $("[property], [typeof]").each((_, el) => {
      try {
        const typeValue = $(el).attr("typeof");
        const property = $(el).attr("property");
        if (typeValue || property) {
          const types = typeValue ? [typeValue] : [];
          if (property && property.includes("schema.org")) {
            types.push(property.split("/").pop() || property);
          }
          if (types.length > 0) {
            const content = $(el).text().trim();
            schema.push({
              types,
              json: JSON.stringify({ "@type": types[0], content })
            });
          }
        }
      } catch (error) {
        console.error("Error extracting RDFa schema:", error);
      }
    });
    return schema;
  }
  /**
   * Check if the page is optimized for mobile
   */
  checkMobileCompatibility($) {
    const viewport = $('meta[name="viewport"]').attr("content");
    if (!viewport) return false;
    return viewport.includes("width=device-width");
  }
  /**
   * Reset crawler state for a new site crawl
   */
  reset() {
    this.crawledUrls.clear();
    this.pendingUrls = [];
    this.currentSite = "";
    this.stats = {
      pagesCrawled: 0,
      pagesSkipped: 0,
      errorsEncountered: 0,
      startTime: 0,
      endTime: 0
    };
  }
  /**
   * Get crawler statistics
   */
  getStats() {
    return {
      ...this.stats,
      crawlTime: this.stats.endTime ? this.stats.endTime - this.stats.startTime : 0,
      cacheSize: this.responseCache.size,
      dnsCache: this.dnsCache.size
    };
  }
  /**
   * Crawl an entire site starting from the homepage
   */
  async crawlSite(url) {
    console.log(`[Crawler] Starting site crawl for: ${url}`);
    this.reset();
    this.stats.startTime = Date.now();
    this.currentSite = new URL(url).origin;
    try {
      const homepage = await this.crawlPage(url);
      this.stats.pagesCrawled++;
      if (homepage.error) {
        console.error(`[Crawler] Failed to crawl homepage: ${homepage.error}`);
        this.stats.errorsEncountered++;
        this.stats.endTime = Date.now();
        return {
          homepage,
          otherPages: [],
          contactPage: void 0,
          servicePages: [],
          locationPages: [],
          serviceAreaPages: [],
          hasSitemapXml: false,
          reachedMaxPages: false
        };
      }
      const homepageResult = this.convertToPageCrawlResult(homepage);
      if (homepage.links && homepage.links.internal) {
        this.pendingUrls = homepage.links.internal.map((link) => typeof link === "string" ? link : link.url).filter((link) => this.shouldCrawlUrl(link)).slice(0, this.MAX_PAGES - 1);
      }
      const otherPages = [];
      let crawledCount = 1;
      while (this.pendingUrls.length > 0 && crawledCount < this.MAX_PAGES) {
        const nextUrl = this.pendingUrls.shift();
        if (!nextUrl || this.crawledUrls.has(nextUrl)) continue;
        try {
          console.log(`[Crawler] Crawling page ${crawledCount + 1}/${this.MAX_PAGES}: ${nextUrl}`);
          const pageData = await this.crawlPage(nextUrl);
          this.crawledUrls.add(nextUrl);
          if (pageData.error) {
            this.stats.errorsEncountered++;
            console.log(`[Crawler] Error crawling ${nextUrl}: ${pageData.error}`);
          } else {
            const pageResult = this.convertToPageCrawlResult(pageData);
            otherPages.push(pageResult);
            this.stats.pagesCrawled++;
            if (pageData.links && pageData.links.internal && crawledCount < this.MAX_PAGES * 0.8) {
              const newLinks = pageData.links.internal.map((link) => typeof link === "string" ? link : link.url).filter((link) => this.shouldCrawlUrl(link) && !this.crawledUrls.has(link)).slice(0, 10);
              this.pendingUrls.push(...newLinks);
            }
          }
          crawledCount++;
          await new Promise((resolve2) => setTimeout(resolve2, this.CRAWL_DELAY));
        } catch (error) {
          console.error(`[Crawler] Exception crawling ${nextUrl}:`, error);
          this.stats.errorsEncountered++;
          crawledCount++;
        }
      }
      const hasSitemapXml = await this.checkSitemap(url);
      this.stats.endTime = Date.now();
      const result = {
        homepage: homepageResult,
        otherPages,
        contactPage: void 0,
        // Will be classified later
        servicePages: [],
        locationPages: [],
        serviceAreaPages: [],
        hasSitemapXml,
        reachedMaxPages: crawledCount >= this.MAX_PAGES
      };
      console.log(`[Crawler] Site crawl completed. Pages crawled: ${this.stats.pagesCrawled}, Errors: ${this.stats.errorsEncountered}`);
      return result;
    } catch (error) {
      console.error(`[Crawler] Site crawl failed for ${url}:`, error);
      this.stats.errorsEncountered++;
      this.stats.endTime = Date.now();
      throw error;
    }
  }
  /**
   * Continue crawling from where we left off
   */
  async continueCrawl(url) {
    console.log(`[Crawler] Continuing site crawl for: ${url}`);
    if (!this.currentSite || this.stats.pagesCrawled === 0) {
      return this.crawlSite(url);
    }
    const otherPages = [];
    let crawledCount = this.stats.pagesCrawled;
    while (this.pendingUrls.length > 0 && crawledCount < this.MAX_PAGES) {
      const nextUrl = this.pendingUrls.shift();
      if (!nextUrl || this.crawledUrls.has(nextUrl)) continue;
      try {
        console.log(`[Crawler] Continuing crawl ${crawledCount + 1}/${this.MAX_PAGES}: ${nextUrl}`);
        const pageData = await this.crawlPage(nextUrl);
        this.crawledUrls.add(nextUrl);
        if (pageData.error) {
          this.stats.errorsEncountered++;
        } else {
          const pageResult = this.convertToPageCrawlResult(pageData);
          otherPages.push(pageResult);
          this.stats.pagesCrawled++;
        }
        crawledCount++;
        await new Promise((resolve2) => setTimeout(resolve2, this.CRAWL_DELAY));
      } catch (error) {
        console.error(`[Crawler] Exception in continued crawl ${nextUrl}:`, error);
        this.stats.errorsEncountered++;
        crawledCount++;
      }
    }
    this.stats.endTime = Date.now();
    return {
      homepage: null,
      // Already crawled in initial crawl
      otherPages,
      contactPage: void 0,
      servicePages: [],
      locationPages: [],
      serviceAreaPages: [],
      hasSitemapXml: false,
      reachedMaxPages: crawledCount >= this.MAX_PAGES
    };
  }
  /**
   * Convert crawler output to PageCrawlResult format
   */
  convertToPageCrawlResult(crawlerOutput) {
    return {
      url: crawlerOutput.url,
      title: crawlerOutput.title,
      metaDescription: crawlerOutput.meta?.description || "",
      bodyText: crawlerOutput.content?.text || "",
      rawHtml: crawlerOutput.rawHtml || crawlerOutput.html || "",
      h1s: crawlerOutput.headings?.h1 || [],
      h2s: crawlerOutput.headings?.h2 || [],
      h3s: crawlerOutput.headings?.h3 || [],
      headings: {
        h1: crawlerOutput.headings?.h1 || [],
        h2: crawlerOutput.headings?.h2 || [],
        h3: crawlerOutput.headings?.h3 || []
      },
      links: {
        internal: (crawlerOutput.links?.internal || []).map(
          (link) => typeof link === "string" ? link : link.url
        ),
        external: (crawlerOutput.links?.external || []).map(
          (link) => typeof link === "string" ? link : link.url
        ),
        broken: (crawlerOutput.links?.internal || []).filter((link) => typeof link === "object" && link.broken).map((link) => link.url)
      },
      hasContactForm: this.hasContactForm(crawlerOutput.rawHtml || crawlerOutput.html || ""),
      hasPhoneNumber: this.hasPhoneNumber(crawlerOutput.content?.text || ""),
      hasAddress: this.hasAddress(crawlerOutput.content?.text || ""),
      hasNAP: this.hasNAP(crawlerOutput.content?.text || ""),
      images: {
        total: crawlerOutput.images?.length || 0,
        withAlt: (crawlerOutput.images || []).filter((img) => img.alt).length,
        withoutAlt: (crawlerOutput.images || []).filter((img) => !img.alt).length,
        largeImages: 0,
        // Could be enhanced
        altTexts: (crawlerOutput.images || []).map((img) => img.alt).filter(Boolean)
      },
      hasSchema: (crawlerOutput.schema || []).length > 0,
      schemaTypes: (crawlerOutput.schema || []).flatMap((s) => s.types || []),
      mobileFriendly: crawlerOutput.mobileCompatible || false,
      wordCount: crawlerOutput.content?.wordCount || 0,
      hasSocialTags: Object.keys(crawlerOutput.meta?.ogTags || {}).length > 0 || Object.keys(crawlerOutput.meta?.twitterTags || {}).length > 0,
      hasCanonical: !!crawlerOutput.meta?.canonical,
      hasRobotsMeta: !!crawlerOutput.meta?.robots,
      hasIcon: false,
      // Could be enhanced
      hasHttps: crawlerOutput.security?.hasHttps || false,
      hasHreflang: false,
      // Could be enhanced
      hasSitemap: false,
      // Determined separately
      hasAmpVersion: false,
      // Could be enhanced
      pageLoadSpeed: {
        score: this.calculateSpeedScore(crawlerOutput.performance),
        firstContentfulPaint: 0,
        totalBlockingTime: 0,
        largestContentfulPaint: 0
      },
      keywordDensity: {},
      readabilityScore: 0,
      contentStructure: {
        hasFAQs: this.hasFAQs(crawlerOutput.content?.text || ""),
        hasTable: this.hasTable(crawlerOutput.rawHtml || crawlerOutput.html || ""),
        hasLists: this.hasLists(crawlerOutput.rawHtml || crawlerOutput.html || ""),
        hasVideo: this.hasVideo(crawlerOutput.rawHtml || crawlerOutput.html || ""),
        hasEmphasis: this.hasEmphasis(crawlerOutput.rawHtml || crawlerOutput.html || "")
      }
    };
  }
  /**
   * Check if URL should be crawled
   */
  shouldCrawlUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const baseDomain = new URL(this.currentSite).hostname;
      if (parsedUrl.hostname !== baseDomain) return false;
      const skipExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".css", ".js", ".zip", ".doc", ".docx"];
      if (skipExtensions.some((ext) => parsedUrl.pathname.toLowerCase().endsWith(ext))) return false;
      const skipPaths = ["/admin", "/wp-admin", "/login", "/register", "/cart", "/checkout"];
      if (skipPaths.some((path) => parsedUrl.pathname.toLowerCase().includes(path))) return false;
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Check if site has sitemap.xml
   */
  async checkSitemap(baseUrl) {
    try {
      const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
      const response = await axios.head(sitemapUrl, { timeout: 5e3 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
  /**
   * Helper methods for content analysis
   */
  hasContactForm(html) {
    return /<form[^>]*>/i.test(html) && /type=['"]?email['"]?/i.test(html);
  }
  hasPhoneNumber(text) {
    const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
    return phoneRegex.test(text);
  }
  hasAddress(text) {
    const addressKeywords = ["street", "avenue", "road", "blvd", "drive", "lane", "way", "suite", "apt"];
    return addressKeywords.some((keyword) => text.toLowerCase().includes(keyword));
  }
  hasNAP(text) {
    return this.hasPhoneNumber(text) && this.hasAddress(text);
  }
  hasFAQs(text) {
    const faqKeywords = ["frequently asked questions", "faq", "questions and answers"];
    return faqKeywords.some((keyword) => text.toLowerCase().includes(keyword));
  }
  hasTable(html) {
    return /<table[^>]*>/i.test(html);
  }
  hasLists(html) {
    return /<[uo]l[^>]*>/i.test(html);
  }
  hasVideo(html) {
    return /<video[^>]*>/i.test(html) || /youtube\.com|vimeo\.com/i.test(html);
  }
  hasEmphasis(html) {
    return /<(strong|b|em|i)[^>]*>/i.test(html);
  }
  calculateSpeedScore(performance) {
    if (!performance) return 50;
    const loadTime = performance.loadTime || 3e3;
    if (loadTime < 1e3) return 90;
    if (loadTime < 2e3) return 75;
    if (loadTime < 3e3) return 60;
    if (loadTime < 5e3) return 40;
    return 20;
  }
};
var crawler = new Crawler();

// server/services/analysis/competitor-analyzer.service.ts
var CompetitorAnalyzer = class {
  USER_AGENT = "SEO-Best-Practices-Assessment-Tool/1.0";
  REQUEST_TIMEOUT = 15e3;
  // 15 seconds timeout
  MAX_COMPETITORS = 5;
  /**
   * Find and analyze competitors for a given URL and keyword, in a specific location
   */
  async analyzeCompetitors(url, primaryKeyword, location = "United States") {
    try {
      const potentialCompetitors = await this.findPotentialCompetitors(primaryKeyword, location);
      const allCompetitors = potentialCompetitors.filter(
        (c) => this.normalizeUrl(c) !== this.normalizeUrl(url)
      );
      const competitorsToAnalyze = allCompetitors.slice(0, this.MAX_COMPETITORS);
      const allCompetitorUrls = allCompetitors.slice(0, 100);
      const competitorPromises = competitorsToAnalyze.map(
        (competitorUrl) => this.analyzeCompetitorSite(competitorUrl, primaryKeyword)
      );
      const competitors = await Promise.all(competitorPromises);
      const validCompetitors = competitors.filter(Boolean);
      const comparisonMetrics = this.calculateComparisonMetrics(validCompetitors);
      return {
        keyword: primaryKeyword,
        location,
        competitors: validCompetitors,
        comparisonMetrics,
        // Include full list of competitor URLs for pagination
        // Analysis completed successfully
        totalResults: allCompetitors.length
      };
    } catch (error) {
      console.error("Error analyzing competitors:", error);
      return {
        keyword: primaryKeyword,
        location,
        competitors: [],
        comparisonMetrics: {
          avgKeywordDensity: 0,
          avgContentLength: 0,
          avgH1Count: 0,
          avgH2Count: 0,
          avgImagesWithAlt: 0,
          topKeywords: []
        },
        totalResults: 0,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
  /**
   * Find potential competitors for a given keyword in a specific location
   */
  async findPotentialCompetitors(keyword, location = "United States") {
    try {
      console.log(`Finding potential competitors for keyword: ${keyword} in ${location}`);
      const { searchService: searchService2 } = await Promise.resolve().then(() => (init_search_service(), search_service_exports));
      const searchResults = await searchService2.searchCompetitors(keyword, location);
      if (searchResults && searchResults.length > 0) {
        console.log(`Found ${searchResults.length} competitors via Google Custom Search API`);
        return searchResults.map((result) => result.url);
      }
      console.log("Google Custom Search API failed, trying manual search...");
      const competitors = await this.findCompetitorsViaManualSearch(keyword, location);
      if (competitors.length > 0) {
        console.log(`Found ${competitors.length} competitors via manual search`);
        return competitors;
      }
      console.log("All search methods failed, using fallback competitor domains");
      return this.getCommonCompetitorDomains(keyword, location);
    } catch (error) {
      console.error("Error finding potential competitors:", error);
      return this.getCommonCompetitorDomains(keyword, location);
    }
  }
  /**
   * Find competitors via intelligent industry detection and location targeting
   * @param keyword - The primary keyword for competitor analysis
   * @param location - The location string (e.g., "United States", "New York, NY")
   * @returns Array of competitor URLs
   */
  async findCompetitorsViaManualSearch(keyword, location) {
    try {
      console.log(`Finding competitors for keyword: ${keyword} in ${location}`);
      const lowercaseKeyword = keyword.toLowerCase();
      const locationWords = location.split(/[,\s]+/).filter((word) => word.length > 1);
      const businessTypes = {
        // Home Services
        "hvac": ["hvac", "heating", "cooling", "air conditioning", "furnace", "ac", "heat pump", "thermostat"],
        "plumbing": ["plumbing", "plumber", "pipe", "water heater", "leak", "drain", "toilet", "faucet", "sink"],
        "electrical": ["electrician", "electrical", "wiring", "lighting", "power", "circuit", "breaker", "outlet", "panel"],
        "roofing": ["roofing", "roofer", "roof", "shingles", "gutter", "tile roof", "roof repair", "metal roof"],
        "landscaping": ["landscaping", "lawn", "garden", "yard", "mowing", "lawn care", "irrigation", "gardener"],
        "cleaning": ["cleaning", "cleaner", "maid", "janitorial", "housekeeping", "carpet cleaning", "window cleaning", "maid service"],
        "painting": ["painting", "painter", "interior paint", "exterior paint", "house painting", "commercial painting"],
        // Food and Hospitality
        "restaurant": ["restaurant", "dining", "eatery", "food", "cafe", "bistro", "catering", "takeout", "delivery"],
        "bakery": ["bakery", "baked goods", "cakes", "pastries", "bread", "desserts"],
        "coffee": ["coffee", "caf\xE9", "coffee shop", "espresso", "latte", "barista"],
        "bar": ["bar", "pub", "brewery", "cocktails", "beer", "wine bar", "drinks", "nightlife"],
        "hotel": ["hotel", "motel", "lodging", "accommodation", "inn", "resort", "bed and breakfast"],
        // Health and Wellness
        "dental": ["dental", "dentist", "teeth", "orthodontist", "smile", "tooth", "oral health", "dental hygiene"],
        "medical": ["medical", "doctor", "physician", "clinic", "healthcare", "wellness", "hospital", "health center"],
        "optometry": ["optometry", "eye doctor", "glasses", "contacts", "vision", "optician", "optometrist", "eye exam"],
        "pharmacy": ["pharmacy", "drug store", "prescription", "medication", "medicines", "chemist"],
        "therapy": ["therapy", "therapist", "counseling", "mental health", "psychiatrist", "psychologist"],
        "spa": ["spa", "massage", "facial", "wellness", "relaxation", "beauty treatment"],
        "fitness": ["fitness", "gym", "workout", "trainer", "exercise", "fitness center", "personal training", "yoga"],
        // Professional Services
        "legal": ["legal", "attorney", "lawyer", "law firm", "legal service", "counsel", "litigation", "estate planning"],
        "accounting": ["accounting", "accountant", "tax", "bookkeeping", "cpa", "financial planning", "tax preparation"],
        "insurance": ["insurance", "insurance agent", "coverage", "policy", "auto insurance", "home insurance", "life insurance"],
        "finance": ["finance", "financial", "bank", "banking", "loan", "mortgage", "credit union", "wealth management"],
        "consulting": ["consulting", "consultant", "business consulting", "management consulting", "strategic planning"],
        // Personal Services
        "salon": ["salon", "hair", "beauty", "barber", "stylist", "spa", "haircut", "coloring", "styling"],
        "barbershop": ["barbershop", "barber", "haircut", "grooming", "men's haircut", "shave"],
        "nail salon": ["nail salon", "manicure", "pedicure", "nails", "nail art", "nail care"],
        "tailor": ["tailor", "alterations", "clothing repair", "custom clothing", "suit", "dress"],
        // Real Estate and Automotive
        "realestate": ["real estate", "realtor", "property", "homes", "housing", "home buying", "home selling", "house", "condo"],
        "auto": ["auto", "car", "mechanic", "repair", "service", "dealership", "auto body", "transmission", "oil change"],
        // Retail
        "clothing": ["clothing", "fashion", "apparel", "boutique", "wear", "clothes", "outfits", "wardrobe"],
        "jewelry": ["jewelry", "jeweler", "accessories", "rings", "necklaces", "watches", "diamonds", "gems"],
        "furniture": ["furniture", "home decor", "furnishings", "interior design", "sofa", "bedroom", "tables", "chairs"],
        "electronics": ["electronics", "computer", "laptop", "mobile phone", "tv", "gadgets", "tech", "appliances"],
        "grocery": ["grocery", "supermarket", "food store", "market", "organic", "produce", "fresh food"],
        // Education and Childcare
        "education": ["education", "school", "tutor", "tutoring", "learning", "academic", "classes", "teaching"],
        "childcare": ["childcare", "daycare", "preschool", "babysitting", "after school", "child care center"],
        // Logistics and Shipping
        "freight": ["freight", "freight forwarding", "shipping", "logistics", "cargo", "transport", "transportation", "carrier", "shipment", "forwarding", "customs broker", "import", "export", "international shipping"],
        "moving": ["moving", "movers", "relocation", "moving company", "storage", "packing", "moving service"],
        "courier": ["courier", "delivery", "package", "parcel", "express delivery", "mail service"],
        // Tech and Marketing
        "tech": ["tech", "technology", "software", "it", "app", "computer service", "web design", "digital"],
        "marketing": ["marketing", "advertising", "digital marketing", "seo", "social media", "ppc", "branding"],
        "webdesign": ["web design", "website", "web development", "web designer", "ux", "ui"]
      };
      let identifiedType = "";
      let identifiedCity = "";
      let identifiedState = "";
      for (const [type, keywords] of Object.entries(businessTypes)) {
        if (keywords.some((key) => lowercaseKeyword.includes(key))) {
          identifiedType = type;
          break;
        }
      }
      const locationParts = location.split(",").map((part) => part.trim());
      if (locationParts.length > 0) {
        identifiedCity = locationParts[0];
        if (locationParts.length > 1) {
          identifiedState = locationParts[1];
        }
      }
      let competitors = [];
      if (["hvac", "plumbing", "electrical", "roofing", "landscaping", "cleaning"].includes(identifiedType)) {
        competitors = [
          // National home service sites
          "https://www.homeadvisor.com",
          "https://www.angi.com",
          "https://www.thumbtack.com",
          "https://www.yelp.com",
          // Major service companies with local branches
          "https://www.servicemasterclean.com",
          "https://www.mrhandyman.com",
          "https://www.mrrooter.com",
          "https://www.aireserv.com",
          "https://www.trugreen.com"
        ];
        if (identifiedType === "hvac") {
          competitors.push("https://www.carrier.com");
          competitors.push("https://www.trane.com");
          competitors.push("https://www.lennox.com");
        } else if (identifiedType === "plumbing") {
          competitors.push("https://www.benjaminfranklinplumbing.com");
          competitors.push("https://www.rotorooter.com");
        } else if (identifiedType === "electrical") {
          competitors.push("https://www.mrelectric.com");
          competitors.push("https://www.misterSparky.com");
        } else if (identifiedType === "roofing") {
          competitors.push("https://www.owenscorning.com");
          competitors.push("https://www.gaf.com");
        }
      } else if (identifiedType === "restaurant") {
        competitors = [
          "https://www.yelp.com",
          "https://www.tripadvisor.com",
          "https://www.opentable.com",
          "https://www.grubhub.com",
          "https://www.doordash.com",
          "https://www.ubereats.com",
          "https://www.zomato.com"
        ];
      } else if (["dental", "medical"].includes(identifiedType)) {
        competitors = [
          "https://www.zocdoc.com",
          "https://www.healthgrades.com",
          "https://www.vitals.com",
          "https://www.webmd.com",
          "https://www.mayoclinic.org",
          "https://www.ratemds.com"
        ];
        if (identifiedType === "dental") {
          competitors.push("https://www.aspen.dental");
          competitors.push("https://www.deltadentalins.com");
        }
      } else if (identifiedType === "freight") {
        competitors = [
          "https://www.fedex.com",
          "https://www.dhl.com",
          "https://www.maersk.com",
          "https://www.flexport.com",
          "https://www.dbschenker.com",
          "https://www.kuehne-nagel.com",
          "https://www.expeditors.com",
          "https://www.dsv.com",
          "https://www.freightquote.com",
          "https://www.freightos.com"
        ];
        const detectedCountryCode = this.getCountryCode(location);
        if (detectedCountryCode === "US") {
          competitors.push("https://www.chrobinson.com");
          competitors.push("https://www.upsfreight.com");
          competitors.push("https://ltl.xpo.com");
          competitors.push("https://www.hubgroup.com");
        }
      } else {
        competitors = [
          "https://www.yelp.com",
          "https://www.yellowpages.com",
          "https://www.bbb.org",
          "https://www.superpages.com",
          "https://www.manta.com",
          "https://www.tripadvisor.com",
          "https://www.google.com/maps",
          "https://www.facebook.com/business"
        ];
      }
      if (identifiedState) {
        const stateAbbrev = this.getStateAbbreviation(identifiedState);
        if (stateAbbrev) {
          competitors.push(`https://www.${identifiedCity.toLowerCase().replace(/\s+/g, "")}.${stateAbbrev.toLowerCase()}.gov`);
          competitors.push(`https://www.${identifiedCity.toLowerCase().replace(/\s+/g, "")}chamber.com`);
        }
      }
      const uniqueCompetitors = [];
      for (const competitor of competitors) {
        if (!uniqueCompetitors.includes(competitor)) {
          uniqueCompetitors.push(competitor);
        }
      }
      const shuffled = uniqueCompetitors.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, this.MAX_COMPETITORS);
    } catch (error) {
      console.error("Error finding competitors:", error);
      return this.getCommonCompetitorDomains(keyword, location);
    }
  }
  /**
   * Get state abbreviation from state name
   */
  getStateAbbreviation(stateName) {
    const stateMap = {
      "alabama": "AL",
      "alaska": "AK",
      "arizona": "AZ",
      "arkansas": "AR",
      "california": "CA",
      "colorado": "CO",
      "connecticut": "CT",
      "delaware": "DE",
      "florida": "FL",
      "georgia": "GA",
      "hawaii": "HI",
      "idaho": "ID",
      "illinois": "IL",
      "indiana": "IN",
      "iowa": "IA",
      "kansas": "KS",
      "kentucky": "KY",
      "louisiana": "LA",
      "maine": "ME",
      "maryland": "MD",
      "massachusetts": "MA",
      "michigan": "MI",
      "minnesota": "MN",
      "mississippi": "MS",
      "missouri": "MO",
      "montana": "MT",
      "nebraska": "NE",
      "nevada": "NV",
      "new hampshire": "NH",
      "new jersey": "NJ",
      "new mexico": "NM",
      "new york": "NY",
      "north carolina": "NC",
      "north dakota": "ND",
      "ohio": "OH",
      "oklahoma": "OK",
      "oregon": "OR",
      "pennsylvania": "PA",
      "rhode island": "RI",
      "south carolina": "SC",
      "south dakota": "SD",
      "tennessee": "TN",
      "texas": "TX",
      "utah": "UT",
      "vermont": "VT",
      "virginia": "VA",
      "washington": "WA",
      "west virginia": "WV",
      "wisconsin": "WI",
      "wyoming": "WY",
      "al": "AL",
      "ak": "AK",
      "az": "AZ",
      "ar": "AR",
      "ca": "CA",
      "co": "CO",
      "ct": "CT",
      "de": "DE",
      "fl": "FL",
      "ga": "GA",
      "hi": "HI",
      "id": "ID",
      "il": "IL",
      "in": "IN",
      "ia": "IA",
      "ks": "KS",
      "ky": "KY",
      "la": "LA",
      "me": "ME",
      "md": "MD",
      "ma": "MA",
      "mi": "MI",
      "mn": "MN",
      "ms": "MS",
      "mo": "MO",
      "mt": "MT",
      "ne": "NE",
      "nv": "NV",
      "nh": "NH",
      "nj": "NJ",
      "nm": "NM",
      "ny": "NY",
      "nc": "NC",
      "nd": "ND",
      "oh": "OH",
      "ok": "OK",
      "or": "OR",
      "pa": "PA",
      "ri": "RI",
      "sc": "SC",
      "sd": "SD",
      "tn": "TN",
      "tx": "TX",
      "ut": "UT",
      "vt": "VT",
      "va": "VA",
      "wa": "WA",
      "wv": "WV",
      "wi": "WI",
      "wy": "WY"
    };
    return stateMap[stateName.toLowerCase()];
  }
  /**
   * Get a two-letter country code for a location string
   */
  getCountryCode(location) {
    const lowercaseLocation = location.toLowerCase();
    const countryCodeMap = {
      "united states": "US",
      "usa": "US",
      "us": "US",
      "america": "US",
      "united kingdom": "GB",
      "uk": "GB",
      "great britain": "GB",
      "england": "GB",
      "canada": "CA",
      "australia": "AU",
      "france": "FR",
      "germany": "DE",
      "spain": "ES",
      "italy": "IT",
      "japan": "JP",
      "india": "IN",
      "china": "CN",
      "brazil": "BR",
      "mexico": "MX",
      "russia": "RU"
    };
    for (const [key, code] of Object.entries(countryCodeMap)) {
      if (lowercaseLocation.includes(key)) {
        return code;
      }
    }
    if (lowercaseLocation.includes("new york") || lowercaseLocation.includes("los angeles") || lowercaseLocation.includes("chicago")) {
      return "US";
    }
    if (lowercaseLocation.includes("london") || lowercaseLocation.includes("manchester") || lowercaseLocation.includes("birmingham")) {
      return "GB";
    }
    if (lowercaseLocation.includes("toronto") || lowercaseLocation.includes("vancouver") || lowercaseLocation.includes("montreal")) {
      return "CA";
    }
    return "US";
  }
  /**
   * Get an example IP address for a given location
   * Note: This is used to give context to the search engine about location
   * but doesn't actually spoof our IP address (which would be against TOS)
   */
  getIpForLocation(location) {
    const locationIpMap = {
      "US": "8.8.8.8",
      // United States (Google DNS)
      "GB": "2.16.10.10",
      // UK
      "CA": "99.236.0.0",
      // Canada
      "AU": "1.1.1.1",
      // Australia (Cloudflare DNS)
      "DE": "3.3.3.3",
      // Germany
      "FR": "5.5.5.5",
      // France
      "JP": "7.7.7.7",
      // Japan
      "IN": "9.9.9.9"
      // India (Quad9 DNS)
    };
    const countryCode = this.getCountryCode(location);
    return locationIpMap[countryCode] || "8.8.8.8";
  }
  /**
   * Get industry-specific competitor domains to ensure relevant results for any keyword
   * @param keyword - The primary keyword to find competitors for
   * @param location - The location string (e.g. "United States", "New York, NY")
   * @returns Array of relevant competitor URLs for the specified industry
   */
  getCommonCompetitorDomains(keyword, location) {
    const lowercaseKeyword = keyword.toLowerCase();
    const countryCode = this.getCountryCode(location);
    const countryTLD = this.getTldForCountry(countryCode);
    const locationParts = location.split(",").map((part) => part.trim());
    const city = locationParts[0];
    const state = locationParts.length > 1 ? locationParts[1] : "";
    const stateAbbrev = state ? this.getStateAbbreviation(state) : "";
    const shouldUseLocalDomains = ["GB", "CA", "AU", "DE", "FR", "JP", "ES", "IT", "BR", "MX", "IN"].includes(countryCode);
    const businessTypes = {
      // Home Services
      "hvac": ["hvac", "heating", "cooling", "air conditioning", "furnace", "ac", "heat pump", "thermostat"],
      "plumbing": ["plumbing", "plumber", "pipe", "water heater", "leak", "drain", "toilet", "faucet", "sink"],
      "electrical": ["electrician", "electrical", "wiring", "lighting", "power", "circuit", "breaker", "outlet", "panel"],
      "roofing": ["roofing", "roofer", "roof", "shingles", "gutter", "tile roof", "roof repair", "metal roof"],
      "landscaping": ["landscaping", "lawn", "garden", "yard", "mowing", "lawn care", "irrigation", "gardener"],
      "cleaning": ["cleaning", "cleaner", "maid", "janitorial", "housekeeping", "carpet cleaning", "window cleaning", "maid service"],
      "painting": ["painting", "painter", "interior paint", "exterior paint", "house painting", "commercial painting"],
      // Food and Hospitality
      "restaurant": ["restaurant", "dining", "eatery", "food", "cafe", "bistro", "catering", "takeout", "delivery"],
      "bakery": ["bakery", "baked goods", "cakes", "pastries", "bread", "desserts"],
      "coffee": ["coffee", "caf\xE9", "coffee shop", "espresso", "latte", "barista"],
      "bar": ["bar", "pub", "brewery", "cocktails", "beer", "wine bar", "drinks", "nightlife"],
      "hotel": ["hotel", "motel", "lodging", "accommodation", "inn", "resort", "bed and breakfast"],
      // Health and Wellness
      "dental": ["dental", "dentist", "teeth", "orthodontist", "smile", "tooth", "oral health", "dental hygiene"],
      "medical": ["medical", "doctor", "physician", "clinic", "healthcare", "wellness", "hospital", "health center"],
      "optometry": ["optometry", "eye doctor", "glasses", "contacts", "vision", "optician", "optometrist", "eye exam"],
      "pharmacy": ["pharmacy", "drug store", "prescription", "medication", "medicines", "chemist"],
      "therapy": ["therapy", "therapist", "counseling", "mental health", "psychiatrist", "psychologist"],
      "spa": ["spa", "massage", "facial", "wellness", "relaxation", "beauty treatment"],
      "fitness": ["fitness", "gym", "workout", "trainer", "exercise", "fitness center", "personal training", "yoga"],
      // Professional Services
      "legal": ["legal", "attorney", "lawyer", "law firm", "legal service", "counsel", "litigation", "estate planning"],
      "accounting": ["accounting", "accountant", "tax", "bookkeeping", "cpa", "financial planning", "tax preparation"],
      "insurance": ["insurance", "insurance agent", "coverage", "policy", "auto insurance", "home insurance", "life insurance"],
      "finance": ["finance", "financial", "bank", "banking", "loan", "mortgage", "credit union", "wealth management"],
      "consulting": ["consulting", "consultant", "business consulting", "management consulting", "strategic planning"],
      // Personal Services
      "salon": ["salon", "hair", "beauty", "barber", "stylist", "spa", "haircut", "coloring", "styling"],
      "barbershop": ["barbershop", "barber", "haircut", "grooming", "men's haircut", "shave"],
      "nail salon": ["nail salon", "manicure", "pedicure", "nails", "nail art", "nail care"],
      "tailor": ["tailor", "alterations", "clothing repair", "custom clothing", "suit", "dress"],
      // Real Estate and Automotive
      "realestate": ["real estate", "realtor", "property", "homes", "housing", "home buying", "home selling", "house", "condo"],
      "auto": ["auto", "car", "mechanic", "repair", "service", "dealership", "auto body", "transmission", "oil change"],
      // Retail
      "clothing": ["clothing", "fashion", "apparel", "boutique", "wear", "clothes", "outfits", "wardrobe"],
      "jewelry": ["jewelry", "jeweler", "accessories", "rings", "necklaces", "watches", "diamonds", "gems"],
      "furniture": ["furniture", "home decor", "furnishings", "interior design", "sofa", "bedroom", "tables", "chairs"],
      "electronics": ["electronics", "computer", "laptop", "mobile phone", "tv", "gadgets", "tech", "appliances"],
      "grocery": ["grocery", "supermarket", "food store", "market", "organic", "produce", "fresh food"],
      // Education and Childcare
      "education": ["education", "school", "tutor", "tutoring", "learning", "academic", "classes", "teaching"],
      "childcare": ["childcare", "daycare", "preschool", "babysitting", "after school", "child care center"],
      // Logistics and Shipping
      "freight": ["freight", "freight forwarding", "shipping", "logistics", "cargo", "transport", "transportation", "carrier", "shipment", "forwarding", "customs broker", "import", "export", "international shipping"],
      "moving": ["moving", "movers", "relocation", "moving company", "storage", "packing", "moving service"],
      "courier": ["courier", "delivery", "package", "parcel", "express delivery", "mail service"],
      // Tech and Marketing
      "tech": ["tech", "technology", "software", "it", "app", "computer service", "web design", "digital"],
      "marketing": ["marketing", "advertising", "digital marketing", "seo", "social media", "ppc", "branding"],
      "webdesign": ["web design", "website", "web development", "web designer", "ux", "ui"],
      // Shopping and E-commerce
      "ecommerce": ["shop", "product", "buy", "store", "retail", "price", "purchase", "shopping", "e-commerce", "online store"],
      // Travel and Tourism
      "travel": ["travel", "vacation", "hotel", "flight", "booking", "tourism", "destination", "trip", "tour", "resort"]
    };
    let identifiedType = "";
    for (const [type, typeKeywords] of Object.entries(businessTypes)) {
      if (typeKeywords.some((key) => lowercaseKeyword.includes(key))) {
        identifiedType = type;
        break;
      }
    }
    console.log(`Identified business type: ${identifiedType || "None"} for keyword: ${keyword}`);
    if (identifiedType === "freight" || this.containsAny(lowercaseKeyword, ["freight", "shipping", "logistics", "cargo", "transport"])) {
      return [
        "https://www.fedex.com",
        "https://www.dhl.com",
        "https://www.maersk.com",
        "https://www.flexport.com",
        "https://www.dbschenker.com",
        "https://www.kuehne-nagel.com",
        "https://www.expeditors.com",
        "https://www.dsv.com",
        "https://www.freightquote.com",
        "https://www.chrobinson.com"
      ];
    }
    if (identifiedType === "ecommerce" || this.containsAny(lowercaseKeyword, ["shop", "product", "buy", "store", "retail", "price"])) {
      if (shouldUseLocalDomains) {
        return [
          `https://www.amazon${countryTLD}`,
          `https://www.ebay${countryTLD}`,
          `https://www.etsy${countryTLD}`,
          "https://www.shopify.com",
          this.getLocalRetailer(countryCode),
          this.getLocalMarketplace(countryCode)
        ];
      } else {
        return [
          "https://www.amazon.com",
          "https://www.ebay.com",
          "https://www.etsy.com",
          "https://www.walmart.com",
          "https://www.shopify.com",
          "https://www.target.com"
        ];
      }
    }
    if (identifiedType === "tech" || this.containsAny(lowercaseKeyword, ["tech", "software", "app", "digital", "code", "program"])) {
      return [
        "https://www.techcrunch.com",
        "https://www.wired.com",
        "https://www.theverge.com",
        "https://www.cnet.com",
        "https://www.github.com",
        "https://www.stackoverflow.com"
      ];
    }
    if (this.containsAny(lowercaseKeyword, ["news", "article", "blog", "media", "story", "report"])) {
      return [
        this.getLocalNewsSource(countryCode),
        `https://www.bbc${countryCode === "GB" ? ".co.uk" : ".com"}`,
        this.getLocalNewsSource(countryCode, 2),
        "https://www.reuters.com",
        this.getLocalNewsSource(countryCode, 3),
        "https://www.medium.com"
      ];
    }
    if (["hvac", "plumbing", "electrical", "roofing", "landscaping", "cleaning", "painting"].includes(identifiedType)) {
      const homeServiceSites = [
        "https://www.homeadvisor.com",
        "https://www.angi.com",
        "https://www.thumbtack.com",
        "https://www.yelp.com",
        "https://www.bbb.org"
      ];
      if (identifiedType === "hvac") {
        homeServiceSites.push("https://www.carrier.com");
        homeServiceSites.push("https://www.trane.com");
        homeServiceSites.push("https://www.lennox.com");
        homeServiceSites.push("https://www.aireserv.com");
      } else if (identifiedType === "plumbing") {
        homeServiceSites.push("https://www.mrrooter.com");
        homeServiceSites.push("https://www.benjaminfranklinplumbing.com");
        homeServiceSites.push("https://www.rotorooter.com");
      } else if (identifiedType === "electrical") {
        homeServiceSites.push("https://www.mrelectric.com");
        homeServiceSites.push("https://www.mistersparky.com");
      } else if (identifiedType === "roofing") {
        homeServiceSites.push("https://www.owenscorning.com");
        homeServiceSites.push("https://www.gaf.com");
      }
      if (city && stateAbbrev) {
        const sanitizedCity = city.toLowerCase().replace(/\s+/g, "");
        homeServiceSites.push(`https://www.yelp.com/search?find_desc=${encodeURIComponent(keyword)}&find_loc=${encodeURIComponent(city)}%2C+${stateAbbrev}`);
        homeServiceSites.push(`https://www.yellowpages.com/search?search_terms=${encodeURIComponent(keyword)}&geo_location_terms=${encodeURIComponent(city)}%2C+${stateAbbrev}`);
        homeServiceSites.push(`https://www.${sanitizedCity}chamber.com`);
      }
      return homeServiceSites.slice(0, this.MAX_COMPETITORS);
    }
    if (identifiedType === "travel" || identifiedType === "hotel" || this.containsAny(lowercaseKeyword, ["travel", "vacation", "hotel", "flight", "booking", "tourism"])) {
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
          "https://www.expedia.com",
          "https://www.booking.com",
          "https://www.tripadvisor.com",
          "https://www.airbnb.com",
          "https://www.kayak.com",
          "https://www.hotels.com"
        ];
      }
    }
    if (["medical", "dental", "optometry", "pharmacy", "therapy", "spa", "fitness"].includes(identifiedType)) {
      if (shouldUseLocalDomains) {
        return [
          this.getLocalHealthSite(countryCode),
          "https://www.mayoclinic.org",
          "https://www.healthline.com",
          this.getLocalHealthAuthority(countryCode),
          "https://www.medicalnewstoday.com",
          this.getLocalHealthSite(countryCode, 2)
        ];
      } else {
        return [
          "https://www.webmd.com",
          "https://www.mayoclinic.org",
          "https://www.healthline.com",
          "https://www.cdc.gov",
          "https://www.medicalnewstoday.com",
          "https://www.nih.gov"
        ];
      }
    }
    if (["legal", "accounting", "insurance", "finance", "consulting"].includes(identifiedType)) {
      return [
        "https://www.legalzoom.com",
        "https://www.findlaw.com",
        "https://www.upwork.com",
        "https://www.indeed.com",
        "https://www.intuit.com",
        "https://www.linkedin.com"
      ];
    }
    if (["restaurant", "bakery", "coffee", "bar"].includes(identifiedType)) {
      return [
        "https://www.yelp.com",
        "https://www.tripadvisor.com",
        "https://www.opentable.com",
        "https://www.grubhub.com",
        "https://www.doordash.com",
        "https://www.ubereats.com"
      ];
    }
    console.log(`Using default competitors for keyword: ${keyword} (no specific industry identified)`);
    if (shouldUseLocalDomains) {
      return [
        "https://www.wikipedia.org",
        `https://www.google${countryTLD}`,
        this.getLocalBusinessSite(countryCode),
        this.getLocalSocialSite(countryCode),
        `https://www.linkedin${countryTLD}`,
        this.getLocalBusinessSite(countryCode, 2)
      ];
    } else {
      return [
        "https://www.wikipedia.org",
        "https://www.reddit.com",
        "https://www.linkedin.com",
        "https://www.forbes.com",
        "https://www.entrepreneur.com",
        "https://www.businessinsider.com"
      ];
    }
  }
  /**
   * Get appropriate TLD for a country
   */
  getTldForCountry(countryCode) {
    const tldMap = {
      "US": ".com",
      "GB": ".co.uk",
      "CA": ".ca",
      "AU": ".com.au",
      "DE": ".de",
      "FR": ".fr",
      "ES": ".es",
      "IT": ".it",
      "JP": ".co.jp",
      "IN": ".in",
      "BR": ".com.br",
      "MX": ".com.mx",
      "CN": ".cn",
      "RU": ".ru"
    };
    return tldMap[countryCode] || ".com";
  }
  /**
   * Get local retailer based on country
   */
  getLocalRetailer(countryCode) {
    const retailerMap = {
      "US": "https://www.walmart.com",
      "GB": "https://www.tesco.com",
      "CA": "https://www.canadiantire.ca",
      "AU": "https://www.woolworths.com.au",
      "DE": "https://www.otto.de",
      "FR": "https://www.carrefour.fr",
      "ES": "https://www.elcorteingles.es",
      "IT": "https://www.esselunga.it",
      "JP": "https://www.rakuten.co.jp",
      "IN": "https://www.flipkart.com",
      "BR": "https://www.americanas.com.br",
      "MX": "https://www.liverpool.com.mx"
    };
    return retailerMap[countryCode] || "https://www.walmart.com";
  }
  /**
   * Get local marketplace based on country
   */
  getLocalMarketplace(countryCode) {
    const marketplaceMap = {
      "US": "https://www.target.com",
      "GB": "https://www.argos.co.uk",
      "CA": "https://www.bestbuy.ca",
      "AU": "https://www.kogan.com",
      "DE": "https://www.zalando.de",
      "FR": "https://www.cdiscount.com",
      "ES": "https://www.aliexpress.es",
      "IT": "https://www.subito.it",
      "JP": "https://www.yahoo.co.jp",
      "IN": "https://www.snapdeal.com",
      "BR": "https://www.mercadolivre.com.br",
      "MX": "https://www.mercadolibre.com.mx"
    };
    return marketplaceMap[countryCode] || "https://www.target.com";
  }
  /**
   * Get local news source based on country
   */
  getLocalNewsSource(countryCode, variant = 1) {
    if (variant === 1) {
      const newsMap = {
        "US": "https://www.cnn.com",
        "GB": "https://www.theguardian.co.uk",
        "CA": "https://www.cbc.ca",
        "AU": "https://www.abc.net.au",
        "DE": "https://www.spiegel.de",
        "FR": "https://www.lemonde.fr",
        "ES": "https://www.elpais.com",
        "IT": "https://www.corriere.it",
        "JP": "https://www.nhk.or.jp",
        "IN": "https://www.ndtv.com",
        "BR": "https://www.globo.com",
        "MX": "https://www.eluniversal.com.mx"
      };
      return newsMap[countryCode] || "https://www.cnn.com";
    } else if (variant === 2) {
      const newsMap = {
        "US": "https://www.nytimes.com",
        "GB": "https://www.dailymail.co.uk",
        "CA": "https://www.globeandmail.com",
        "AU": "https://www.news.com.au",
        "DE": "https://www.faz.net",
        "FR": "https://www.lefigaro.fr",
        "ES": "https://www.elmundo.es",
        "IT": "https://www.repubblica.it",
        "JP": "https://www.asahi.com",
        "IN": "https://www.indiatimes.com",
        "BR": "https://www.uol.com.br",
        "MX": "https://www.excelsior.com.mx"
      };
      return newsMap[countryCode] || "https://www.nytimes.com";
    } else {
      const newsMap = {
        "US": "https://www.washingtonpost.com",
        "GB": "https://www.telegraph.co.uk",
        "CA": "https://www.nationalpost.com",
        "AU": "https://www.smh.com.au",
        "DE": "https://www.zeit.de",
        "FR": "https://www.liberation.fr",
        "ES": "https://www.abc.es",
        "IT": "https://www.lastampa.it",
        "JP": "https://www.yomiuri.co.jp",
        "IN": "https://timesofindia.indiatimes.com",
        "BR": "https://www.folha.uol.com.br",
        "MX": "https://www.jornada.com.mx"
      };
      return newsMap[countryCode] || "https://www.washingtonpost.com";
    }
  }
  /**
   * Get local travel site based on country
   */
  getLocalTravelSite(countryCode) {
    const travelMap = {
      "US": "https://www.kayak.com",
      "GB": "https://www.skyscanner.net",
      "CA": "https://www.flightcentre.ca",
      "AU": "https://www.webjet.com.au",
      "DE": "https://www.ab-in-den-urlaub.de",
      "FR": "https://www.voyages-sncf.com",
      "ES": "https://www.rumbo.es",
      "IT": "https://www.volagratis.com",
      "JP": "https://www.jalan.net",
      "IN": "https://www.makemytrip.com",
      "BR": "https://www.decolar.com",
      "MX": "https://www.bestday.com.mx"
    };
    return travelMap[countryCode] || "https://www.kayak.com";
  }
  /**
   * Get local health site based on country
   */
  getLocalHealthSite(countryCode, variant = 1) {
    if (variant === 1) {
      const healthMap = {
        "US": "https://www.webmd.com",
        "GB": "https://www.nhs.uk",
        "CA": "https://www.healthlinkbc.ca",
        "AU": "https://www.healthdirect.gov.au",
        "DE": "https://www.gesundheit.de",
        "FR": "https://www.doctissimo.fr",
        "ES": "https://www.cuidateplus.com",
        "IT": "https://www.paginemediche.it",
        "JP": "https://www.health.goo.ne.jp",
        "IN": "https://www.practo.com",
        "BR": "https://www.minhavida.com.br",
        "MX": "https://www.medicinapreventiva.com.mx"
      };
      return healthMap[countryCode] || "https://www.webmd.com";
    } else {
      const healthMap = {
        "US": "https://www.health.com",
        "GB": "https://www.bupa.co.uk",
        "CA": "https://www.medbroadcast.com",
        "AU": "https://www.betterhealth.vic.gov.au",
        "DE": "https://www.netdoktor.de",
        "FR": "https://www.e-sante.fr",
        "ES": "https://www.webconsultas.com",
        "IT": "https://www.my-personaltrainer.it",
        "JP": "https://www.kenko.com",
        "IN": "https://www.healthkart.com",
        "BR": "https://www.tuasaude.com",
        "MX": "https://www.salud.carlosslim.org"
      };
      return healthMap[countryCode] || "https://www.health.com";
    }
  }
  /**
   * Get local health authority based on country
   */
  getLocalHealthAuthority(countryCode) {
    const authorityMap = {
      "US": "https://www.cdc.gov",
      "GB": "https://www.nhs.uk",
      "CA": "https://www.canada.ca/en/health-canada.html",
      "AU": "https://www.health.gov.au",
      "DE": "https://www.bundesgesundheitsministerium.de",
      "FR": "https://solidarites-sante.gouv.fr",
      "ES": "https://www.mscbs.gob.es",
      "IT": "https://www.salute.gov.it",
      "JP": "https://www.mhlw.go.jp",
      "IN": "https://www.mohfw.gov.in",
      "BR": "https://www.gov.br/saude/pt-br",
      "MX": "https://www.gob.mx/salud"
    };
    return authorityMap[countryCode] || "https://www.cdc.gov";
  }
  /**
   * Get local business site based on country
   */
  getLocalBusinessSite(countryCode, variant = 1) {
    if (variant === 1) {
      const businessMap = {
        "US": "https://www.forbes.com",
        "GB": "https://www.ft.com",
        "CA": "https://www.theglobeandmail.com/business",
        "AU": "https://www.afr.com",
        "DE": "https://www.handelsblatt.com",
        "FR": "https://www.lesechos.fr",
        "ES": "https://www.expansion.com",
        "IT": "https://www.ilsole24ore.com",
        "JP": "https://www.nikkei.com",
        "IN": "https://economictimes.indiatimes.com",
        "BR": "https://www.valor.com.br",
        "MX": "https://www.eleconomista.com.mx"
      };
      return businessMap[countryCode] || "https://www.forbes.com";
    } else {
      const businessMap = {
        "US": "https://www.businessinsider.com",
        "GB": "https://www.thisismoney.co.uk",
        "CA": "https://www.bnn.ca",
        "AU": "https://www.businessnews.com.au",
        "DE": "https://www.wiwo.de",
        "FR": "https://www.latribune.fr",
        "ES": "https://cincodias.elpais.com",
        "IT": "https://www.milanofinanza.it",
        "JP": "https://www.bloomberg.co.jp",
        "IN": "https://www.business-standard.com",
        "BR": "https://exame.com",
        "MX": "https://www.elfinanciero.com.mx"
      };
      return businessMap[countryCode] || "https://www.businessinsider.com";
    }
  }
  /**
   * Get local social site based on country
   */
  getLocalSocialSite(countryCode) {
    const socialMap = {
      "US": "https://www.reddit.com",
      "GB": "https://www.reddit.com/r/unitedkingdom",
      "CA": "https://www.reddit.com/r/canada",
      "AU": "https://www.reddit.com/r/australia",
      "DE": "https://www.gutefrage.net",
      "FR": "https://www.jeuxvideo.com/forums.htm",
      "ES": "https://www.meneame.net",
      "IT": "https://www.reddit.com/r/italy",
      "JP": "https://www.5ch.net",
      "IN": "https://www.quora.com/topic/India",
      "BR": "https://www.reddit.com/r/brasil",
      "MX": "https://www.reddit.com/r/mexico"
    };
    return socialMap[countryCode] || "https://www.reddit.com";
  }
  /**
   * Check if a string contains any of the words in an array
   */
  containsAny(str, words) {
    return words.some((word) => str.includes(word));
  }
  /**
   * Analyze a competitor's website
   */
  async analyzeCompetitorSite(url, primaryKeyword) {
    try {
      const startTime = Date.now();
      const pageData = await crawler.crawlPage(url);
      const loadTime = Date.now() - startTime;
      const title = pageData.title || "";
      const description = pageData.meta.description || "";
      const h1Count = pageData.headings.h1.length;
      const h2Count = pageData.headings.h2.length;
      const h3Count = pageData.headings.h3.length;
      const internalLinksCount = pageData.links.internal.length;
      const externalLinksCount = pageData.links.external.length;
      const images = pageData.images || [];
      const imagesWithAlt = images.filter((img) => img.alt && img.alt.trim().length > 0).length;
      const contentLength = pageData.content.text.length;
      let keywordDensity = 0;
      if (primaryKeyword && pageData.content.text) {
        const keywordRegex = new RegExp(primaryKeyword, "gi");
        const matches = pageData.content.text.match(keywordRegex) || [];
        const wordCount = pageData.content.wordCount || 1;
        keywordDensity = matches.length / wordCount * 100;
      }
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
  identifyStrengths(data) {
    const strengths = [];
    if (data.title.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      strengths.push("Keyword in page title");
    }
    if (data.description.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      strengths.push("Keyword in meta description");
    }
    if (data.contentLength > 1500) {
      strengths.push("Long-form content (1500+ characters)");
    }
    if (data.h1Count === 1) {
      strengths.push("Proper H1 usage (exactly one H1)");
    }
    if (data.h2Count >= 2) {
      strengths.push("Good heading structure with multiple H2s");
    }
    if (data.keywordDensity >= 0.5 && data.keywordDensity <= 2.5) {
      strengths.push("Optimal keyword density");
    }
    if (data.imageCount > 0 && data.imagesWithAlt / data.imageCount > 0.8) {
      strengths.push("Most images have descriptive alt text");
    }
    return strengths;
  }
  /**
   * Identify weaknesses of a competitor
   */
  identifyWeaknesses(data) {
    const weaknesses = [];
    if (!data.title.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      weaknesses.push("Keyword missing in page title");
    }
    if (!data.description.toLowerCase().includes(data.primaryKeyword.toLowerCase())) {
      weaknesses.push("Keyword missing in meta description");
    }
    if (data.contentLength < 500) {
      weaknesses.push("Thin content (less than 500 characters)");
    }
    if (data.h1Count === 0) {
      weaknesses.push("Missing H1 heading");
    } else if (data.h1Count > 1) {
      weaknesses.push("Multiple H1 headings (should have exactly one)");
    }
    if (data.h2Count === 0) {
      weaknesses.push("No H2 headings for content structure");
    }
    if (data.keywordDensity < 0.3) {
      weaknesses.push("Low keyword density");
    } else if (data.keywordDensity > 3) {
      weaknesses.push("Potential keyword stuffing");
    }
    if (data.imageCount > 0 && data.imagesWithAlt / data.imageCount < 0.5) {
      weaknesses.push("Many images missing alt text");
    }
    return weaknesses;
  }
  /**
   * Calculate comparison metrics from competitors
   */
  calculateComparisonMetrics(competitors) {
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
    const avgKeywordDensity = competitors.reduce((sum, comp) => sum + comp.keywordDensity, 0) / competitors.length;
    const avgContentLength = Math.floor(competitors.reduce((sum, comp) => sum + comp.contentLength, 0) / competitors.length);
    const avgH1Count = competitors.reduce((sum, comp) => sum + comp.h1Count, 0) / competitors.length;
    const avgH2Count = competitors.reduce((sum, comp) => sum + comp.h2Count, 0) / competitors.length;
    const avgImagesWithAlt = competitors.reduce((sum, comp) => {
      if (comp.imageCount === 0) return sum;
      return sum + comp.imagesWithAlt / comp.imageCount;
    }, 0) / competitors.length;
    const allStrengths = competitors.flatMap((comp) => comp.strengths);
    const strengthCounts = {};
    allStrengths.forEach((strength) => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });
    const topKeywords = Object.entries(strengthCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([keyword]) => keyword);
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
  normalizeUrl(url) {
    try {
      let normalized = url.replace(/^(https?:\/\/)/, "");
      normalized = normalized.replace(/^www\./, "");
      normalized = normalized.replace(/\/$/, "");
      return normalized.toLowerCase();
    } catch (error) {
      return url.toLowerCase();
    }
  }
};
var competitorAnalyzer = new CompetitorAnalyzer();

// netlify/functions/competitor-analysis.ts
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }
  try {
    let body = {};
    if (event.body) {
      body = JSON.parse(event.body);
    }
    const { url, competitors = [] } = body;
    if (!url) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ message: "URL is required" })
      };
    }
    const analysisResult = await competitorAnalyzer.analyzeCompetitors(url, "business services", "United States");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(analysisResult)
    };
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Competitor analysis failed",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
export {
  handler
};
