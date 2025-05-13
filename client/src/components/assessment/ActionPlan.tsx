import { useState } from "react";
import { SeoAnalysisResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ActionPlanProps {
  data: SeoAnalysisResult;
}

export default function ActionPlan({ data }: ActionPlanProps) {
  const { toast } = useToast();
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  
  // Generate prioritized action items based on the analysis
  const generateActionItems = () => {
    const actionItems = [];
    
    // Get most critical title tag issues
    if (!data.keywordAnalysis.titlePresent) {
      actionItems.push({
        id: "title",
        priority: 1,
        title: "Optimize Title Tag and H1 Heading",
        description: "Rewrite your title tag to include the primary keyword at the beginning and ensure your H1 heading contains the primary keyword.",
        current: data.metaTagsAnalysis.title || "No title tag found",
        suggestion: `${data.keywordAnalysis.primaryKeyword}: Optimized Page Title | ${data.url.split('/').pop() || 'Your Brand'}`
      });
    }
    
    // Get meta description issues
    if (!data.metaTagsAnalysis.description || !data.keywordAnalysis.descriptionPresent) {
      actionItems.push({
        id: "meta-desc",
        priority: 2,
        title: "Add/Optimize Meta Description",
        description: "Create a compelling meta description that includes your primary keyword and clearly describes the page content.",
        current: data.metaTagsAnalysis.description || "No meta description found",
        suggestion: `Discover our comprehensive guide to ${data.keywordAnalysis.primaryKeyword}. Learn expert strategies, best practices, and proven techniques for better results.`
      });
    }
    
    // Get image alt text issues
    if (!data.keywordAnalysis.altTextPresent && data.imageAnalysis.withoutAltCount > 0) {
      actionItems.push({
        id: "img-alt",
        priority: 3,
        title: "Add Image Alt Text",
        description: `Add descriptive alt text to ${data.imageAnalysis.withoutAltCount} image(s) that includes relevant keywords.`,
        example: `<img src="example.jpg" alt="${data.keywordAnalysis.primaryKeyword} - descriptive text about the image">`
      });
    }
    
    // Get content depth issues
    if (data.contentAnalysis.wordCount < 600) {
      actionItems.push({
        id: "content-depth",
        priority: 4,
        title: "Enhance Content Depth",
        description: "Expand your content with more comprehensive information, aiming for at least 600-1000 words for better topic coverage.",
        current: `Current word count: ${data.contentAnalysis.wordCount} words`,
        suggestion: "Add sections covering additional aspects of the topic, examples, statistics, and expert insights."
      });
    }
    
    // Get internal linking issues
    if (data.internalLinksAnalysis.count < 3) {
      actionItems.push({
        id: "internal-links",
        priority: 5,
        title: "Improve Internal Linking",
        description: "Add more relevant internal links to and from this page using descriptive anchor text.",
        suggestion: "Link to related product categories, information pages, and blog content with keyword-rich anchor text."
      });
    }
    
    // Get schema markup issues
    if (!data.schemaMarkupAnalysis.hasSchemaMarkup) {
      actionItems.push({
        id: "schema",
        priority: 6,
        title: "Add Schema Markup",
        description: "Implement schema markup to enhance visibility in search results and potentially earn rich snippets.",
        suggestion: `Consider adding ${data.url.includes('/product') ? 'Product' : 'Article'} schema, FAQ schema, or BreadcrumbList schema depending on your content.`
      });
    }
    
    // Return only top 5 action items
    return actionItems.slice(0, 5);
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
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center text-lg font-medium text-gray-800 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-success-500 mr-2"
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
          Your SEO Looks Great!
        </div>
        <p className="text-gray-600 mb-4">
          No urgent action items needed. Your page is well-optimized according to our assessment. 
          Continue maintaining these best practices and consider the recommendations in the detailed 
          sections for minor improvements.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Priority Action Plan</h3>
      <p className="text-gray-600 mb-6">Focus on these high-impact improvements to boost your SEO performance.</p>
      
      <div className="space-y-4">
        {actionItems.map((action) => (
          <div 
            key={action.id}
            className={`bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500 ${
              completedActions[action.id] ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-primary-100 rounded-full p-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white text-sm font-medium">
                  {action.priority}
                </span>
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex justify-between">
                  <h4 className="text-base font-medium text-gray-900">{action.title}</h4>
                  <Checkbox
                    id={`action-${action.id}`}
                    className="h-5 w-5 data-[state=checked]:bg-primary-500"
                    checked={completedActions[action.id] || false}
                    onCheckedChange={() => handleMarkComplete(action.id)}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                
                {action.current && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current</div>
                    <div className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-200 mb-2">
                      {action.current}
                    </div>
                  </div>
                )}
                
                {action.suggestion && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {action.example ? "Example" : "Suggested"}
                    </div>
                    <div className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-200">
                      {action.suggestion}
                    </div>
                  </div>
                )}
                
                {action.example && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Example</div>
                    <div className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-200 font-mono">
                      {action.example}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary-700 bg-primary-100 hover:bg-primary-200 border-primary-100"
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
