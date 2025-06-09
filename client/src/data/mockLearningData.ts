// Mock data for the learning path feature
// This will be replaced with real API data later
import { 
  LearningModule, 
  LearningLesson, 
  LearningPath,
  UserLearningProgress,
  LearningRecommendation
} from "@/types/learningTypes";

export const mockModules: LearningModule[] = [
  {
    id: 1,
    title: "SEO Fundamentals",
    description: "Learn the core principles of SEO that every website owner should know. This introductory module covers the basic concepts, terminology, and best practices that form the foundation of successful search engine optimization strategies.",
    imageUrl: undefined,
    difficulty: "Beginner",
    estimatedTime: 90,
    prerequisiteIds: [],
    sortOrder: 1,
    isActive: true
  },
  {
    id: 2,
    title: "Keyword Research Mastery",
    description: "Discover how to find the most valuable keywords for your business. Learn effective research techniques, competitor analysis, and how to prioritize keywords based on search volume, difficulty, and user intent.",
    imageUrl: undefined,
    difficulty: "Beginner",
    estimatedTime: 120,
    prerequisiteIds: [1],
    sortOrder: 2,
    isActive: true
  },
  {
    id: 3,
    title: "On-Page SEO Optimization",
    description: "Master the art of optimizing individual web pages to rank higher and earn more relevant traffic. This comprehensive module covers title tag optimization, meta description crafting, heading structure, content optimization, keyword placement, internal linking strategies, image optimization, URL structure, schema markup implementation, and user engagement metrics improvement techniques.",
    imageUrl: undefined,
    difficulty: "Intermediate",
    estimatedTime: 150,
    prerequisiteIds: [1, 2],
    sortOrder: 3,
    isActive: true
  },
  {
    id: 4,
    title: "Technical SEO Essentials",
    description: "Understand the technical aspects of SEO including site speed, mobile optimization, structured data, XML sitemaps, robots.txt, and website architecture. Learn how to identify and fix common technical SEO issues.",
    imageUrl: undefined,
    difficulty: "Intermediate",
    estimatedTime: 180,
    prerequisiteIds: [1],
    sortOrder: 4,
    isActive: true
  },
  {
    id: 5,
    title: "Link Building Strategies",
    description: "Learn proven tactics to build high-quality backlinks to your website. Explore content-based link building, outreach techniques, guest posting, broken link building, and how to evaluate link quality.",
    imageUrl: undefined,
    difficulty: "Advanced",
    estimatedTime: 210,
    prerequisiteIds: [1, 3],
    sortOrder: 5,
    isActive: true
  },
  {
    id: 6,
    title: "Local SEO Optimization",
    description: "Master the techniques for improving your business's visibility in local search results. Learn about Google My Business, local citations, review management, and location-specific keyword optimization.",
    imageUrl: undefined,
    difficulty: "Intermediate",
    estimatedTime: 120,
    prerequisiteIds: [1, 2, 3],
    sortOrder: 6,
    isActive: true
  },
  {
    id: 7,
    title: "International SEO & Multilingual Optimization",
    description: "Learn how to expand your online presence globally with effective international SEO strategies. Master hreflang implementation, country-specific domains, language targeting, and cultural considerations for global markets.",
    imageUrl: undefined,
    difficulty: "Advanced",
    estimatedTime: 210,
    prerequisiteIds: [1, 2, 3, 4],
    sortOrder: 7,
    isActive: true
  },
  {
    id: 8,
    title: "SEO Analytics & Reporting",
    description: "Master the art of SEO measurement and reporting with Google Analytics and Search Console. Learn to track organic traffic, monitor keyword rankings, analyze user behavior, identify high-performing content, track conversions, and create dashboards that demonstrate ROI to stakeholders.",
    imageUrl: undefined,
    difficulty: "Intermediate",
    estimatedTime: 150,
    prerequisiteIds: [1],
    sortOrder: 8,
    isActive: true
  },
  {
    id: 9,
    title: "Mobile SEO & Core Web Vitals",
    description: "Master the techniques for optimizing your website for mobile users and meeting Google's Core Web Vitals requirements. Learn about responsive design, mobile-first indexing, page speed optimization, CLS reduction, FID improvements, and mobile UX best practices that directly impact search rankings.",
    imageUrl: undefined, 
    difficulty: "Advanced",
    estimatedTime: 180,
    prerequisiteIds: [1, 4],
    sortOrder: 9,
    isActive: true
  }
];

