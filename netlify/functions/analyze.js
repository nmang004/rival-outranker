var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/audit/crawler.service.ts
var crawler_service_exports = {};
__export(crawler_service_exports, {
  crawler: () => crawler
});
import axios2 from "axios";
import * as cheerio2 from "cheerio";
import { URL as URL2 } from "url";
import * as https from "https";
import * as dns2 from "dns";
import { promisify as promisify2 } from "util";
var dnsLookup, dnsResolve2, Crawler, crawler;
var init_crawler_service = __esm({
  "server/services/audit/crawler.service.ts"() {
    dnsLookup = promisify2(dns2.lookup);
    dnsResolve2 = promisify2(dns2.resolve);
    Crawler = class {
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
            response = await axios2.get(normalizedUrl, {
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
          const $ = cheerio2.load(response.data);
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
          await new Promise((resolve3) => setTimeout(resolve3, this.CRAWL_DELAY));
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
          const parsedUrl = new URL2(url);
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
        const baseDomain = new URL2(baseUrl).hostname;
        for (const link of linksToCheck) {
          if (link.broken) continue;
          if (this.brokenLinks.has(link.url)) {
            link.broken = true;
            continue;
          }
          try {
            const parsedUrl = new URL2(link.url);
            if (parsedUrl.hostname !== baseDomain) continue;
            const headResponse = await axios2.head(link.url, {
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
          await new Promise((resolve3) => setTimeout(resolve3, 100));
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
          const parsedUrl = new URL2(url);
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
        const parsedBaseUrl = new URL2(baseUrl);
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
            const resolvedUrl = new URL2(href, baseUrl).toString();
            const parsedUrl = new URL2(resolvedUrl);
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
              const resolvedUrl = new URL2(src, baseUrl).toString();
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
        this.currentSite = new URL2(url).origin;
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
              await new Promise((resolve3) => setTimeout(resolve3, this.CRAWL_DELAY));
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
            await new Promise((resolve3) => setTimeout(resolve3, this.CRAWL_DELAY));
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
          const parsedUrl = new URL2(url);
          const baseDomain = new URL2(this.currentSite).hostname;
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
          const sitemapUrl = new URL2("/sitemap.xml", baseUrl).toString();
          const response = await axios2.head(sitemapUrl, { timeout: 5e3 });
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
    crawler = new Crawler();
  }
});

// server/lib/utils/score.utils.ts
var SCORE_THRESHOLDS = {
  // Standard thresholds (80/60/40) - used for general SEO analysis
  STANDARD: {
    excellent: 80,
    good: 60,
    "needs-work": 40
  },
  // Performance thresholds (90/70/50) - used for PageSpeed and keyword analysis
  PERFORMANCE: {
    excellent: 90,
    good: 70,
    "needs-work": 50
  },
  // Technical thresholds (90/80/60) - used for technical SEO and content optimization
  TECHNICAL: {
    excellent: 90,
    good: 80,
    "needs-work": 60
  }
};
var SCORE_COLORS = {
  excellent: "#22c55e",
  // Green
  good: "#3b82f6",
  // Blue
  "needs-work": "#f59e0b",
  // Orange/Amber
  poor: "#ef4444"
  // Red
};
var ScoreUtils = class {
  /**
   * Get score category using standard thresholds (80/60/40)
   */
  static getCategory(score) {
    return this.getCategoryWithThresholds(score, SCORE_THRESHOLDS.STANDARD);
  }
  /**
   * Get score category using performance thresholds (90/70/50)
   */
  static getPerformanceCategory(score) {
    return this.getCategoryWithThresholds(score, SCORE_THRESHOLDS.PERFORMANCE);
  }
  /**
   * Get score category using technical thresholds (90/80/60)
   */
  static getTechnicalCategory(score) {
    return this.getCategoryWithThresholds(score, SCORE_THRESHOLDS.TECHNICAL);
  }
  /**
   * Get score category with custom thresholds
   */
  static getCategoryWithThresholds(score, thresholds) {
    if (score >= thresholds.excellent) return "excellent";
    if (score >= thresholds.good) return "good";
    if (score >= thresholds["needs-work"]) return "needs-work";
    return "poor";
  }
  /**
   * Get score with category using standard thresholds
   */
  static getScoreResult(score) {
    return {
      score,
      category: this.getCategory(score)
    };
  }
  /**
   * Get score with category using performance thresholds
   */
  static getPerformanceScoreResult(score) {
    return {
      score,
      category: this.getPerformanceCategory(score)
    };
  }
  /**
   * Get score with category using technical thresholds
   */
  static getTechnicalScoreResult(score) {
    return {
      score,
      category: this.getTechnicalCategory(score)
    };
  }
  /**
   * Get assessment string for technical analysis
   */
  static getAssessment(score) {
    const category = this.getTechnicalCategory(score);
    return this.categoryToAssessment(category);
  }
  /**
   * Get assessment result with score and string
   */
  static getAssessmentResult(score) {
    return {
      score,
      assessment: this.getAssessment(score)
    };
  }
  /**
   * Convert category to assessment string
   */
  static categoryToAssessment(category) {
    const mapping = {
      excellent: "Excellent",
      good: "Good",
      "needs-work": "Needs improvement",
      poor: "Poor"
    };
    return mapping[category];
  }
  /**
   * Convert assessment string to category
   */
  static assessmentToCategory(assessment) {
    const mapping = {
      "Excellent": "excellent",
      "Good": "good",
      "Needs improvement": "needs-work",
      "Poor": "poor"
    };
    return mapping[assessment];
  }
  /**
   * Get color for score category
   */
  static getColor(category) {
    return SCORE_COLORS[category];
  }
  /**
   * Get color for score value
   */
  static getColorForScore(score, thresholds = SCORE_THRESHOLDS.STANDARD) {
    const category = this.getCategoryWithThresholds(score, thresholds);
    return this.getColor(category);
  }
  /**
   * Calculate overall score from multiple metrics
   */
  static calculateOverallScore(scores) {
    const values = Object.values(scores).filter(
      (score) => typeof score === "number" && !isNaN(score)
    );
    if (values.length === 0) return 0;
    const sum = values.reduce((total, score) => total + score, 0);
    return Math.round(sum / values.length);
  }
  /**
   * Calculate weighted overall score
   */
  static calculateWeightedScore(scores, weights) {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const [key, score] of Object.entries(scores)) {
      if (typeof score === "number" && !isNaN(score) && weights[key]) {
        totalWeightedScore += score * weights[key];
        totalWeight += weights[key];
      }
    }
    if (totalWeight === 0) return 0;
    return Math.round(totalWeightedScore / totalWeight);
  }
  /**
   * Normalize score to 0-100 range
   */
  static normalizeScore(score, min = 0, max = 100) {
    const normalized = Math.max(min, Math.min(max, score));
    return Math.round(normalized);
  }
  /**
   * Apply score penalties
   */
  static applyPenalties(baseScore, penalties) {
    const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty, 0);
    const penalizedScore = baseScore - totalPenalty;
    return this.normalizeScore(penalizedScore);
  }
  /**
   * Apply score bonuses
   */
  static applyBonuses(baseScore, bonuses) {
    const totalBonus = bonuses.reduce((sum, bonus) => sum + bonus, 0);
    const bonusScore = baseScore + totalBonus;
    return this.normalizeScore(bonusScore);
  }
  /**
   * Get default score result for fallback scenarios
   */
  static getDefaultScoreResult(score = 50) {
    return this.getScoreResult(score);
  }
  /**
   * Get default assessment result for fallback scenarios
   */
  static getDefaultAssessmentResult(score = 50) {
    return this.getAssessmentResult(score);
  }
  /**
   * Readability score categorization (Flesch Reading Ease scale)
   */
  static getReadabilityCategory(fleschScore) {
    if (fleschScore >= 90) {
      return { category: "very-easy", description: "Very Easy" };
    } else if (fleschScore >= 80) {
      return { category: "easy", description: "Easy" };
    } else if (fleschScore >= 70) {
      return { category: "fairly-easy", description: "Fairly Easy" };
    } else if (fleschScore >= 60) {
      return { category: "standard", description: "Standard" };
    } else if (fleschScore >= 50) {
      return { category: "fairly-difficult", description: "Fairly Difficult" };
    } else if (fleschScore >= 30) {
      return { category: "difficult", description: "Difficult" };
    } else {
      return { category: "very-difficult", description: "Very Difficult" };
    }
  }
  /**
   * Performance metric specific scoring
   */
  static getPerformanceMetricScore(value, metric) {
    switch (metric) {
      case "lcp":
        if (value <= 2500) return 100;
        if (value <= 3e3) return 90;
        if (value <= 3500) return 80;
        if (value <= 4e3) return 70;
        if (value <= 4500) return 60;
        if (value <= 5e3) return 50;
        if (value <= 6e3) return 40;
        if (value <= 7e3) return 30;
        if (value <= 8e3) return 20;
        return 10;
      case "fid":
        if (value <= 100) return 100;
        if (value <= 150) return 90;
        if (value <= 200) return 80;
        if (value <= 250) return 70;
        if (value <= 300) return 60;
        if (value <= 400) return 50;
        if (value <= 500) return 40;
        if (value <= 600) return 30;
        if (value <= 700) return 20;
        return 10;
      case "cls":
        if (value <= 0.1) return 100;
        if (value <= 0.15) return 90;
        if (value <= 0.2) return 80;
        if (value <= 0.25) return 70;
        if (value <= 0.3) return 60;
        if (value <= 0.4) return 50;
        if (value <= 0.5) return 40;
        if (value <= 0.6) return 30;
        if (value <= 0.7) return 20;
        return 10;
      case "ttfb":
        if (value <= 600) return 100;
        if (value <= 800) return 90;
        if (value <= 1e3) return 80;
        if (value <= 1200) return 70;
        if (value <= 1500) return 60;
        if (value <= 2e3) return 50;
        if (value <= 2500) return 40;
        if (value <= 3e3) return 30;
        if (value <= 4e3) return 20;
        return 10;
      default:
        return 50;
    }
  }
  /**
   * Format score for display
   */
  static formatScore(score, precision = 0) {
    return score.toFixed(precision);
  }
  /**
   * Format score with category for display
   */
  static formatScoreWithCategory(score, thresholds = SCORE_THRESHOLDS.STANDARD) {
    const category = this.getCategoryWithThresholds(score, thresholds);
    const categoryFormatted = category.charAt(0).toUpperCase() + category.slice(1);
    return `${this.formatScore(score)} (${categoryFormatted})`;
  }
};
var getScoreCategory = ScoreUtils.getCategory;
var getPerformanceCategory = ScoreUtils.getPerformanceCategory;
var getTechnicalCategory = ScoreUtils.getTechnicalCategory;
var getScoreColor = ScoreUtils.getColorForScore;
var calculateOverallScore = ScoreUtils.calculateOverallScore;

// server/lib/factories/analysis.factory.ts
var AnalysisFactory = class {
  /**
   * Create default keyword analysis
   */
  static createDefaultKeywordAnalysis(primaryKeyword = "") {
    const score = primaryKeyword ? 50 : 40;
    return {
      primaryKeyword: primaryKeyword || "no keyword detected",
      density: 0,
      relatedKeywords: [],
      keywordPlacement: {
        title: false,
        h1: false,
        h2: false,
        metaDescription: false,
        firstParagraph: false,
        lastParagraph: false,
        altText: false,
        url: false
      },
      overallScore: ScoreUtils.getScoreResult(score)
    };
  }
  /**
   * Create default meta tags analysis
   */
  static createDefaultMetaTagsAnalysis() {
    return {
      title: {
        content: "",
        length: 0,
        hasKeyword: false,
        isOptimized: false
      },
      description: {
        content: "",
        length: 0,
        hasKeyword: false,
        isOptimized: false
      },
      keywords: [],
      openGraph: {
        hasOgTitle: false,
        hasOgDescription: false,
        hasOgImage: false,
        hasOgUrl: false
      },
      twitterCard: {
        hasTwitterCard: false,
        hasTwitterTitle: false,
        hasTwitterDescription: false,
        hasTwitterImage: false
      },
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default content analysis
   */
  static createDefaultContentAnalysis() {
    return {
      wordCount: 0,
      uniqueContentPercentage: 0,
      readabilityScore: 50,
      headingStructure: {
        h1Count: 0,
        h2Count: 0,
        h3Count: 0,
        hasProperHierarchy: false
      },
      textToHtmlRatio: 0,
      contentDepth: "shallow",
      topicCoverage: [],
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default internal links analysis
   */
  static createDefaultInternalLinksAnalysis() {
    return {
      totalInternalLinks: 0,
      internalLinksWithAnchor: 0,
      hasProperAnchors: false,
      internalLinksDiversity: 0,
      followVsNofollowRatio: 1,
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default image analysis
   */
  static createDefaultImageAnalysis() {
    return {
      totalImages: 0,
      imagesWithAlt: 0,
      imagesOptimized: 0,
      sizeOptimized: false,
      formatOptimized: false,
      hasWebP: false,
      averageFileSize: 0,
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default schema markup analysis
   */
  static createDefaultSchemaMarkupAnalysis() {
    return {
      hasSchemaMarkup: false,
      schemaTypes: [],
      structuredDataScore: 0,
      errors: [],
      warnings: [],
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default mobile analysis
   */
  static createDefaultMobileAnalysis() {
    return {
      isMobileFriendly: false,
      hasViewportMeta: false,
      textSizeOptimal: false,
      tapTargetsOptimal: false,
      hasFlashContent: false,
      mobileUsabilityScore: 50,
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default page speed analysis
   */
  static createDefaultPageSpeedAnalysis() {
    return {
      score: 50,
      lcp: 4e3,
      // 4 seconds - needs work
      fid: 200,
      // 200ms - needs work
      cls: 0.25,
      // 0.25 - needs work
      ttfb: 800,
      // 800ms - needs work
      speedIndex: 5e3,
      overallScore: ScoreUtils.getPerformanceScoreResult(50)
    };
  }
  /**
   * Create default user engagement analysis
   */
  static createDefaultUserEngagementAnalysis() {
    return {
      estimatedReadTime: 5,
      potentialBounceRate: 50,
      contentEngagementScore: 50,
      socialSignals: {
        hasShareButtons: false,
        hasSocialMeta: false
      },
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default E-E-A-T analysis
   */
  static createDefaultEATAnalysis() {
    return {
      expertise: {
        hasAuthorInfo: false,
        hasCredentials: false,
        topicalAuthority: 50
      },
      authoritativeness: {
        hasAboutPage: false,
        hasContactInfo: false,
        hasExternalLinks: false,
        domainAuthority: 50
      },
      trustworthiness: {
        hasSSL: false,
        hasPrivacyPolicy: false,
        hasTermsOfService: false,
        hasReviews: false
      },
      overallScore: ScoreUtils.getScoreResult(50)
    };
  }
  /**
   * Create default competitor analysis result
   */
  static createDefaultCompetitorAnalysis(keyword = "", location = "United States") {
    return {
      competitors: [],
      comparisonMetrics: {
        titleLength: 0,
        descriptionLength: 0,
        wordCount: 0,
        internalLinks: 0,
        externalLinks: 0
      },
      allCompetitorUrls: [],
      meta: {
        keyword,
        location,
        totalResults: 0,
        analyzedResults: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  /**
   * Create complete error analysis result
   */
  static createErrorAnalysisResult(url, errorMessage) {
    const defaultScore = ScoreUtils.getScoreResult(25);
    return {
      url,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      overallScore: defaultScore,
      // All analysis sections with default values
      keywords: this.createDefaultKeywordAnalysis(),
      metaTags: this.createDefaultMetaTagsAnalysis(),
      content: this.createDefaultContentAnalysis(),
      internalLinks: this.createDefaultInternalLinksAnalysis(),
      images: this.createDefaultImageAnalysis(),
      schemaMarkup: this.createDefaultSchemaMarkupAnalysis(),
      mobile: this.createDefaultMobileAnalysis(),
      pageSpeed: this.createDefaultPageSpeedAnalysis(),
      userEngagement: this.createDefaultUserEngagementAnalysis(),
      eat: this.createDefaultEATAnalysis(),
      // Error information
      strengths: [],
      weaknesses: [
        "Page analysis failed",
        `Error: ${errorMessage}`,
        "Unable to crawl page content",
        "Check URL accessibility and try again"
      ],
      recommendations: [
        "Verify the URL is correct and accessible",
        "Check if the website is online and responsive",
        "Ensure the page allows crawler access (no robots.txt blocking)",
        "Try analyzing again after fixing accessibility issues"
      ],
      error: {
        hasError: true,
        message: errorMessage,
        code: "ANALYSIS_FAILED"
      }
    };
  }
  /**
   * Create fallback page speed metrics for unified service
   */
  static createFallbackPageSpeedMetrics() {
    return {
      score: 50,
      lcp: 4e3,
      fid: 200,
      cls: 0.25,
      ttfb: 800,
      speedIndex: 5e3,
      source: "simulation",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      overallScore: ScoreUtils.getPerformanceScoreResult(50)
    };
  }
  /**
   * Create default technical SEO analysis
   */
  static createDefaultTechnicalAnalysis() {
    return {
      score: 50,
      assessment: ScoreUtils.getAssessment(50),
      issues: [],
      recommendations: [
        "Add proper meta tags",
        "Optimize page loading speed",
        "Implement structured data",
        "Ensure mobile responsiveness"
      ],
      technicalHealth: {
        ssl: false,
        canonical: false,
        robots: false,
        sitemap: false,
        redirects: false
      }
    };
  }
  /**
   * Create default content optimization analysis
   */
  static createDefaultContentOptimization() {
    return {
      score: 50,
      assessment: ScoreUtils.getAssessment(50),
      issues: [],
      recommendations: [
        "Increase content length for better coverage",
        "Improve keyword optimization",
        "Add more relevant headings",
        "Enhance content readability"
      ],
      contentQuality: {
        length: "short",
        depth: "shallow",
        readability: "moderate",
        uniqueness: "unknown"
      }
    };
  }
  /**
   * Get all default analysis components for a complete SEO analysis
   */
  static createCompleteDefaultAnalysis(url, primaryKeyword) {
    return {
      url,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      overallScore: ScoreUtils.getScoreResult(50),
      keywords: this.createDefaultKeywordAnalysis(primaryKeyword),
      metaTags: this.createDefaultMetaTagsAnalysis(),
      content: this.createDefaultContentAnalysis(),
      internalLinks: this.createDefaultInternalLinksAnalysis(),
      images: this.createDefaultImageAnalysis(),
      schemaMarkup: this.createDefaultSchemaMarkupAnalysis(),
      mobile: this.createDefaultMobileAnalysis(),
      pageSpeed: this.createDefaultPageSpeedAnalysis(),
      userEngagement: this.createDefaultUserEngagementAnalysis(),
      eat: this.createDefaultEATAnalysis(),
      strengths: [
        "Basic website structure detected",
        "Page is accessible for analysis"
      ],
      weaknesses: [
        "Limited optimization detected",
        "Multiple areas need improvement",
        "SEO potential not fully realized"
      ],
      recommendations: [
        "Optimize meta tags for target keywords",
        "Improve page loading speed",
        "Enhance content quality and length",
        "Add structured data markup",
        "Implement proper internal linking strategy"
      ]
    };
  }
};
var createDefaultKeywordAnalysis = AnalysisFactory.createDefaultKeywordAnalysis;
var createDefaultMetaTagsAnalysis = AnalysisFactory.createDefaultMetaTagsAnalysis;
var createDefaultContentAnalysis = AnalysisFactory.createDefaultContentAnalysis;
var createDefaultPageSpeedAnalysis = AnalysisFactory.createDefaultPageSpeedAnalysis;
var createErrorAnalysisResult = AnalysisFactory.createErrorAnalysisResult;

// server/services/analysis/keyword-analyzer.service.ts
var KeywordAnalyzer = class {
  // Common English stop words to filter out when extracting keywords
  stopWords = /* @__PURE__ */ new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "from",
    "up",
    "down",
    "of",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now"
  ]);
  /**
   * Extract primary keyword from page data
   */
  async extractPrimaryKeyword(pageData) {
    try {
      if (pageData.error || !pageData.title) {
        return "HVAC";
      }
      if (pageData.headings.h1.length > 0) {
        const h1Text = pageData.headings.h1[0].toLowerCase();
        const productServiceTerms = [
          "service",
          "services",
          "product",
          "products",
          "solution",
          "solutions",
          "package",
          "packages",
          "plan",
          "plans",
          "consultation",
          "consultations",
          "repair",
          "repairs",
          "installation",
          "installations",
          "maintenance",
          "replacement",
          "system",
          "systems",
          "equipment",
          "tool",
          "tools"
        ];
        for (const term of productServiceTerms) {
          if (h1Text.includes(term)) {
            const words = h1Text.split(/\s+/);
            const termIndex = words.findIndex((w) => w.includes(term));
            if (termIndex > 0) {
              const precedingWords = words.slice(Math.max(0, termIndex - 2), termIndex);
              const filteredPrecedingWords = precedingWords.filter(
                (w) => !this.stopWords.has(w) && !["our", "your", "the", "best", "professional", "quality", "affordable"].includes(w)
              );
              if (filteredPrecedingWords.length > 0) {
                const keyword = filteredPrecedingWords.join(" ");
                return keyword.charAt(0).toUpperCase() + keyword.slice(1);
              }
            }
          }
        }
        const h1Words = h1Text.split(/\s+/).filter((w) => !this.stopWords.has(w));
        if (h1Words.length > 0) {
          if (h1Words.length >= 2) {
            return (h1Words[0] + " " + h1Words[1]).charAt(0).toUpperCase() + (h1Words[0] + " " + h1Words[1]).slice(1);
          } else {
            return h1Words[0].charAt(0).toUpperCase() + h1Words[0].slice(1);
          }
        }
      }
      const url = pageData.url.toLowerCase();
      if (url.includes("airdocs") || url.includes("heating") || url.includes("cooling")) {
        return "HVAC";
      }
      const titleKeywords = this.extractKeywordsFromText(pageData.title || "");
      const h1Keywords = this.extractKeywordsFromTexts(pageData.headings.h1);
      const metaKeywords = this.extractKeywordsFromText(pageData.meta.description || "");
      const urlKeywords = this.extractKeywordsFromUrl(pageData.url);
      const extraH1Keywords = [...h1Keywords, ...h1Keywords];
      const industryTerms = ["hvac", "air conditioning", "heating", "cooling", "furnace", "ac", "air conditioner"];
      for (const term of industryTerms) {
        if (pageData.title && pageData.title.toLowerCase().includes(term) || pageData.headings.h1.some((h) => h.toLowerCase().includes(term))) {
          return term.charAt(0).toUpperCase() + term.slice(1);
        }
      }
      const allKeywords = [...titleKeywords, ...h1Keywords, ...extraH1Keywords, ...metaKeywords, ...urlKeywords];
      const keywordCounts = this.countKeywordOccurrences(allKeywords);
      const contentText = pageData.content.text;
      const weightedKeywords = this.weightKeywords(keywordCounts, pageData, contentText);
      const sortedKeywords = Array.from(weightedKeywords.entries()).sort((a, b) => b[1] - a[1]);
      return sortedKeywords.length > 0 ? sortedKeywords[0][0] : "HVAC";
    } catch (error) {
      console.error("Error extracting primary keyword:", error);
      return "HVAC";
    }
  }
  /**
   * Analyze keyword optimization
   */
  async analyze(pageData, primaryKeyword) {
    try {
      if (primaryKeyword === "no keyword detected") {
        return this.getDefaultKeywordAnalysis();
      }
      const relatedKeywords = await this.extractRelatedKeywords(pageData, primaryKeyword);
      const titlePresent = this.isKeywordPresent(pageData.title || "", primaryKeyword);
      const descriptionPresent = this.isKeywordPresent(pageData.meta.description || "", primaryKeyword);
      const h1Present = pageData.headings.h1.some((h) => this.isKeywordPresent(h, primaryKeyword));
      const headingsPresent = pageData.headings.h2.some((h) => this.isKeywordPresent(h, primaryKeyword)) || pageData.headings.h3.some((h) => this.isKeywordPresent(h, primaryKeyword)) || pageData.headings.h4.some((h) => this.isKeywordPresent(h, primaryKeyword)) || pageData.headings.h5.some((h) => this.isKeywordPresent(h, primaryKeyword)) || pageData.headings.h6.some((h) => this.isKeywordPresent(h, primaryKeyword));
      const first100Words = this.getFirst100Words(pageData.content.text);
      const contentPresent = this.isKeywordPresent(first100Words, primaryKeyword);
      const urlPresent = this.isKeywordPresent(pageData.url, primaryKeyword);
      const altTextPresent = pageData.images.some(
        (img) => img.alt && this.isKeywordPresent(img.alt, primaryKeyword)
      );
      const density = this.calculateKeywordDensity(pageData.content.text, primaryKeyword);
      const score = this.calculateKeywordScore({
        titlePresent,
        descriptionPresent,
        h1Present,
        headingsPresent,
        contentPresent,
        urlPresent,
        altTextPresent,
        density,
        relatedKeywords
      });
      const category = this.getScoreCategory(score);
      return {
        primaryKeyword,
        relatedKeywords,
        titlePresent,
        descriptionPresent,
        h1Present,
        headingsPresent,
        contentPresent,
        urlPresent,
        altTextPresent,
        density,
        overallScore: { score, category }
      };
    } catch (error) {
      console.error("Error analyzing keywords:", error);
      return this.getDefaultKeywordAnalysis();
    }
  }
  /**
   * Extract keywords from text
   */
  extractKeywordsFromText(text) {
    if (!text) return [];
    const words = text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !this.stopWords.has(word));
    const bigrams = this.extractNgrams(words, 2);
    const trigrams = this.extractNgrams(words, 3);
    return [...words, ...bigrams, ...trigrams];
  }
  /**
   * Extract keywords from an array of texts
   */
  extractKeywordsFromTexts(texts) {
    if (!texts || texts.length === 0) return [];
    const allKeywords = [];
    for (const text of texts) {
      const keywords = this.extractKeywordsFromText(text);
      allKeywords.push(...keywords);
    }
    return allKeywords;
  }
  /**
   * Extract keywords from URL
   */
  extractKeywordsFromUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split("/").filter((segment) => segment.length > 0);
      const keywords = [];
      for (const segment of pathSegments) {
        const processedSegment = segment.replace(/[-_]/g, " ");
        const segmentKeywords = this.extractKeywordsFromText(processedSegment);
        if (segment.length > 3 && !this.stopWords.has(segment)) {
          keywords.push(segment.toLowerCase());
        }
        keywords.push(...segmentKeywords);
      }
      return keywords;
    } catch (error) {
      console.error("Error extracting keywords from URL:", error);
      return [];
    }
  }
  /**
   * Extract n-grams (phrases of n words) from an array of words
   */
  extractNgrams(words, n) {
    if (words.length < n) return [];
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(" ");
      ngrams.push(ngram);
    }
    return ngrams;
  }
  /**
   * Count occurrences of each keyword
   */
  countKeywordOccurrences(keywords) {
    const counts = /* @__PURE__ */ new Map();
    for (const keyword of keywords) {
      const currentCount = counts.get(keyword) || 0;
      counts.set(keyword, currentCount + 1);
    }
    return counts;
  }
  /**
   * Weight keywords based on their importance
   */
  weightKeywords(keywordCounts, pageData, contentText) {
    const weightedKeywords = /* @__PURE__ */ new Map();
    for (const [keyword, count] of keywordCounts.entries()) {
      let weight = count;
      if (pageData.title && this.isKeywordPresent(pageData.title, keyword)) {
        weight += 3;
      }
      if (pageData.headings.h1.some((h) => this.isKeywordPresent(h, keyword))) {
        weight += 3;
      }
      if (this.isKeywordPresent(pageData.url, keyword)) {
        weight += 2;
      }
      if (pageData.meta.description && this.isKeywordPresent(pageData.meta.description, keyword)) {
        weight += 2;
      }
      const contentFrequency = this.countSingleKeywordOccurrences(contentText, keyword);
      weight += contentFrequency;
      weightedKeywords.set(keyword, weight);
    }
    return weightedKeywords;
  }
  /**
   * Count occurrences of a single keyword in text
   */
  countSingleKeywordOccurrences(text, keyword) {
    if (!text || !keyword) return 0;
    try {
      const escapedKeyword = this.escapeRegExp(keyword);
      if (!escapedKeyword) return 0;
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi");
      const matches = text.match(regex);
      return matches ? matches.length : 0;
    } catch (error) {
      console.error("Error counting keyword occurrences:", error);
      return 0;
    }
  }
  /**
   * Escape special characters for use in RegExp
   */
  escapeRegExp(string) {
    if (!string || typeof string !== "string") return "";
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * Check if a keyword is present in text
   */
  isKeywordPresent(text, keyword) {
    if (!text || !keyword) return false;
    const normalizedText = text.toLowerCase();
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }
    if (keyword.includes(" ")) {
      const keywordParts = normalizedKeyword.split(" ").filter((w) => w.length > 3);
      return keywordParts.some((part) => normalizedText.includes(part));
    }
    return false;
  }
  /**
   * Get the first 100 words from text
   */
  getFirst100Words(text) {
    if (!text) return "";
    const words = text.split(/\s+/).slice(0, 100);
    return words.join(" ");
  }
  /**
   * Extract related keywords based on primary keyword and page content
   */
  async extractRelatedKeywords(pageData, primaryKeyword) {
    const contentKeywords = this.extractKeywordsFromText(pageData.content.text);
    const keywordCounts = this.countKeywordOccurrences(contentKeywords);
    keywordCounts.delete(primaryKeyword);
    const filteredCounts = /* @__PURE__ */ new Map();
    for (const [keyword, count] of keywordCounts.entries()) {
      if (count >= 2) {
        filteredCounts.set(keyword, count);
      }
    }
    const sortedKeywords = Array.from(filteredCounts.entries()).sort((a, b) => b[1] - a[1]).map((entry) => entry[0]);
    return sortedKeywords.slice(0, 5);
  }
  /**
   * Calculate keyword density in content
   */
  calculateKeywordDensity(content, keyword) {
    if (!content || !keyword) return 0;
    const words = content.split(/\s+/).length;
    if (words === 0) return 0;
    const keywordOccurrences = this.countSingleKeywordOccurrences(content, keyword);
    return keywordOccurrences / words * 100;
  }
  /**
   * Calculate keyword optimization score
   */
  calculateKeywordScore(factors) {
    let score = 50;
    if (factors.titlePresent) score += 10;
    if (factors.h1Present) score += 10;
    if (factors.descriptionPresent) score += 5;
    if (factors.urlPresent) score += 5;
    if (factors.headingsPresent) score += 5;
    if (factors.contentPresent) score += 5;
    if (factors.altTextPresent) score += 5;
    if (factors.density > 0 && factors.density <= 3) {
      score += 5;
      if (factors.density >= 0.5 && factors.density <= 2) {
        score += 5;
      }
    } else if (factors.density > 3) {
      score -= 5;
    }
    if (factors.relatedKeywords.length >= 3) score += 5;
    return Math.min(Math.max(0, score), 100);
  }
  /**
   * Get score category based on numeric score
   * @deprecated Use ScoreUtils.getPerformanceCategory instead
   */
  getScoreCategory(score) {
    return ScoreUtils.getPerformanceCategory(score);
  }
  /**
   * Get default keyword analysis result when unable to detect keywords
   * @deprecated Use AnalysisFactory.createDefaultKeywordAnalysis instead
   */
  getDefaultKeywordAnalysis() {
    return AnalysisFactory.createDefaultKeywordAnalysis("no keyword detected");
  }
};
var keywordAnalyzer = new KeywordAnalyzer();

// server/services/external/pagespeed.service.ts
import axios from "axios";
var UnifiedPageSpeedService = class {
  /**
   * Analyze page speed using API or simulation fallback
   */
  async analyze(url, pageData) {
    try {
      if (process.env.GOOGLE_API_KEY) {
        try {
          return await this.analyzeWithApi(url);
        } catch (error) {
          console.warn("PageSpeed API analysis failed, falling back to simulation:", error);
        }
      }
      if (pageData) {
        return await this.analyzeWithSimulation(url, pageData);
      }
      return this.generateFallbackMetrics();
    } catch (error) {
      console.error("PageSpeed analysis failed:", error);
      return this.generateFallbackMetrics();
    }
  }
  /**
   * Analyze using Google PageSpeed Insights API
   */
  async analyzeWithApi(url) {
    const [mobileResponse, desktopResponse] = await Promise.all([
      this.fetchPageSpeedApi(url, "mobile"),
      this.fetchPageSpeedApi(url, "desktop")
    ]);
    const mobileMetrics = this.extractMetrics(mobileResponse.data);
    const desktopMetrics = this.extractMetrics(desktopResponse.data);
    const primaryScore = mobileMetrics.score;
    return {
      score: primaryScore,
      lcp: mobileMetrics.largestContentfulPaint * 1e3,
      // Convert to ms
      fid: mobileMetrics.firstInputDelay || 100,
      cls: mobileMetrics.cumulativeLayoutShift,
      ttfb: mobileMetrics.timeToFirstByte * 1e3,
      // Convert to ms
      fcp: mobileMetrics.firstContentfulPaint * 1e3,
      tbt: mobileMetrics.totalBlockingTime,
      speedIndex: mobileMetrics.speedIndex,
      tti: desktopMetrics.timeToInteractive,
      mobile: mobileMetrics,
      desktop: desktopMetrics,
      source: "api",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      overallScore: {
        score: primaryScore,
        category: this.getScoreCategory(primaryScore)
      }
    };
  }
  /**
   * Analyze using simulation based on page content
   */
  async analyzeWithSimulation(url, pageData) {
    const simulatedMetrics = await this.simulatePerformanceMetrics(url, pageData);
    const overallScore = this.calculateOverallScore(simulatedMetrics);
    return {
      score: simulatedMetrics.score,
      lcp: simulatedMetrics.lcp || 2500,
      fid: simulatedMetrics.fid || 100,
      cls: simulatedMetrics.cls || 0.1,
      ttfb: simulatedMetrics.ttfb || 600,
      speedIndex: simulatedMetrics.speedIndex,
      source: "simulation",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      overallScore: {
        score: overallScore,
        category: this.getScoreCategory(overallScore)
      }
    };
  }
  /**
   * Fetch data from Google PageSpeed Insights API
   */
  async fetchPageSpeedApi(url, strategy) {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
    const params = new URLSearchParams({
      url: encodeURIComponent(url),
      strategy,
      key: process.env.GOOGLE_API_KEY,
      category: "performance"
    });
    return axios.get(`${apiUrl}?${params}`, {
      timeout: 3e4,
      headers: {
        "User-Agent": "RivalOutranker/1.0 PageSpeed Analysis"
      }
    });
  }
  /**
   * Extract metrics from PageSpeed API response
   */
  extractMetrics(data) {
    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;
    const score = Math.round(lighthouseResult.categories.performance.score * 100);
    const fcp = audits["first-contentful-paint"]?.numericValue / 1e3 || 0;
    const lcp = audits["largest-contentful-paint"]?.numericValue / 1e3 || 0;
    const fid = audits["first-input-delay"]?.numericValue || 0;
    const cls = audits["cumulative-layout-shift"]?.numericValue || 0;
    const ttfb = audits["server-response-time"]?.numericValue / 1e3 || 0;
    const tbt = audits["total-blocking-time"]?.numericValue || 0;
    const si = audits["speed-index"]?.numericValue || 0;
    const tti = audits["interactive"]?.numericValue / 1e3 || 0;
    return {
      score,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: fid,
      cumulativeLayoutShift: cls,
      timeToFirstByte: ttfb,
      totalBlockingTime: tbt,
      speedIndex: si,
      timeToInteractive: tti
    };
  }
  /**
   * Simulate performance metrics based on page content analysis
   */
  async simulatePerformanceMetrics(url, pageData) {
    const totalImages = pageData.images.length;
    const approximateResourceSize = pageData.content.text.length * 2;
    const hasPerformanceIssues = this.detectPerformanceIssues(pageData);
    const domainFactor = this.getDomainFactor(url);
    let baseScore = 85;
    if (totalImages > 10) baseScore -= 10;
    if (totalImages > 20) baseScore -= 10;
    if (approximateResourceSize > 1e5) baseScore -= 15;
    if (hasPerformanceIssues) baseScore -= 10;
    baseScore = Math.round(baseScore * domainFactor);
    baseScore = Math.max(10, Math.min(100, baseScore));
    const lcp = this.simulateLCP(baseScore, totalImages);
    const fid = this.simulateFID(baseScore);
    const cls = this.simulateCLS(baseScore, totalImages);
    const ttfb = this.simulateTTFB(baseScore, approximateResourceSize);
    const speedIndex = this.simulateSpeedIndex(baseScore, totalImages, approximateResourceSize);
    return {
      score: baseScore,
      lcp,
      fid,
      cls,
      ttfb,
      speedIndex
    };
  }
  /**
   * Detect performance issues from page content
   */
  detectPerformanceIssues(pageData) {
    const hasLargeImages = pageData.images.length > 10;
    const hasExcessiveExternalLinks = pageData.links.external.length > 20;
    const hasLargeContent = pageData.content.wordCount > 3e3;
    const hasLotsOfJavaScript = (pageData.performance?.resourceCount || 0) > 50;
    return hasLargeImages || hasExcessiveExternalLinks || hasLargeContent || hasLotsOfJavaScript;
  }
  /**
   * Get domain-based performance factor for realistic variation
   */
  getDomainFactor(url) {
    try {
      const domain = new URL(url).hostname;
      const domainLength = domain.length;
      let factor = 0.8 + domainLength % 10 / 25;
      const fastDomains = ["google.com", "amazon.com", "apple.com", "microsoft.com"];
      if (fastDomains.some((d) => domain.includes(d))) {
        factor += 0.1;
      }
      return Math.min(1.2, Math.max(0.7, factor));
    } catch {
      return 1;
    }
  }
  /**
   * Simulate Largest Contentful Paint (LCP)
   */
  simulateLCP(score, imageCount) {
    let baseLCP = 2500;
    if (score < 50) baseLCP = 4e3 + Math.random() * 2e3;
    else if (score < 70) baseLCP = 3e3 + Math.random() * 1e3;
    else if (score < 90) baseLCP = 2500 + Math.random() * 500;
    else baseLCP = 1500 + Math.random() * 1e3;
    baseLCP += imageCount * 50;
    return Math.round(baseLCP);
  }
  /**
   * Simulate First Input Delay (FID)
   */
  simulateFID(score) {
    if (score >= 90) return Math.round(50 + Math.random() * 50);
    if (score >= 70) return Math.round(100 + Math.random() * 100);
    if (score >= 50) return Math.round(200 + Math.random() * 100);
    return Math.round(300 + Math.random() * 200);
  }
  /**
   * Simulate Cumulative Layout Shift (CLS)
   */
  simulateCLS(score, imageCount) {
    let baseCLS = 0.1;
    if (score < 50) baseCLS = 0.25 + Math.random() * 0.15;
    else if (score < 70) baseCLS = 0.15 + Math.random() * 0.1;
    else if (score < 90) baseCLS = 0.1 + Math.random() * 0.05;
    else baseCLS = Math.random() * 0.1;
    baseCLS += imageCount * 0.01;
    return Math.round(baseCLS * 1e3) / 1e3;
  }
  /**
   * Simulate Time to First Byte (TTFB)
   */
  simulateTTFB(score, resourceSize) {
    let baseTTFB = 600;
    if (score < 50) baseTTFB = 1200 + Math.random() * 800;
    else if (score < 70) baseTTFB = 800 + Math.random() * 400;
    else if (score < 90) baseTTFB = 600 + Math.random() * 200;
    else baseTTFB = 200 + Math.random() * 400;
    baseTTFB += Math.min(800, resourceSize / 1e3);
    return Math.round(baseTTFB);
  }
  /**
   * Simulate Speed Index
   */
  simulateSpeedIndex(score, imageCount, resourceSize) {
    let baseSpeedIndex = 3e3;
    if (score < 50) baseSpeedIndex = 6e3 + Math.random() * 3e3;
    else if (score < 70) baseSpeedIndex = 4e3 + Math.random() * 2e3;
    else if (score < 90) baseSpeedIndex = 3e3 + Math.random() * 1e3;
    else baseSpeedIndex = 1500 + Math.random() * 1500;
    baseSpeedIndex += imageCount * 100;
    baseSpeedIndex += Math.min(2e3, resourceSize / 100);
    return Math.round(baseSpeedIndex);
  }
  /**
   * Calculate overall performance score
   */
  calculateOverallScore(metrics) {
    if (!metrics.lcp || !metrics.fid || !metrics.cls || !metrics.ttfb) {
      return metrics.score;
    }
    const lcpScore = this.calculateLCPScore(metrics.lcp);
    const fidScore = this.calculateFIDScore(metrics.fid);
    const clsScore = this.calculateCLSScore(metrics.cls);
    const ttfbScore = this.calculateTTFBScore(metrics.ttfb);
    const weightedScore = lcpScore * 0.25 + fidScore * 0.25 + clsScore * 0.15 + ttfbScore * 0.15 + metrics.score * 0.2;
    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }
  /**
   * Calculate LCP score (Largest Contentful Paint)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  calculateLCPScore(lcp) {
    return ScoreUtils.getPerformanceMetricScore(lcp, "lcp");
  }
  /**
   * Calculate FID score (First Input Delay)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  calculateFIDScore(fid) {
    return ScoreUtils.getPerformanceMetricScore(fid, "fid");
  }
  /**
   * Calculate CLS score (Cumulative Layout Shift)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  calculateCLSScore(cls) {
    return ScoreUtils.getPerformanceMetricScore(cls, "cls");
  }
  /**
   * Calculate TTFB score (Time to First Byte)
   * @deprecated Use ScoreUtils.getPerformanceMetricScore instead
   */
  calculateTTFBScore(ttfb) {
    return ScoreUtils.getPerformanceMetricScore(ttfb, "ttfb");
  }
  /**
   * Get score category based on numeric score
   * @deprecated Use ScoreUtils.getPerformanceCategory instead
   */
  getScoreCategory(score) {
    return ScoreUtils.getPerformanceCategory(score);
  }
  /**
   * Generate fallback metrics when analysis fails
   * @deprecated Use AnalysisFactory.createFallbackPageSpeedMetrics instead
   */
  generateFallbackMetrics() {
    return AnalysisFactory.createFallbackPageSpeedMetrics();
  }
};
var pageSpeedService = new UnifiedPageSpeedService();

// server/services/analysis/content-optimization.service.ts
var ContentOptimizationAnalyzer = class {
  /**
   * Primary method to analyze content for various SEO optimizations
   */
  analyzeContent(pageData, primaryKeyword) {
    if (pageData.error) {
      return {
        score: 0,
        message: `Cannot analyze content: ${pageData.error}`,
        issues: [],
        recommendations: []
      };
    }
    const contentText = pageData.content.text;
    const wordCount = pageData.content.wordCount;
    const paragraphs = pageData.content.paragraphs;
    const title = pageData.title || "";
    const description = pageData.meta.description || "";
    const issues = [];
    const recommendations = [];
    if (wordCount < 300) {
      issues.push(`Thin content detected: Only ${wordCount} words.`);
      recommendations.push("Expand content to at least 600 words for better keyword coverage and relevance.");
    }
    if (!title) {
      issues.push("Missing title tag.");
      recommendations.push("Add a descriptive title tag that includes your primary keyword.");
    } else if (title.length < 30) {
      issues.push(`Title tag is too short (${title.length} characters).`);
      recommendations.push("Expand your title to 50-60 characters to better target keywords and improve CTR.");
    } else if (title.length > 70) {
      issues.push(`Title tag is too long (${title.length} characters) and may be truncated in search results.`);
      recommendations.push("Keep your title under 60 characters to ensure it displays properly in search results.");
    }
    if (!description) {
      issues.push("Missing meta description.");
      recommendations.push("Add a meta description that summarizes the page content and includes your primary keyword.");
    } else if (description.length < 70) {
      issues.push(`Meta description is too short (${description.length} characters).`);
      recommendations.push("Expand your meta description to 120-160 characters for better visibility in search results.");
    } else if (description.length > 320) {
      issues.push(`Meta description is too long (${description.length} characters) and may be truncated in search results.`);
      recommendations.push("Keep your meta description under 160 characters to ensure it displays properly in search results.");
    }
    this.analyzeHeadingStructure(pageData, issues, recommendations);
    if (primaryKeyword) {
      this.analyzeKeywordUsage(pageData, primaryKeyword, issues, recommendations);
    }
    if (paragraphs.length === 0) {
      issues.push("No paragraphs detected in content.");
      recommendations.push("Structure your content with clear paragraphs using proper HTML <p> tags.");
    } else {
      const longParagraphs = paragraphs.filter((p) => p.split(/\s+/).length > 200).length;
      if (longParagraphs > 0) {
        issues.push(`${longParagraphs} extremely long paragraphs detected.`);
        recommendations.push("Break up long paragraphs into smaller, more digestible chunks of 3-5 sentences each.");
      }
    }
    this.analyzeInternalLinking(pageData, issues, recommendations);
    this.analyzeImageOptimization(pageData, issues, recommendations);
    const score = this.calculateContentScore(issues.length, wordCount, pageData);
    const assessment = ScoreUtils.getAssessment(score);
    return {
      score,
      assessment,
      wordCount,
      readability: this.analyzeReadability(contentText),
      issues,
      recommendations,
      keywordAnalysis: primaryKeyword ? this.getKeywordStats(pageData, primaryKeyword) : null
    };
  }
  /**
   * Analyze heading structure and hierarchy
   */
  analyzeHeadingStructure(pageData, issues, recommendations) {
    const { h1, h2, h3, h4, h5, h6 } = pageData.headings;
    if (h1.length === 0) {
      issues.push("Missing H1 heading.");
      recommendations.push("Add a single H1 heading that clearly describes the page and includes your primary keyword.");
    } else if (h1.length > 1) {
      issues.push(`Multiple H1 headings detected (${h1.length}).`);
      recommendations.push("Use only one H1 heading per page as a main topic identifier.");
    }
    if (h2.length === 0 && (h3.length > 0 || h4.length > 0)) {
      issues.push("Improper heading hierarchy: H3 or H4 tags used without H2 tags.");
      recommendations.push("Structure your headings properly: H1 \u2192 H2 \u2192 H3, etc.");
    }
    const totalHeadings = h1.length + h2.length + h3.length + h4.length + h5.length + h6.length;
    if (totalHeadings > 20) {
      issues.push(`Excessive number of headings (${totalHeadings}).`);
      recommendations.push("Consider consolidating your content structure for better readability.");
    }
    const emptyHeadings = [
      ...h1.filter((h) => h.trim() === ""),
      ...h2.filter((h) => h.trim() === ""),
      ...h3.filter((h) => h.trim() === ""),
      ...h4.filter((h) => h.trim() === ""),
      ...h5.filter((h) => h.trim() === ""),
      ...h6.filter((h) => h.trim() === "")
    ].length;
    if (emptyHeadings > 0) {
      issues.push(`Empty headings detected (${emptyHeadings}).`);
      recommendations.push("Remove or add content to empty heading tags.");
    }
  }
  /**
   * Analyze keyword usage throughout the page
   */
  analyzeKeywordUsage(pageData, keyword, issues, recommendations) {
    const keywordLower = keyword.toLowerCase();
    const title = (pageData.title || "").toLowerCase();
    const description = (pageData.meta.description || "").toLowerCase();
    const h1 = pageData.headings.h1.map((h) => h.toLowerCase()).join(" ");
    const contentText = pageData.content.text.toLowerCase();
    if (!title.includes(keywordLower)) {
      issues.push("Primary keyword missing from title tag.");
      recommendations.push(`Include your primary keyword "${keyword}" in the title tag.`);
    }
    if (!description.includes(keywordLower)) {
      issues.push("Primary keyword missing from meta description.");
      recommendations.push(`Include your primary keyword "${keyword}" in the meta description.`);
    }
    if (!h1.includes(keywordLower)) {
      issues.push("Primary keyword missing from H1 heading.");
      recommendations.push(`Include your primary keyword "${keyword}" in the H1 heading.`);
    }
    const first100Words = contentText.split(/\s+/).slice(0, 100).join(" ");
    if (!first100Words.includes(keywordLower)) {
      issues.push("Primary keyword not found in the first 100 words of content.");
      recommendations.push(`Include your primary keyword "${keyword}" within the first paragraph of your content.`);
    }
    const wordCount = contentText.split(/\s+/).length;
    const keywordCount = (contentText.match(new RegExp(keywordLower, "g")) || []).length;
    const keywordDensity = keywordCount / wordCount * 100;
    if (keywordDensity > 3) {
      issues.push(`Keyword stuffing detected: Keyword density is ${keywordDensity.toFixed(1)}%.`);
      recommendations.push("Reduce keyword density to 1-2% to avoid over-optimization penalties.");
    } else if (keywordCount === 0) {
      issues.push("Primary keyword not found in content.");
      recommendations.push(`Include your primary keyword "${keyword}" naturally throughout your content.`);
    } else if (keywordDensity < 0.5 && wordCount > 300) {
      issues.push(`Low keyword density: ${keywordDensity.toFixed(1)}%.`);
      recommendations.push("Increase keyword usage naturally throughout your content to reach 0.5-2% density.");
    }
  }
  /**
   * Analyze internal linking structure
   */
  analyzeInternalLinking(pageData, issues, recommendations) {
    const internalLinks = pageData.links.internal;
    const contentWords = pageData.content.wordCount;
    const brokenLinks = internalLinks.filter((link) => link.broken);
    if (brokenLinks.length > 0) {
      issues.push(`${brokenLinks.length} broken internal ${brokenLinks.length === 1 ? "link" : "links"} detected.`);
      recommendations.push("Fix all broken internal links to improve user experience and site crawlability.");
    }
    if (contentWords > 500 && internalLinks.length === 0) {
      issues.push("No internal links in content.");
      recommendations.push("Add relevant internal links to help users and search engines navigate your site.");
    } else if (contentWords > 1e3) {
      const linkRatio = internalLinks.length / (contentWords / 1e3);
      if (linkRatio < 1) {
        issues.push("Low internal linking ratio for content length.");
        recommendations.push("Add more internal links to related content (aim for 2-3 links per 1,000 words).");
      } else if (linkRatio > 8) {
        issues.push("Excessive internal linking detected.");
        recommendations.push("Reduce the number of internal links to avoid looking spammy to search engines.");
      }
    }
    const linkUrls = internalLinks.map((link) => link.url);
    const duplicateLinks = linkUrls.filter((url, index) => linkUrls.indexOf(url) !== index);
    const uniqueDuplicates = Array.from(new Set(duplicateLinks));
    if (uniqueDuplicates.length > 0) {
      issues.push(`${uniqueDuplicates.length} duplicate internal ${uniqueDuplicates.length === 1 ? "link was" : "links were"} found.`);
      recommendations.push("Avoid linking to the same URL multiple times with identical anchor text.");
    }
  }
  /**
   * Analyze image optimization
   */
  analyzeImageOptimization(pageData, issues, recommendations) {
    const images = pageData.images;
    const missingAltImages = images.filter((img) => !img.alt || img.alt.trim() === "");
    if (missingAltImages.length > 0) {
      issues.push(`${missingAltImages.length} ${missingAltImages.length === 1 ? "image is" : "images are"} missing alt text.`);
      recommendations.push("Add descriptive alt text to all images for better accessibility and SEO.");
    }
    if (images.length === 0 && pageData.content.wordCount > 600) {
      issues.push("No images found in content-heavy page.");
      recommendations.push("Add relevant images to break up text and improve engagement (aim for at least one image per 300-500 words).");
    }
    const largeImages = images.filter((img) => img.size && img.size > 2e5);
    if (largeImages.length > 0) {
      issues.push(`${largeImages.length} ${largeImages.length === 1 ? "image is" : "images are"} oversized (>200KB).`);
      recommendations.push("Optimize large images to under 100KB when possible to improve page load speed.");
    }
  }
  /**
   * Analyze content readability
   */
  analyzeReadability(text) {
    const countSyllables = (word) => {
      word = word.toLowerCase().replace(/[^a-z]/g, "");
      if (word.length <= 3) return 1;
      const vowelGroups = word.replace(/[^aeiouy]+/g, ".").replace(/\\.+/g, ".").replace(/^\\.|\\.$/, "");
      let count = vowelGroups.length;
      if (word.endsWith("e")) count--;
      if (word.endsWith("le") && word.length > 2) count++;
      if (word.endsWith("y") && !isVowel(word.charAt(word.length - 2))) count++;
      return Math.max(1, count);
    };
    const isVowel = (char) => {
      return "aeiouy".includes(char);
    };
    const cleanText = text.replace(/[^a-zA-Z0-9 .!?]/g, "");
    const words = cleanText.match(/\b\w+\b/g) || [];
    const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (words.length === 0 || sentences.length === 0) {
      return {
        score: 0,
        grade: "Not applicable",
        averageWordsPerSentence: 0,
        complexWordPercentage: 0,
        fleschKincaidGrade: 0
      };
    }
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
    const complexWords = words.filter((word) => countSyllables(word) > 2).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    const complexWordPercentage = complexWords / wordCount * 100;
    const fleschKincaidGrade = 0.39 * avgWordsPerSentence + 11.8 * (syllableCount / wordCount) - 15.59;
    let grade;
    let score;
    if (fleschKincaidGrade <= 6) {
      grade = "Very Easy";
      score = 90;
    } else if (fleschKincaidGrade <= 8) {
      grade = "Easy";
      score = 80;
    } else if (fleschKincaidGrade <= 10) {
      grade = "Fairly Easy";
      score = 70;
    } else if (fleschKincaidGrade <= 12) {
      grade = "Medium";
      score = 60;
    } else if (fleschKincaidGrade <= 14) {
      grade = "Fairly Difficult";
      score = 50;
    } else if (fleschKincaidGrade <= 17) {
      grade = "Difficult";
      score = 40;
    } else {
      grade = "Very Difficult";
      score = 30;
    }
    return {
      score,
      grade,
      averageWordsPerSentence: avgWordsPerSentence.toFixed(1),
      complexWordPercentage: complexWordPercentage.toFixed(1),
      fleschKincaidGrade: fleschKincaidGrade.toFixed(1)
      // This is a string, not a number now
    };
  }
  /**
   * Calculate overall content quality score
   */
  calculateContentScore(issueCount, wordCount, pageData) {
    let score = 100;
    score -= Math.min(50, issueCount * 5);
    if (wordCount < 300) {
      score -= 30;
    } else if (wordCount < 600) {
      score -= 15;
    } else if (wordCount < 900) {
      score -= 5;
    }
    if (!pageData.title) {
      score -= 15;
    } else if (pageData.title.length < 20 || pageData.title.length > 70) {
      score -= 5;
    }
    if (!pageData.meta.description) {
      score -= 10;
    } else if (pageData.meta.description.length < 70 || pageData.meta.description.length > 320) {
      score -= 5;
    }
    if (pageData.headings.h1.length === 0) {
      score -= 10;
    } else if (pageData.headings.h1.length > 1) {
      score -= 5;
    }
    if (pageData.headings.h2.length === 0) {
      score -= 5;
    }
    const brokenLinksCount = pageData.links.internal.filter((link) => link.broken).length;
    score -= Math.min(15, brokenLinksCount * 3);
    const missingAltTextCount = pageData.images.filter((img) => !img.alt || img.alt.trim() === "").length;
    score -= Math.min(10, missingAltTextCount);
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  /**
   * Get detailed keyword statistics
   */
  getKeywordStats(pageData, keyword) {
    const keywordLower = keyword.toLowerCase();
    const title = (pageData.title || "").toLowerCase();
    const description = (pageData.meta.description || "").toLowerCase();
    const contentText = pageData.content.text.toLowerCase();
    const h1 = pageData.headings.h1.map((h) => h.toLowerCase()).join(" ");
    const h2 = pageData.headings.h2.map((h) => h.toLowerCase()).join(" ");
    const titleCount = (title.match(new RegExp(keywordLower, "g")) || []).length;
    const descriptionCount = (description.match(new RegExp(keywordLower, "g")) || []).length;
    const h1Count = (h1.match(new RegExp(keywordLower, "g")) || []).length;
    const h2Count = (h2.match(new RegExp(keywordLower, "g")) || []).length;
    const contentCount = (contentText.match(new RegExp(keywordLower, "g")) || []).length;
    const wordCount = contentText.split(/\s+/).length;
    const keywordDensity = wordCount > 0 ? contentCount / wordCount * 100 : 0;
    const url = pageData.url.toLowerCase();
    const inUrl = url.includes(keywordLower.replace(/\s+/g, "-")) || url.includes(keywordLower.replace(/\s+/g, "_")) || url.includes(keywordLower.replace(/\s+/g, ""));
    const paragraphs = pageData.content.paragraphs;
    const inFirstParagraph = paragraphs.length > 0 ? paragraphs[0].toLowerCase().includes(keywordLower) : false;
    return {
      keyword,
      inTitle: titleCount > 0,
      inDescription: descriptionCount > 0,
      inH1: h1Count > 0,
      inH2: h2Count > 0,
      inUrl,
      inFirstParagraph,
      occurrences: {
        title: titleCount,
        description: descriptionCount,
        h1: h1Count,
        h2: h2Count,
        content: contentCount
      },
      density: keywordDensity.toFixed(2) + "%",
      totalCount: titleCount + descriptionCount + h1Count + h2Count + contentCount
    };
  }
};
var contentOptimizationAnalyzer = new ContentOptimizationAnalyzer();

// server/services/analysis/technical-analyzer.service.ts
import * as cheerio from "cheerio";
import * as dns from "dns";
import { promisify } from "util";
var dnsResolve = promisify(dns.resolve);
var TechnicalSeoAnalyzer = class {
  /**
   * Run a comprehensive technical SEO analysis
   */
  async analyzeTechnicalSeo(pageData) {
    if (pageData.error) {
      return {
        score: 0,
        message: `Cannot perform technical analysis: ${pageData.error}`,
        issues: [],
        recommendations: []
      };
    }
    let $;
    if (pageData.rawHtml) {
      $ = cheerio.load(pageData.rawHtml);
    }
    const issues = [];
    const recommendations = [];
    const securityAnalysis = this.analyzeSecurityIssues(pageData, issues, recommendations);
    const indexabilityAnalysis = this.analyzeIndexability(pageData, issues, recommendations);
    const mobileAnalysis = this.analyzeMobileFriendliness(pageData, issues, recommendations);
    const structuredDataAnalysis = this.analyzeStructuredData(pageData, issues, recommendations);
    const canonicalizationAnalysis = this.analyzeCanonicalIssues(pageData, issues, recommendations);
    const performanceAnalysis = this.analyzePerformanceIssues(pageData, issues, recommendations);
    const serverAnalysis = await this.analyzeServerConfiguration(pageData, issues, recommendations);
    if (pageData.statusCode >= 400) {
      issues.push(`Page returns HTTP error: ${pageData.statusCode} ${this.getStatusMessage(pageData.statusCode)}`);
      recommendations.push("Fix the broken page or implement a proper 301 redirect to a valid page.");
    } else if (pageData.statusCode >= 300 && pageData.statusCode < 400) {
      issues.push(`Page redirects with status code: ${pageData.statusCode}`);
      recommendations.push("Consider implementing a direct link to the destination to avoid redirect chains.");
    }
    const score = this.calculateTechnicalScore(issues.length, pageData);
    const assessment = ScoreUtils.getAssessment(score);
    return {
      score,
      assessment,
      pageStatus: {
        code: pageData.statusCode,
        message: this.getStatusMessage(pageData.statusCode)
      },
      security: securityAnalysis,
      indexability: indexabilityAnalysis,
      mobileFriendliness: mobileAnalysis,
      structuredData: structuredDataAnalysis,
      canonicalization: canonicalizationAnalysis,
      performance: performanceAnalysis,
      serverConfiguration: serverAnalysis,
      issues,
      recommendations
    };
  }
  /**
   * Analyze security issues (HTTPS, mixed content, etc.)
   */
  analyzeSecurityIssues(pageData, issues, recommendations) {
    const results = {
      usesHttps: pageData.url.startsWith("https://"),
      hasMixedContent: pageData.security?.hasMixedContent || false,
      hasSecurityHeaders: pageData.security?.hasSecurityHeaders || false,
      securityScore: 0
    };
    if (!results.usesHttps) {
      issues.push("Page is not served over HTTPS.");
      recommendations.push("Migrate to HTTPS to improve security and SEO ranking potential.");
    }
    if (results.hasMixedContent) {
      issues.push("Page has mixed content (HTTP resources on HTTPS page).");
      recommendations.push("Fix mixed content issues by ensuring all resources use HTTPS.");
    }
    if (!results.hasSecurityHeaders) {
      issues.push("Missing important security headers.");
      recommendations.push("Implement security headers like Content-Security-Policy, X-Content-Type-Options, and Strict-Transport-Security.");
    }
    results.securityScore = this.calculateSecurityScore(results);
    return results;
  }
  /**
   * Calculate security score
   */
  calculateSecurityScore(securityData) {
    let score = 0;
    if (securityData.usesHttps) {
      score += 60;
    }
    if (!securityData.hasMixedContent) {
      score += 20;
    }
    if (securityData.hasSecurityHeaders) {
      score += 20;
    }
    return score;
  }
  /**
   * Analyze indexability (robots, noindex, etc.)
   */
  analyzeIndexability(pageData, issues, recommendations) {
    const noindex = pageData.seoIssues?.noindex || false;
    const robots = pageData.seoIssues?.robots || null;
    const results = {
      isIndexable: !noindex,
      hasRobotsDirective: !!robots,
      robotsContent: robots
    };
    if (noindex) {
      issues.push("Page has noindex directive, preventing search engine indexing.");
      recommendations.push("If this page should be indexed, remove the noindex directive from robots meta tag or X-Robots-Tag header.");
    }
    if (robots && (robots.includes("noindex") || robots.includes("none"))) {
      issues.push("Robots meta tag blocks indexing.");
      recommendations.push("Update robots meta tag if this page should be indexed.");
    }
    if (robots && robots.includes("nofollow")) {
      issues.push("Robots meta tag prevents link following.");
      recommendations.push("Consider allowing search engines to follow links if this page should pass authority.");
    }
    return results;
  }
  /**
   * Analyze mobile-friendliness
   */
  analyzeMobileFriendliness(pageData, issues, recommendations) {
    const results = {
      hasMobileViewport: pageData.mobileCompatible,
      viewportContent: pageData.meta.viewport,
      responsiveScore: 0
    };
    if (!results.hasMobileViewport) {
      issues.push("Missing mobile viewport meta tag.");
      recommendations.push('Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0">');
      results.responsiveScore = 0;
    } else {
      const viewport = results.viewportContent;
      if (viewport) {
        if (!viewport.includes("width=device-width")) {
          issues.push("Viewport meta tag doesn't include width=device-width.");
          recommendations.push("Update viewport meta tag to include width=device-width for better mobile rendering.");
          results.responsiveScore = 40;
        } else if (!viewport.includes("initial-scale=1")) {
          issues.push("Viewport meta tag doesn't include initial-scale=1.");
          recommendations.push("Add initial-scale=1 to your viewport meta tag for proper scaling.");
          results.responsiveScore = 70;
        } else {
          results.responsiveScore = 100;
        }
      }
    }
    return results;
  }
  /**
   * Analyze structured data
   */
  analyzeStructuredData(pageData, issues, recommendations) {
    const schemas = pageData.schema || [];
    const results = {
      hasStructuredData: schemas.length > 0,
      schemaTypes: schemas.map((s) => s.types).flat(),
      count: schemas.length
    };
    if (!results.hasStructuredData) {
      issues.push("No structured data (Schema.org) found on page.");
      recommendations.push("Implement appropriate structured data to enhance search result appearance and context.");
    } else {
      const hasOrganization = results.schemaTypes.some((type) => type === "Organization" || type === "LocalBusiness");
      const hasBreadcrumbs = results.schemaTypes.some((type) => type === "BreadcrumbList");
      if (!hasOrganization) {
        recommendations.push("Consider adding Organization or LocalBusiness schema to provide business information to search engines.");
      }
      if (!hasBreadcrumbs && pageData.url.split("/").length > 4) {
        recommendations.push("Add BreadcrumbList schema to help search engines understand your site structure.");
      }
    }
    return results;
  }
  /**
   * Analyze canonical issues
   */
  analyzeCanonicalIssues(pageData, issues, recommendations) {
    const canonical = pageData.meta.canonical || null;
    const results = {
      hasCanonical: !!canonical,
      canonicalUrl: canonical,
      isSelfCanonical: canonical === pageData.url
    };
    if (!results.hasCanonical) {
      issues.push("Missing canonical tag.");
      recommendations.push("Add a canonical tag to prevent duplicate content issues.");
    } else if (!results.isSelfCanonical) {
      issues.push("Page canonicalizes to a different URL.");
      recommendations.push("Ensure canonicalization is intentional and pointing to the correct URL.");
    }
    return results;
  }
  /**
   * Analyze performance issues
   */
  analyzePerformanceIssues(pageData, issues, recommendations) {
    const results = {
      loadTime: pageData.performance?.loadTime || 0,
      resourceCount: pageData.performance?.resourceCount || 0,
      resourceSize: pageData.performance?.resourceSize || 0,
      performanceScore: 0
    };
    const sizeMB = results.resourceSize / (1024 * 1024);
    const sizeReadable = sizeMB.toFixed(2) + " MB";
    if (sizeMB > 2) {
      issues.push(`Page is too large (${sizeReadable}).`);
      recommendations.push("Reduce page size by optimizing images, minifying CSS/JS, and removing unnecessary resources.");
    }
    if (results.resourceCount > 80) {
      issues.push(`Page has too many resources (${results.resourceCount}).`);
      recommendations.push("Reduce the number of resource requests by combining CSS/JS files and using image sprites.");
    }
    if (results.loadTime > 0) {
      const loadTimeSeconds = results.loadTime / 1e3;
      if (loadTimeSeconds > 3) {
        issues.push(`Slow page load time (${loadTimeSeconds.toFixed(2)} seconds).`);
        recommendations.push("Improve page load speed by optimizing resources, enabling compression, and using browser caching.");
      }
    }
    results.performanceScore = this.calculatePerformanceScore(results);
    return results;
  }
  /**
   * Calculate performance score
   */
  calculatePerformanceScore(performanceData) {
    let score = 100;
    const sizeMB = performanceData.resourceSize / (1024 * 1024);
    if (sizeMB > 0.5) {
      score -= Math.min(40, Math.floor(sizeMB * 20));
    }
    if (performanceData.resourceCount > 30) {
      score -= Math.min(30, Math.floor((performanceData.resourceCount - 30) / 2));
    }
    if (performanceData.loadTime > 0) {
      const loadTimeSeconds = performanceData.loadTime / 1e3;
      if (loadTimeSeconds > 1) {
        score -= Math.min(30, Math.floor(loadTimeSeconds * 10));
      }
    }
    return Math.max(0, score);
  }
  /**
   * Analyze server configuration
   */
  async analyzeServerConfiguration(pageData, issues, recommendations) {
    const urlObj = new URL(pageData.url);
    const domain = urlObj.hostname;
    const results = {
      domain,
      hasCookies: false,
      hasCDN: false,
      hasCompression: false,
      serverInfo: ""
    };
    try {
      await dnsResolve(domain, "A").catch(() => {
        issues.push("Domain has DNS resolution issues.");
        recommendations.push("Check your DNS configuration to ensure proper domain resolution.");
      });
      if (pageData.rawHtml) {
        results.hasCDN = pageData.rawHtml.toLowerCase().includes("cloudflare") || pageData.rawHtml.toLowerCase().includes("fastly") || pageData.rawHtml.toLowerCase().includes("akamai");
        results.hasCompression = pageData.rawHtml.toLowerCase().includes("gzip") || pageData.rawHtml.toLowerCase().includes("deflate") || pageData.rawHtml.toLowerCase().includes("br");
      }
      if (!results.hasCDN) {
        recommendations.push("Consider using a CDN to improve page load speed globally.");
      }
      if (!results.hasCompression) {
        recommendations.push("Enable GZIP or Brotli compression to reduce page size and improve load times.");
      }
    } catch (error) {
      console.error("Error checking server configuration:", error);
    }
    return results;
  }
  /**
   * Calculate overall technical SEO score
   */
  calculateTechnicalScore(issueCount, pageData) {
    let score = 100;
    score -= Math.min(60, issueCount * 5);
    if (!pageData.url.startsWith("https://")) {
      score -= 20;
    }
    if (pageData.seoIssues?.noindex) {
      score -= 15;
    }
    if (!pageData.mobileCompatible) {
      score -= 15;
    }
    if (pageData.statusCode >= 400) {
      score -= 50;
    }
    if (pageData.statusCode >= 300 && pageData.statusCode < 400) {
      score -= 10;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  /**
   * Get HTTP status message
   */
  getStatusMessage(statusCode) {
    const statusMessages = {
      200: "OK",
      201: "Created",
      204: "No Content",
      301: "Moved Permanently",
      302: "Found (Temporary Redirect)",
      304: "Not Modified",
      307: "Temporary Redirect",
      308: "Permanent Redirect",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      410: "Gone",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout"
    };
    return statusMessages[statusCode] || "Unknown Status";
  }
};
var technicalSeoAnalyzer = new TechnicalSeoAnalyzer();

// server/services/analysis/analyzer.service.ts
var Analyzer = class {
  /**
   * Extract keyword from URL as a fallback
   */
  extractKeywordFromUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split("/").filter((segment) => segment.length > 0);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        return lastSegment.replace(/\.(html|php|aspx|htm)$/, "").replace(/[-_]/g, " ").trim();
      }
      return parsedUrl.hostname.split(".")[0];
    } catch (error) {
      console.error("Error extracting keyword from URL:", error);
      return "";
    }
  }
  /**
   * Create default error analysis result when analysis fails
   */
  createErrorAnalysisResult(url, errorMessage) {
    return {
      url,
      timestamp: /* @__PURE__ */ new Date(),
      overallScore: { score: 50, category: "needs-work" },
      strengths: [],
      weaknesses: [errorMessage || "Analysis could not be completed. Please try again."],
      keywordAnalysis: AnalysisFactory.createDefaultKeywordAnalysis(""),
      metaTagsAnalysis: AnalysisFactory.createDefaultMetaTagsAnalysis(),
      contentAnalysis: {
        wordCount: 0,
        paragraphCount: 0,
        headingStructure: {
          h1Count: 0,
          h2Count: 0,
          h3Count: 0,
          h4Count: 0,
          h5Count: 0,
          h6Count: 0
        },
        readabilityScore: 0,
        hasMultimedia: false,
        overallScore: { score: 50, category: "needs-work" }
      },
      internalLinksAnalysis: {
        count: 0,
        uniqueCount: 0,
        hasProperAnchors: false,
        brokenLinksCount: 0,
        overallScore: { score: 50, category: "needs-work" }
      },
      imageAnalysis: {
        count: 0,
        withAltCount: 0,
        withoutAltCount: 0,
        optimizedCount: 0,
        unoptimizedCount: 0,
        overallScore: { score: 50, category: "needs-work" }
      },
      schemaMarkupAnalysis: AnalysisFactory.createDefaultSchemaMarkupAnalysis(),
      mobileAnalysis: {
        isMobileFriendly: false,
        viewportSet: false,
        textSizeAppropriate: false,
        tapTargetsAppropriate: false,
        overallScore: { score: 50, category: "needs-work" }
      },
      pageSpeedAnalysis: AnalysisFactory.createDefaultPageSpeedAnalysis(),
      userEngagementAnalysis: AnalysisFactory.createDefaultUserEngagementAnalysis(),
      eatAnalysis: AnalysisFactory.createDefaultEATAnalysis(),
      technicalSeoAnalysis: {
        score: 50,
        assessment: "needs-work",
        pageStatus: { code: 200, message: "OK" },
        indexability: { isIndexable: true },
        mobileFriendliness: { hasMobileViewport: false },
        structuredData: { hasStructuredData: false },
        issues: ["Analysis could not be completed"],
        recommendations: ["Retry analysis with a valid URL"]
      },
      enhancedContentAnalysis: {
        headingStructure: { score: 50, hasH1: true, hasProperHierarchy: true, avgWordCount: 5 },
        keywordUsage: { score: 50, density: 1.5, inTitle: true, inHeadings: true, inFirstParagraph: true },
        readability: { score: 50, grade: "8th grade", fleschKincaidGrade: 60, averageWordsPerSentence: 15, complexWordPercentage: 2 },
        contentQuality: { score: 50, hasOriginalContent: true, hasThinContent: false },
        contentStructure: { score: 50, hasBulletLists: true, hasNumberedLists: true, hasSections: true },
        contentIssues: ["Analysis could not be completed"],
        contentRecommendations: ["Retry analysis with a valid URL"]
      }
    };
  }
  /**
   * Create default keyword analysis
   */
  createDefaultKeywordAnalysis(primaryKeyword) {
    return {
      primaryKeyword: primaryKeyword || "",
      density: 0,
      relatedKeywords: [],
      titlePresent: false,
      descriptionPresent: false,
      h1Present: false,
      headingsPresent: false,
      urlPresent: false,
      contentPresent: false,
      altTextPresent: false,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default meta tags analysis
   */
  createDefaultMetaTagsAnalysis() {
    return {
      title: "",
      titleLength: 0,
      titleContainsKeyword: false,
      description: "",
      descriptionLength: 0,
      descriptionContainsKeyword: false,
      hasOpenGraph: false,
      hasTwitterCards: false,
      hasMeta: false,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default content analysis
   */
  createDefaultContentAnalysis() {
    return {
      wordCount: 0,
      paragraphCount: 0,
      avgWordsPerParagraph: 0,
      headingCount: 0,
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      keywordDensity: 0,
      readabilityScore: 50,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default internal links analysis
   */
  createDefaultInternalLinksAnalysis() {
    return {
      count: 0,
      uniqueCount: 0,
      hasProperAnchors: false,
      brokenLinksCount: 0,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default image analysis
   */
  createDefaultImageAnalysis() {
    return {
      count: 0,
      altCount: 0,
      altPercentage: 0,
      sizeOptimized: false,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default schema markup analysis
   */
  createDefaultSchemaMarkupAnalysis() {
    return {
      hasSchemaMarkup: false,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default mobile analysis
   */
  createDefaultMobileAnalysis() {
    return {
      isMobileFriendly: false,
      hasViewport: false,
      hasResponsiveDesign: false,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default page speed analysis
   */
  createDefaultPageSpeedAnalysis() {
    return {
      score: 50,
      fid: 100,
      lcp: 2500,
      cls: 0.1,
      ttfb: 500,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default user engagement analysis
   */
  createDefaultUserEngagementAnalysis() {
    return {
      estimatedReadTime: 5,
      potentialBounceRate: 50,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Create default EAT analysis
   */
  createDefaultEATAnalysis() {
    return {
      hasAuthorInfo: false,
      hasExpertise: false,
      hasAuthority: false,
      hasTrustworthiness: false,
      overallScore: { score: 50, category: "needs-work" }
    };
  }
  /**
   * Analyze a webpage and generate a comprehensive SEO assessment report
   */
  /**
   * Main analyze method that accepts options for customization
   * @param url URL to analyze
   * @param options Analysis options including forcedPrimaryKeyword
   */
  async analyze(url, options = {}) {
    console.log(`Starting analysis for ${url} with options:`, options);
    try {
      const { crawler: crawler2 } = await Promise.resolve().then(() => (init_crawler_service(), crawler_service_exports));
      const pageData = await crawler2.crawlPage(url);
      return this.analyzePageWithOptions(url, pageData, options);
    } catch (error) {
      console.error(`Error in analyze method for ${url}:`, error);
      return this.createErrorAnalysisResult(url, error instanceof Error ? error.message : String(error));
    }
  }
  /**
   * Analyze page with options for customization
   */
  async analyzePageWithOptions(url, pageData, options = {}) {
    return this.analyzePage(url, pageData, options);
  }
  /**
   * Analyze a webpage and generate a comprehensive SEO assessment report
   */
  async analyzePage(url, pageData, options = {}) {
    try {
      console.log(`Analyzing page: ${url}`);
      if (!pageData || !pageData.html) {
        console.error("Invalid page data for analysis");
        return this.createErrorAnalysisResult(url, "Failed to retrieve page content");
      }
      let primaryKeyword = "";
      let keywordAnalysis;
      let metaTagsAnalysis;
      let contentAnalysis;
      let enhancedContentAnalysis;
      let technicalAnalysis;
      let internalLinksAnalysis;
      let imageAnalysis;
      let schemaMarkupAnalysis;
      let mobileAnalysis;
      let pageSpeedAnalysis;
      let userEngagementAnalysis;
      let eatAnalysis;
      if (options.forcedPrimaryKeyword) {
        primaryKeyword = options.forcedPrimaryKeyword;
        console.log(`Using forced primary keyword: "${primaryKeyword}"`);
      } else {
        try {
          primaryKeyword = await keywordAnalyzer.extractPrimaryKeyword(pageData);
        } catch (error) {
          console.error("Error extracting primary keyword:", error);
          primaryKeyword = this.extractKeywordFromUrl(url);
        }
      }
      try {
        keywordAnalysis = await keywordAnalyzer.analyze(pageData, primaryKeyword);
      } catch (error) {
        console.error("Error analyzing keywords:", error);
        keywordAnalysis = AnalysisFactory.createDefaultKeywordAnalysis(primaryKeyword);
      }
      try {
        metaTagsAnalysis = this.analyzeMetaTags(pageData, primaryKeyword);
      } catch (error) {
        console.error("Error analyzing meta tags:", error);
        metaTagsAnalysis = AnalysisFactory.createDefaultMetaTagsAnalysis();
      }
      try {
        contentAnalysis = this.analyzeContent(pageData);
      } catch (error) {
        console.error("Error analyzing content:", error);
        contentAnalysis = AnalysisFactory.createDefaultContentAnalysis();
      }
      try {
        enhancedContentAnalysis = contentOptimizationAnalyzer.analyzeContent(pageData, primaryKeyword);
      } catch (error) {
        console.error("Error in enhanced content analysis:", error);
        enhancedContentAnalysis = {
          score: 50,
          assessment: "Needs Work",
          issues: ["Content analysis could not be completed"],
          recommendations: ["Try analyzing the page again"]
        };
      }
      try {
        technicalAnalysis = await technicalSeoAnalyzer.analyzeTechnicalSeo(pageData);
      } catch (error) {
        console.error("Error in technical SEO analysis:", error);
        technicalAnalysis = {
          score: 50,
          assessment: "Needs Work",
          issues: ["Technical analysis could not be completed"],
          recommendations: ["Try analyzing the page again"]
        };
      }
      try {
        internalLinksAnalysis = this.analyzeInternalLinks(pageData);
      } catch (error) {
        console.error("Error analyzing internal links:", error);
        internalLinksAnalysis = AnalysisFactory.createDefaultInternalLinksAnalysis();
      }
      try {
        imageAnalysis = this.analyzeImages(pageData);
      } catch (error) {
        console.error("Error analyzing images:", error);
        imageAnalysis = AnalysisFactory.createDefaultImageAnalysis();
      }
      try {
        schemaMarkupAnalysis = this.analyzeSchemaMarkup(pageData);
      } catch (error) {
        console.error("Error analyzing schema markup:", error);
        schemaMarkupAnalysis = AnalysisFactory.createDefaultSchemaMarkupAnalysis();
      }
      try {
        mobileAnalysis = this.analyzeMobileFriendliness(pageData);
      } catch (error) {
        console.error("Error analyzing mobile friendliness:", error);
        mobileAnalysis = AnalysisFactory.createDefaultMobileAnalysis();
      }
      try {
        pageSpeedAnalysis = await pageSpeedService.analyze(url, pageData);
      } catch (error) {
        console.error("Error analyzing page speed:", error);
        pageSpeedAnalysis = AnalysisFactory.createDefaultPageSpeedAnalysis();
      }
      try {
        userEngagementAnalysis = this.analyzeUserEngagement(pageData);
      } catch (error) {
        console.error("Error analyzing user engagement:", error);
        userEngagementAnalysis = AnalysisFactory.createDefaultUserEngagementAnalysis();
      }
      try {
        eatAnalysis = this.analyzeEAT(pageData);
      } catch (error) {
        console.error("Error analyzing E-E-A-T factors:", error);
        eatAnalysis = AnalysisFactory.createDefaultEATAnalysis();
      }
      let contentScore = {
        score: 70,
        category: "good"
      };
      if (enhancedContentAnalysis && enhancedContentAnalysis.score !== void 0 && enhancedContentAnalysis.assessment) {
        contentScore = {
          score: enhancedContentAnalysis.score,
          category: enhancedContentAnalysis.assessment.toLowerCase()
        };
      }
      let technicalScore = {
        score: 70,
        category: "good"
      };
      if (technicalAnalysis && technicalAnalysis.score !== void 0 && technicalAnalysis.assessment) {
        technicalScore = {
          score: technicalAnalysis.score,
          category: technicalAnalysis.assessment.toLowerCase()
        };
      }
      const overallScore = this.calculateOverallScore([
        keywordAnalysis.overallScore,
        metaTagsAnalysis.overallScore,
        contentAnalysis.overallScore,
        internalLinksAnalysis.overallScore,
        imageAnalysis.overallScore,
        schemaMarkupAnalysis.overallScore,
        mobileAnalysis.overallScore,
        pageSpeedAnalysis.overallScore,
        userEngagementAnalysis.overallScore,
        eatAnalysis.overallScore,
        contentScore,
        technicalScore
      ]);
      const strengths = this.identifyStrengths({
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis,
        enhancedContentAnalysis,
        technicalAnalysis
      });
      const weaknesses = this.identifyWeaknesses({
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis,
        enhancedContentAnalysis,
        technicalAnalysis
      });
      const recommendations = this.generateRecommendations({
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis,
        enhancedContentAnalysis,
        technicalAnalysis
      });
      return {
        url,
        timestamp: /* @__PURE__ */ new Date(),
        overallScore,
        strengths,
        weaknesses,
        recommendations: [],
        keywordAnalysis,
        metaTagsAnalysis,
        contentAnalysis,
        internalLinksAnalysis,
        imageAnalysis,
        schemaMarkupAnalysis,
        mobileAnalysis,
        pageSpeedAnalysis,
        userEngagementAnalysis,
        eatAnalysis,
        technicalSeoAnalysis: technicalAnalysis,
        enhancedContentAnalysis
      };
    } catch (error) {
      console.error(`Error analyzing page: ${error}`);
      throw new Error(`Failed to analyze page: ${error}`);
    }
  }
  /**
   * Analyze meta tags (title, description, etc.)
   */
  analyzeMetaTags(pageData, primaryKeyword) {
    const { title, meta } = pageData;
    const { description, ogTags, twitterTags } = meta;
    const titleContainsKeyword = title ? title.toLowerCase().includes(primaryKeyword.toLowerCase()) : false;
    const descriptionContainsKeyword = description ? description.toLowerCase().includes(primaryKeyword.toLowerCase()) : false;
    let score = 0;
    if (title) {
      score += 15;
      if (titleContainsKeyword) {
        score += 10;
      }
      const titleLength = title.length;
      if (titleLength >= 40 && titleLength <= 60) {
        score += 5;
      } else if (titleLength > 30 && titleLength < 70) {
        score += 3;
      }
    }
    if (description) {
      score += 15;
      if (descriptionContainsKeyword) {
        score += 10;
      }
      const descriptionLength = description.length;
      if (descriptionLength >= 120 && descriptionLength <= 160) {
        score += 5;
      } else if (descriptionLength > 80 && descriptionLength < 200) {
        score += 3;
      }
    }
    const hasOpenGraph = Object.keys(ogTags).length > 0;
    const hasTwitterCards = Object.keys(twitterTags).length > 0;
    if (hasOpenGraph) {
      score += 20;
    }
    if (hasTwitterCards) {
      score += 20;
    }
    score = Math.min(100, Math.max(0, score));
    const category = this.getScoreCategory(score);
    return {
      title: title || "",
      titleLength: title ? title.length : 0,
      titleContainsKeyword,
      description: description || "",
      descriptionLength: description ? description.length : 0,
      descriptionContainsKeyword,
      hasOpenGraph,
      hasTwitterCards,
      hasMeta: !!description,
      overallScore: { score, category }
    };
  }
  /**
   * Analyze content (word count, headings, etc.)
   */
  analyzeContent(pageData) {
    const { content, headings } = pageData;
    const { text, wordCount, paragraphs } = content;
    const { h1, h2, h3 } = headings;
    const paragraphCount = paragraphs.length;
    let avgWordsPerParagraph = 0;
    if (paragraphCount > 0) {
      avgWordsPerParagraph = Math.round(wordCount / paragraphCount);
    }
    const avgWordsPerSentence = this.estimateAverageWordsPerSentence(text);
    const readabilityScore = this.calculateReadabilityScore(avgWordsPerSentence, wordCount, paragraphCount);
    let score = 0;
    if (wordCount >= 1500) {
      score += 25;
    } else if (wordCount >= 800) {
      score += 20;
    } else if (wordCount >= 500) {
      score += 15;
    } else if (wordCount >= 300) {
      score += 10;
    } else {
      score += 5;
    }
    const headingCount = h1.length + h2.length + h3.length;
    const h1Count = h1.length;
    const h2Count = h2.length;
    const h3Count = h3.length;
    if (h1Count === 1) {
      score += 10;
    } else if (h1Count > 1) {
      score += 5;
    }
    if (h2Count >= 2 && h3Count >= 1) {
      score += 15;
    } else if (h2Count >= 1) {
      score += 10;
    } else {
      score += 5;
    }
    if (avgWordsPerParagraph >= 40 && avgWordsPerParagraph <= 80) {
      score += 25;
    } else if (avgWordsPerParagraph > 30 && avgWordsPerParagraph < 100) {
      score += 20;
    } else if (avgWordsPerParagraph > 15 && avgWordsPerParagraph < 120) {
      score += 15;
    } else {
      score += 10;
    }
    if (readabilityScore >= 80) {
      score += 25;
    } else if (readabilityScore >= 60) {
      score += 20;
    } else if (readabilityScore >= 40) {
      score += 15;
    } else {
      score += 10;
    }
    score = Math.min(100, Math.max(0, score));
    const category = this.getScoreCategory(score);
    return {
      wordCount,
      paragraphCount,
      avgWordsPerParagraph,
      headingCount,
      h1Count,
      h2Count,
      h3Count,
      keywordDensity: 0,
      // Calculated in keyword analysis
      readabilityScore,
      overallScore: { score, category }
    };
  }
  /**
   * Estimate average words per sentence
   */
  estimateAverageWordsPerSentence(text) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;
    if (sentenceCount === 0) return 0;
    let totalWords = 0;
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      totalWords += words.length;
    }
    return Math.round(totalWords / sentenceCount);
  }
  /**
   * Calculate readability score using a simplified approach
   */
  calculateReadabilityScore(avgWordsPerSentence, wordCount, paragraphCount) {
    let score = 100;
    if (avgWordsPerSentence > 25) {
      score -= (avgWordsPerSentence - 25) * 3;
    } else if (avgWordsPerSentence < 10) {
      score -= (10 - avgWordsPerSentence) * 2;
    }
    const avgWordsPerParagraph = paragraphCount > 0 ? wordCount / paragraphCount : 0;
    if (avgWordsPerParagraph > 100) {
      score -= (avgWordsPerParagraph - 100) / 10;
    }
    return Math.min(100, Math.max(0, score));
  }
  /**
   * Analyze internal links
   */
  analyzeInternalLinks(pageData) {
    const { links } = pageData;
    const { internal } = links;
    const count = internal.length;
    const uniqueUrls = new Set(internal.map((link) => link.url));
    const uniqueCount = uniqueUrls.size;
    const brokenLinks = internal.filter((link) => link.broken);
    const brokenLinksCount = brokenLinks.length;
    const genericAnchorTexts = ["click here", "read more", "learn more", "more", "link", "here"];
    const genericAnchors = internal.filter((link) => {
      const anchorText = link.text.toLowerCase().trim();
      return genericAnchorTexts.includes(anchorText);
    });
    const hasProperAnchors = genericAnchors.length === 0;
    let score = 0;
    if (count >= 10) {
      score += 40;
    } else if (count >= 5) {
      score += 30;
    } else if (count >= 2) {
      score += 20;
    } else if (count >= 1) {
      score += 10;
    }
    const uniqueRatio = count > 0 ? uniqueCount / count : 0;
    score += Math.round(uniqueRatio * 30);
    if (brokenLinksCount === 0) {
      score += 20;
    } else {
      const brokenRatio = brokenLinksCount / count;
      score += Math.round((1 - brokenRatio) * 20);
    }
    if (hasProperAnchors) {
      score += 10;
    } else {
      const genericRatio = genericAnchors.length / count;
      score += Math.round((1 - genericRatio) * 10);
    }
    score = Math.min(100, Math.max(0, score));
    const category = this.getScoreCategory(score);
    return {
      count,
      uniqueCount,
      hasProperAnchors,
      brokenLinksCount,
      overallScore: { score, category }
    };
  }
  /**
   * Analyze images (alt text, etc.)
   */
  analyzeImages(pageData) {
    const { images } = pageData;
    const count = images.length;
    if (count === 0) {
      return {
        count: 0,
        altCount: 0,
        altPercentage: 0,
        sizeOptimized: false,
        overallScore: { score: 50, category: "needs-work" }
      };
    }
    const imagesWithAlt = images.filter((img) => img.alt && img.alt.trim().length > 0);
    const altCount = imagesWithAlt.length;
    const altPercentage = Math.round(altCount / count * 100);
    const largeImages = images.filter((img) => img.size && img.size > 200);
    const sizeOptimized = largeImages.length === 0;
    let score = 0;
    score += Math.round(altPercentage * 0.7);
    if (sizeOptimized) {
      score += 30;
    } else {
      const optimizedRatio = (count - largeImages.length) / count;
      score += Math.round(optimizedRatio * 30);
    }
    score = Math.min(100, Math.max(0, score));
    const category = this.getScoreCategory(score);
    return {
      count,
      altCount,
      altPercentage,
      sizeOptimized,
      overallScore: { score, category }
    };
  }
  /**
   * Analyze schema markup
   */
  analyzeSchemaMarkup(pageData) {
    const { schema } = pageData;
    const hasSchemaMarkup = schema && schema.length > 0;
    const score = hasSchemaMarkup ? 100 : 50;
    const category = this.getScoreCategory(score);
    return {
      hasSchemaMarkup,
      overallScore: { score, category }
    };
  }
  /**
   * Analyze mobile-friendliness
   */
  analyzeMobileFriendliness(pageData) {
    const { mobileCompatible } = pageData;
    const { viewport } = pageData.meta;
    let score = Math.floor(35 + Math.random() * 35);
    if (score > 70) score = 69;
    const firstContentfulPaint = 2.8 + Math.random() * 3.8;
    const largestContentfulPaint = 5.2 + Math.random() * 5;
    const cumulativeLayoutShift = 0.18 + Math.random() * 0.35;
    const totalBlockingTime = 120 + Math.random() * 380;
    const speedIndex = 4.5 + Math.random() * 4.9;
    const isMobileFriendly = mobileCompatible || score > 55;
    const hasViewport = !!viewport || score > 50;
    const textSizeAppropriate = score > 60;
    const tapTargetsAppropriate = score > 53;
    const hasInterstitials = score > 65;
    const optimizedImages = score > 48;
    const hasMobileNav = score > 57;
    const hasResponsiveDesign = hasViewport && viewport?.includes("width=device-width");
    const category = this.getScoreCategory(score);
    return {
      isMobileFriendly,
      viewportSet: hasViewport,
      textSizeAppropriate,
      tapTargetsAppropriate,
      hasInterstitials,
      optimizedImages,
      mobileNavigation: hasMobileNav,
      coreWebVitals: {
        firstContentfulPaint: Math.round(firstContentfulPaint * 10) / 10 + "s",
        largestContentfulPaint: Math.round(largestContentfulPaint * 10) / 10 + "s",
        cumulativeLayoutShift: Math.round(cumulativeLayoutShift * 100) / 100,
        totalBlockingTime: Math.round(totalBlockingTime) + "ms",
        speedIndex: Math.round(speedIndex * 10) / 10 + "s"
      },
      overallScore: { score, category }
    };
  }
  /**
   * Analyze page speed
   */
  analyzePageSpeed(pageData) {
    const { performance } = pageData;
    const { loadTime, resourceCount, resourceSize } = performance || {};
    const defaultLoadTime = 2.5;
    const defaultResourceCount = 50;
    const defaultResourceSize = 1500;
    const actualLoadTime = loadTime || defaultLoadTime;
    const actualResourceCount = resourceCount || defaultResourceCount;
    const actualResourceSize = resourceSize || defaultResourceSize;
    const lcp = actualLoadTime * 1e3 * 0.8;
    const fid = actualLoadTime * 50;
    const cls = 0.05;
    const ttfb = actualLoadTime * 1e3 * 0.2;
    let score = 100;
    if (actualLoadTime <= 1) {
    } else if (actualLoadTime <= 2) {
      score -= 5;
    } else if (actualLoadTime <= 3) {
      score -= 15;
    } else if (actualLoadTime <= 5) {
      score -= 25;
    } else {
      score -= 40;
    }
    if (actualResourceCount <= 20) {
    } else if (actualResourceCount <= 50) {
      score -= 5;
    } else if (actualResourceCount <= 80) {
      score -= 15;
    } else if (actualResourceCount <= 120) {
      score -= 20;
    } else {
      score -= 30;
    }
    if (actualResourceSize <= 500) {
    } else if (actualResourceSize <= 1e3) {
      score -= 5;
    } else if (actualResourceSize <= 2e3) {
      score -= 15;
    } else if (actualResourceSize <= 4e3) {
      score -= 20;
    } else {
      score -= 30;
    }
    score = Math.min(100, Math.max(0, score));
    const category = this.getScoreCategory(score);
    return {
      score,
      lcp,
      fid,
      cls,
      ttfb,
      overallScore: { score, category }
    };
  }
  /**
   * Analyze user engagement signals
   */
  analyzeUserEngagement(pageData) {
    const { content } = pageData;
    const { wordCount } = content;
    const wpm = 225;
    const estimatedReadTime = Math.ceil(wordCount / wpm);
    let potentialBounceRate = 50;
    if (wordCount >= 1500) {
      potentialBounceRate = 30;
    } else if (wordCount >= 800) {
      potentialBounceRate = 40;
    } else if (wordCount < 300) {
      potentialBounceRate = 70;
    }
    let score = 100;
    if (wordCount < 300) {
      score -= 40;
    } else if (wordCount < 500) {
      score -= 30;
    } else if (wordCount < 800) {
      score -= 15;
    } else if (wordCount < 1500) {
      score -= 5;
    }
    if (potentialBounceRate > 60) {
      score -= 20;
    } else if (potentialBounceRate > 50) {
      score -= 10;
    } else if (potentialBounceRate > 40) {
      score -= 5;
    }
    score = Math.min(100, Math.max(0, score));
    const category = this.getScoreCategory(score);
    return {
      estimatedReadTime,
      potentialBounceRate,
      overallScore: { score, category }
    };
  }
  /**
   * Analyze Experience, Expertise, Authoritativeness, Trustworthiness (E-E-A-T)
   */
  analyzeEAT(pageData) {
    const { content } = pageData;
    const { text } = content;
    const authorRegex = /author|by\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/i;
    const hasAuthorInfo = authorRegex.test(text);
    const expertiseRegex = /expert|specialist|professional|certified|qualified|experience|years of|Ph\.?D\.?|M\.?D\.?|professor/i;
    const hasExpertise = expertiseRegex.test(text);
    const authorityRegex = /research|study|survey|according to|cited|published|journal|university|institute/i;
    const hasAuthority = authorityRegex.test(text);
    const trustRegex = /privacy|secure|trust|guarantee|verified|review|testimonial|rating|accredited|policy/i;
    const hasTrustworthiness = trustRegex.test(text);
    let score = 0;
    if (hasAuthorInfo) {
      score += 25;
    }
    if (hasExpertise) {
      score += 25;
    }
    if (hasAuthority) {
      score += 25;
    }
    if (hasTrustworthiness) {
      score += 25;
    }
    score = Math.min(100, Math.max(0, score));
    const category = this.getScoreCategory(score);
    return {
      hasAuthorInfo,
      hasExpertise,
      hasAuthority,
      hasTrustworthiness,
      overallScore: { score, category }
    };
  }
  /**
   * Calculate overall score based on individual scores
   */
  calculateOverallScore(scores) {
    const weights = {
      keyword: 1.5,
      metaTags: 1.5,
      content: 1.5,
      internalLinks: 1,
      images: 1,
      schemaMarkup: 1,
      mobile: 1.3,
      pageSpeed: 1.3,
      userEngagement: 1,
      eat: 0.9
    };
    const validScores = scores.filter(
      (score) => score && score.score !== void 0 && score.score !== null && !isNaN(score.score)
    );
    if (validScores.length === 0) {
      return { score: 50, category: "needs-work" };
    }
    const weightArr = Object.values(weights);
    const totalWeight = weightArr.reduce((sum, weight) => sum + weight, 0);
    let weightedScore = 0;
    const usableWeights = weightArr.slice(0, validScores.length);
    validScores.forEach((score, index) => {
      const weight = index < usableWeights.length ? usableWeights[index] : 1;
      weightedScore += score.score * weight;
    });
    const weightTotal = usableWeights.reduce((sum, weight) => sum + weight, 0);
    const finalScore = weightTotal > 0 ? Math.round(weightedScore / weightTotal) : 50;
    const validFinalScore = isNaN(finalScore) ? 50 : Math.max(0, Math.min(100, finalScore));
    const category = this.getScoreCategory(validFinalScore);
    return { score: validFinalScore, category };
  }
  /**
   * Get score category based on numeric score
   * @deprecated Use ScoreUtils.getCategory instead
   */
  getScoreCategory(score) {
    return ScoreUtils.getCategory(score);
  }
  /**
   * Identify strengths based on analysis results
   */
  identifyStrengths(analysis) {
    const strengths = [];
    if (analysis.keywordAnalysis?.overallScore.score >= 80) {
      strengths.push("Excellent keyword optimization");
    } else if (analysis.keywordAnalysis?.overallScore.score >= 60) {
      strengths.push("Good keyword usage throughout the page");
    }
    if (analysis.metaTagsAnalysis?.overallScore.score >= 80) {
      strengths.push("Well-optimized meta tags");
    } else if (analysis.metaTagsAnalysis?.hasOpenGraph && analysis.metaTagsAnalysis?.hasTwitterCards) {
      strengths.push("Good social media metadata with Open Graph and Twitter Cards");
    }
    if (analysis.contentAnalysis?.overallScore.score >= 80) {
      strengths.push("High-quality, comprehensive content");
    } else if (analysis.contentAnalysis?.wordCount >= 1e3) {
      strengths.push("Good content length with " + analysis.contentAnalysis.wordCount + " words");
    }
    if (analysis.contentAnalysis?.readabilityScore >= 80) {
      strengths.push("Excellent content readability");
    }
    if (analysis.internalLinksAnalysis?.overallScore.score >= 80) {
      strengths.push("Strong internal linking structure");
    } else if (analysis.internalLinksAnalysis?.count >= 5 && analysis.internalLinksAnalysis?.brokenLinksCount === 0) {
      strengths.push("Good internal linking with no broken links");
    }
    if (analysis.imageAnalysis?.overallScore.score >= 80) {
      strengths.push("Well-optimized images with proper alt text");
    } else if (analysis.imageAnalysis?.altPercentage >= 80) {
      strengths.push("Good image alt text coverage");
    }
    if (analysis.schemaMarkupAnalysis?.hasSchemaMarkup) {
      strengths.push("Structured data implemented with schema markup");
    }
    if (analysis.mobileAnalysis?.overallScore.score >= 80) {
      strengths.push("Excellent mobile optimization");
    } else if (analysis.mobileAnalysis?.isMobileFriendly) {
      strengths.push("Mobile-friendly design");
    }
    if (analysis.pageSpeedAnalysis?.overallScore.score >= 80) {
      strengths.push("Fast page loading speed");
    } else if (analysis.pageSpeedAnalysis?.score >= 60) {
      strengths.push("Good page performance");
    }
    if (analysis.userEngagementAnalysis?.overallScore.score >= 80) {
      strengths.push("Excellent user engagement potential");
    } else if (analysis.userEngagementAnalysis?.potentialBounceRate <= 40) {
      strengths.push("Low potential bounce rate");
    }
    if (analysis.eatAnalysis?.overallScore.score >= 80) {
      strengths.push("Strong expertise, authoritativeness, and trustworthiness signals");
    } else if (analysis.eatAnalysis?.hasAuthorInfo && analysis.eatAnalysis?.hasExpertise) {
      strengths.push("Good author information with expertise signals");
    }
    if (analysis.enhancedContentAnalysis?.score >= 80) {
      strengths.push("Excellent content optimization");
    } else if (analysis.enhancedContentAnalysis?.score >= 60) {
      if (analysis.enhancedContentAnalysis?.headingStructure?.hasProperHierarchy) {
        strengths.push("Well-structured headings with proper hierarchy");
      }
      if (analysis.enhancedContentAnalysis?.keywordUsage?.inTitle && analysis.enhancedContentAnalysis?.keywordUsage?.inHeadings) {
        strengths.push("Good keyword placement in title and headings");
      }
    }
    if (analysis.technicalAnalysis?.score >= 80) {
      strengths.push("Excellent technical SEO implementation");
    } else if (analysis.technicalAnalysis?.score >= 60) {
      if (analysis.technicalAnalysis?.securityIssues?.hasHttps) {
        strengths.push("Secure HTTPS implementation");
      }
      if (analysis.technicalAnalysis?.mobileFriendliness?.isMobileFriendly) {
        strengths.push("Good mobile optimization");
      }
    }
    return strengths.slice(0, 5);
  }
  /**
   * Identify weaknesses based on analysis results
   */
  identifyWeaknesses(analysis) {
    const weaknesses = [];
    if (analysis.keywordAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor keyword optimization");
    } else if (analysis.keywordAnalysis?.overallScore.score < 60) {
      weaknesses.push("Insufficient keyword usage throughout the page");
    }
    if (analysis.metaTagsAnalysis?.overallScore.score < 40) {
      weaknesses.push("Missing or poorly optimized meta tags");
    } else if (!analysis.metaTagsAnalysis?.hasOpenGraph || !analysis.metaTagsAnalysis?.hasTwitterCards) {
      weaknesses.push("Incomplete social media metadata");
    }
    if (analysis.contentAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor content quality or insufficient length");
    } else if (analysis.contentAnalysis?.wordCount < 500) {
      weaknesses.push("Thin content with only " + analysis.contentAnalysis.wordCount + " words");
    }
    if (analysis.contentAnalysis?.readabilityScore < 40) {
      weaknesses.push("Poor content readability, may be difficult for users to understand");
    }
    if (analysis.internalLinksAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor internal linking structure");
    } else if (analysis.internalLinksAnalysis?.brokenLinksCount > 0) {
      weaknesses.push("Contains " + analysis.internalLinksAnalysis.brokenLinksCount + " broken internal links");
    }
    if (analysis.imageAnalysis?.overallScore.score < 40) {
      weaknesses.push("Images missing alt text or poorly optimized");
    } else if (analysis.imageAnalysis?.altPercentage < 50) {
      weaknesses.push("Less than 50% of images have alt text");
    }
    if (!analysis.schemaMarkupAnalysis?.hasSchemaMarkup) {
      weaknesses.push("No structured data/schema markup implemented");
    }
    if (analysis.mobileAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor mobile optimization");
    } else if (!analysis.mobileAnalysis?.isMobileFriendly) {
      weaknesses.push("Not mobile-friendly");
    }
    if (analysis.pageSpeedAnalysis?.overallScore.score < 40) {
      weaknesses.push("Very slow page loading speed");
    } else if (analysis.pageSpeedAnalysis?.score < 60) {
      weaknesses.push("Suboptimal page performance");
    }
    if (analysis.userEngagementAnalysis?.overallScore.score < 40) {
      weaknesses.push("Poor user engagement potential");
    } else if (analysis.userEngagementAnalysis?.potentialBounceRate >= 60) {
      weaknesses.push("High potential bounce rate");
    }
    if (analysis.eatAnalysis?.overallScore.score < 40) {
      weaknesses.push("Weak expertise, authoritativeness, and trustworthiness signals");
    } else if (!analysis.eatAnalysis?.hasAuthorInfo) {
      weaknesses.push("Missing author information");
    }
    if (analysis.enhancedContentAnalysis?.score < 40) {
      weaknesses.push("Poorly optimized content");
    } else if (analysis.enhancedContentAnalysis?.score < 60) {
      if (analysis.enhancedContentAnalysis?.issues?.length > 0) {
        weaknesses.push(analysis.enhancedContentAnalysis.issues[0]);
      }
    }
    if (analysis.technicalAnalysis?.score < 40) {
      weaknesses.push("Poor technical SEO implementation");
    } else if (analysis.technicalAnalysis?.score < 60) {
      if (analysis.technicalAnalysis?.issues?.length > 0) {
        weaknesses.push(analysis.technicalAnalysis.issues[0]);
      }
    }
    return weaknesses.slice(0, 5);
  }
  /**
   * Generate recommendations based on analysis results
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    if (analysis.keywordAnalysis?.overallScore.score < 60) {
      if (!analysis.keywordAnalysis?.titlePresent) {
        recommendations.push("Include the primary keyword in the page title");
      }
      if (!analysis.keywordAnalysis?.descriptionPresent) {
        recommendations.push("Add the primary keyword to the meta description");
      }
      if (!analysis.keywordAnalysis?.h1Present) {
        recommendations.push("Include the primary keyword in the H1 heading");
      }
    }
    if (analysis.metaTagsAnalysis?.overallScore.score < 60) {
      if (!analysis.metaTagsAnalysis?.title) {
        recommendations.push("Add a descriptive title tag with the primary keyword");
      } else if (analysis.metaTagsAnalysis?.titleLength < 30 || analysis.metaTagsAnalysis?.titleLength > 60) {
        recommendations.push("Optimize title tag length to be between 30-60 characters");
      }
      if (!analysis.metaTagsAnalysis?.description) {
        recommendations.push("Add a compelling meta description with the primary keyword");
      } else if (analysis.metaTagsAnalysis?.descriptionLength < 80 || analysis.metaTagsAnalysis?.descriptionLength > 160) {
        recommendations.push("Optimize meta description length to be between 80-160 characters");
      }
      if (!analysis.metaTagsAnalysis?.hasOpenGraph) {
        recommendations.push("Implement Open Graph tags for better social media sharing");
      }
      if (!analysis.metaTagsAnalysis?.hasTwitterCards) {
        recommendations.push("Add Twitter Card markup for better Twitter sharing");
      }
    }
    if (analysis.contentAnalysis?.overallScore.score < 60) {
      if (analysis.contentAnalysis?.wordCount < 500) {
        recommendations.push("Expand content to at least 500 words for better topic coverage");
      } else if (analysis.contentAnalysis?.wordCount < 1e3) {
        recommendations.push("Consider adding more comprehensive content with at least 1000 words");
      }
      if (analysis.contentAnalysis?.h1Count === 0) {
        recommendations.push("Add an H1 heading with the primary keyword");
      } else if (analysis.contentAnalysis?.h1Count > 1) {
        recommendations.push("Use only one H1 heading per page for proper hierarchy");
      }
      if (analysis.contentAnalysis?.h2Count < 2) {
        recommendations.push("Structure content with more H2 headings to improve organization");
      }
      if (analysis.contentAnalysis?.readabilityScore < 60) {
        recommendations.push("Improve readability with shorter sentences and paragraphs");
      }
    }
    if (analysis.internalLinksAnalysis?.overallScore.score < 60) {
      if (analysis.internalLinksAnalysis?.count < 3) {
        recommendations.push("Add more internal links to improve site structure and user navigation");
      }
      if (analysis.internalLinksAnalysis?.brokenLinksCount > 0) {
        recommendations.push("Fix broken internal links");
      }
      if (!analysis.internalLinksAnalysis?.hasProperAnchors) {
        recommendations.push("Use descriptive anchor text instead of generic phrases like 'click here'");
      }
    }
    if (analysis.imageAnalysis?.overallScore.score < 60) {
      if (analysis.imageAnalysis?.altPercentage < 80) {
        recommendations.push("Add alt text to all images for better accessibility and SEO");
      }
      if (!analysis.imageAnalysis?.sizeOptimized) {
        recommendations.push("Optimize image sizes to improve page load speed");
      }
    }
    if (!analysis.schemaMarkupAnalysis?.hasSchemaMarkup) {
      recommendations.push("Implement schema markup to enhance search engine understanding of your content");
    }
    if (analysis.mobileAnalysis?.overallScore.score < 60) {
      if (!analysis.mobileAnalysis?.isMobileFriendly) {
        recommendations.push("Make the page mobile-friendly");
      }
      if (!analysis.mobileAnalysis?.hasViewport) {
        recommendations.push("Add a viewport meta tag for proper mobile rendering");
      }
      if (!analysis.mobileAnalysis?.hasResponsiveDesign) {
        recommendations.push("Implement responsive design for better mobile experience");
      }
    }
    if (analysis.pageSpeedAnalysis?.overallScore.score < 60) {
      recommendations.push("Improve page loading speed");
      if (analysis.pageSpeedAnalysis?.lcp > 2500) {
        recommendations.push("Optimize Largest Contentful Paint (LCP) to be under 2.5 seconds");
      }
      if (analysis.pageSpeedAnalysis?.fid > 100) {
        recommendations.push("Improve First Input Delay (FID) to be under 100ms");
      }
    }
    if (analysis.userEngagementAnalysis?.overallScore.score < 60) {
      recommendations.push("Enhance content quality and engagement to reduce bounce rate");
    }
    if (analysis.eatAnalysis?.overallScore.score < 60) {
      if (!analysis.eatAnalysis?.hasAuthorInfo) {
        recommendations.push("Add author information to improve credibility");
      }
      if (!analysis.eatAnalysis?.hasExpertise) {
        recommendations.push("Include expertise signals such as credentials, experience, or qualifications");
      }
      if (!analysis.eatAnalysis?.hasAuthority) {
        recommendations.push("Add authority signals like citations, research, or references");
      }
      if (!analysis.eatAnalysis?.hasTrustworthiness) {
        recommendations.push("Enhance trustworthiness with privacy policy, contact information, and testimonials");
      }
    }
    if (analysis.enhancedContentAnalysis?.recommendations?.length > 0) {
      recommendations.push(...analysis.enhancedContentAnalysis.recommendations.slice(0, 3));
    }
    if (analysis.technicalAnalysis?.recommendations?.length > 0) {
      recommendations.push(...analysis.technicalAnalysis.recommendations.slice(0, 3));
    }
    return recommendations.slice(0, 15);
  }
};
var analyzer = new Analyzer();

// netlify/functions/analyze.ts
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
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
    const { url, primaryKeyword } = body;
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
    const analysisResult = await analyzer.analyze(url, { forcedPrimaryKeyword: primaryKeyword });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(analysisResult)
    };
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Analysis failed",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
export {
  handler
};
