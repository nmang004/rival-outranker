// SEO Knowledge Base - Extensive collection of SEO topics, advice, and best practices

export interface SeoTopic {
  id: string;
  name: string;
  description: string;
  subtopics: SeoSubtopic[];
}

export interface SeoSubtopic {
  id: string;
  name: string;
  content: string;
  examples?: string[];
  relatedSubtopics?: string[];
  keywords?: string[];
}

export const seoKnowledgeBase: SeoTopic[] = [
  {
    id: "on-page-seo",
    name: "On-Page SEO",
    description: "Optimizing individual web pages to rank higher and earn more relevant traffic",
    subtopics: [
      {
        id: "title-tags",
        name: "Title Tags",
        content: "Title tags are HTML elements that specify the title of a web page. They are crucial for SEO as they tell search engines what a page is about and appear as the clickable headline in search results. Best practices include: keeping them under 60 characters, putting important keywords near the beginning, making each title unique, and creating compelling titles that encourage clicks.",
        examples: [
          "\"Best Organic Dog Food Reviews 2025 | Top Brands Compared\"",
          "\"Emergency Plumbing Services in Boston | 24/7 Repairs\"",
          "\"Beginner's Guide to Digital Photography: Tips & Equipment\""
        ],
        keywords: ["title tags", "meta titles", "page titles", "HTML title"]
      },
      {
        id: "meta-descriptions",
        name: "Meta Descriptions",
        content: "Meta descriptions are HTML attributes that provide concise summaries of web pages. While they don't directly impact rankings, they significantly influence click-through rates from search results. Effective meta descriptions should be 120-155 characters, include relevant keywords naturally, contain a clear call-to-action, and accurately describe the page content.",
        examples: [
          "\"Looking for organic dog food? Our comprehensive review compares the top 10 brands for nutrition, ingredients, and value. Find the best option for your pet!\"",
          "\"Experiencing a plumbing emergency? Our licensed plumbers provide 24/7 emergency repairs throughout Boston. Fast response, fair pricing guaranteed!\"",
          "\"Learn digital photography fundamentals with our beginner's guide. Covers camera settings, composition techniques, and essential equipment recommendations.\""
        ],
        keywords: ["meta descriptions", "meta tags", "search snippets", "SERP description"]
      },
      {
        id: "header-tags",
        name: "Header Tags (H1, H2, H3)",
        content: "Header tags (H1, H2, H3, etc.) structure your content hierarchically and help search engines understand your content organization. The H1 should contain your primary keyword and clearly indicate what the page is about. H2s should organize main sections, while H3s and beyond structure subsections. Each page should have only one H1, with multiple H2s and H3s as needed for organization.",
        examples: [
          "H1: \"Complete Guide to WordPress SEO\"",
          "H2: \"On-Page Optimization Techniques\"",
          "H3: \"Optimizing Images for Better Performance\""
        ],
        keywords: ["header tags", "H1 tags", "heading hierarchy", "content structure", "headings SEO"]
      },
      {
        id: "keyword-optimization",
        name: "Keyword Optimization",
        content: "Keyword optimization involves strategically placing relevant keywords throughout your content to improve visibility in search results. Focus on using primary keywords in titles, headings, first 100 words, and naturally throughout the text. Include secondary and long-tail keywords to capture additional search traffic. Avoid keyword stuffing, which can result in penalties. Instead, focus on creating content that naturally incorporates relevant terms while addressing user intent.",
        examples: [
          "Primary keyword: 'bamboo flooring' - Used in title, H1, first paragraph, and 2-3 times in content",
          "Secondary keywords: 'eco-friendly flooring', 'bamboo hardwood', 'sustainable flooring options'",
          "Long-tail: 'how to install bamboo flooring in kitchen', 'cost of bamboo vs hardwood flooring'"
        ],
        keywords: ["keyword density", "LSI keywords", "keyword placement", "semantic keywords", "keyword stuffing"]
      },
      {
        id: "content-quality",
        name: "Content Quality & Length",
        content: "High-quality content is comprehensive, accurate, well-researched, and addresses user intent effectively. Google's algorithms increasingly favor in-depth content that thoroughly covers a topic. While there's no magic word count, studies suggest that longer content (1,500+ words) often ranks better for competitive terms. Focus on being thorough rather than hitting a specific length. Content should be well-structured with clear headings, short paragraphs, bullet points, and relevant images or videos to enhance readability.",
        examples: [
          "Ultimate guides that cover topics comprehensively (2,000+ words)",
          "Detailed how-to articles with step-by-step instructions",
          "In-depth product reviews that compare multiple options with pros/cons"
        ],
        keywords: ["content quality", "content length", "comprehensive content", "content depth", "word count SEO"]
      },
      {
        id: "image-optimization",
        name: "Image Optimization",
        content: "Image optimization improves user experience and SEO by ensuring images load quickly and are properly indexed. Best practices include: using descriptive file names (e.g., bamboo-flooring-installation.jpg instead of IMG001.jpg), adding alt text that describes the image and includes relevant keywords, compressing images to reduce file size without sacrificing quality, using appropriate dimensions, and implementing lazy loading for images below the fold.",
        examples: [
          "Alt text: 'Professional installation of bamboo flooring in modern kitchen'",
          "Compressed image reduced from 2MB to 200KB while maintaining quality",
          "Image file named 'organic-dog-food-comparison-chart.jpg'"
        ],
        keywords: ["image alt text", "image compression", "image SEO", "lazy loading", "WebP format"]
      },
      {
        id: "internal-linking",
        name: "Internal Linking",
        content: "Internal linking connects your content and helps establish information hierarchy for search engines. It spreads link equity throughout your site, helps search engines discover new pages, and improves user navigation. Best practices include: using descriptive anchor text that includes target keywords, linking to relevant and valuable pages, creating a logical site structure, ensuring every page is accessible within 3-4 clicks from the homepage, and regularly auditing for broken links.",
        examples: [
          "Using 'bamboo flooring maintenance tips' as anchor text instead of 'click here'",
          "Creating topic clusters with pillar content and related posts",
          "Adding 'related articles' sections at the end of blog posts"
        ],
        keywords: ["internal links", "site structure", "anchor text", "pillar content", "topic clusters"]
      },
      {
        id: "mobile-optimization",
        name: "Mobile Optimization",
        content: "With Google's mobile-first indexing, optimizing for mobile devices is crucial. This includes implementing responsive design that adapts to all screen sizes, ensuring text is readable without zooming, setting appropriate viewport tags, making sure buttons and links are easily tappable with adequate spacing, minimizing pop-ups on mobile, and testing your site on various devices and browsers. Page speed is particularly important for mobile users who may have slower connections.",
        examples: [
          "Responsive design that adapts layout for phones, tablets, and desktops",
          "Touch-friendly navigation with buttons at least 44px × 44px",
          "Simplified menus for mobile users"
        ],
        keywords: ["mobile-first indexing", "responsive design", "mobile UX", "mobile SEO", "viewport meta tag"]
      }
    ]
  },
  {
    id: "technical-seo",
    name: "Technical SEO",
    description: "Optimizing website and server settings to help search engine spiders crawl and index your site more effectively",
    subtopics: [
      {
        id: "site-speed",
        name: "Site Speed Optimization",
        content: "Page speed is a ranking factor for both desktop and mobile searches. Slow-loading sites increase bounce rates and reduce conversions. Common optimization techniques include: minimizing HTTP requests, enabling compression, minifying CSS/JavaScript/HTML, optimizing images, leveraging browser caching, reducing server response time, implementing Content Delivery Networks (CDNs), prioritizing above-the-fold content, and eliminating render-blocking resources. Use tools like Google PageSpeed Insights, GTmetrix, and Lighthouse to identify specific optimization opportunities.",
        examples: [
          "Compressing images reduced page load time from 4.2s to 1.8s",
          "Minifying and combining CSS/JS files decreased HTTP requests by 60%",
          "Implementing a CDN improved global load times by 45%"
        ],
        keywords: ["page speed", "core web vitals", "LCP", "FID", "CLS", "site performance", "speed optimization"]
      },
      {
        id: "crawlability",
        name: "Crawlability & Indexation",
        content: "Search engines need to crawl and index your pages before they can rank. Common issues that hinder crawlability include: incorrect robots.txt files, poor internal linking, broken links, duplicate content, and server errors. To improve crawlability: create and submit XML sitemaps, ensure your robots.txt correctly guides crawlers, maintain a logical site structure, regularly check for crawl errors in Google Search Console, implement pagination correctly, and ensure all important pages are indexable. For large sites, strategic use of 'noindex' on low-value pages can help preserve crawl budget.",
        examples: [
          "Robots.txt configuration allowing crawling of important sections while blocking low-value pages",
          "XML sitemap organization by content type (products, categories, blog posts)",
          "Using Search Console to identify and fix crawl errors"
        ],
        keywords: ["robots.txt", "XML sitemaps", "crawl budget", "noindex", "Google Search Console", "crawl errors"]
      },
      {
        id: "core-web-vitals",
        name: "Core Web Vitals",
        content: "Core Web Vitals are a set of specific factors that Google considers important for overall user experience. The three main metrics are: Largest Contentful Paint (LCP - loading performance, should be under 2.5 seconds), First Input Delay (FID - interactivity, should be under 100ms), and Cumulative Layout Shift (CLS - visual stability, should be under 0.1). These metrics affect rankings and are measured based on real-world usage data from Chrome users. Improving these metrics typically involves optimizing code, images, and third-party scripts.",
        examples: [
          "Preloading hero images to improve LCP from 3.2s to 1.8s",
          "Deferring non-critical JavaScript to reduce FID from 150ms to 70ms",
          "Adding size attributes to images and embeds to minimize CLS from 0.15 to 0.05"
        ],
        keywords: ["LCP", "FID", "CLS", "web vitals", "page experience", "performance metrics"]
      },
      {
        id: "secure-https",
        name: "HTTPS Security",
        content: "HTTPS is a ranking signal and is essential for website security and user trust. If you haven't migrated from HTTP to HTTPS, you should prioritize this. When implementing HTTPS: purchase and install an SSL certificate (or use free options like Let's Encrypt), ensure all internal links, images, and resources use HTTPS URLs, set up 301 redirects from HTTP to HTTPS versions, update canonical tags, and submit the HTTPS version in Google Search Console. After migration, monitor for mixed content warnings and security issues.",
        examples: [
          "Full site migration from HTTP to HTTPS with proper 301 redirects",
          "Resolving mixed content warnings by updating all resource URLs",
          "Implementing HSTS (HTTP Strict Transport Security) for enhanced security"
        ],
        keywords: ["SSL", "TLS", "HTTPS migration", "SSL certificate", "secure browsing", "mixed content"]
      },
      {
        id: "mobile-friendliness",
        name: "Mobile-First Indexing",
        content: "Google now uses the mobile version of content for indexing and ranking. To ensure mobile-first readiness: implement responsive design rather than separate mobile sites, ensure content parity between mobile and desktop versions, avoid hiding content behind tabs on mobile, check that structured data and metadata are consistent across versions, ensure adequate font sizes and tap target spacing, and optimize images specifically for mobile devices. Regularly test your site using Google's Mobile-Friendly Test tool.",
        examples: [
          "Implementing responsive design instead of separate m.domain.com",
          "Ensuring all content is accessible on mobile, not just desktop",
          "Optimizing navigation for thumb-friendly mobile interaction"
        ],
        keywords: ["mobile-first index", "responsive design", "mobile parity", "mobile usability", "mobile testing"]
      }
    ]
  },
  {
    id: "link-building",
    name: "Link Building",
    description: "Strategies for acquiring high-quality backlinks to improve site authority and rankings",
    subtopics: [
      {
        id: "backlink-quality",
        name: "Backlink Quality Factors",
        content: "Not all backlinks are created equal. Quality factors include: domain authority of the linking site, relevance to your content/industry, dofollow vs. nofollow status, anchor text used, placement within content vs. footers/sidebars, the number of other links on the page, and whether the link is editorial (naturally given) or artificially created. Focus on acquiring links from authoritative, relevant sites where the link is contextual and editorially given. A few high-quality links often provide more value than many low-quality ones.",
        examples: [
          "High-quality link: Editorial mention from an industry publication with relevant anchor text",
          "Medium-quality link: Directory listing in a niche-relevant directory",
          "Low-quality link: Footer link from an unrelated website"
        ],
        keywords: ["backlink quality", "link authority", "link relevance", "dofollow links", "editorial links", "contextual links"]
      },
      {
        id: "content-driven-link-building",
        name: "Content-Driven Link Building",
        content: "Creating linkable assets is one of the most sustainable link building strategies. Types of content that naturally attract links include: original research and industry studies, comprehensive guides and tutorials, infographics and data visualizations, tools and calculators, templates and resources, expert roundups, and controversial or unique perspectives on industry topics. After creating linkable content, promote it through outreach, social media, email newsletters, and relevant communities to increase visibility and link potential.",
        examples: [
          "Industry survey generating 50+ backlinks from news sites and blogs",
          "Interactive tool that bloggers and news sites reference as a resource",
          "Ultimate guide that becomes the go-to reference for a specific topic"
        ],
        keywords: ["linkable assets", "content marketing", "link magnets", "resource link building", "evergreen content"]
      },
      {
        id: "outreach-strategies",
        name: "Outreach Strategies",
        content: "Effective outreach is crucial for earning quality backlinks. Best practices include: personalizing each outreach email beyond just using the recipient's name, clearly demonstrating how your content adds value to their audience, keeping emails concise with specific requests, following up thoughtfully (1-2 times maximum), building relationships before asking for links, and using attention-grabbing subject lines. Track all outreach in a system to manage follow-ups and relationships. Aim for a conversational tone rather than a templated approach.",
        examples: [
          "Resource page outreach: 'I noticed your helpful resources on [topic] and wanted to suggest an additional tool'",
          "Broken link outreach: 'I found a broken link on your [specific page] and have a replacement suggestion'",
          "Expert contribution: 'Would you be interested in expert insights on [topic] for your upcoming content?'"
        ],
        keywords: ["email outreach", "link request", "outreach templates", "personalization", "follow-up strategy", "relationship building"]
      },
      {
        id: "guest-posting",
        name: "Guest Posting Strategies",
        content: "Despite some abuse, ethical guest posting remains an effective link building tactic. For successful guest posting: focus on relevant, high-quality sites in your industry, pitch unique topics that provide genuine value to the target audience, follow the site's guidelines meticulously, deliver well-written, comprehensive content that matches the site's style, include contextual links only when relevant (not just in author bios), and build ongoing relationships for repeat opportunities. Avoid mass guest posting on low-quality sites as this can trigger Google penalties.",
        examples: [
          "Data-driven guest post on industry trends for a major publication",
          "Expert guide published on complementary business' blog with mutual audience benefits",
          "Series of guest articles establishing thought leadership on industry platforms"
        ],
        keywords: ["guest blogging", "contributor posts", "guest article", "editorial guidelines", "content pitching", "author bio"]
      },
      {
        id: "broken-link-building",
        name: "Broken Link Building",
        content: "Broken link building involves finding broken links on other websites and suggesting your content as a replacement. The process includes: using tools like Ahrefs or Check My Links to find broken links on relevant sites, creating high-quality content that serves as a suitable replacement, contacting the webmaster to alert them to the broken link, and suggesting your content as an alternative. This technique works because you're helping fix a problem while suggesting your link, creating a win-win situation for both parties.",
        examples: [
          "Finding a broken link to a resource guide and offering your updated guide as a replacement",
          "Recreating lost content found through archive.org and reaching out to sites still linking to the dead page",
          "Building a better version of a popular but outdated resource that has many broken links pointing to it"
        ],
        keywords: ["broken links", "404 pages", "link reclamation", "content replacement", "dead link strategy"]
      }
    ]
  },
  {
    id: "local-seo",
    name: "Local SEO",
    description: "Strategies to improve visibility for location-based searches and businesses with physical locations",
    subtopics: [
      {
        id: "google-business-profile",
        name: "Google Business Profile Optimization",
        content: "Google Business Profile (formerly Google My Business) is essential for local SEO. Optimization best practices include: claiming and verifying your listing, selecting accurate primary and secondary categories, providing complete NAP (Name, Address, Phone) information, writing a keyword-rich business description, adding high-quality photos and videos, collecting and responding to reviews, posting regular updates, utilizing attributes to highlight business features, and completing all relevant sections (services, products, menu, etc.). Monitor insights to track performance and adjust strategy accordingly.",
        examples: [
          "Complete GBP profile with 30+ photos, weekly posts, and 50+ reviews",
          "Service-specific business descriptions with local keywords",
          "Comprehensive attribute selection highlighting accessibility, payment options, etc."
        ],
        keywords: ["Google Business Profile", "GMB optimization", "local listing", "Google Maps SEO", "local 3-pack", "GBP posts"]
      },
      {
        id: "local-citations",
        name: "Local Citations & Directories",
        content: "Local citations are mentions of your business NAP (Name, Address, Phone) information online. They help establish business legitimacy and improve local rankings. Citation best practices include: ensuring NAP consistency across all platforms, focusing on quality over quantity, prioritizing industry-specific and local directories, regularly auditing and correcting citation errors, selecting consistent business categories across platforms, and including additional information like business hours and descriptions where possible. Start with tier-one directories (Google, Yelp, Facebook, Apple Maps) before moving to industry-specific ones.",
        examples: [
          "NAP-consistent listings across 50+ relevant local directories",
          "Industry-specific directory listings (e.g., TripAdvisor for restaurants)",
          "Local chamber of commerce and community directory listings"
        ],
        keywords: ["NAP consistency", "business directories", "citation building", "local listings", "structured citations", "unstructured citations"]
      },
      {
        id: "local-link-building",
        name: "Local Link Building Strategies",
        content: "Local links are particularly valuable for businesses targeting specific geographic areas. Effective local link building tactics include: sponsoring local events, teams, or charities, joining local business associations and chambers of commerce, creating location-specific resource content, getting featured in local news media, participating in community initiatives and events, forming partnerships with complementary local businesses, and getting listed in local 'best of' guides. These links not only improve rankings but also drive relevant local traffic likely to convert.",
        examples: [
          "Sponsorship link from local charity event website",
          "Feature article in local news publication about business milestone",
          "Backlink from neighborhood association website for community involvement"
        ],
        keywords: ["local backlinks", "community involvement", "sponsorship links", "local organizations", "city-specific backlinks"]
      },
      {
        id: "review-management",
        name: "Review Management",
        content: "Online reviews impact both rankings and conversion rates for local businesses. Effective review management includes: implementing a systematic process for requesting reviews from satisfied customers, monitoring reviews across all platforms (Google, Yelp, Facebook, industry-specific sites), responding promptly and professionally to all reviews (both positive and negative), addressing negative feedback constructively, incorporating keywords naturally in review responses, and using review insights to improve business operations. Never incentivize reviews or use fake reviews as these violate platform policies and can result in penalties.",
        examples: [
          "Systematic email follow-up system generating 15 new reviews monthly",
          "Professional response template strategy for negative reviews",
          "Review monitoring system covering 5+ platforms"
        ],
        keywords: ["online reviews", "review generation", "reputation management", "review responses", "negative reviews", "review platforms"]
      },
      {
        id: "local-on-page-seo",
        name: "Local On-Page SEO",
        content: "On-page optimization for local businesses should focus on geographic relevance. Key strategies include: incorporating location-based keywords in title tags, headings, and content, creating location-specific pages for businesses serving multiple areas, adding a locally-optimized About Us page, embedding Google Maps on contact pages, implementing local business schema markup, ensuring mobile optimization, including location information in image alt text where relevant, and maintaining consistent NAP information throughout the site. For multi-location businesses, create unique content for each location page rather than using templates.",
        examples: [
          "Service page optimization with city-specific keywords naturally incorporated",
          "Location page with unique local content, embedded map, and location schema",
          "About page highlighting local community involvement and history"
        ],
        keywords: ["local keywords", "location pages", "city landing pages", "localized content", "local schema markup", "city modifiers"]
      }
    ]
  },
  {
    id: "content-strategy",
    name: "Content Strategy",
    description: "Planning, creating, and optimizing content to drive organic traffic and conversions",
    subtopics: [
      {
        id: "keyword-research",
        name: "Keyword Research",
        content: "Effective keyword research forms the foundation of content strategy. Best practices include: focusing on search intent rather than just volume, categorizing keywords by funnel stage (awareness, consideration, decision), identifying long-tail opportunities with less competition, analyzing keyword difficulty relative to your site's authority, looking for question-based keywords that align with featured snippet opportunities, evaluating SERP features for target terms, and monitoring trending topics in your industry. Use tools like Semrush, Ahrefs, or Google Keyword Planner to identify opportunities, then organize keywords into thematic clusters for content planning.",
        examples: [
          "Comprehensive keyword mapping document organizing terms by intent and funnel stage",
          "Content gap analysis identifying keywords competitors rank for but you don't",
          "Quarterly keyword trend analysis revealing seasonal opportunities"
        ],
        keywords: ["keyword intent", "search volume", "keyword difficulty", "long-tail keywords", "keyword mapping", "search trends"]
      },
      {
        id: "content-audit",
        name: "Content Audit & Optimization",
        content: "Regular content audits help identify improvement opportunities in existing content. The audit process includes: cataloging all content with associated metrics (traffic, conversions, backlinks, etc.), categorizing content as keep, update, consolidate, or remove, identifying thin content that needs expansion, finding outdated information requiring updates, spotting keyword cannibalization issues, and prioritizing updates based on traffic potential. After auditing, implement a systematic approach to refreshing content, combining similar pieces to prevent cannibalization, and redirecting or removing underperforming pages that don't serve user intent.",
        examples: [
          "Quarterly audit spreadsheet tracking performance metrics for 200+ content pieces",
          "Content consolidation project merging 5 similar posts into one comprehensive guide",
          "Historical optimization increasing organic traffic to key pages by 40%"
        ],
        keywords: ["content inventory", "historical optimization", "content pruning", "content consolidation", "content refresh", "thin content"]
      },
      {
        id: "topic-clusters",
        name: "Topic Clusters & Pillar Content",
        content: "Topic clusters organize content around core topics to build topical authority. Implementation involves: identifying main topics relevant to your business (pillar topics), creating comprehensive pillar pages that broadly cover each topic, developing cluster content pieces that address specific aspects of the main topic in detail, linking cluster content to pillar pages with semantically relevant anchor text, interlinking related cluster content, and updating the structure as new content is published. This approach helps search engines understand the breadth and depth of your topical expertise while creating an intuitive site architecture for users.",
        examples: [
          "Pillar page on 'Email Marketing' with 15 linked cluster content pieces on specific subtopics",
          "Hub-and-spoke content model with comprehensive guide at center linked to related articles",
          "Topical map visualization showing relationship between content pieces"
        ],
        keywords: ["content pillars", "hub and spoke model", "topical authority", "content clusters", "semantic SEO", "content hierarchy"]
      },
      {
        id: "search-intent-optimization",
        name: "Search Intent Optimization",
        content: "Aligning content with search intent is crucial for ranking success. The four main intent types are: informational (seeking knowledge), navigational (looking for a specific site), commercial (researching before purchasing), and transactional (ready to buy). To optimize for intent: analyze the current SERP for each target keyword, note the content format (guides, listicles, comparison posts, etc.), examine content elements (images, videos, tools, etc.), identify the content angle that dominates, and tailor your content to match the dominant intent while providing unique value. Different stages of the buyer's journey require different content approaches.",
        examples: [
          "SERP analysis document categorizing target keywords by intent type",
          "Informational content optimized with comprehensive guides and visualizations",
          "Transactional content designed with strong CTAs and trust signals"
        ],
        keywords: ["user intent", "SERP analysis", "content format", "buyer's journey", "informational content", "transactional content"]
      },
      {
        id: "content-creation-workflow",
        name: "Content Creation Workflow",
        content: "A systematic content creation process ensures consistency and quality. An effective workflow includes: keyword and topic research to identify opportunities, developing comprehensive content briefs with keyword guidance, competitor analysis of top-ranking content, creating original outlines, drafting content optimized for both users and search engines, incorporating visuals and multimedia elements, implementing thorough editing and fact-checking processes, optimizing on-page SEO elements, and establishing a regular publishing schedule. For larger teams, create standard operating procedures and templates to maintain consistency across writers and content types.",
        examples: [
          "Comprehensive content brief template guiding writers on intent, keywords, and structure",
          "Editorial calendar mapping content to business goals and seasonal trends",
          "Quality assurance checklist covering factual accuracy, grammar, and SEO elements"
        ],
        keywords: ["content brief", "editorial process", "content calendar", "content production", "content workflow", "style guide"]
      }
    ]
  }
];