export const mockLessons: LearningLesson[] = [
  // Module 1: SEO Fundamentals
  {
    id: 101,
    moduleId: 1,
    title: "What is SEO?",
    description: "Introduction to search engine optimization and why it matters.",
    content: `<h2>Introduction to Search Engine Optimization</h2>
      <p>Search Engine Optimization (SEO) is the practice of increasing the quantity and quality of traffic to your website through organic search engine results. Unlike paid advertising, SEO focuses on improving your site's visibility in unpaid search results.</p>
      
      <h3>Why SEO Matters for Your Business</h3>
      <p>SEO is essential for several reasons:</p>
      <ul>
        <li><strong>Increased Visibility:</strong> Higher rankings mean more eyes on your content</li>
        <li><strong>Credibility & Trust:</strong> Users trust websites that appear at the top of search results</li>
        <li><strong>Better User Experience:</strong> Good SEO practices improve website usability</li>
        <li><strong>Cost-Effectiveness:</strong> Once established, organic traffic continues without per-click costs</li>
        <li><strong>Competitive Advantage:</strong> Outranking competitors can significantly impact market share</li>
      </ul>
      
      <h3>Core Components of SEO:</h3>
      <ul>
        <li><strong>Technical SEO:</strong> Ensuring your website is crawlable, indexable, and meets technical requirements including site speed, mobile-friendliness, and secure connections</li>
        <li><strong>On-page SEO:</strong> Optimizing individual pages through content quality, keyword usage, meta tags, heading structure, and internal linking</li>
        <li><strong>Off-page SEO:</strong> Building external signals like backlinks, social mentions, and online reputation that indicate your site's authority and relevance</li>
        <li><strong>User Experience:</strong> Creating content that satisfies user intent and provides a positive interaction with your site</li>
      </ul>
      
      <h3>How Search Engines Work</h3>
      <p>Search engines like Google use complex algorithms to determine which pages to show for specific search queries. These algorithms consider hundreds of factors and are constantly evolving. The basic process includes:</p>
      <ol>
        <li><strong>Crawling:</strong> Search engines send bots to discover and scan web pages</li>
        <li><strong>Indexing:</strong> Content is analyzed and stored in the search engine's database</li>
        <li><strong>Ranking:</strong> When a user searches, the engine determines the most relevant results based on numerous factors</li>
        <li><strong>Serving:</strong> Results are presented to the user, often with additional features like rich snippets</li>
      </ol>
      
      <h3>Key Ranking Factors</h3>
      <p>While Google doesn't reveal all ranking factors, we know these elements are important:</p>
      <ul>
        <li>Content relevance and quality</li>
        <li>Backlink quantity and quality</li>
        <li>Mobile-friendliness</li>
        <li>Page speed and performance</li>
        <li>User behavior metrics (click-through rates, time on page, etc.)</li>
        <li>Secure website (HTTPS)</li>
        <li>Site structure and navigation</li>
        <li>Content freshness and updates</li>
      </ul>
      
      <p>Understanding these fundamentals will help you build a strong foundation for your SEO strategy.</p>`,
    estimatedTime: 15,
    sortOrder: 1,
    isActive: true,
    quiz: {
      id: 1001,
      lessonId: 101,
      questions: [
        {
          id: 10001,
          text: "What is the primary goal of SEO?",
          options: [
            "To increase website loading speed",
            "To increase the quantity and quality of organic traffic to a website",
            "To create more backlinks from other websites",
            "To reduce ad spending on paid search"
          ],
          correctOptionIndex: 1,
          explanation: "The primary goal of SEO is to increase both the quantity and quality of traffic coming to your website through organic (non-paid) search engine results."
        },
        {
          id: 10002,
          text: "Which of these is NOT one of the core components of SEO discussed in the lesson?",
          options: [
            "Technical SEO",
            "On-page SEO",
            "Paid advertising",
            "Off-page SEO"
          ],
          correctOptionIndex: 2,
          explanation: "Paid advertising is not considered a component of SEO, which focuses exclusively on organic (non-paid) methods of improving visibility in search results."
        },
        {
          id: 10003,
          text: "What is the first step in how search engines process web content?",
          options: [
            "Ranking",
            "Crawling",
            "Indexing",
            "Serving"
          ],
          correctOptionIndex: 1,
          explanation: "The first step in the search engine process is crawling, where search bots discover and scan web pages before they can be indexed and ranked."
        }
      ],
      passingScore: 70
    },
    additionalResources: [
      {
        title: "Google's Search Engine Optimization Starter Guide",
        url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        type: "guide",
        description: "Official guide from Google covering SEO fundamentals and best practices"
      },
      {
        title: "How Search Engines Work: Crawling, Indexing, and Ranking",
        url: "https://moz.com/beginners-guide-to-seo/how-search-engines-operate",
        type: "article",
        description: "In-depth explanation of search engine operations from Moz's Beginner's Guide to SEO"
      },
      {
        title: "The Three Pillars of SEO (Technical, On-Page, Off-Page)",
        url: "https://www.semrush.com/blog/the-three-pillars-of-seo/",
        type: "article",
        description: "Detailed breakdown of the three core components of effective SEO"
      }
    ]
  },
  {
    id: 102,
    moduleId: 1,
    title: "How Search Engines Work",
    description: "Understanding the basics of search engine crawling, indexing, and ranking.",
    content: `<h2>The Search Engine Process</h2>
      <p>Search engines work through three primary functions:</p>
      <h3>1. Crawling</h3>
      <p>Search engines use bots (sometimes called spiders or crawlers) to discover content on the web by following links. These bots scan websites and collect information about their content.</p>
      <h3>2. Indexing</h3>
      <p>The information collected during crawling is stored in a massive database called an index. This allows search engines to quickly retrieve relevant pages when a user performs a search.</p>
      <h3>3. Ranking</h3>
      <p>When someone performs a search, the search engine uses complex algorithms to determine which pages from its index should appear for that specific query and in what order.</p>
      <p>Google's algorithm uses over 200 factors to rank content, including keyword usage, page speed, backlinks, user experience, and much more.</p>`,
    estimatedTime: 20,
    sortOrder: 2,
    isActive: true
  },
  {
    id: 103,
    moduleId: 1,
    title: "White Hat vs. Black Hat SEO",
    description: "Understanding ethical SEO practices versus risky tactics.",
    content: `<h2>Ethical vs. Unethical SEO Approaches</h2>
      <h3>White Hat SEO</h3>
      <p>White Hat SEO refers to ethical optimization strategies that focus on a human audience and follow search engine guidelines. These techniques include:</p>
      <ul>
        <li>Creating high-quality, relevant content</li>
        <li>Optimizing site structure and navigation</li>
        <li>Building legitimate backlinks through valuable content</li>
        <li>Improving user experience</li>
        <li>Ensuring fast page load speeds</li>
      </ul>
      <h3>Black Hat SEO</h3>
      <p>Black Hat SEO involves manipulative tactics that attempt to trick search engines into giving a site higher rankings. These tactics include:</p>
      <ul>
        <li>Keyword stuffing</li>
        <li>Hidden text or links</li>
        <li>Cloaking (showing different content to users vs. search engines)</li>
        <li>Buying links from link farms</li>
        <li>Duplicate content</li>
      </ul>
      <p class="warning"><strong>Warning:</strong> Black hat techniques can lead to penalties or even complete removal from search engine results!</p>`,
    estimatedTime: 15,
    sortOrder: 3,
    isActive: true
  },
  {
    id: 104,
    moduleId: 1,
    title: "The SEO Landscape in 2025",
    description: "Current trends and future directions in search engine optimization.",
    content: `<h2>Modern SEO Trends and Future Directions</h2>
      <p>SEO continues to evolve as search engines update their algorithms and user behavior changes. Here are the key trends shaping SEO in 2025:</p>
      <h3>AI and Machine Learning</h3>
      <p>Google's AI systems like BERT and MUM are dramatically improving the search engine's ability to understand context and user intent, making keyword stuffing obsolete and rewarding truly helpful content.</p>
      <h3>Mobile-First Indexing</h3>
      <p>With most searches now occurring on mobile devices, Google indexes and ranks content based on the mobile version of websites rather than desktop versions.</p>
      <h3>User Experience Signals</h3>
      <p>Core Web Vitals and other user experience metrics are now official ranking factors, emphasizing the importance of fast, stable, and interactive websites.</p>
      <h3>E-A-T (Expertise, Authority, Trustworthiness)</h3>
      <p>Particularly for "Your Money or Your Life" (YMYL) topics, search engines increasingly evaluate content based on the expertise of its creators and the authority of the publishing website.</p>
      <h3>Voice Search Optimization</h3>
      <p>As smart speakers and voice assistants gain popularity, optimizing for conversational queries and featured snippets becomes more important.</p>`,
    estimatedTime: 20,
    sortOrder: 4,
    isActive: true
  },
  {
    id: 105,
    moduleId: 1,
    title: "Essential SEO Tools and Resources",
    description: "Overview of the most important tools for SEO analysis and optimization.",
    content: `<h2>The SEO Toolkit</h2>
      <p>Successful SEO practitioners rely on a variety of tools to research, implement, and monitor their optimization efforts. Here are the essential categories and recommended tools:</p>
      <h3>Keyword Research Tools</h3>
      <ul>
        <li><strong>Google Keyword Planner:</strong> Free tool for keyword ideas and volume data</li>
        <li><strong>Ahrefs Keywords Explorer:</strong> Comprehensive keyword research with difficulty metrics</li>
        <li><strong>Semrush:</strong> Powerful competitor keyword analysis</li>
        <li><strong>Moz Keyword Explorer:</strong> Keyword prioritization with opportunity scores</li>
      </ul>
      <h3>Technical SEO Tools</h3>
      <ul>
        <li><strong>Google Search Console:</strong> Free tool to monitor and maintain your site's presence in search results</li>
        <li><strong>Screaming Frog SEO Spider:</strong> Website crawler to identify technical issues</li>
        <li><strong>PageSpeed Insights:</strong> Performance analysis for desktop and mobile</li>
        <li><strong>GTmetrix:</strong> Detailed page loading analysis</li>
      </ul>
      <h3>On-Page SEO Tools</h3>
      <ul>
        <li><strong>Yoast SEO:</strong> WordPress plugin for on-page optimization</li>
        <li><strong>Surfer SEO:</strong> Content optimization based on top-ranking pages</li>
        <li><strong>Clearscope:</strong> AI-powered content optimization</li>
      </ul>
      <h3>Link Building Tools</h3>
      <ul>
        <li><strong>Ahrefs:</strong> Backlink analysis and monitoring</li>
        <li><strong>Moz Link Explorer:</strong> Link profile analysis with spam score</li>
        <li><strong>BuzzStream:</strong> Outreach and relationship management</li>
      </ul>
      <h3>Analytics Tools</h3>
      <ul>
        <li><strong>Google Analytics:</strong> Free website traffic and user behavior analysis</li>
        <li><strong>Hotjar:</strong> Heat maps and session recordings</li>
        <li><strong>SEMrush Analytics:</strong> Competitive analysis and position tracking</li>
      </ul>`,
    estimatedTime: 20,
    sortOrder: 5,
    isActive: true
  },

  // Module 2: Keyword Research Mastery
  {
    id: 201,
    moduleId: 2,
    title: "Understanding Keyword Types and Intent",
    description: "Learn about different keyword categories and search intent.",
    content: `<h2>Keyword Types and Search Intent</h2>
      <p>Effective keyword research begins with understanding the different types of keywords and the intentions behind searchers when they type queries into search engines.</p>
      
      <h3>The Hierarchy of Keywords</h3>
      
      <h4>By Length and Specificity</h4>
      <ul>
        <li><strong>Head Keywords (Short-tail)</strong>
          <ul>
            <li>1-2 words in length</li>
            <li>High search volume (1,000+ monthly searches)</li>
            <li>Extremely competitive</li>
            <li>Low conversion rates</li>
            <li>Examples: "shoes", "SEO", "marketing"</li>
          </ul>
        </li>
        <li><strong>Body Keywords (Mid-tail)</strong>
          <ul>
            <li>2-3 words in length</li>
            <li>Moderate search volume (100-1,000 monthly searches)</li>
            <li>Moderate competition</li>
            <li>Better conversion potential</li>
            <li>Examples: "running shoes", "SEO tools", "content marketing"</li>
          </ul>
        </li>
        <li><strong>Long-tail Keywords</strong>
          <ul>
            <li>4+ words in length</li>
            <li>Lower search volume (10-100 monthly searches)</li>
            <li>Lower competition</li>
            <li>High conversion potential</li>
            <li>Examples: "best trail running shoes for flat feet", "how to fix technical SEO issues", "content marketing strategy for small businesses"</li>
          </ul>
        </li>
      </ul>
      
      <div class="info-box" style="background: #f0f7ff; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #3498db;">Strategy Tip</h4>
        <p>For new websites or those with limited domain authority, focus initially on long-tail keywords. As your site gains authority, gradually target more competitive mid-tail and head keywords.</p>
      </div>
      
      <h3>Understanding Search Intent</h3>
      <p>Google's algorithm has become increasingly sophisticated at understanding the "why" behind a search query. Optimizing for intent is now more important than optimizing for specific keywords.</p>
      
      <h4>The Four Main Types of Search Intent</h4>
      
      <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color:#f5f5f5; font-weight: bold;">
          <td>Intent Type</td>
          <td>User Goal</td>
          <td>Keyword Indicators</td>
          <td>Content Types</td>
          <td>Examples</td>
        </tr>
        <tr>
          <td><strong>Informational</strong></td>
          <td>To learn or find information</td>
          <td>"how to", "what is", "guide", "tutorial", question words</td>
          <td>Blog posts, guides, tutorials, videos, infographics, FAQs</td>
          <td>"how to perform keyword research", "what is domain authority", "guide to technical SEO"</td>
        </tr>
        <tr>
          <td><strong>Navigational</strong></td>
          <td>To find a specific website or page</td>
          <td>Brand names, product names, website names</td>
          <td>Homepage, about page, login page, specific tools</td>
          <td>"Facebook login", "Amazon customer service", "Moz Link Explorer"</td>
        </tr>
        <tr>
          <td><strong>Commercial</strong></td>
          <td>To research before purchase</td>
          <td>"best", "top", "review", "vs", "comparison"</td>
          <td>Comparison pages, reviews, listicles, case studies</td>
          <td>"best SEO tools 2025", "Ahrefs vs Semrush", "iPhone 15 reviews"</td>
        </tr>
        <tr>
          <td><strong>Transactional</strong></td>
          <td>To complete an action or purchase</td>
          <td>"buy", "discount", "deal", "price", "order", "coupon"</td>
          <td>Product pages, pricing pages, landing pages, checkout pages</td>
          <td>"buy Ahrefs subscription", "WordPress hosting discount", "order iPhone 15 Pro"</td>
        </tr>
      </table>
      
      <h3>Aligning Content with Intent</h3>
      <p>One of the biggest mistakes in SEO is creating content that doesn't match the dominant intent behind a keyword. For example:</p>
      <ul>
        <li>Creating a product page for an informational keyword</li>
        <li>Writing a tutorial for a transactional keyword</li>
      </ul>
      
      <p>To identify the dominant intent for a keyword:</p>
      <ol>
        <li>Search the keyword in Google</li>
        <li>Examine the top 5-10 ranking pages</li>
        <li>Identify the common content format and angle</li>
        <li>Create content that matches this pattern while bringing unique value</li>
      </ol>
      
      <div class="warning-box" style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #e74c3c;">Common Mistake</h4>
        <p>Don't try to rank a sales page for an informational query. Users looking for information will bounce quickly from overtly sales-focused content, sending negative user signals to Google.</p>
      </div>
      
      <h3>Micro-Intentions and Search Refinement</h3>
      <p>Beyond the four main categories, searchers often have specific micro-intentions that can be addressed in content:</p>
      <ul>
        <li><strong>Comparison Intent:</strong> Evaluating options ("iPhone vs. Samsung")</li>
        <li><strong>Price Intent:</strong> Understanding costs ("Ahrefs pricing")</li>
        <li><strong>Location Intent:</strong> Finding local options ("SEO agency near me")</li>
        <li><strong>Time Intent:</strong> Seeking recent information ("SEO trends 2025")</li>
        <li><strong>Process Intent:</strong> Understanding how something works ("how Google algorithm works")</li>
      </ul>
      
      <p>Understanding and catering to these nuanced intentions can significantly improve the relevance and performance of your content in search results.</p>`,
    estimatedTime: 30,
    sortOrder: 1,
    isActive: true,
    quiz: {
      id: 2101,
      lessonId: 201,
      questions: [
        {
          id: 21001,
          text: "Which type of keyword typically has the highest conversion potential?",
          options: [
            "Head keywords",
            "Body keywords",
            "Long-tail keywords",
            "Branded keywords"
          ],
          correctOptionIndex: 2,
          explanation: "Long-tail keywords have the highest conversion potential because they are more specific and usually indicate a user who knows exactly what they're looking for, often further along in the buying journey."
        },
        {
          id: 21002,
          text: "What type of search intent would the query 'how to fix crawl errors' most likely represent?",
          options: [
            "Navigational intent",
            "Informational intent",
            "Commercial intent",
            "Transactional intent"
          ],
          correctOptionIndex: 1,
          explanation: "The query 'how to fix crawl errors' demonstrates informational intent because the user is seeking knowledge about solving a specific problem rather than making a purchase or looking for a specific website."
        },
        {
          id: 21003,
          text: "Which of these strategies is recommended for websites with limited domain authority?",
          options: [
            "Focus primarily on head keywords",
            "Target only branded keywords",
            "Begin with long-tail keywords and gradually move to more competitive terms",
            "Ignore keyword research entirely and focus only on backlinks"
          ],
          correctOptionIndex: 2,
          explanation: "For new websites or those with limited domain authority, it's recommended to focus initially on long-tail keywords (which are less competitive) and gradually target more competitive terms as the site gains authority."
        },
        {
          id: 21004,
          text: "What is the recommended way to identify the dominant intent for a keyword?",
          options: [
            "Guess based on the keyword length",
            "Analyze the top ranking pages for the keyword in search results",
            "Always assume informational intent for longer keywords",
            "Use the number of monthly searches as the only indicator"
          ],
          correctOptionIndex: 1,
          explanation: "The most effective way to identify the dominant intent behind a keyword is to search for it in Google and analyze the content format and angle of the top-ranking pages."
        }
      ],
      passingScore: 75
    },
    additionalResources: [
      {
        title: "Search Intent Guide for SEO",
        url: "https://ahrefs.com/blog/search-intent/",
        type: "article",
        description: "Comprehensive guide to understanding and optimizing for search intent"
      },
      {
        title: "How to Find Long-Tail Keywords",
        url: "https://backlinko.com/hub/seo/long-tail-keywords",
        type: "guide",
        description: "Strategies for identifying valuable long-tail keyword opportunities"
      },
      {
        title: "Keyword Intent Analysis Tutorial",
        url: "https://www.youtube.com/watch?v=D5eh9MgYlpU",
        type: "video",
        description: "Practical demonstration of analyzing and categorizing keyword intent"
      }
    ]
  },
  {
    id: 202,
    moduleId: 2,
    title: "Keyword Research Tools and Techniques",
    description: "Learn how to use various tools and methods to find valuable keywords for your website.",
    content: `<h2>Keyword Research Tools and Techniques</h2>
      <p>Effective keyword research requires both the right tools and strategic techniques to discover opportunities your competitors might miss.</p>
      
      <h3>Essential Keyword Research Tools</h3>
      
      <h4>Free Tools</h4>
      <ul>
        <li><strong>Google Keyword Planner:</strong> Provides search volume data and keyword suggestions directly from Google. While primarily designed for advertisers, it's valuable for organic SEO as well.</li>
        <li><strong>Google Search Console:</strong> Shows which keywords are actually driving traffic to your site, along with impression data, click-through rates, and average positions.</li>
        <li><strong>Google Trends:</strong> Reveals the relative popularity of keywords over time and by region, helping identify seasonal patterns and emerging topics.</li>
        <li><strong>AnswerThePublic:</strong> Visualizes questions and prepositions related to your seed keywords, excellent for content ideation.</li>
        <li><strong>Keyword Surfer:</strong> A free Chrome extension that shows search volume data directly in Google search results.</li>
      </ul>
      
      <h4>Paid Tools</h4>
      <ul>
        <li><strong>Ahrefs Keywords Explorer:</strong> Comprehensive data including keyword difficulty, click metrics, parent topic analysis, and SERP feature analysis.</li>
        <li><strong>SEMrush:</strong> Offers keyword gap analysis, organic research, and competitive intelligence.</li>
        <li><strong>Moz Keyword Explorer:</strong> Provides keyword opportunity scores and SERP analysis tools.</li>
        <li><strong>Mangools KWFinder:</strong> User-friendly interface with accurate keyword difficulty scores, particularly good for local SEO.</li>
      </ul>
      
      <div class="tip-box" style="background: #f5fff5; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #4caf50;">Pro Tip</h4>
        <p>Start with free tools and move to paid options as your SEO strategy matures. For most small to medium businesses, a combination of Google Keyword Planner, Google Search Console, and one premium tool like Ahrefs or SEMrush is sufficient.</p>
      </div>
      
      <h3>Proven Keyword Research Techniques</h3>
      
      <h4>1. Competitor Keyword Analysis</h4>
      <p>Identify keywords your competitors are ranking for but you aren't by:</p>
      <ol>
        <li>Identifying your top 3-5 competitors</li>
        <li>Using Ahrefs, SEMrush, or similar tools to analyze their organic keywords</li>
        <li>Filtering for keywords with good traffic potential but manageable difficulty</li>
        <li>Prioritizing keywords relevant to your business goals</li>
      </ol>
      
      <h4>2. Content Gap Analysis</h4>
      <p>Find keywords that multiple competitors rank for but you don't by:</p>
      <ol>
        <li>Using Ahrefs' Content Gap tool or SEMrush's Keyword Gap feature</li>
        <li>Entering multiple competitor domains and your own</li>
        <li>Focusing on keywords with consistent competitor rankings</li>
      </ol>
      
      <h4>3. "Also Rank For" Method</h4>
      <p>Discover related keywords by:</p>
      <ol>
        <li>Finding a page ranking well for your target keyword</li>
        <li>Analyzing what other keywords that page ranks for</li>
        <li>Incorporating these related terms into your content</li>
      </ol>
      
      <h4>4. Question-Based Keyword Research</h4>
      <p>Target informational queries by:</p>
      <ol>
        <li>Using tools like AnswerThePublic, AlsoAsked.com, or the "People Also Ask" section in Google</li>
        <li>Organizing questions by search intent and topic clusters</li>
        <li>Creating comprehensive content that answers these questions</li>
      </ol>
      
      <h4>5. SERP Analysis Technique</h4>
      <p>Understand what Google considers relevant for a keyword by:</p>
      <ol>
        <li>Analyzing the current top 10 results for your target keyword</li>
        <li>Identifying content types, formats, and topics that consistently appear</li>
        <li>Creating content that matches search intent while providing unique value</li>
      </ol>
      
      <h3>Building an Effective Keyword Strategy</h3>
      <p>After gathering keywords, organize them into a strategic framework:</p>
      <ol>
        <li><strong>Categorize by topic:</strong> Group related keywords into thematic clusters</li>
        <li><strong>Prioritize by opportunity:</strong> Consider a balance of search volume, competition, and conversion potential</li>
        <li><strong>Map to content types:</strong> Align keywords with appropriate content formats (blog posts, product pages, etc.)</li>
        <li><strong>Create a content calendar:</strong> Schedule content creation based on priority and resources</li>
        <li><strong>Track performance:</strong> Monitor rankings, traffic, and conversions to refine your strategy</li>
      </ol>
      
      <div class="important-box" style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #ffc107;">Remember</h4>
        <p>Keyword research is not a one-time activity but an ongoing process. Search behavior changes, new opportunities emerge, and competitive landscapes evolve. Review and update your keyword strategy quarterly.</p>
      </div>`,
    estimatedTime: 35,
    sortOrder: 2,
    isActive: true,
    quiz: {
      id: 2201,
      lessonId: 202,
      questions: [
        {
          id: 22001,
          text: "Which free tool provides data on keywords that are already driving traffic to your website?",
          options: [
            "Google Keyword Planner",
            "Google Search Console",
            "Google Trends",
            "AnswerThePublic"
          ],
          correctOptionIndex: 1,
          explanation: "Google Search Console shows which keywords are already driving traffic to your site, along with important metrics like impressions, clicks, and average position."
        },
        {
          id: 22002,
          text: "What is the main benefit of conducting a competitor keyword analysis?",
          options: [
            "It automatically improves your rankings",
            "It identifies keywords your competitors rank for but you don't",
            "It guarantees higher search volume",
            "It eliminates the need for content creation"
          ],
          correctOptionIndex: 1,
          explanation: "The main benefit of competitor keyword analysis is discovering keywords that your competitors are ranking for but you aren't, revealing potential opportunities for your SEO strategy."
        },
        {
          id: 22003,
          text: "What should you analyze when performing SERP analysis for a target keyword?",
          options: [
            "Only the domain authority of ranking websites",
            "Only the word count of ranking content",
            "Content types, formats, and topics that consistently appear in top results",
            "Only the number of backlinks to ranking pages"
          ],
          correctOptionIndex: 2,
          explanation: "When performing SERP analysis, you should analyze the content types, formats, and topics that consistently appear in the top results to understand what Google considers relevant for that keyword."
        },
        {
          id: 22004,
          text: "How often should you review and update your keyword strategy?",
          options: [
            "Once every 3-5 years",
            "Never, once it's set it's permanent",
            "Quarterly",
            "Only when rankings drop significantly"
          ],
          correctOptionIndex: 2,
          explanation: "Keyword research is an ongoing process, not a one-time activity. It's recommended to review and update your keyword strategy quarterly as search behavior changes, new opportunities emerge, and competitive landscapes evolve."
        }
      ],
      passingScore: 75
    },
    additionalResources: [
      {
        title: "How to Do Keyword Research for SEO: A Beginner's Guide",
        url: "https://www.semrush.com/blog/keyword-research-guide-for-seo/",
        type: "guide",
        description: "Comprehensive walkthrough of keyword research fundamentals"
      },
      {
        title: "How to Find Low-Competition Keywords for SEO",
        url: "https://ahrefs.com/blog/find-low-competition-keywords/",
        type: "article",
        description: "Strategies for identifying easier ranking opportunities"
      },
      {
        title: "Keyword Research: The Ultimate Guide (2025 Edition)",
        url: "https://backlinko.com/keyword-research",
        type: "guide",
        description: "Advanced techniques and case studies"
      }
    ]
  },
  {
    id: 203,
    moduleId: 2,
    title: "Keyword Research Process",
    description: "Step-by-step approach to discovering valuable keywords.",
    content: `<h2>The Keyword Research Process</h2>
      <p>Follow this systematic approach to discover and prioritize the most valuable keywords for your website:</p>
      <h3>Step 1: Brainstorm Seed Keywords</h3>
      <p>Begin by listing topics relevant to your business, products, or services. Consider:</p>
      <ul>
        <li>Products and services you offer</li>
        <li>Problems your business solves</li>
        <li>Common questions from customers</li>
        <li>Industry terminology</li>
      </ul>
      <h3>Step 2: Expand Your List with Research Tools</h3>
      <p>Use keyword research tools to expand your seed list:</p>
      <ul>
        <li><strong>Google Keyword Planner:</strong> Discover related keywords and get volume data</li>
        <li><strong>Google Search (autocomplete):</strong> See what people commonly search for</li>
        <li><strong>Google Search Console:</strong> Find keywords you already rank for</li>
        <li><strong>Paid tools:</strong> Ahrefs, Semrush, Moz for more comprehensive data</li>
      </ul>
      <h3>Step 3: Analyze Competitor Keywords</h3>
      <p>Examine which keywords your competitors are targeting:</p>
      <ul>
        <li>Identify top-ranking competitors for your main keywords</li>
        <li>Use competitive analysis tools to see which keywords drive their traffic</li>
        <li>Look for keyword gaps - valuable terms they aren't targeting</li>
      </ul>
      <h3>Step 4: Evaluate and Prioritize Keywords</h3>
      <p>Assess each keyword based on these factors:</p>
      <ul>
        <li><strong>Search volume:</strong> How many people search for this term monthly</li>
        <li><strong>Keyword difficulty:</strong> How hard it will be to rank for this term</li>
        <li><strong>Business relevance:</strong> How closely it aligns with your offerings</li>
        <li><strong>Conversion potential:</strong> Likelihood of driving valuable actions</li>
        <li><strong>Current rankings:</strong> Terms you already rank for may be easier to improve</li>
      </ul>
      <h3>Step 5: Group Keywords by Topic</h3>
      <p>Organize your keywords into topic clusters:</p>
      <ul>
        <li>Identify primary keywords for pillar content</li>
        <li>Group related long-tail keywords for supporting content</li>
        <li>This helps create a logical site structure and content strategy</li>
      </ul>`,
    estimatedTime: 30,
    sortOrder: 2,
    isActive: true
  }
];

