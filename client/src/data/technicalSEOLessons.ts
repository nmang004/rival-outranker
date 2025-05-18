import { LearningLesson } from "@/types/learningTypes";

export const technicalSEOLessons: LearningLesson[] = [
  {
    id: 401,
    moduleId: 4,
    title: "Technical SEO Fundamentals",
    description: "Learn the core technical elements that impact your website's search visibility and performance.",
    content: `<h2>Technical SEO Fundamentals</h2>
      <p>Technical SEO focuses on improving the technical aspects of a website to help search engines crawl, index, and render your content more effectively. While content and backlinks often get the spotlight, technical SEO creates the foundation that allows your site to rank well.</p>
      
      <h3>Why Technical SEO Matters</h3>
      <p>Technical SEO is critical for several reasons:</p>
      <ul>
        <li><strong>Crawlability:</strong> Ensures search engines can discover and access all your content</li>
        <li><strong>Indexability:</strong> Helps search engines properly store and organize your content</li>
        <li><strong>Renderability:</strong> Ensures search engines can properly interpret your JavaScript, CSS, and HTML</li>
        <li><strong>User Experience:</strong> Most technical factors impact user experience, which is a ranking factor</li>
        <li><strong>Mobile Experience:</strong> Technical optimization for mobile devices is essential for rankings</li>
        <li><strong>Core Web Vitals:</strong> Performance metrics directly affect search rankings</li>
      </ul>
      
      <h3>The Technical SEO Framework</h3>
      <p>Technical SEO can be organized into several key categories:</p>
      
      <div class="technical-framework" style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0;">
        <div style="flex: 1; min-width: 280px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Crawl Optimization</h4>
          <ul>
            <li>XML sitemaps</li>
            <li>Robots.txt configuration</li>
            <li>URL structure</li>
            <li>Internal linking</li>
            <li>Crawl budget management</li>
          </ul>
        </div>
        
        <div style="flex: 1; min-width: 280px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Indexation Control</h4>
          <ul>
            <li>Canonical tags</li>
            <li>Meta robots directives</li>
            <li>HTTP status codes</li>
            <li>Hreflang implementation</li>
            <li>Pagination handling</li>
          </ul>
        </div>
        
        <div style="flex: 1; min-width: 280px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Performance Optimization</h4>
          <ul>
            <li>Page speed improvement</li>
            <li>Core Web Vitals</li>
            <li>Mobile optimization</li>
            <li>Server response time</li>
            <li>Resource optimization</li>
          </ul>
        </div>
        
        <div style="flex: 1; min-width: 280px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h4 style="margin-top: 0; color: #3366cc;">Security & Infrastructure</h4>
          <ul>
            <li>HTTPS implementation</li>
            <li>Server configuration</li>
            <li>Host management</li>
            <li>JavaScript optimization</li>
            <li>Structured data markup</li>
          </ul>
        </div>
      </div>
      
      <h3>Crawlability: Helping Search Engines Discover Your Content</h3>
      <p>Search engines use bots (crawlers) to discover and navigate websites. Optimizing for crawlability ensures these bots can efficiently access your content.</p>
      
      <h4>XML Sitemaps</h4>
      <p>An XML sitemap acts as a roadmap for search engines, listing all important pages on your site.</p>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;?xml version="1.0" encoding="UTF-8"?&gt;<br>
        &lt;urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"&gt;<br>
        &nbsp;&nbsp;&lt;url&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;loc&gt;https://example.com/&lt;/loc&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;lastmod&gt;2025-01-01&lt;/lastmod&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;changefreq&gt;monthly&lt;/changefreq&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;priority&gt;1.0&lt;/priority&gt;<br>
        &nbsp;&nbsp;&lt;/url&gt;<br>
        &lt;/urlset&gt;
      </div>
      
      <p>Best practices for XML sitemaps:</p>
      <ul>
        <li>Include all important, canonical URLs</li>
        <li>Exclude non-indexed, redirected, or low-value pages</li>
        <li>Keep sitemaps under 50,000 URLs and 50MB</li>
        <li>Use sitemap index files for larger sites</li>
        <li>Update sitemaps when content changes</li>
        <li>Submit sitemaps to Google Search Console and Bing Webmaster Tools</li>
      </ul>
      
      <h4>Robots.txt</h4>
      <p>The robots.txt file provides instructions to search engine crawlers about which parts of your site should or shouldn't be crawled.</p>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        User-agent: *<br>
        Disallow: /admin/<br>
        Disallow: /private/<br>
        Allow: /<br>
        <br>
        Sitemap: https://example.com/sitemap.xml
      </div>
      
      <p>Best practices for robots.txt:</p>
      <ul>
        <li>Place the file in the root directory</li>
        <li>Only block content you don't want indexed</li>
        <li>Include sitemap location</li>
        <li>Be careful with wildcards and patterns</li>
        <li>Test using Google Search Console's robots.txt tester</li>
        <li>Don't use robots.txt for privacy or security (it's publicly accessible)</li>
      </ul>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">Common Mistake</h4>
        <p>Never use robots.txt to hide important pages from search engines if you want them indexed. While robots.txt blocks crawling, it doesn't prevent indexing if Google knows about the URL from other sources like links.</p>
      </div>
      
      <h4>URL Structure</h4>
      <p>Well-structured URLs improve crawlability and provide context to search engines:</p>
      <ul>
        <li><strong>Use HTTPS</strong> - Secure protocol is a ranking factor</li>
        <li><strong>Keep URLs short</strong> - Shorter URLs are easier to crawl and index</li>
        <li><strong>Use descriptive keywords</strong> - Help indicate content topic</li>
        <li><strong>Follow logical hierarchy</strong> - Organize by category/subcategory</li>
        <li><strong>Use hyphens as separators</strong> - Not underscores or spaces</li>
        <li><strong>Avoid parameters when possible</strong> - Complex URLs can cause indexing issues</li>
        <li><strong>Be consistent with trailing slashes</strong> - Pick one format and stick with it</li>
      </ul>
      
      <h4>Internal Linking</h4>
      <p>Internal links create pathways for search engines to discover content and establish hierarchical relationships:</p>
      <ul>
        <li>Create a logical site structure</li>
        <li>Link to important pages from your homepage</li>
        <li>Use descriptive anchor text</li>
        <li>Ensure no page is more than 3-4 clicks from homepage</li>
        <li>Fix broken internal links</li>
        <li>Use breadcrumb navigation</li>
        <li>Include internal links within content</li>
      </ul>
      
      <h3>Indexability: Controlling How Search Engines Store Your Content</h3>
      
      <h4>Canonical Tags</h4>
      <p>The canonical tag helps manage duplicate content by specifying the preferred version of a page.</p>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;link rel="canonical" href="https://example.com/preferred-page" /&gt;
      </div>
      
      <p>When to use canonical tags:</p>
      <ul>
        <li>Different URL parameters (sorting, filtering)</li>
        <li>HTTP vs HTTPS versions</li>
        <li>WWW vs non-WWW versions</li>
        <li>Paginated content</li>
        <li>Printed versions of pages</li>
        <li>Similar products with slight variations</li>
      </ul>
      
      <h4>Meta Robots Directives</h4>
      <p>Meta robots tags provide page-level instructions to search engines:</p>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;meta name="robots" content="noindex, nofollow" /&gt;
      </div>
      
      <p>Common directives:</p>
      <ul>
        <li><strong>index/noindex</strong> - Allow/prevent indexing of the page</li>
        <li><strong>follow/nofollow</strong> - Allow/prevent following links on the page</li>
        <li><strong>noarchive</strong> - Prevent storing cached versions</li>
        <li><strong>nosnippet</strong> - Prevent displaying snippets in search results</li>
        <li><strong>max-snippet:[number]</strong> - Specify maximum snippet length</li>
        <li><strong>unavailable_after:[date]</strong> - Stop showing in results after date</li>
      </ul>
      
      <h4>HTTP Status Codes</h4>
      <p>Status codes tell search engines how to handle pages:</p>
      
      <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; text-align: left;">Status Code</th>
          <th style="padding: 10px; text-align: left;">Meaning</th>
          <th style="padding: 10px; text-align: left;">SEO Impact</th>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>200 OK</strong></td>
          <td style="padding: 10px;">Page loaded successfully</td>
          <td style="padding: 10px;">Page is accessible and can be indexed</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>301 Moved Permanently</strong></td>
          <td style="padding: 10px;">Permanent redirect</td>
          <td style="padding: 10px;">Passes most link equity to new URL</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>302 Found</strong></td>
          <td style="padding: 10px;">Temporary redirect</td>
          <td style="padding: 10px;">Passes less link equity than 301s</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>404 Not Found</strong></td>
          <td style="padding: 10px;">Page doesn't exist</td>
          <td style="padding: 10px;">Removed from index after repeated crawls</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>410 Gone</strong></td>
          <td style="padding: 10px;">Page permanently removed</td>
          <td style="padding: 10px;">Removed from index faster than 404s</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>500 Server Error</strong></td>
          <td style="padding: 10px;">Server-side error</td>
          <td style="padding: 10px;">Can lead to deindexing if persistent</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>503 Service Unavailable</strong></td>
          <td style="padding: 10px;">Server temporarily unavailable</td>
          <td style="padding: 10px;">Tells crawlers to come back later</td>
        </tr>
      </table>
      
      <h3>Performance: Optimizing for Speed and User Experience</h3>
      <p>Site performance directly impacts both user experience and search rankings, particularly through Core Web Vitals.</p>
      
      <h4>Core Web Vitals</h4>
      <p>These user experience metrics are official Google ranking factors:</p>
      
      <div class="web-vitals" style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
        <div style="flex: 1; min-width: 280px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h5 style="margin-top: 0; color: #3366cc;">Largest Contentful Paint (LCP)</h5>
          <p><strong>Measures:</strong> Loading performance</p>
          <p><strong>Good score:</strong> 2.5 seconds or faster</p>
          <p><strong>Improvement tactics:</strong> 
            <ul>
              <li>Optimize server response time</li>
              <li>Remove render-blocking resources</li>
              <li>Optimize images and fonts</li>
              <li>Implement caching</li>
            </ul>
          </p>
        </div>
        
        <div style="flex: 1; min-width: 280px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h5 style="margin-top: 0; color: #3366cc;">First Input Delay (FID)</h5>
          <p><strong>Measures:</strong> Interactivity</p>
          <p><strong>Good score:</strong> 100 milliseconds or less</p>
          <p><strong>Improvement tactics:</strong> 
            <ul>
              <li>Minimize JavaScript execution</li>
              <li>Break up long tasks</li>
              <li>Optimize event handlers</li>
              <li>Use web workers for complex tasks</li>
            </ul>
          </p>
        </div>
        
        <div style="flex: 1; min-width: 280px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f9f9f9;">
          <h5 style="margin-top: 0; color: #3366cc;">Cumulative Layout Shift (CLS)</h5>
          <p><strong>Measures:</strong> Visual stability</p>
          <p><strong>Good score:</strong> 0.1 or less</p>
          <p><strong>Improvement tactics:</strong> 
            <ul>
              <li>Set dimensions for images and videos</li>
              <li>Reserve space for ads and embeds</li>
              <li>Avoid inserting content above existing content</li>
              <li>Preload fonts to prevent shifts</li>
            </ul>
          </p>
        </div>
      </div>
      
      <div class="tools-box" style="background: #f0f7ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #3366cc;">Performance Measurement Tools</h4>
        <ul>
          <li><a href="https://pagespeed.web.dev/" target="_blank">PageSpeed Insights</a> - Core Web Vitals and performance metrics</li>
          <li><a href="https://www.webpagetest.org/" target="_blank">WebPageTest</a> - Detailed performance analysis</li>
          <li><a href="https://developers.google.com/web/tools/lighthouse" target="_blank">Lighthouse</a> - Performance, accessibility, SEO, and best practices audit</li>
          <li><a href="https://gtmetrix.com/" target="_blank">GTmetrix</a> - Performance testing with actionable recommendations</li>
          <li><a href="https://search.google.com/search-console" target="_blank">Google Search Console</a> - Core Web Vitals report for real-user data</li>
        </ul>
      </div>
      
      <h4>Mobile Optimization</h4>
      <p>With Google's mobile-first indexing, mobile optimization is essential:</p>
      <ul>
        <li><strong>Responsive design</strong> - Site adapts to all screen sizes</li>
        <li><strong>Mobile-friendly layout</strong> - Readable text without zooming, appropriate tap targets</li>
        <li><strong>Fast loading on mobile</strong> - Optimize for slower connections</li>
        <li><strong>No intrusive interstitials</strong> - Avoid popups that obscure content</li>
        <li><strong>Mobile viewport configuration</strong> - Proper meta viewport tag</li>
        <li><strong>Touch-friendly navigation</strong> - Easy to use on touchscreens</li>
      </ul>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
      </div>
      
      <h3>Security: HTTPS Implementation</h3>
      <p>HTTPS is a ranking factor and essential for user trust:</p>
      <ul>
        <li>Install an SSL certificate</li>
        <li>Implement 301 redirects from HTTP to HTTPS</li>
        <li>Update internal links to use HTTPS</li>
        <li>Update canonical tags to HTTPS versions</li>
        <li>Ensure third-party resources use HTTPS</li>
        <li>Add HTTP Strict Transport Security (HSTS) header</li>
        <li>Update Google Search Console property to HTTPS version</li>
      </ul>
      
      <h3>Technical SEO Audit Process</h3>
      <p>Regular technical audits help identify and fix issues:</p>
      
      <ol>
        <li><strong>Crawlability Analysis</strong>
          <ul>
            <li>Check robots.txt configuration</li>
            <li>Review XML sitemap</li>
            <li>Analyze crawl stats in Search Console</li>
            <li>Identify crawl errors</li>
          </ul>
        </li>
        
        <li><strong>Indexation Review</strong>
          <ul>
            <li>Compare indexed pages vs. total pages</li>
            <li>Check for incorrect canonical tags</li>
            <li>Review meta robots directives</li>
            <li>Identify duplicate content issues</li>
          </ul>
        </li>
        
        <li><strong>Site Architecture Assessment</strong>
          <ul>
            <li>Evaluate URL structure</li>
            <li>Analyze internal linking patterns</li>
            <li>Check for orphaned pages</li>
            <li>Review site depth (clicks from homepage)</li>
          </ul>
        </li>
        
        <li><strong>Performance Evaluation</strong>
          <ul>
            <li>Measure Core Web Vitals</li>
            <li>Test mobile friendliness</li>
            <li>Assess page speed</li>
            <li>Check for render-blocking resources</li>
          </ul>
        </li>
        
        <li><strong>On-Page Technical Elements</strong>
          <ul>
            <li>Review structured data implementation</li>
            <li>Check heading structure</li>
            <li>Evaluate image optimization</li>
            <li>Test for broken links</li>
          </ul>
        </li>
        
        <li><strong>Server Configuration</strong>
          <ul>
            <li>Verify HTTPS implementation</li>
            <li>Check server response time</li>
            <li>Review status codes</li>
            <li>Test server handling of 404 errors</li>
          </ul>
        </li>
      </ol>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>Use a combination of tools for technical SEO audits - no single tool catches everything. Popular options include Screaming Frog SEO Spider, Semrush, Ahrefs, DeepCrawl, and Google Search Console.</p>
      </div>
      
      <div class="checklist" style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Technical SEO Checklist</h4>
        <ul>
          <li>✓ Implement HTTPS across the entire site</li>
          <li>✓ Create and submit an XML sitemap</li>
          <li>✓ Configure robots.txt correctly</li>
          <li>✓ Optimize for mobile devices</li>
          <li>✓ Improve Core Web Vitals scores</li>
          <li>✓ Fix broken links and 404 errors</li>
          <li>✓ Use proper canonical tags</li>
          <li>✓ Implement schema markup</li>
          <li>✓ Optimize URL structure</li>
          <li>✓ Create a logical site architecture</li>
          <li>✓ Ensure proper handling of JavaScript for SEO</li>
          <li>✓ Fix duplicate content issues</li>
          <li>✓ Optimize images (size, format, alt text)</li>
          <li>✓ Improve server response time</li>
          <li>✓ Implement proper redirects (301 for permanent changes)</li>
        </ul>
      </div>
      
      <p>Technical SEO may seem complex, but it's an essential foundation for all other SEO efforts. By ensuring your site is technically sound, you provide both search engines and users with a better experience, which ultimately leads to improved visibility and performance in search results.</p>`,
    estimatedTime: 35,
    sortOrder: 1,
    isActive: true,
    quiz: {
      id: 4001,
      lessonId: 401,
      questions: [
        {
          id: 40001,
          text: "What are the three Core Web Vitals metrics that are official Google ranking factors?",
          options: [
            "Time to First Byte, First Contentful Paint, and Speed Index",
            "Largest Contentful Paint, First Input Delay, and Cumulative Layout Shift",
            "Time to Interactive, Total Blocking Time, and First Paint",
            "Server Response Time, DOM Content Loaded, and Fully Loaded Time"
          ],
          correctOptionIndex: 1,
          explanation: "The three Core Web Vitals metrics that are official Google ranking factors are Largest Contentful Paint (LCP) which measures loading performance, First Input Delay (FID) which measures interactivity, and Cumulative Layout Shift (CLS) which measures visual stability."
        },
        {
          id: 40002,
          text: "What is the purpose of a canonical tag in technical SEO?",
          options: [
            "To increase page loading speed",
            "To block search engines from crawling certain pages",
            "To specify the preferred version of a page when duplicate content exists",
            "To implement structured data markup"
          ],
          correctOptionIndex: 2,
          explanation: "The purpose of a canonical tag is to help manage duplicate content by specifying the preferred version of a page. It tells search engines which URL should be considered the primary one when multiple URLs contain the same or very similar content."
        },
        {
          id: 40003,
          text: "Which HTTP status code should be used for a page that has been permanently moved to a new URL?",
          options: [
            "200 OK",
            "301 Moved Permanently",
            "302 Found",
            "404 Not Found"
          ],
          correctOptionIndex: 1,
          explanation: "The 301 Moved Permanently status code should be used for a page that has been permanently moved to a new URL. This status code passes most of the link equity to the new URL and tells search engines to update their index with the new location."
        },
        {
          id: 40004,
          text: "What is the best practice for XML sitemaps regarding the number of URLs they should contain?",
          options: [
            "No more than 100 URLs",
            "No more than 1,000 URLs",
            "No more than 10,000 URLs",
            "No more than 50,000 URLs"
          ],
          correctOptionIndex: 3,
          explanation: "Best practice for XML sitemaps is to keep them under 50,000 URLs and 50MB in size. For larger sites, you should use sitemap index files to organize multiple sitemaps."
        },
        {
          id: 40005,
          text: "What is the appropriate meta robots directive to use when you want to prevent a page from being indexed but still want search engines to follow the links on the page?",
          options: [
            "index, nofollow",
            "noindex, follow",
            "noindex, nofollow",
            "index, follow"
          ],
          correctOptionIndex: 1,
          explanation: "The appropriate meta robots directive to prevent indexing but allow link following is 'noindex, follow'. This tells search engines not to include the page in their index but to still crawl and follow the links on the page."
        }
      ],
      passingScore: 80
    },
    additionalResources: [
      {
        title: "Google's Core Web Vitals Guide",
        url: "https://web.dev/vitals/",
        type: "guide",
        description: "Official Google resource for understanding and optimizing Core Web Vitals"
      },
      {
        title: "Technical SEO Guide",
        url: "https://moz.com/blog/technical-seo-checklist",
        type: "article",
        description: "Comprehensive technical SEO checklist with actionable items"
      },
      {
        title: "Mobile-First Indexing Best Practices",
        url: "https://developers.google.com/search/mobile-sites/mobile-first-indexing",
        type: "guide",
        description: "Google's official guidelines for mobile-first indexing"
      }
    ]
  },
  {
    id: 402,
    moduleId: 4,
    title: "Page Speed Optimization",
    description: "Learn how to improve your website's loading speed to enhance user experience and search rankings.",
    content: `<h2>Page Speed Optimization</h2>
      <p>Website speed has become a critical factor for both search engine rankings and user experience. Faster websites provide better user experiences, leading to higher engagement, conversion rates, and improved search visibility. This lesson covers essential strategies for optimizing your website's loading speed.</p>
      
      <h3>Why Page Speed Matters</h3>
      <p>The impact of page speed extends beyond simple user satisfaction:</p>
      
      <div class="impact-stats" style="background: #f5f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #3366cc;">Page Speed Impact Statistics</h4>
        <ul>
          <li>1-second delay in page load time can result in 7% fewer conversions</li>
          <li>47% of users expect pages to load in under 2 seconds</li>
          <li>40% abandon sites that take more than 3 seconds to load</li>
          <li>Google explicitly uses page speed as a ranking factor for both mobile and desktop searches</li>
          <li>Core Web Vitals (including loading performance) are official ranking signals</li>
          <li>Faster pages have higher ad viewability and lower bounce rates</li>
        </ul>
      </div>
      
      <h3>Key Speed Metrics to Measure</h3>
      <p>Several metrics help evaluate different aspects of page performance:</p>
      
      <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; text-align: left;">Metric</th>
          <th style="padding: 10px; text-align: left;">Description</th>
          <th style="padding: 10px; text-align: left;">Target Value</th>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Largest Contentful Paint (LCP)</strong></td>
          <td style="padding: 10px;">Time to render the largest content element visible in the viewport</td>
          <td style="padding: 10px;">≤ 2.5 seconds</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>First Contentful Paint (FCP)</strong></td>
          <td style="padding: 10px;">Time from navigation to the first content render</td>
          <td style="padding: 10px;">≤ 1.8 seconds</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Time to Interactive (TTI)</strong></td>
          <td style="padding: 10px;">Time until the page becomes fully interactive</td>
          <td style="padding: 10px;">≤ 3.8 seconds</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Total Blocking Time (TBT)</strong></td>
          <td style="padding: 10px;">Sum of time periods between FCP and TTI when tasks block user interactions</td>
          <td style="padding: 10px;">≤ 200 milliseconds</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Cumulative Layout Shift (CLS)</strong></td>
          <td style="padding: 10px;">Measure of visual stability (elements shifting as page loads)</td>
          <td style="padding: 10px;">≤ 0.1</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>Server Response Time (TTFB)</strong></td>
          <td style="padding: 10px;">Time from request to first byte of page content</td>
          <td style="padding: 10px;">≤ 200 milliseconds</td>
        </tr>
      </table>
      
      <div class="tools-box" style="background: #f0f7ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #3366cc;">Speed Testing Tools</h4>
        <ul>
          <li><a href="https://pagespeed.web.dev/" target="_blank">PageSpeed Insights</a> - Google's tool for Core Web Vitals and general performance</li>
          <li><a href="https://www.webpagetest.org/" target="_blank">WebPageTest</a> - Detailed performance analysis with waterfall charts</li>
          <li><a href="https://developer.chrome.com/docs/lighthouse/" target="_blank">Lighthouse</a> - Audit tool built into Chrome DevTools</li>
          <li><a href="https://gtmetrix.com/" target="_blank">GTmetrix</a> - Performance testing with actionable recommendations</li>
          <li><a href="https://tools.pingdom.com/" target="_blank">Pingdom Website Speed Test</a> - Simple interface with good visualizations</li>
        </ul>
      </div>
      
      <h3>Server Optimization Strategies</h3>
      <p>The foundation of page speed starts with your server configuration:</p>
      
      <h4>1. Choose the Right Hosting</h4>
      <ul>
        <li><strong>Shared Hosting:</strong> Affordable but slower due to shared resources</li>
        <li><strong>VPS (Virtual Private Server):</strong> Better performance with dedicated resources</li>
        <li><strong>Dedicated Server:</strong> Maximum control and performance</li>
        <li><strong>Cloud Hosting:</strong> Scalable resources that adapt to traffic levels</li>
      </ul>
      
      <h4>2. Implement Content Delivery Network (CDN)</h4>
      <p>CDNs distribute your content across multiple servers worldwide, reducing latency for users:</p>
      <ul>
        <li>Store static assets (images, CSS, JavaScript) on CDN servers</li>
        <li>Reduce distance between users and server</li>
        <li>Provide built-in optimizations (compression, caching, etc.)</li>
        <li>Offer DDoS protection</li>
        <li>Popular options: Cloudflare, Akamai, Amazon CloudFront, Fastly</li>
      </ul>
      
      <h4>3. Configure Server Caching</h4>
      <p>Server-side caching reduces database queries and processing time:</p>
      <ul>
        <li><strong>Object Caching:</strong> Store database query results</li>
        <li><strong>Opcode Caching:</strong> Store compiled PHP code</li>
        <li><strong>Full Page Caching:</strong> Store complete HTML output</li>
        <li>For WordPress: WP Rocket, W3 Total Cache, LiteSpeed Cache</li>
        <li>For custom applications: Redis, Memcached, Varnish</li>
      </ul>
      
      <h4>4. Enable HTTP/2 or HTTP/3</h4>
      <ul>
        <li>Multiplexing: Load multiple resources simultaneously</li>
        <li>Header compression: Reduce overhead</li>
        <li>Server push: Send critical resources proactively</li>
        <li>Requires HTTPS implementation</li>
      </ul>
      
      <h4>5. Optimize TTFB (Time To First Byte)</h4>
      <ul>
        <li>Upgrade server hardware/resources</li>
        <li>Optimize database queries</li>
        <li>Implement server-side caching</li>
        <li>Reduce DNS lookup time</li>
        <li>Optimize application code</li>
      </ul>
      
      <h3>File Optimization Strategies</h3>
      
      <h4>1. Image Optimization</h4>
      <p>Images often account for most of a page's weight:</p>
      <ul>
        <li><strong>Compress images</strong> without sacrificing quality</li>
        <li><strong>Choose the right format:</strong>
          <ul>
            <li>JPEG: Photos and images with many colors</li>
            <li>PNG: Images requiring transparency</li>
            <li>WebP: Modern format with better compression (check browser support)</li>
            <li>SVG: Vector graphics and icons</li>
            <li>AVIF: Next-generation format with excellent compression</li>
          </ul>
        </li>
        <li><strong>Resize images</strong> to the display size</li>
        <li><strong>Implement lazy loading</strong> for images below the fold</li>
        <li><strong>Use responsive images</strong> with srcset and sizes attributes</li>
        <li><strong>Consider image CDNs</strong> with on-the-fly optimization</li>
      </ul>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;!-- Responsive image with lazy loading --&gt;<br>
        &lt;img src="small.jpg"<br>
        &nbsp;&nbsp;srcset="small.jpg 500w,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;medium.jpg 1000w,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;large.jpg 1500w"<br>
        &nbsp;&nbsp;sizes="(max-width: 600px) 500px,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;(max-width: 1200px) 1000px,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;1500px"<br>
        &nbsp;&nbsp;alt="Description of image"<br>
        &nbsp;&nbsp;loading="lazy"<br>
        &nbsp;&nbsp;width="800"<br>
        &nbsp;&nbsp;height="600"&gt;
      </div>
      
      <h4>2. CSS and JavaScript Optimization</h4>
      <ul>
        <li><strong>Minify files</strong> to remove unnecessary characters</li>
        <li><strong>Combine files</strong> to reduce HTTP requests (weigh against HTTP/2 benefits)</li>
        <li><strong>Remove unused code</strong> (use tools like PurgeCSS)</li>
        <li><strong>Defer non-critical JavaScript</strong> loading</li>
        <li><strong>Use asynchronous loading</strong> where appropriate</li>
        <li><strong>Critical CSS:</strong> Inline critical styles in <code>&lt;head&gt;</code></li>
        <li><strong>Load JavaScript modules</strong> with <code>type="module"</code></li>
      </ul>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;!-- Defer non-critical JavaScript --&gt;<br>
        &lt;script src="non-critical.js" defer&gt;&lt;/script&gt;<br>
        <br>
        &lt;!-- Async for independent scripts --&gt;<br>
        &lt;script src="analytics.js" async&gt;&lt;/script&gt;
      </div>
      
      <h4>3. Font Optimization</h4>
      <ul>
        <li><strong>Limit font families and weights</strong></li>
        <li><strong>Use modern font formats</strong> (WOFF2)</li>
        <li><strong>Host fonts locally</strong> instead of third-party services</li>
        <li><strong>Implement font-display</strong> property to control rendering</li>
        <li><strong>Preload critical fonts</strong></li>
        <li><strong>Consider system fonts</strong> for better performance</li>
      </ul>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;!-- Preload critical font --&gt;<br>
        &lt;link rel="preload" href="fonts/roboto.woff2" as="font" type="font/woff2" crossorigin&gt;<br>
        <br>
        &lt;style&gt;<br>
        @font-face {<br>
        &nbsp;&nbsp;font-family: 'Roboto';<br>
        &nbsp;&nbsp;font-style: normal;<br>
        &nbsp;&nbsp;font-weight: 400;<br>
        &nbsp;&nbsp;font-display: swap; /* Prevents FOIT */<br>
        &nbsp;&nbsp;src: local('Roboto'), url('fonts/roboto.woff2') format('woff2');<br>
        }<br>
        &lt;/style&gt;
      </div>
      
      <h4>4. HTML Optimization</h4>
      <ul>
        <li>Minify HTML</li>
        <li>Remove unnecessary comments and whitespace</li>
        <li>Avoid inline styles and scripts when possible</li>
        <li>Use semantic HTML for faster rendering</li>
        <li>Reduce DOM size and nesting depth</li>
      </ul>
      
      <h3>Advanced Speed Optimization Techniques</h3>
      
      <h4>1. Resource Hints</h4>
      <p>Inform the browser about resources that will be needed soon:</p>
      <ul>
        <li><strong>preload:</strong> High-priority fetch for current navigation</li>
        <li><strong>prefetch:</strong> Low-priority fetch for future navigation</li>
        <li><strong>preconnect:</strong> Early connection to referenced domain</li>
        <li><strong>dns-prefetch:</strong> Early DNS resolution</li>
      </ul>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        &lt;!-- Preload critical CSS --&gt;<br>
        &lt;link rel="preload" href="critical.css" as="style"&gt;<br>
        <br>
        &lt;!-- Prefetch for future navigation --&gt;<br>
        &lt;link rel="prefetch" href="next-page.html"&gt;<br>
        <br>
        &lt;!-- Preconnect to third-party domain --&gt;<br>
        &lt;link rel="preconnect" href="https://example.com"&gt;<br>
        <br>
        &lt;!-- DNS prefetch as fallback --&gt;<br>
        &lt;link rel="dns-prefetch" href="https://example.com"&gt;
      </div>
      
      <h4>2. Browser Caching</h4>
      <p>Instruct browsers to store assets locally:</p>
      <ul>
        <li>Set appropriate Cache-Control headers</li>
        <li>Use ETag and Last-Modified headers</li>
        <li>Implement versioning for cache busting</li>
      </ul>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto; font-size: 0.9em;">
        # Apache (.htaccess) example<br>
        &lt;IfModule mod_expires.c&gt;<br>
        &nbsp;&nbsp;ExpiresActive On<br>
        &nbsp;&nbsp;# Images<br>
        &nbsp;&nbsp;ExpiresByType image/jpeg "access plus 1 year"<br>
        &nbsp;&nbsp;ExpiresByType image/png "access plus 1 year"<br>
        &nbsp;&nbsp;# CSS, JavaScript<br>
        &nbsp;&nbsp;ExpiresByType text/css "access plus 1 month"<br>
        &nbsp;&nbsp;ExpiresByType text/javascript "access plus 1 month"<br>
        &lt;/IfModule&gt;
      </div>
      
      <h4>3. Reduce Third-Party Impact</h4>
      <ul>
        <li>Audit and remove unnecessary third-party scripts</li>
        <li>Load third-party resources asynchronously</li>
        <li>Use tag management systems</li>
        <li>Self-host third-party assets when possible</li>
        <li>Implement resource hints for third-party domains</li>
        <li>Monitor third-party performance impact</li>
      </ul>
      
      <h4>4. Implement Critical Rendering Path Optimization</h4>
      <ul>
        <li>Minimize critical resources</li>
        <li>Reduce critical path length</li>
        <li>Reduce number of critical bytes</li>
        <li>Prioritize visible content (above the fold)</li>
        <li>Defer non-critical resources</li>
      </ul>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>Use Chrome DevTools' Performance and Network panels to identify render-blocking resources and optimize critical rendering path. The "Coverage" tab can also help identify unused CSS and JavaScript.</p>
      </div>
      
      <h3>Optimization for Different Site Types</h3>
      
      <h4>WordPress Sites</h4>
      <ul>
        <li>Use a lightweight, well-coded theme</li>
        <li>Limit plugins to essentials</li>
        <li>Implement a caching plugin (WP Rocket, W3 Total Cache)</li>
        <li>Optimize the database regularly</li>
        <li>Consider managed WordPress hosting</li>
      </ul>
      
      <h4>E-commerce Sites</h4>
      <ul>
        <li>Implement AJAX loading for product filtering</li>
        <li>Use pagination or infinite scroll for product listings</li>
        <li>Optimize product images</li>
        <li>Cache product pages and categories</li>
        <li>Minimize checkout process steps</li>
      </ul>
      
      <h4>JavaScript Frameworks (React, Vue, Angular)</h4>
      <ul>
        <li>Implement code splitting and lazy loading</li>
        <li>Use server-side rendering (SSR) or static site generation</li>
        <li>Enable tree shaking to eliminate unused code</li>
        <li>Optimize bundle size</li>
        <li>Use production builds with minification</li>
      </ul>
      
      <h3>Page Speed Optimization Process</h3>
      <p>Follow this systematic approach to improve site speed:</p>
      
      <ol>
        <li><strong>Measurement & Analysis</strong>
          <ul>
            <li>Establish baseline performance metrics</li>
            <li>Identify specific issues and bottlenecks</li>
            <li>Prioritize optimizations by impact</li>
          </ul>
        </li>
        
        <li><strong>Server-Level Optimizations</strong>
          <ul>
            <li>Improve hosting infrastructure</li>
            <li>Implement CDN</li>
            <li>Configure server caching</li>
            <li>Enable compression</li>
          </ul>
        </li>
        
        <li><strong>Asset Optimization</strong>
          <ul>
            <li>Optimize images, videos, and fonts</li>
            <li>Minify and combine CSS/JavaScript</li>
            <li>Remove unused code</li>
            <li>Implement lazy loading</li>
          </ul>
        </li>
        
        <li><strong>Rendering Optimization</strong>
          <ul>
            <li>Address render-blocking resources</li>
            <li>Implement critical CSS</li>
            <li>Defer non-critical JavaScript</li>
            <li>Optimize above-the-fold content</li>
          </ul>
        </li>
        
        <li><strong>Advanced Techniques</strong>
          <ul>
            <li>Implement resource hints</li>
            <li>Configure browser caching</li>
            <li>Reduce third-party impact</li>
            <li>Consider AMP for certain content</li>
          </ul>
        </li>
        
        <li><strong>Verification & Monitoring</strong>
          <ul>
            <li>Re-test after implementing changes</li>
            <li>Measure improvements against baseline</li>
            <li>Set up ongoing performance monitoring</li>
            <li>Establish performance budgets</li>
          </ul>
        </li>
      </ol>
      
      <div class="checklist" style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Page Speed Optimization Checklist</h4>
        <ul>
          <li>✓ Implement a CDN for static asset delivery</li>
          <li>✓ Enable GZIP or Brotli compression</li>
          <li>✓ Optimize and compress all images</li>
          <li>✓ Minify CSS, JavaScript, and HTML</li>
          <li>✓ Eliminate render-blocking resources</li>
          <li>✓ Implement browser caching</li>
          <li>✓ Reduce server response time (TTFB)</li>
          <li>✓ Optimize CSS delivery</li>
          <li>✓ Use asynchronous and deferred JavaScript loading</li>
          <li>✓ Prioritize visible content</li>
          <li>✓ Reduce third-party JavaScript impact</li>
          <li>✓ Optimize web fonts loading</li>
          <li>✓ Ensure proper dimensions for images and embeds</li>
          <li>✓ Implement resource hints (preload, prefetch, preconnect)</li>
          <li>✓ Enable HTTP/2 or HTTP/3</li>
        </ul>
      </div>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">Common Page Speed Mistakes</h4>
        <ul>
          <li>Implementing optimizations without measuring impact</li>
          <li>Focusing on PageSpeed scores instead of user experience metrics</li>
          <li>Sacrificing functionality for speed</li>
          <li>Ignoring mobile optimization</li>
          <li>Using too many optimization plugins that conflict with each other</li>
          <li>Overlooking server-side performance issues</li>
          <li>Neglecting to compress and resize images</li>
          <li>Loading unnecessary third-party scripts</li>
        </ul>
      </div>
      
      <p>Page speed optimization is an ongoing process that requires regular testing and refinement. By implementing these strategies, you can significantly improve your website's loading performance, providing a better user experience and potentially improving your search rankings.</p>`,
    estimatedTime: 45,
    sortOrder: 2,
    isActive: true,
    quiz: {
      id: 4002,
      lessonId: 402,
      questions: [
        {
          id: 40006,
          text: "What is the recommended target time for Largest Contentful Paint (LCP)?",
          options: [
            "Under 1 second",
            "Under 2.5 seconds",
            "Under 4 seconds",
            "Under 5.5 seconds"
          ],
          correctOptionIndex: 1,
          explanation: "The recommended target time for Largest Contentful Paint (LCP) is under 2.5 seconds. Google considers this a 'good' score for this Core Web Vital metric, which measures loading performance by timing how long it takes to render the largest content element visible in the viewport."
        },
        {
          id: 40007,
          text: "Which of the following is NOT a benefit of using a Content Delivery Network (CDN)?",
          options: [
            "Reduced latency for users worldwide",
            "Improved server response time",
            "Protection against DDoS attacks",
            "Automatic creation of mobile-optimized images"
          ],
          correctOptionIndex: 3,
          explanation: "A CDN does not automatically create mobile-optimized images. While CDNs provide benefits like reduced latency, improved server response time, and DDoS protection, image optimization typically requires separate tools or services (though some CDNs offer image optimization as an additional feature)."
        },
        {
          id: 40008,
          text: "Which attribute should be used to prevent layout shifts when loading images?",
          options: [
            "async",
            "loading=\"lazy\"",
            "width and height",
            "defer"
          ],
          correctOptionIndex: 2,
          explanation: "Adding width and height attributes to images helps prevent layout shifts (which negatively impact Cumulative Layout Shift scores) by allowing the browser to reserve the correct space for images before they load. The loading=\"lazy\" attribute delays loading of images until they're near the viewport, but doesn't prevent layout shifts."
        },
        {
          id: 40009,
          text: "What is the purpose of the 'preconnect' resource hint?",
          options: [
            "To load a resource immediately with high priority",
            "To establish early connections to domains before resources are requested",
            "To indicate future navigation destinations",
            "To inform the browser about resources needed for the next page"
          ],
          correctOptionIndex: 1,
          explanation: "The 'preconnect' resource hint is used to establish early connections to referenced domains, informing the browser to initiate the connection process (DNS lookup, TCP handshake, TLS negotiation) before resources are actually requested from those domains. This reduces connection establishment time when resources are later requested."
        },
        {
          id: 40010,
          text: "Which approach is recommended for loading non-critical JavaScript?",
          options: [
            "Placing script tags at the top of the HTML document",
            "Using synchronous loading in the head section",
            "Using the defer or async attributes",
            "Inline all JavaScript in the HTML"
          ],
          correctOptionIndex: 2,
          explanation: "Using the defer or async attributes is recommended for loading non-critical JavaScript. The defer attribute loads the script after HTML parsing is complete but before the DOMContentLoaded event, while async loads the script asynchronously during HTML parsing. Both prevent render-blocking and improve page load performance."
        }
      ],
      passingScore: 80
    },
    additionalResources: [
      {
        title: "Web Vitals",
        url: "https://web.dev/vitals/",
        type: "guide",
        description: "Google's essential metrics for a healthy website"
      },
      {
        title: "Image Optimization Guide",
        url: "https://images.guide/",
        type: "guide",
        description: "Comprehensive guide to optimizing images for the web"
      },
      {
        title: "JavaScript Loading Optimization",
        url: "https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/javascript-startup-optimization",
        type: "article",
        description: "Google's guide to optimizing JavaScript execution"
      }
    ]
  }
];