// Specific advice for different industries
export const industrySpecificAdvice = {
  ecommerce: {
    name: "E-commerce SEO",
    tips: [
      "Implement proper category and product page hierarchies with breadcrumb navigation",
      "Use schema.org Product markup with pricing, availability, and review information",
      "Create unique content for product pages, avoiding manufacturer descriptions",
      "Optimize for transactional keywords with purchase intent",
      "Implement faceted navigation with proper SEO controls",
      "Focus on site speed optimization for better conversion rates",
      "Use canonical tags to manage product variations and pagination",
      "Create buying guides and comparison content to capture top-of-funnel traffic"
    ]
  },
  localBusiness: {
    name: "Local Business SEO",
    tips: [
      "Fully optimize Google Business Profile with photos, posts, and complete information",
      "Build consistent NAP citations across local directories",
      "Create location-specific landing pages for multi-location businesses",
      "Implement LocalBusiness schema markup with proper geolocation data",
      "Generate and respond to customer reviews on Google and other platforms",
      "Create locally-relevant content mentioning neighborhood landmarks and concerns",
      "Build relationships with local businesses for community-based backlinks",
      "Optimize for 'near me' and location-specific keyword variations"
    ]
  },
  b2b: {
    name: "B2B SEO",
    tips: [
      "Focus on industry-specific long-tail keywords with high intent",
      "Create detailed case studies demonstrating concrete business results",
      "Develop comprehensive resource centers addressing industry challenges",
      "Publish original research and data to establish authority and generate backlinks",
      "Implement lead magnet strategies with gated content for key conversion points",
      "Optimize for longer sales cycles with nurturing content sequences",
      "Focus on building industry backlinks from trade publications and associations",
      "Create content addressing specific job titles and decision-maker concerns"
    ]
  },
  saas: {
    name: "SaaS SEO",
    tips: [
      "Create feature-specific landing pages targeting solution-oriented keywords",
      "Develop comparison content addressing alternatives and competitors",
      "Implement pricing page schema and transparent feature comparisons",
      "Build integration pages for each platform your software connects with",
      "Create comprehensive resource centers with API documentation and guides",
      "Develop use-case specific content targeting different user segments",
      "Focus on keywords related to problems your software solves",
      "Implement strategic free tools to generate leads and backlinks"
    ]
  },
  healthcare: {
    name: "Healthcare SEO",
    tips: [
      "Prioritize E-E-A-T signals with clear medical credentials and expertise",
      "Ensure all health content is medically accurate and cited properly",
      "Focus on local SEO for physical practices and facilities",
      "Implement appropriate schema for medical practices, practitioners, and services",
      "Create condition and treatment-specific content addressing patient concerns",
      "Comply with industry regulations (HIPAA, etc.) in all content",
      "Build backlinks from reputable health organizations and publications",
      "Create content that addresses common patient questions and concerns"
    ]
  }
};