export const mockLearningPaths: LearningPath[] = [
  {
    id: 1,
    name: "SEO Essentials",
    description: "Master the fundamentals of search engine optimization to improve your website's visibility in search results and drive more organic traffic.",
    imageUrl: undefined,
    targetAudience: "Beginners",
    isActive: true,
    moduleIds: [1, 2, 3, 8]
  },
  {
    id: 2,
    name: "Technical SEO Specialist",
    description: "Become an expert in the technical aspects of SEO including site architecture, page speed optimization, mobile-friendliness, and structured data.",
    imageUrl: undefined,
    targetAudience: "Intermediate",
    isActive: true,
    moduleIds: [4, 9, 8]
  },
  {
    id: 3,
    name: "E-commerce SEO",
    description: "Learn specialized SEO techniques for online stores, including product page optimization, category structures, and conversion-focused strategies.",
    imageUrl: undefined,
    targetAudience: "Business Owners",
    isActive: true,
    moduleIds: [1, 2, 7, 8]
  }
];

// Mock user progress data
export const mockUserProgress = [
  {
    id: 1001,
    userId: "user-123",
    moduleId: 1,
    lessonId: 101,
    status: 'completed',
    completionPercentage: 100,
    startedAt: "2025-04-01T10:30:00Z",
    completedAt: "2025-04-01T10:45:00Z",
    lastAccessedAt: "2025-04-01T10:45:00Z"
  },
  {
    id: 1002,
    userId: "user-123",
    moduleId: 1,
    lessonId: 102,
    status: 'completed',
    completionPercentage: 100,
    startedAt: "2025-04-01T10:50:00Z",
    completedAt: "2025-04-01T11:10:00Z",
    lastAccessedAt: "2025-04-01T11:10:00Z"
  },
  {
    id: 1003,
    userId: "user-123",
    moduleId: 1,
    lessonId: 103,
    status: 'in_progress',
    completionPercentage: 50,
    startedAt: "2025-04-01T11:15:00Z",
    lastAccessedAt: "2025-04-01T11:25:00Z"
  },
  {
    id: 1004,
    userId: "user-123",
    moduleId: 2,
    lessonId: 201,
    status: 'completed',
    completionPercentage: 100,
    startedAt: "2025-04-02T09:30:00Z",
    completedAt: "2025-04-02T09:55:00Z",
    lastAccessedAt: "2025-04-02T09:55:00Z"
  }
];

