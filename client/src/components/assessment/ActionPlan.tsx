import { useState } from "react";
import { SeoAnalysisResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ActionPlanProps {
  data?: SeoAnalysisResult;
}

export default function ActionPlan({ data }: ActionPlanProps) {
  const { toast } = useToast();
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  
  // Generate prioritized action items based on the analysis
  const generateActionItems = () => {
    // If data is undefined, return an empty array
    if (!data) return [];
    
    const actionItems = [];
    const url = data.url || '';
    const domain = url.split('//')[1]?.split('/')[0] || 'your-domain.com';
    const primaryKeyword = data?.keywordAnalysis?.primaryKeyword || 'main topic';
    
    // Get most critical title tag issues
    if (data?.keywordAnalysis?.titlePresent === false) {
      actionItems.push({
        id: "title",
        priority: "high",
        icon: "!",
        title: "Optimize Title Tag and H1 Heading",
        description: "Rewrite your page title to include your primary keyword near the beginning, stay under 60 characters, and create a compelling reason for users to click.",
        current: data?.metaTagsAnalysis?.title || "No title tag found",
        suggestion: `${primaryKeyword} - Complete Guide to [Specific Benefit] | ${domain}`,
        implementation: `Add this to your <head> section: <title>${primaryKeyword} - Complete Guide to Optimization | ${domain}</title>`
      });
    }
    
    // Get meta description issues
    if (!data?.metaTagsAnalysis?.description || data?.keywordAnalysis?.descriptionPresent === false) {
      actionItems.push({
        id: "meta-desc",
        priority: "high",
        icon: "!",
        title: "Create an Optimized Meta Description",
        description: "Craft a compelling meta description under 160 characters that includes your primary keyword and creates a clear call-to-action for searchers.",
        current: data?.metaTagsAnalysis?.description || "No meta description found",
        suggestion: `Discover proven ${primaryKeyword} strategies that increase [specific benefit]. Our step-by-step guide shows how to implement these techniques for measurable results.`,
        implementation: `<meta name="description" content="Discover proven ${primaryKeyword} strategies that increase visibility. Our step-by-step guide shows how to implement these techniques for measurable results.">`
      });
    }
    
    // Get image alt text issues
    if (data?.keywordAnalysis?.altTextPresent === false && data?.imageAnalysis?.withoutAltCount > 0) {
      actionItems.push({
        id: "img-alt",
        priority: "high",
        icon: "✓",
        title: "Add Descriptive Alt Text to Images",
        description: `Add descriptive alt text to ${data?.imageAnalysis?.withoutAltCount} image(s) that includes relevant keywords while accurately describing the image content for accessibility.`,
        example: `<img src="seo-analysis-tool.jpg" alt="SEO analysis dashboard showing ${primaryKeyword} performance metrics">`,
        implementation: "Use a descriptive format that includes your target keyword naturally: [Keyword] + [Image Description] + [Context if relevant]"
      });
    }
    
    // Get content depth issues
    if (data?.contentAnalysis?.wordCount < 600) {
      actionItems.push({
        id: "content-depth",
        priority: "high",
        icon: "✓",
        title: "Expand Content Depth and Expertise",
        description: "Significantly expand your content with comprehensive information to demonstrate expertise, authoritativeness, and trustworthiness (E-E-A-T).",
        current: `Current word count: ${data?.contentAnalysis?.wordCount} words`,
        suggestion: "Aim for 1,000-1,500 words minimum for competitive topics. Include expert quotes, research citations, practical examples, and step-by-step instructions.",
        implementation: "Add sections addressing: 1) Common challenges with the topic, 2) Detailed solutions with examples, 3) Expert perspectives with citations, 4) Specific implementation steps, 5) Expected outcomes and metrics"
      });
    }
    
    // Get paragraph structure issues
    if (data?.contentAnalysis?.paragraphCount > 0 && data?.contentAnalysis?.wordCount / data?.contentAnalysis?.paragraphCount > 100) {
      actionItems.push({
        id: "paragraph-structure",
        priority: "medium",
        icon: "★",
        title: "Improve Text Readability and Structure",
        description: "Restructure your content with shorter paragraphs, clear headings, and better visual hierarchy to improve readability and user engagement.",
        current: `Avg paragraph length: ~${Math.round(data?.contentAnalysis?.wordCount / data?.contentAnalysis?.paragraphCount)} words`,
        suggestion: "Keep paragraphs under 3-4 sentences. Use H2 and H3 headings to organize content logically. Add bullet points for lists and key takeaways.",
        implementation: "Break up existing content into smaller chunks. Add a new heading every 200-300 words. Create a table of contents at the beginning for longer content."
      });
    }
    
    // Get internal linking issues
    if (data?.internalLinksAnalysis?.count < 3) {
      actionItems.push({
        id: "internal-links",
        priority: "medium",
        icon: "★",
        title: "Implement Strategic Internal Linking",
        description: "Create a comprehensive internal linking strategy that connects related content and helps both users and search engines navigate your site effectively.",
        current: `Current internal links: ${data?.internalLinksAnalysis?.count}`,
        suggestion: "Add 4-6 contextual internal links to related content, using descriptive anchor text that includes target keywords naturally.",
        implementation: "1) Identify top-performing pages on your site with related topics. 2) Link to them using descriptive anchor text. 3) Ensure links provide genuine value to users seeking additional information."
      });
    }
    
    // Get pillar content strategy recommendation
    if (data?.internalLinksAnalysis?.count < 5 && data?.contentAnalysis?.wordCount > 800) {
      actionItems.push({
        id: "topic-clusters",
        priority: "medium",
        icon: "★",
        title: "Create Topic Clusters for Content Authority",
        description: "Develop a comprehensive topic cluster with this page as the pillar content, linked to supporting cluster pages that cover subtopics in detail.",
        suggestion: "Create 5-7 related articles that cover specific aspects of your main topic in detail. Link them to this main 'pillar' page and to each other where relevant.",
        implementation: "1) Identify subtopics related to your main keyword. 2) Create dedicated pages for each subtopic. 3) Link from the pillar page to each cluster page with keyword-rich anchor text. 4) Link between cluster pages and back to the pillar page."
      });
    }
    
    // Get schema markup issues
    if (data?.schemaMarkupAnalysis?.hasSchemaMarkup === false) {
      actionItems.push({
        id: "schema",
        priority: "medium",
        icon: "★",
        title: "Implement Structured Data Markup",
        description: "Add schema markup to help search engines understand your content and potentially earn rich snippets in search results.",
        suggestion: `Implement ${url.includes('/blog') || url.includes('/article') ? 'Article' : url.includes('/product') ? 'Product' : 'WebPage'} schema with all required and recommended properties.`,
        implementation: `Use Schema.org JSON-LD format and validate with Google's Rich Results Test. For ${primaryKeyword}-related content, include specificities about your offering, ratings if available, and detailed property values.`
      });
    }
    
    // Add page speed optimization recommendation if needed
    if (data?.pageSpeedAnalysis?.overallScore.score < 70) {
      actionItems.push({
        id: "page-speed",
        priority: "high",
        icon: "✓",
        title: "Optimize Core Web Vitals Performance",
        description: "Improve your page loading performance to enhance user experience and meet Google's Core Web Vitals requirements.",
        current: `Current performance score: ${data?.pageSpeedAnalysis?.overallScore.score}/100`,
        suggestion: "Focus on LCP (Largest Contentful Paint), FID (First Input Delay), and CLS (Cumulative Layout Shift) metrics. Optimize images, eliminate render-blocking resources, and implement proper content layout.",
        implementation: "1) Compress and convert images to WebP format. 2) Defer non-critical JavaScript. 3) Implement proper image and element sizing to prevent layout shifts. 4) Consider a performance-focused CDN solution."
      });
    }
    
    // Add E-E-A-T recommendation
    if (data?.eatAnalysis?.hasAuthorInfo === false) {
      actionItems.push({
        id: "author-info",
        priority: "medium",
        icon: "★",
        title: "Enhance E-E-A-T Signals and Credibility",
        description: "Strengthen Experience, Expertise, Authoritativeness, and Trustworthiness signals to align with Google's quality guidelines.",
        suggestion: "Add author biography with credentials, cite authoritative sources, include case studies or statistics, and demonstrate first-hand expertise.",
        implementation: "Create an author section with photo, bio, and credentials. Include 'About Us' section with company credentials. Cite 3-5 authoritative external sources. Add testimonials or case studies demonstrating real-world applications."
      });
    }
    
    // Add multimedia content recommendation
    actionItems.push({
      id: "multimedia",
      priority: "medium",
      icon: "★",
      title: "Diversify Content with Rich Media",
      description: "Enhance user engagement and dwell time by incorporating various multimedia elements that supplement your written content.",
      suggestion: `Add a combination of images, videos, infographics, or interactive elements related to ${primaryKeyword} to improve user experience and engagement metrics.`,
      implementation: "1) Create a short (2-3 minute) explainer video summarizing key points. 2) Design an infographic highlighting important statistics or processes. 3) Add before/after images demonstrating results. 4) Consider embedding relevant calculators or interactive tools."
    });
    
    // Add FAQ recommendation with specific questions
    actionItems.push({
      id: "faq-section",
      priority: "medium",
      icon: "★",
      title: "Add Structured FAQ Section with Schema",
      description: "Create a comprehensive FAQ section that answers common user questions while implementing proper FAQ schema markup to target featured snippets.",
      suggestion: `Research questions users frequently ask about ${primaryKeyword} through Google's "People Also Ask" feature, Answer The Public, or customer support inquiries.`,
      implementation: `Add 5-7 specific questions like "What is the best approach to ${primaryKeyword}?", "How much does ${primaryKeyword} implementation cost?", "How long does it take to see results from ${primaryKeyword} strategies?" and provide concise, informative answers with properly implemented FAQ schema.`
    });
    
    // Add content freshness recommendation
    actionItems.push({
      id: "content-freshness",
      priority: "low",
      icon: "○",
      title: "Implement Content Freshness Strategy",
      description: "Establish a regular content update schedule to maintain relevance, accuracy, and demonstrate ongoing expertise in your field.",
      suggestion: "Add a visible 'Last Updated' date at the top of your content. Schedule quarterly content reviews to update statistics, examples, and recommendations based on industry changes.",
      implementation: "1) Add schema markup with datePublished and dateModified properties. 2) Update at least 20-30% of content during revisions. 3) Add new sections addressing emerging trends or technologies. 4) Remove outdated information and replace with current best practices."
    });
    
    // Add semantic relevance recommendation
    actionItems.push({
      id: "semantic-relevance",
      priority: "medium",
      icon: "★",
      title: "Enhance Semantic Relevance",
      description: "Improve topic comprehensiveness by incorporating semantically related terms and concepts that search engines associate with your primary keyword.",
      suggestion: `Research related concepts and terminology for ${primaryKeyword} through Google's related searches, "People Also Ask" boxes, and competitor content analysis.`,
      implementation: "Create a semantically rich content ecosystem by: 1) Adding sections addressing related questions and concepts, 2) Incorporating industry-specific terminology, 3) Discussing complementary topics and approaches, 4) Including relevant statistics and data points."
    });
    
    // Add mobile optimization recommendation
    if (data?.mobileAnalysis?.isMobileFriendly === false) {
      actionItems.push({
        id: "mobile-optimization",
        priority: "high",
        icon: "✓",
        title: "Optimize for Mobile Experience",
        description: "Improve your site's mobile experience to meet Google's mobile-first indexing requirements and provide better usability for mobile users.",
        suggestion: "Ensure responsive design, readable text without zooming, adequate tap target sizes, and fast mobile loading speeds.",
        implementation: "1) Implement responsive design templates. 2) Set viewport meta tag correctly. 3) Ensure minimum 16px font size for body text. 4) Make tap targets at least 48px in height/width with adequate spacing. 5) Optimize images and code for mobile loading speed."
      });
    }
    
    // Return up to 8 prioritized action items
    return actionItems
      .sort((a, b) => {
        const priorityValues: Record<string, number> = { high: 1, medium: 2, low: 3 };
        return priorityValues[a.priority as string] - priorityValues[b.priority as string];
      })
      .slice(0, 8);
  };
  
  const actionItems = generateActionItems();
  
  const handleMarkComplete = (actionId: string) => {
    setCompletedActions(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
    
    toast({
      title: completedActions[actionId] ? "Action unmarked" : "Action marked as complete",
      description: completedActions[actionId] 
        ? "You can revisit this action item later." 
        : "Great job! Keep improving your SEO with the remaining recommendations.",
    });
  };

  if (actionItems.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-8 mb-6 sage-border">
        <div className="flex items-center text-xl font-medium gradient-heading mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-primary mr-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Your SEO Implementation Is Excellent!
        </div>
        <p className="text-foreground mb-4">
          Your page is well-optimized according to our assessment. Continue maintaining these best practices
          and periodically review the detailed analysis sections to identify any potential areas for 
          improvement as search engine algorithms evolve.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-8 mb-6 sage-border">
      <h3 className="text-2xl gradient-heading mb-2">Prioritized Action Plan</h3>
      <p className="text-muted-foreground mb-8">Focus on these high-impact improvements to boost your SEO performance. We've prioritized them based on potential impact and implementation difficulty.</p>
      
      <div className="space-y-6">
        {actionItems.map((action) => (
          <div 
            key={action.id}
            className={`recommendation-card ${
              action.priority === 'high' ? 'recommendation-card-high' : 
              action.priority === 'medium' ? 'recommendation-card-medium' : 
              'recommendation-card-low'
            } ${completedActions[action.id] ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-muted/50 rounded-full p-1 mr-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 text-white text-sm font-medium">
                  {action.icon || (
                    action.priority === 'high' ? '!' : 
                    action.priority === 'medium' ? '↑' : 
                    '•'
                  )}
                </span>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-medium text-foreground">{action.title}</h4>
                  <div className="flex items-center">
                    <span className={`score-badge mr-3 ${
                      action.priority === 'high' ? 'score-badge-excellent' : 
                      action.priority === 'medium' ? 'score-badge-good' : 
                      'score-badge-needs-work'
                    }`}>
                      {action.priority === 'high' ? 'High Priority' : 
                       action.priority === 'medium' ? 'Medium Priority' : 
                       'Low Priority'}
                    </span>
                    <Checkbox
                      id={`action-${action.id}`}
                      className="h-5 w-5 data-[state=checked]:bg-primary"
                      checked={completedActions[action.id] || false}
                      onCheckedChange={() => handleMarkComplete(action.id)}
                    />
                  </div>
                </div>
                <p className="my-2 text-muted-foreground">{action.description}</p>
                
                {action.current && (
                  <div className="mt-4 bg-muted/30 p-3 rounded-md">
                    <div className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Current Status</div>
                    <div className="text-sm text-foreground p-2 rounded border border-primary/10">
                      {action.current}
                    </div>
                  </div>
                )}
                
                {action.suggestion && (
                  <div className="mt-4 bg-muted/30 p-3 rounded-md">
                    <div className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                      Recommended Solution
                    </div>
                    <div className="text-sm text-foreground p-2 rounded border border-primary/10">
                      {action.suggestion}
                    </div>
                  </div>
                )}
                
                {action.implementation && (
                  <div className="mt-4 bg-muted/30 p-3 rounded-md">
                    <div className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                      Implementation Steps
                    </div>
                    <div className="text-sm text-foreground p-2 rounded border border-primary/10">
                      {action.implementation}
                    </div>
                  </div>
                )}
                
                {action.example && (
                  <div className="mt-4 bg-muted/30 p-3 rounded-md">
                    <div className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Code Example</div>
                    <div className="text-sm text-foreground p-2 rounded border border-primary/10 font-mono">
                      {action.example}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary bg-muted hover:bg-primary hover:text-white border-primary/20"
                    onClick={() => handleMarkComplete(action.id)}
                  >
                    {completedActions[action.id] ? 'Mark as incomplete' : 'Mark as complete'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