// SEO tools organized by category
export const seoTools = {
  keyword: [
    {
      name: "SEMrush",
      url: "https://www.semrush.com/",
      description: "Comprehensive SEO suite with strong keyword research capabilities and competitive analysis"
    },
    {
      name: "Ahrefs",
      url: "https://ahrefs.com/",
      description: "Powerful SEO tool focused on backlink analysis, keyword research, and SERP monitoring"
    },
    {
      name: "Google Keyword Planner",
      url: "https://ads.google.com/home/tools/keyword-planner/",
      description: "Free keyword research tool from Google providing volume ranges and competition data"
    },
    {
      name: "Moz Keyword Explorer",
      url: "https://moz.com/explorer",
      description: "Keyword research tool with useful metrics like keyword difficulty and organic CTR"
    }
  ],
  technical: [
    {
      name: "Screaming Frog",
      url: "https://www.screamingfrog.co.uk/seo-spider/",
      description: "Powerful desktop-based crawler for comprehensive technical SEO audits"
    },
    {
      name: "Google Search Console",
      url: "https://search.google.com/search-console/",
      description: "Free Google tool providing indexation, performance, and technical issue data"
    },
    {
      name: "Sitebulb",
      url: "https://sitebulb.com/",
      description: "Website crawler with visual representations and detailed technical SEO audits"
    },
    {
      name: "PageSpeed Insights",
      url: "https://pagespeed.web.dev/",
      description: "Google tool for analyzing page speed and Core Web Vitals performance"
    }
  ],
  content: [
    {
      name: "Clearscope",
      url: "https://www.clearscope.io/",
      description: "AI-powered content optimization tool focused on semantic relevance and topic coverage"
    },
    {
      name: "Surfer SEO",
      url: "https://surferseo.com/",
      description: "Content and on-page optimization tool analyzing top-ranking pages for content factors"
    },
    {
      name: "Frase",
      url: "https://www.frase.io/",
      description: "AI content tool focused on search intent optimization and comprehensive topic coverage"
    },
    {
      name: "Hemingway Editor",
      url: "https://hemingwayapp.com/",
      description: "Free tool to improve content readability and clarity"
    }
  ],
  local: [
    {
      name: "BrightLocal",
      url: "https://www.brightlocal.com/",
      description: "Local SEO platform for citation building, rank tracking, and reputation management"
    },
    {
      name: "Whitespark",
      url: "https://whitespark.ca/",
      description: "Specialized local SEO tools for citation building and local rank tracking"
    },
    {
      name: "Google Business Profile Manager",
      url: "https://business.google.com/",
      description: "Official Google tool for managing your business listings"
    },
    {
      name: "Moz Local",
      url: "https://moz.com/products/local",
      description: "Tool for managing local business listings and citation consistency"
    }
  ]
};