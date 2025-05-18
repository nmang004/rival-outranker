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
    description: "Master the art of optimizing individual web pages to rank higher and earn more relevant traffic. Learn about title tags, meta descriptions, content optimization, internal linking, and other critical on-page factors.",
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
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
    imageUrl: null,
    difficulty: "Intermediate",
    estimatedTime: 120,
    prerequisiteIds: [1, 2, 3],
    sortOrder: 6,
    isActive: true
  },
  {
    id: 7,
    title: "E-commerce SEO",
    description: "Discover specialized SEO techniques for online stores. Learn about product page optimization, category page structure, handling duplicate content, and implementing schema markup for products.",
    imageUrl: null,
    difficulty: "Advanced",
    estimatedTime: 240,
    prerequisiteIds: [1, 2, 3, 4],
    sortOrder: 7,
    isActive: true
  },
  {
    id: 8,
    title: "SEO Analytics & Reporting",
    description: "Learn how to measure the effectiveness of your SEO efforts using tools like Google Analytics and Search Console. Understand key performance metrics, create custom dashboards, and generate actionable reports.",
    imageUrl: null,
    difficulty: "Intermediate",
    estimatedTime: 150,
    prerequisiteIds: [1],
    sortOrder: 8,
    isActive: true
  },
  {
    id: 9,
    title: "Mobile SEO Optimization",
    description: "Master the techniques for optimizing your website for mobile users. Learn about responsive design, mobile-first indexing, AMP pages, and mobile user experience best practices.",
    imageUrl: null, 
    difficulty: "Advanced",
    estimatedTime: 180,
    prerequisiteIds: [1, 4],
    sortOrder: 9,
    isActive: true
  }
];

export const mockLessons = [
  // Module 1: SEO Fundamentals
  {
    id: 101,
    moduleId: 1,
    title: "What is SEO?",
    description: "Introduction to search engine optimization and why it matters.",
    content: `<h2>Introduction to Search Engine Optimization</h2>
      <p>Search Engine Optimization (SEO) is the practice of increasing the quantity and quality of traffic to your website through organic search engine results.</p>
      <h3>Core Components of SEO:</h3>
      <ul>
        <li><strong>Technical SEO:</strong> Ensuring your website is crawlable and meets technical requirements</li>
        <li><strong>On-page SEO:</strong> Optimizing individual pages through content and HTML source code</li>
        <li><strong>Off-page SEO:</strong> External signals like backlinks that indicate your site's quality</li>
      </ul>
      <p>Search engines like Google use complex algorithms to determine which pages to show for specific search queries. Understanding these algorithms is key to SEO success.</p>`,
    estimatedTime: 15,
    sortOrder: 1,
    isActive: true
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

  // Module 2: Keyword Research Mastery (first 2 lessons only as examples)
  {
    id: 201,
    moduleId: 2,
    title: "Understanding Keyword Types and Intent",
    description: "Learn about different keyword categories and search intent.",
    content: `<h2>Keyword Types and Search Intent</h2>
      <p>Effective keyword research begins with understanding the different types of keywords and the intentions behind them.</p>
      <h3>Keyword Types by Length</h3>
      <ul>
        <li><strong>Short-tail keywords:</strong> 1-2 words, high volume, high competition (e.g., "SEO tools")</li>
        <li><strong>Mid-tail keywords:</strong> 3-4 words, moderate volume and competition (e.g., "best SEO tools 2025")</li>
        <li><strong>Long-tail keywords:</strong> 5+ words, lower volume but higher conversion potential (e.g., "best free SEO tools for small business websites")</li>
      </ul>
      <h3>Search Intent Categories</h3>
      <p>Understanding why someone is searching is crucial for targeting the right keywords:</p>
      <ul>
        <li><strong>Informational:</strong> Seeking information or answers (e.g., "how to improve website SEO")</li>
        <li><strong>Navigational:</strong> Looking for a specific website (e.g., "Google Analytics login")</li>
        <li><strong>Commercial investigation:</strong> Researching before making a purchase (e.g., "best SEO software reviews")</li>
        <li><strong>Transactional:</strong> Ready to make a purchase or take action (e.g., "buy Ahrefs subscription")</li>
      </ul>
      <h3>Mapping Keywords to the Customer Journey</h3>
      <p>Different keyword types align with different stages of the customer journey:</p>
      <ul>
        <li><strong>Awareness stage:</strong> Informational keywords (e.g., "what is technical SEO")</li>
        <li><strong>Consideration stage:</strong> Commercial investigation keywords (e.g., "Semrush vs Ahrefs")</li>
        <li><strong>Decision stage:</strong> Transactional keywords (e.g., "Ahrefs discount code")</li>
      </ul>`,
    estimatedTime: 25,
    sortOrder: 1,
    isActive: true
  },
  {
    id: 202,
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
    imageUrl: null,
    targetAudience: "Intermediate",
    isActive: true,
    moduleIds: [4, 9, 8]
  },
  {
    id: 3,
    name: "E-commerce SEO",
    description: "Learn specialized SEO techniques for online stores, including product page optimization, category structures, and conversion-focused strategies.",
    imageUrl: null,
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

// Calculate progress summary based on user progress
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