// Mock recommendations
export const mockRecommendations = [
  {
    id: 101,
    userId: "user-123",
    moduleId: 3,
    reasonCode: "keyword_gap",
    reasonText: "Based on your recent content analysis, your site could benefit from improved on-page optimization techniques.",
    priority: 1,
    analysisId: 1036,
    isCompleted: false,
    isDismmised: false
  },
  {
    id: 102,
    userId: "user-123",
    moduleId: 4,
    reasonCode: "technical_issue",
    reasonText: "Your website's technical SEO score indicates opportunity for improvement in page speed optimization.",
    priority: 2,
    analysisId: 1036,
    isCompleted: false,
    isDismmised: false
  },
  {
    id: 103,
    userId: "user-123",
    moduleId: 6,
    reasonCode: "local_seo",
    reasonText: "Your business could benefit from local SEO optimization to improve visibility in your service area.",
    priority: 3,
    analysisId: 1036,
    isCompleted: false,
    isDismmised: false
  }
];

// Import all SEO lesson modules
import { localBusinessSEOLessons } from "./localBusinessSEOLessons";
import { onPageSEOLessons } from "./onPageSEOLessons";
import { technicalSEOLessons } from "./technicalSEOLessons";
import { analyticsSEOLessons } from "./analyticsSEOLessons";
import { keywordResearchLessons } from "./keywordResearchLessons";

