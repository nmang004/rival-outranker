import { LearningLesson } from "@/types/learningTypes";

export const internationalSEOLessons: LearningLesson[] = [
  {
    id: 701,
    moduleId: 7,
    title: "Introduction to International SEO",
    description: "Understand the fundamentals of expanding your online presence globally through effective international SEO strategies.",
    content: `<h2>Introduction to International SEO</h2>
      <p>International SEO is the process of optimizing your website to attract search traffic from multiple countries or in multiple languages. As businesses expand globally, proper international SEO implementation becomes crucial for reaching diverse audiences worldwide.</p>
      
      <h3>Why International SEO Matters</h3>
      <p>Implementing a strong international SEO strategy offers numerous advantages:</p>
      <ul>
        <li><strong>Expanded Market Reach:</strong> Access new markets and customer segments beyond your home country</li>
        <li><strong>Competitive Advantage:</strong> Establish presence in markets before your competitors</li>
        <li><strong>Increased Revenue Opportunities:</strong> Tap into growing economies and diversify your revenue streams</li>
        <li><strong>Improved User Experience:</strong> Provide content in users' preferred languages and with localized cultural context</li>
        <li><strong>Better Search Visibility:</strong> Rank higher in country-specific search engines and local search results</li>
      </ul>
      
      <h3>Key Components of International SEO</h3>
      <ol>
        <li><strong>URL Structure Planning:</strong> Deciding between ccTLDs, subdirectories, or subdomains for your international sites</li>
        <li><strong>Hreflang Implementation:</strong> Properly indicating language and regional targeting</li>
        <li><strong>Content Localization:</strong> Adapting content for language, cultural nuances, and regional preferences</li>
        <li><strong>Technical Optimization:</strong> Server location, site speed, and mobile optimization for international audiences</li>
        <li><strong>Local Link Building:</strong> Developing country-specific backlink profiles</li>
        <li><strong>International Keyword Research:</strong> Finding relevant search terms for each target market</li>
      </ol>
      
      <div class="important-box" style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #ffc107;">Important Consideration</h4>
        <p>International SEO is not simply about translating your existing content. Effective global SEO requires understanding local search behaviors, cultural preferences, and market-specific competitive landscapes.</p>
      </div>
      
      <h3>Common International SEO Challenges</h3>
      <ul>
        <li><strong>Duplicate Content Issues:</strong> Managing similar content across multiple languages/regions</li>
        <li><strong>Incorrect Geotargeting:</strong> Pages appearing in search results for unintended countries</li>
        <li><strong>Translation Quality:</strong> Poor translations damaging user experience and brand perception</li>
        <li><strong>Technical Implementation:</strong> Correctly implementing hreflang, structured data, and geotargeting</li>
        <li><strong>Local Competition:</strong> Competing against established local businesses with strong domain authority</li>
      </ul>
      
      <h3>International SEO Checklist</h3>
      <ol>
        <li>Research target markets thoroughly (market size, competition, search behavior)</li>
        <li>Choose the right URL structure for your international expansion</li>
        <li>Implement proper hreflang tags for language/regional targeting</li>
        <li>Create high-quality localized content (not just translations)</li>
        <li>Optimize for local search engines (not just Google)</li>
        <li>Build local backlink profiles</li>
        <li>Ensure technical compliance (server location, page speed, mobile-friendliness)</li>
        <li>Set up country-specific Google Search Console properties</li>
        <li>Monitor international performance metrics</li>
      </ol>
      
      <p>In the following lessons, we'll dive deeper into each aspect of international SEO, providing practical strategies and implementation guidance for effectively expanding your online presence globally.</p>`,
    estimatedTime: 30,
    sortOrder: 1,
    isActive: true,
    quiz: {
      id: 7001,
      lessonId: 701,
      questions: [
        {
          id: 70001,
          text: "Which of the following is NOT a key component of International SEO?",
          options: [
            "URL structure planning",
            "Hreflang implementation",
            "Content localization",
            "Focusing solely on English-speaking markets"
          ],
          correctOptionIndex: 3,
          explanation: "Focusing solely on English-speaking markets contradicts the purpose of international SEO, which aims to expand reach across multiple countries and languages. The other options are all essential components of a comprehensive international SEO strategy."
        },
        {
          id: 70002,
          text: "What is the primary purpose of implementing International SEO?",
          options: [
            "To reduce website hosting costs",
            "To attract search traffic from multiple countries or in multiple languages",
            "To decrease the need for customer support",
            "To simplify website maintenance"
          ],
          correctOptionIndex: 1,
          explanation: "The primary purpose of international SEO is to optimize your website to attract search traffic from multiple countries or in multiple languages, expanding your global market reach."
        },
        {
          id: 70003,
          text: "Which of the following is a common challenge in International SEO?",
          options: [
            "Too much organic traffic from international markets",
            "Excessive backlinks from international websites",
            "Managing duplicate content across multiple languages/regions",
            "Too much engagement from international users"
          ],
          correctOptionIndex: 2,
          explanation: "Managing duplicate content across multiple languages/regions is a common challenge in international SEO. When you have similar content in different languages or targeting different regions, search engines may have difficulty determining which version to show to which users."
        },
        {
          id: 70004,
          text: "What does effective international SEO require beyond simply translating existing content?",
          options: [
            "Only using ccTLDs for all international sites",
            "Avoiding local search engines completely",
            "Understanding local search behaviors, cultural preferences, and market-specific competitive landscapes",
            "Creating entirely different websites for each country"
          ],
          correctOptionIndex: 2,
          explanation: "Effective international SEO requires understanding local search behaviors, cultural preferences, and market-specific competitive landscapes. Simply translating content without considering these factors will likely result in poor performance in international markets."
        }
      ],
      passingScore: 75
    },
    additionalResources: [
      {
        title: "Google's Guide to Multi-language and Multi-regional Sites",
        url: "https://developers.google.com/search/docs/specialty/international",
        type: "guide",
        description: "Official guidance from Google on international site structures and best practices"
      },
      {
        title: "International SEO: Ultimate Guide",
        url: "https://ahrefs.com/blog/international-seo/",
        type: "article",
        description: "Comprehensive resource covering all aspects of international SEO implementation"
      },
      {
        title: "Hreflang Tags Generator Tool",
        url: "https://ahrefs.com/hreflang-generator",
        type: "tool",
        description: "Free tool to generate proper hreflang tags for your international pages"
      }
    ]
  },
  {
    id: 702,
    moduleId: 7,
    title: "URL Structure for International Websites",
    description: "Learn the pros and cons of different URL structures for international websites and how to choose the right approach for your business.",
    content: `<h2>URL Structure for International Websites</h2>
      <p>One of the first and most critical decisions when expanding internationally is choosing the right URL structure for your global website. This decision affects how search engines understand your site's geographic targeting, how users perceive your brand, and how efficiently you can manage your international content.</p>
      
      <h3>The Three Main URL Structure Options</h3>
      
      <table border="1" cellpadding="10" style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color:#f5f5f5; font-weight: bold;">
          <td>Structure Type</td>
          <td>Example</td>
          <td>Pros</td>
          <td>Cons</td>
          <td>Best For</td>
        </tr>
        <tr>
          <td><strong>Country Code Top-Level Domains (ccTLDs)</strong></td>
          <td>example.fr (France)<br>example.de (Germany)<br>example.jp (Japan)</td>
          <td>
            • Strongest geo-targeting signal<br>
            • Clear country association for users<br>
            • Can host on local servers easily<br>
            • Independent SEO performance
          </td>
          <td>
            • Most expensive to implement<br>
            • Requires separate SEO for each domain<br>
            • No shared domain authority<br>
            • More complex maintenance
          </td>
          <td>Large multinational companies with significant resources and strong local presence in each market</td>
        </tr>
        <tr>
          <td><strong>Subdirectories</strong></td>
          <td>example.com/fr/ (France)<br>example.com/de/ (Germany)<br>example.com/jp/ (Japan)</td>
          <td>
            • Leverages domain authority of main site<br>
            • Easier to implement and maintain<br>
            • Lower cost<br>
            • Consolidates link equity
          </td>
          <td>
            • Weaker geo-targeting signal<br>
            • Server location may impact performance<br>
            • All sites affected by domain-wide issues
          </td>
          <td>Most businesses, especially those starting international expansion with limited resources</td>
        </tr>
        <tr>
          <td><strong>Subdomains</strong></td>
          <td>fr.example.com (France)<br>de.example.com (Germany)<br>jp.example.com (Japan)</td>
          <td>
            • Can host on different servers<br>
            • Some shared domain authority<br>
            • Good compromise solution
          </td>
          <td>
            • Treated somewhat separately by search engines<br>
            • Less intuitive for some users<br>
            • Limited geo-targeting compared to ccTLDs
          </td>
          <td>Businesses that need more separation than subdirectories but can't invest in ccTLDs</td>
        </tr>
      </table>
      
      <h3>Factors to Consider When Choosing Your URL Structure</h3>
      
      <h4>1. Business Goals and Resources</h4>
      <ul>
        <li><strong>Budget:</strong> ccTLDs are more expensive to implement and maintain</li>
        <li><strong>Team size:</strong> Multiple domains require more resources to manage</li>
        <li><strong>Long-term strategy:</strong> How critical is international growth to your business?</li>
      </ul>
      
      <h4>2. Target Markets</h4>
      <ul>
        <li><strong>Number of markets:</strong> More markets make ccTLDs more challenging</li>
        <li><strong>Local competition:</strong> Highly competitive markets may benefit from ccTLDs</li>
        <li><strong>Language vs. country focus:</strong> Are you targeting languages or specific countries?</li>
      </ul>
      
      <h4>3. SEO Considerations</h4>
      <ul>
        <li><strong>Domain authority:</strong> New ccTLDs start with zero authority</li>
        <li><strong>Link building capacity:</strong> Can you build links to multiple domains?</li>
        <li><strong>Existing international traffic:</strong> Where are your users already coming from?</li>
      </ul>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>Most businesses should start with subdirectories and only consider migrating to ccTLDs when they have established a strong presence in a market and have the resources to support independent domains.</p>
      </div>
      
      <h3>Migration Considerations</h3>
      <p>If you're changing your international URL structure, plan carefully:</p>
      <ol>
        <li>Implement proper 301 redirects from old URLs to new ones</li>
        <li>Update all internal links to reflect the new structure</li>
        <li>Inform Google of the change through Search Console</li>
        <li>Update all hreflang annotations</li>
        <li>Monitor traffic changes closely during the transition</li>
      </ol>
      
      <h3>Country-Specific Hosting</h3>
      <p>Regardless of URL structure, consider server location:</p>
      <ul>
        <li>Google uses server location as a geo-targeting signal (though less important than in the past)</li>
        <li>Local hosting can improve page speed for users in that region</li>
        <li>Some countries (like China) require local hosting for optimal performance</li>
        <li>CDNs (Content Delivery Networks) can help deliver content quickly regardless of server location</li>
      </ul>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">Common Mistake</h4>
        <p>Don't choose ccTLDs unless you're committed to building each domain's authority independently. Many businesses underestimate the SEO challenges of managing multiple independent domains.</p>
      </div>`,
    estimatedTime: 35,
    sortOrder: 2,
    isActive: true,
    quiz: {
      id: 7002,
      lessonId: 702,
      questions: [
        {
          id: 70005,
          text: "Which URL structure provides the strongest geo-targeting signal to search engines?",
          options: [
            "Subdirectories (example.com/fr/)",
            "Subdomains (fr.example.com)",
            "ccTLDs (example.fr)",
            "Parameter URLs (example.com?country=fr)"
          ],
          correctOptionIndex: 2,
          explanation: "Country Code Top-Level Domains (ccTLDs) like example.fr provide the strongest geo-targeting signal to search engines, making it clear that the content is specifically targeted to users in that country."
        },
        {
          id: 70006,
          text: "Which URL structure is generally recommended for most businesses starting international expansion with limited resources?",
          options: [
            "ccTLDs",
            "Subdirectories",
            "Subdomains",
            "Dynamic serving with the same URL"
          ],
          correctOptionIndex: 1,
          explanation: "Subdirectories (example.com/fr/) are generally recommended for most businesses starting international expansion with limited resources because they leverage the domain authority of the main site, are easier to implement and maintain, and are more cost-effective."
        },
        {
          id: 70007,
          text: "What is a key disadvantage of using ccTLDs for international SEO?",
          options: [
            "They provide too strong of a geo-targeting signal",
            "They require separate SEO efforts for each domain with no shared domain authority",
            "They are not recognized by most search engines",
            "They cannot be hosted on local servers"
          ],
          correctOptionIndex: 1,
          explanation: "A key disadvantage of using ccTLDs is that they require separate SEO efforts for each domain with no shared domain authority. Each ccTLD starts with zero authority and needs its own link building and SEO strategy."
        },
        {
          id: 70008,
          text: "When changing your international URL structure, what is an important step in the migration process?",
          options: [
            "Always move all content at once",
            "Implement proper 301 redirects from old URLs to new ones",
            "Delete the original website immediately",
            "Use temporary 302 redirects for all pages"
          ],
          correctOptionIndex: 1,
          explanation: "When changing your international URL structure, implementing proper 301 redirects from old URLs to new ones is a crucial step in the migration process. This helps preserve SEO value and ensures users are properly directed to the new content locations."
        }
      ],
      passingScore: 75
    },
    additionalResources: [
      {
        title: "International Targeting: URL Structures",
        url: "https://moz.com/learn/seo/international-seo",
        type: "guide",
        description: "Comprehensive explanation of international URL structure options"
      },
      {
        title: "Google Search Central: Managing Multi-regional Sites",
        url: "https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites",
        type: "article",
        description: "Google's official guidance on international URL structures"
      },
      {
        title: "International SEO: URL Structures Case Study",
        url: "https://www.searchenginejournal.com/international-seo-case-study/343500/",
        type: "article",
        description: "Real-world examples of URL structure implementations and results"
      }
    ]
  },
  {
    id: 703,
    moduleId: 7,
    title: "Hreflang Implementation & Best Practices",
    description: "Master the technical implementation of hreflang tags to properly indicate language and regional targeting for your international content.",
    content: `<h2>Hreflang Implementation & Best Practices</h2>
      <p>The hreflang attribute is one of the most powerful tools for international SEO, but it's also one of the most commonly misunderstood and incorrectly implemented. When properly used, hreflang helps search engines understand which language and geographic region your content is targeting, ensuring the right version is shown to the right users.</p>
      
      <h3>What is Hreflang?</h3>
      <p>The hreflang attribute is an HTML element that tells search engines which language and geographical targeting a specific page has. It helps prevent duplicate content issues across different language versions of your site and ensures users see the most relevant version of your content.</p>
      
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto;">
        &lt;link rel="alternate" hreflang="en-us" href="https://example.com/en-us/page" /&gt;
      </div>
      
      <h3>Hreflang Attribute Structure</h3>
      <p>The hreflang attribute follows a specific format:</p>
      <ul>
        <li><strong>Language code only:</strong> <code>hreflang="en"</code> (English, no specific region)</li>
        <li><strong>Language + Region:</strong> <code>hreflang="en-us"</code> (English for US users)</li>
        <li><strong>Region only:</strong> <code>hreflang="x-default"</code> (Default page for users where no specific language/region version exists)</li>
      </ul>
      
      <p>Language codes follow the <a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes" target="_blank">ISO 639-1 format</a> (two-letter codes like "en" for English), while region codes follow the <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank">ISO 3166-1 Alpha-2 format</a> (two-letter codes like "us" for United States).</p>
      
      <h3>Three Methods of Hreflang Implementation</h3>
      
      <h4>1. HTML Head Method</h4>
      <p>Add link elements in the <code>&lt;head&gt;</code> section of your HTML:</p>
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto;">
        &lt;head&gt;<br>
        &nbsp;&nbsp;&lt;link rel="alternate" hreflang="en-us" href="https://example.com/en-us/page" /&gt;<br>
        &nbsp;&nbsp;&lt;link rel="alternate" hreflang="en-gb" href="https://example.com/en-gb/page" /&gt;<br>
        &nbsp;&nbsp;&lt;link rel="alternate" hreflang="de-de" href="https://example.com/de-de/page" /&gt;<br>
        &nbsp;&nbsp;&lt;link rel="alternate" hreflang="x-default" href="https://example.com/page" /&gt;<br>
        &lt;/head&gt;
      </div>
      
      <h4>2. HTTP Headers Method (for non-HTML files)</h4>
      <p>For PDFs, images, or other non-HTML content:</p>
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto;">
        Link: &lt;https://example.com/en-us/document.pdf&gt;; rel="alternate"; hreflang="en-us"
      </div>
      
      <h4>3. XML Sitemap Method</h4>
      <p>Include hreflang annotations in your XML sitemap:</p>
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto;">
        &lt;?xml version="1.0" encoding="UTF-8"?&gt;<br>
        &lt;urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"<br>
        &nbsp;&nbsp;xmlns:xhtml="http://www.w3.org/1999/xhtml"&gt;<br>
        &nbsp;&nbsp;&lt;url&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;loc&gt;https://example.com/en-us/page&lt;/loc&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;xhtml:link rel="alternate" hreflang="en-us" href="https://example.com/en-us/page" /&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;xhtml:link rel="alternate" hreflang="en-gb" href="https://example.com/en-gb/page" /&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;xhtml:link rel="alternate" hreflang="de-de" href="https://example.com/de-de/page" /&gt;<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&lt;xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/page" /&gt;<br>
        &nbsp;&nbsp;&lt;/url&gt;<br>
        &lt;/urlset&gt;
      </div>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>It's recommended to use at least two methods simultaneously (typically HTML head and XML sitemap) for redundancy and to ensure search engines properly recognize your hreflang implementation.</p>
      </div>
      
      <h3>Key Hreflang Implementation Requirements</h3>
      <ol>
        <li><strong>Reciprocal References:</strong> Each language version must reference all other language versions, including itself. This creates a complete circle of references.</li>
        <li><strong>Accurate Language/Region Codes:</strong> Must use proper ISO codes for languages and countries.</li>
        <li><strong>Absolute URLs:</strong> Always use full URLs, not relative paths.</li>
        <li><strong>Matching Page Content:</strong> Linked pages should be translations of the same content, not different content.</li>
        <li><strong>X-default:</strong> Recommended to include an x-default version for users who don't match any of your targeted languages/regions.</li>
      </ol>
      
      <h3>Common Hreflang Errors & Solutions</h3>
      <table border="1" cellpadding="10" style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color:#f5f5f5; font-weight: bold;">
          <td>Error</td>
          <td>Description</td>
          <td>Solution</td>
        </tr>
        <tr>
          <td>Missing return tags</td>
          <td>Language versions don't reference each other reciprocally</td>
          <td>Ensure each page references all alternate versions including itself</td>
        </tr>
        <tr>
          <td>Incorrect language/region codes</td>
          <td>Using invalid or improper formatting (e.g., "en_US" instead of "en-us")</td>
          <td>Use proper ISO codes with hyphen separator; language codes should be lowercase, country codes can be uppercase or lowercase</td>
        </tr>
        <tr>
          <td>Conflicting signals</td>
          <td>Using different geotargeting methods that contradict each other</td>
          <td>Ensure alignment between hreflang, Search Console geotargeting, and other signals</td>
        </tr>
        <tr>
          <td>Improper implementation on canonicals</td>
          <td>Conflicts between canonical tags and hreflang</td>
          <td>Canonical tags should point to the version in the same language, not across languages</td>
        </tr>
        <tr>
          <td>Hreflang chains/loops</td>
          <td>Indirect references (A→B→C→A instead of direct A→B, A→C, B→A, B→C, etc.)</td>
          <td>Each page should directly reference every alternative version</td>
        </tr>
      </table>
      
      <h3>Special Cases</h3>
      
      <h4>1. Language-Only vs. Language-Region Targeting</h4>
      <ul>
        <li>Use language-only (<code>hreflang="en"</code>) when content is suitable for all speakers of that language regardless of location</li>
        <li>Use language-region (<code>hreflang="en-us"</code>) when content is specifically tailored to speakers of that language in a particular location</li>
        <li>You can use both: <code>hreflang="en"</code> for generic English content and <code>hreflang="en-us"</code>, <code>hreflang="en-gb"</code>, etc., for region-specific English content</li>
      </ul>
      
      <h4>2. The x-default Tag</h4>
      <p>The <code>hreflang="x-default"</code> attribute indicates the default page to show when no other language/region version matches the user:</p>
      <div class="code-box" style="background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; overflow-x: auto;">
        &lt;link rel="alternate" hreflang="x-default" href="https://example.com/international" /&gt;
      </div>
      <p>Best practices for x-default:</p>
      <ul>
        <li>Often points to a country/language selector page</li>
        <li>Can point to your primary language version if no selector page exists</li>
        <li>Should be included in your hreflang implementation</li>
      </ul>
      
      <h3>Checking Hreflang Implementation</h3>
      <p>Verify your implementation using:</p>
      <ol>
        <li>Google Search Console's International Targeting report and Coverage report</li>
        <li>Third-party hreflang validation tools</li>
        <li>Manual inspection of source code or XML sitemaps</li>
      </ol>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">Common Mistake</h4>
        <p>The most common hreflang error is failing to implement reciprocal references. Remember, if page A references page B, then page B must also reference page A (and all other language versions).</p>
      </div>`,
    estimatedTime: 40,
    sortOrder: 3,
    isActive: true,
    quiz: {
      id: 7003,
      lessonId: 703,
      questions: [
        {
          id: 70009,
          text: "What is the main purpose of the hreflang attribute in international SEO?",
          options: [
            "To speed up page loading times for international users",
            "To translate content automatically into different languages",
            "To tell search engines which language and geographic region a specific page targets",
            "To block specific countries from accessing your content"
          ],
          correctOptionIndex: 2,
          explanation: "The main purpose of the hreflang attribute is to tell search engines which language and geographic region a specific page targets, helping them show the right version of your content to the appropriate users."
        },
        {
          id: 70010,
          text: "What is a 'reciprocal reference' in hreflang implementation?",
          options: [
            "When each language version references all other language versions, including itself",
            "When only the main page has hreflang tags",
            "When hreflang tags are only implemented in the sitemap",
            "When you reference only the most important language versions"
          ],
          correctOptionIndex: 0,
          explanation: "A 'reciprocal reference' means each language version must reference all other language versions, including itself. This creates a complete circle of references, which is a critical requirement for proper hreflang implementation."
        },
        {
          id: 70011,
          text: "What does the hreflang=\"x-default\" attribute indicate?",
          options: [
            "That the page should never be shown in search results",
            "That the page is only for desktop users",
            "The default page to show when no other language/region version matches the user",
            "That the page is in an experimental language"
          ],
          correctOptionIndex: 2,
          explanation: "The hreflang=\"x-default\" attribute indicates the default page to show when no other language/region version matches the user. It's often used for a language/country selector page or your primary language version."
        },
        {
          id: 70012,
          text: "Which of the following is NOT a valid method for implementing hreflang?",
          options: [
            "In the HTML head section",
            "In HTTP headers for non-HTML files",
            "In the XML sitemap",
            "In the robots.txt file"
          ],
          correctOptionIndex: 3,
          explanation: "Implementing hreflang in the robots.txt file is not a valid method. The three valid methods are: in the HTML head section, in HTTP headers (for non-HTML files), and in the XML sitemap."
        },
        {
          id: 70013,
          text: "What format should be used for language and region codes in hreflang attributes?",
          options: [
            "ISO 639-1 for language, ISO 3166-1 Alpha-2 for regions (e.g., 'en-us')",
            "Full language names and country names (e.g., 'english-unitedstates')",
            "Three-letter codes for both (e.g., 'eng-usa')",
            "Custom codes defined by the website owner"
          ],
          correctOptionIndex: 0,
          explanation: "Language codes in hreflang attributes should follow the ISO 639-1 format (two-letter codes like 'en' for English), while region codes should follow the ISO 3166-1 Alpha-2 format (two-letter codes like 'us' for United States)."
        }
      ],
      passingScore: 80
    },
    additionalResources: [
      {
        title: "Hreflang Tags Generator",
        url: "https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/",
        type: "tool",
        description: "Free tool to generate proper hreflang tags for your pages"
      },
      {
        title: "Google's Official Hreflang Guide",
        url: "https://developers.google.com/search/docs/specialty/international/localized-versions",
        type: "guide",
        description: "Google's documentation on using hreflang for language and regional URLs"
      },
      {
        title: "Advanced Hreflang Implementation Guide",
        url: "https://www.semrush.com/blog/hreflang-ultimate-guide/",
        type: "article",
        description: "Comprehensive technical guide to implementing hreflang correctly"
      }
    ]
  }
];