// Add all the new lessons to the original mockLessons array
// First, extend the array with local business SEO lessons
mockLessons.push(...localBusinessSEOLessons);
// Then add on-page SEO lessons
mockLessons.push(...onPageSEOLessons);
// Add technical SEO lessons 
mockLessons.push(...technicalSEOLessons);
// Add analytics SEO lessons
mockLessons.push(...analyticsSEOLessons);
// Add keyword research lessons
mockLessons.push(...keywordResearchLessons);

// Calculate progress summary based on user progress
// Mock achievements for the gamification system
export const mockAchievements = [
  {
    id: "first-lesson",
    title: "First Steps",
    description: "Completed your first lesson",
    icon: "BookOpen",
    category: "lesson" as const,
    trigger: {
      type: "lessons_completed" as const,
      threshold: 1
    },
    rewardPoints: 10,
    imageUrl: undefined
  },
  {
    id: "quiz-master",
    title: "Quiz Master",
    description: "Achieved 100% on your first quiz",
    icon: "Award",
    category: "quiz" as const,
    trigger: {
      type: "quiz_score" as const,
      threshold: 100
    },
    rewardPoints: 25,
    imageUrl: undefined
  },
  {
    id: "module-complete",
    title: "Module Mastery",
    description: "Completed an entire module",
    icon: "CheckCircle2",
    category: "module" as const,
    trigger: {
      type: "module_complete" as const,
      threshold: 1
    },
    rewardPoints: 50,
    imageUrl: undefined
  },
  {
    id: "seo-fundamentals",
    title: "SEO Foundation Builder",
    description: "Mastered the SEO Fundamentals module",
    icon: "Trophy",
    category: "module" as const,
    trigger: {
      type: "module_complete" as const,
      threshold: 1,
      moduleId: 1
    },
    rewardPoints: 75,
    imageUrl: undefined
  },
  {
    id: "keyword-researcher",
    title: "Keyword Detective",
    description: "Mastered the Keyword Research module",
    icon: "Search",
    category: "module" as const,
    trigger: {
      type: "module_complete" as const,
      threshold: 1,
      moduleId: 2
    },
    rewardPoints: 75,
    imageUrl: undefined
  },
  {
    id: "learning-streak",
    title: "Consistent Learner",
    description: "Completed lessons for 5 consecutive days",
    icon: "Flame",
    category: "streak" as const,
    trigger: {
      type: "streak_days" as const,
      threshold: 5
    },
    rewardPoints: 100,
    imageUrl: undefined
  },
  {
    id: "seo-journey",
    title: "SEO Journey",
    description: "Completed 10 SEO lessons",
    icon: "MapPin",
    category: "milestone" as const,
    trigger: {
      type: "lessons_completed" as const,
      threshold: 10
    },
    rewardPoints: 125,
    imageUrl: undefined
  }
];

// Mock user achievements - which achievements the user has unlocked
export const mockUserAchievements = [
  {
    userId: "user123",
    achievementId: "first-lesson",
    unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    seen: true
  }
];

export function generateProgressSummary() {
  // Get completed lessons
  const completedLessons = mockUserProgress.filter(p => p.status === 'completed');
  const inProgressLessons = mockUserProgress.filter(p => p.status === 'in_progress');
  
  // Get unique modules the user has worked on
  const moduleIdMap: Record<number, boolean> = {};
  mockUserProgress.forEach(p => {
    moduleIdMap[p.moduleId] = true;
  });
  const moduleIds = Object.keys(moduleIdMap).map(id => parseInt(id));
  
  // Calculate module-level progress
  const moduleProgress = moduleIds.map(moduleId => {
    const moduleLessons = mockLessons.filter(l => l.moduleId === moduleId);
    const moduleCompletedLessons = completedLessons.filter(p => p.moduleId === moduleId);
    const moduleInProgressLessons = inProgressLessons.filter(p => p.moduleId === moduleId);
    
    const totalLessons = moduleLessons.length;
    const completedLessonCount = moduleCompletedLessons.length;
    const inProgressLessonCount = moduleInProgressLessons.length;
    const percentComplete = Math.round((completedLessonCount / totalLessons) * 100);
    
    let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
    if (completedLessonCount === totalLessons) {
      status = 'completed';
    } else if (completedLessonCount > 0 || inProgressLessonCount > 0) {
      status = 'in_progress';
    }
    
    return {
      moduleId,
      moduleTitle: mockModules.find(m => m.id === moduleId)?.title || '',
      moduleDifficulty: mockModules.find(m => m.id === moduleId)?.difficulty || '',
      totalLessons,
      completedLessons: completedLessonCount,
      inProgressLessons: inProgressLessonCount,
      notStartedLessons: totalLessons - completedLessonCount - inProgressLessonCount,
      percentComplete,
      status
    };
  });
  
  // Calculate overall progress
  const totalModules = mockModules.length;
  const completedModules = moduleProgress.filter(p => p.status === 'completed').length;
  const inProgressModules = moduleProgress.filter(p => p.status === 'in_progress').length;
  
  const totalLessons = mockLessons.length;
  const totalCompletedLessons = completedLessons.length;
  
  return {
    userId: "user-123",
    overallProgress: {
      totalModules,
      completedModules,
      inProgressModules,
      notStartedModules: totalModules - completedModules - inProgressModules,
      totalLessons,
      completedLessons: totalCompletedLessons,
      percentComplete: Math.round((totalCompletedLessons / totalLessons) * 100)
    },
    moduleProgress
  };
}