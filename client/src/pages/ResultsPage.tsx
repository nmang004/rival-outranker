import { useEffect, useState, createContext } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import OverallScore from "@/components/assessment/OverallScore";
import KeyMetrics from "@/components/assessment/KeyMetrics";
import SummarySection from "@/components/assessment/SummarySection";
import AssessmentTabs from "@/components/assessment/AssessmentTabs";
import ActionPlan from "@/components/assessment/ActionPlan";
import NextSteps from "@/components/assessment/NextSteps";
import { ExportPdfButton } from "@/components/assessment/ExportPdfButton";
import { SeoAnalysisResult } from "@shared/schema";
import { formatDate, formatUrl } from "@/lib/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Clock, BarChart, Loader2, Gauge, Zap, Search, Check } from "lucide-react";

// Create context to track PageSpeed data loading - move outside of component
// to fix hot module replacement issues
const PageSpeedContext = createContext<{
  isPageSpeedLoaded: boolean;
  setPageSpeedLoaded: (loaded: boolean) => void;
}>({
  isPageSpeedLoaded: false,
  setPageSpeedLoaded: () => {},
});

// Export the context separately
export { PageSpeedContext };

export default function ResultsPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract URL, tab, and targetKeyword from search params
  const params = new URLSearchParams(search);
  const url = params.get("url");
  const initialTab = params.get("tab") || "keyword";
  const targetKeyword = params.get("targetKeyword");
  
  // State for selected URL and target keyword
  const [selectedUrl, setSelectedUrl] = useState<string | null>(url);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(targetKeyword);
  
  // For recent analyses dropdown
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  
  // State to track PageSpeed data loading
  const [isPageSpeedLoaded, setPageSpeedLoaded] = useState(false);
  
  // Listen for PageSpeed data loaded event
  useEffect(() => {
    // Function to handle the custom event that checks for formatting info
    const handlePageSpeedLoaded = (event: Event) => {
      console.log("PageSpeed data loaded event received in ResultsPage");
      
      // Check if the event includes formatting information
      const customEvent = event as CustomEvent;
      
      if (customEvent.detail && customEvent.detail.formatted) {
        console.log("PageSpeed metrics are properly formatted - will show results page");
        
        // PageSpeed data is properly formatted - set loaded state to true
        setPageSpeedLoaded(true);
      } else if (customEvent.detail && (customEvent.detail.error || customEvent.detail.timeout)) {
        console.log("PageSpeed data failed to load (error or timeout) - showing results anyway");
        
        // Either there was an error or a timeout - we need to move forward
        setPageSpeedLoaded(true);
      } else {
        console.log("PageSpeed data loaded but waiting for proper formatting");
        // Don't set isPageSpeedLoaded to true yet - will wait for properly formatted metrics
      }
    };
    
    // Register event listener with type assertion to handle CustomEvent
    window.addEventListener('pageSpeedDataLoaded', handlePageSpeedLoaded as EventListener);
    
    // Clear localStorage on component mount to reset state
    if (selectedUrl) {
      console.log("Clearing pageSpeedDataLoaded from localStorage for new URL:", selectedUrl);
      localStorage.removeItem('pageSpeedDataLoaded');
      // Also reset the loaded state when URL changes
      setPageSpeedLoaded(false);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('pageSpeedDataLoaded', handlePageSpeedLoaded as EventListener);
    };
  }, [selectedUrl]); // Add selectedUrl as dependency to reset state when URL changes
  
  // Redirect to home if no URL is provided
  useEffect(() => {
    if (!url) {
      setLocation("/");
    } else {
      setSelectedUrl(url);
    }
  }, [url, setLocation]);
  
  // Fetch recent analyses to populate the dropdown
  const recentAnalysesQuery = useQuery<{url: string, timestamp: string}[]>({
    queryKey: ['/api/analyses']
  });
  
  // Process URL data when we get recentAnalysesQuery results
  useEffect(() => {
    if (recentAnalysesQuery.data && Array.isArray(recentAnalysesQuery.data)) {
      // Extract unique URLs using a map to preserve uniqueness
      const urlsMap: Record<string, boolean> = {};
      recentAnalysesQuery.data.forEach(item => {
        if (item.url) {
          urlsMap[item.url] = true;
        }
      });
      setRecentUrls(Object.keys(urlsMap));
    }
  }, [recentAnalysesQuery.data]);
  
  // Define a type for the API response
  interface ApiResponse {
    url: string;
    results?: any; // We'll keep this as any for now since it's a complex structure
  }
  
  // Fetch the analysis for the selected URL with target keyword if provided
  const { data: apiResponse, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: [
      `/api/analysis?url=${encodeURIComponent(selectedUrl || "")}${
        selectedKeyword ? `&targetKeyword=${encodeURIComponent(selectedKeyword)}` : ''
      }`
    ],
    enabled: !!selectedUrl,
    refetchInterval: (data) => {
      // Poll until we get complete data with results
      return data && 'results' in data ? false : 1000;
    },
    retry: 5,
    retryDelay: 1000,
  });
  
  // Extract the actual analysis data from the response
  // Make sure to include the analysis ID in the data passed to components
  const data = apiResponse ? {
    ...apiResponse.results,
    id: apiResponse.id,
    url: apiResponse.url
  } : {};
  
  // Create default empty arrays if missing to avoid rendering issues
  if (!data.strengths) data.strengths = [];
  if (!data.weaknesses) data.weaknesses = [];
  
  // If there's a retrieval error but no weaknesses, add one
  if (data.weaknesses?.length === 0 && (!data.url || !data.overallScore)) {
    data.weaknesses = ["Analysis could not be completed. Please try again."];
  }
  
  // Ensure a default overall score is available if missing
  if (!data.overallScore) {
    data.overallScore = {
      score: 50,
      category: 'needs-work',
      improvements: ["Analysis could not be completed. Please check the URL and try again."]
    };
  }
  
  // Update overall score to reflect more realistic mobile scores
  if (data.overallScore && data.mobileAnalysis) {
    // Use the actual mobile score value without artificially limiting it
    const mobileScore = data.mobileAnalysis.overallScore.score || 50;
    
    // Recalculate the overall score with the updated mobile score
    // This assumes mobile is weighted similarly to other factors 
    const keywordScore = data.keywordAnalysis?.overallScore?.score || 50;
    const pageSpeedScore = data.pageSpeedAnalysis?.overallScore?.score || 50;
    const contentScore = data.contentAnalysis?.score || 50;
    const totalScore = Math.round((keywordScore * 0.25) + (pageSpeedScore * 0.15) + 
                                  (mobileScore * 0.15) + (contentScore * 0.25) + 
                                  ((data.schemaMarkupAnalysis?.overallScore?.score || 50) * 0.1) + 
                                  ((data.eatAnalysis?.score || 50) * 0.1));
    
    data.overallScore.score = Math.min(100, Math.max(1, totalScore));
    data.overallScore.category = data.overallScore.score >= 70 ? 'excellent' : 
                                 data.overallScore.score >= 50 ? 'good' : 'poor';
  }
  
  // Ensure that all required analysis objects are at least defined with defaults
  if (!data.pageSpeedAnalysis) {
    data.pageSpeedAnalysis = {
      score: 50,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }
  
  if (!data.mobileAnalysis) {
    data.mobileAnalysis = {
      isMobileFriendly: false,
      viewportSet: false,
      textSizeAppropriate: false,
      tapTargetsAppropriate: false,
      overallScore: { score: 50, category: 'needs-work' }
    };
  }
  
  if (!data.enhancedContentAnalysis) {
    data.enhancedContentAnalysis = {
      headingStructure: {
        hasH1: false,
        score: 50,
        avgWordCount: 0,
        hasProperHierarchy: false
      },
      contentIssues: ["No content analysis available"],
      contentRecommendations: ["Try analyzing the page again"]
    };
  }
  
  // Make sure headingStructure is available in contentAnalysis
  if (data.contentAnalysis && !data.contentAnalysis.headingStructure) {
    data.contentAnalysis.headingStructure = {
      h1Count: data.contentAnalysis.h1Count || 0,
      h2Count: data.contentAnalysis.h2Count || 0,
      h3Count: data.contentAnalysis.h3Count || 0,
      h4Count: 0,
      h5Count: 0,
      h6Count: 0
    };
  }
  
  // Add empty competitorAnalysis and deepContentAnalysis if not present (rather than undefined)
  // This will explicitly mark them as not requested, rather than as loading states
  if (!data.competitorAnalysis) {
    data.competitorAnalysis = null;
  }
  
  // Make sure deepContentAnalysis is set to null if not requested
  if (!data.deepContentAnalysis) {
    data.deepContentAnalysis = null;
  }

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error fetching results",
        description: (error as Error)?.message || "Failed to load analysis results. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Handle URL selection change
  const handleUrlChange = (newUrl: string) => {
    setSelectedUrl(newUrl);
    // Update the browser URL without full navigation
    const newParams = new URLSearchParams();
    newParams.set("url", newUrl);
    
    // Preserve the target keyword if it exists
    if (selectedKeyword) {
      newParams.set("targetKeyword", selectedKeyword);
    }
    
    window.history.replaceState({}, "", `${window.location.pathname}?${newParams.toString()}`);
  };

  if (!selectedUrl) {
    return null;
  }

  // Declare state for manual override of loading screen at the top level
  const [forceShowResults, setForceShowResults] = useState(false);

  // Set up timeout to eventually show results even if PageSpeed doesn't load
  useEffect(() => {
    console.log("Starting analysis and showing loading screen for PageSpeed data");
    
    // Reset forcing flag when URL changes
    setForceShowResults(false);
    setPageSpeedLoaded(false);
    
    // Reset localStorage state to clear any stale pageSpeedDataLoaded flags
    localStorage.removeItem('pageSpeedDataLoaded');
    
    // Safety timeout: if PageSpeed data takes too long, show results anyway
    const timer = setTimeout(() => {
      console.log("Timeout reached, forcing results to show");
      setForceShowResults(true);
      // Also set PageSpeed as loaded to maintain consistent state
      setPageSpeedLoaded(true);
    }, 120000); // 120 seconds maximum wait time
    
    return () => clearTimeout(timer);
  }, [selectedUrl]);

  // Show loading state if data is not yet available or being fetched
  if (isLoading || !apiResponse || !apiResponse.results) {
    console.log("Initial data loading, showing skeleton");
    return (
      <ResultsPageSkeleton 
        url={selectedUrl} 
        message="Analyzing your website..."
      />
    );
  }
  
  // Check if PageSpeed data is properly formatted with units
  const hasValidPageSpeedFormat = data.pageSpeedAnalysis && 
    typeof data.pageSpeedAnalysis.lcp === 'number' &&
    typeof data.pageSpeedAnalysis.cls === 'number' &&
    typeof data.pageSpeedAnalysis.ttfb === 'number';
  
  // Always capture when we enter these branches for debugging
  console.log("Decision point - forceShowResults:", forceShowResults);
  console.log("Decision point - isPageSpeedLoaded:", isPageSpeedLoaded);
  console.log("Decision point - hasValidPageSpeedFormat:", hasValidPageSpeedFormat);
  
  // Show PageSpeed loading indicator if:
  // 1. We haven't forced showing results via timeout AND
  // 2. Either the PageSpeed data isn't loaded properly OR the data isn't formatted with proper units
  if (!forceShowResults && (!isPageSpeedLoaded || !hasValidPageSpeedFormat)) {
    console.log("PageSpeed data not fully loaded yet, showing loading screen");
    return (
      <ResultsPageSkeleton 
        url={selectedUrl} 
        message="Fetching performance metrics from PageSpeed Insights..."
      />
    );
  }
  
  console.log("*** ALL CONDITIONS MET - SHOWING RESULTS PAGE ***");
  
  // If the analysis failed to retrieve content or was incomplete, show a custom error message
  const hasError = data.weaknesses?.length === 1 && 
                   (data.weaknesses[0].includes("Failed to retrieve") || 
                    data.weaknesses[0].includes("could not be completed"));
                    
  // For empty datasets, ensure we have the minimal needed for rendering key components
  if (data.weaknesses?.length > 0 && !data.keywordAnalysis) {
    data.keywordAnalysis = {
      primaryKeyword: "",
      density: 0,
      relatedKeywords: [],
      titlePresent: false,
      descriptionPresent: false,
      h1Present: false,
      headingsPresent: false,
      urlPresent: false,
      contentPresent: false,
      altTextPresent: false,
      overallScore: { score: 0, category: 'poor' as const }
    };
  }

  // The export functionality is now handled by the ExportPdfButton component

  const handleShare = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "The analysis URL has been copied to your clipboard.",
    });
  };

  return (
    <div id="results-section" className="px-4 sm:px-0">
      {/* URL Selection Bar */}
      {recentUrls.length > 1 && (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-grow">
              <label htmlFor="url-selector" className="block text-sm font-medium text-gray-700 mb-1">
                Select a URL to view analysis
              </label>
              <Select value={selectedUrl || undefined} onValueChange={handleUrlChange}>
                <SelectTrigger id="url-selector" className="w-full">
                  <SelectValue placeholder="Select a URL" />
                </SelectTrigger>
                <SelectContent>
                  {recentUrls.map((analyzeUrl) => (
                    <SelectItem key={analyzeUrl} value={analyzeUrl}>
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-primary/70" />
                        <span className="truncate">{formatUrl(analyzeUrl, 40)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="default"
                className="sage-bg-gradient hover:opacity-90 transition-opacity"
                onClick={() => setLocation("/")}
              >
                <BarChart className="h-4 w-4 mr-2" />
                Analyze New URL
              </Button>
            </div>
          </div>
        </div>
      )}
    
      {/* Overall Score Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">SEO Assessment Results</h2>
            <p className="text-gray-500 text-sm mt-1">{data.url}</p>
            <div className="text-xs text-gray-500 mt-1">
              Analyzed on <span>{formatDate(data.timestamp || new Date())}</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <ExportPdfButton 
              analysisResult={data as SeoAnalysisResult}
              variant="outline"
              className="bg-primary-50 text-primary-700 border-primary-100 hover:bg-primary-100"
            />
            <Button 
              variant="outline"
              onClick={handleShare}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              Share
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Score */}
          <OverallScore score={data.overallScore} />
          
          {/* Key Metrics */}
          <KeyMetrics 
            pageSpeed={data.pageSpeedAnalysis}
            mobileFriendliness={data.mobileAnalysis}
            keywordOptimization={data.keywordAnalysis}
          />
        </div>
        
        {/* Summary Section */}
        <SummarySection 
          strengths={data.strengths}
          weaknesses={data.weaknesses}
        />
      </div>
      
      {/* Detailed Assessment Sections */}
      <div className="mb-6">
        <AssessmentTabs data={data} initialTab={initialTab} />
      </div>
      
      {/* Action Plan Section */}
      <ActionPlan data={data} />
      
      {/* Next Steps */}
      <NextSteps url={data.url} />
      
      {/* Ranking Factors */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">SEO Ranking Factors</h2>
        <p className="text-sm text-gray-600 mb-4">
          Our SEO assessment evaluates these critical ranking factors to determine your overall score. Here's how each factor impacts your website's performance in search engines:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-medium text-primary-600 mb-2">Keyword Optimization (25%)</h3>
            <p className="text-sm text-gray-600">Evaluates keyword presence, density, and placement. Well-optimized keywords help search engines understand your content's relevance.</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-medium text-primary-600 mb-2">Meta Tags & Structure (15%)</h3>
            <p className="text-sm text-gray-600">Assesses your title tags, meta descriptions, and heading structure. These elements are crucial for both search engines and user engagement.</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-medium text-primary-600 mb-2">Content Quality (20%)</h3>
            <p className="text-sm text-gray-600">Analyzes content depth, readability, and relevance. High-quality, original content is one of the most important ranking factors.</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-medium text-primary-600 mb-2">Technical SEO (15%)</h3>
            <p className="text-sm text-gray-600">Evaluates schema markup, page speed, and other technical elements that affect search engine crawling and indexing.</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-medium text-primary-600 mb-2">User Experience (15%)</h3>
            <p className="text-sm text-gray-600">Measures mobile-friendliness, navigation, and other elements that impact how users interact with your site.</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-medium text-primary-600 mb-2">E-E-A-T Factors (10%)</h3>
            <p className="text-sm text-gray-600">Assesses Experience, Expertise, Authoritativeness, and Trustworthiness signals in your content, which are increasingly important for rankings.</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-md font-medium mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            How Our Scoring Works
          </h3>
          <p className="text-sm text-gray-600">
            Our scoring algorithm combines these factors with varying weights to calculate your overall SEO score. Scores above 70 are considered excellent, 50-69 good, and below 50 needs improvement. Prioritize fixing factors with lower scores for the most significant impact on your rankings.
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultsPageSkeleton({ url, message }: { url: string, message?: string }) {
  // State to track the current analysis step
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;
  
  // Analysis steps
  const analysisSteps = [
    { title: "Fetching Website Content", icon: Globe, color: "text-blue-500", description: "Retrieving webpage content for analysis..." },
    { title: "Analyzing On-Page SEO", icon: Search, color: "text-green-500", description: "Examining meta tags, headings, and content structure..." },
    { title: "Checking Mobile Friendliness", icon: Clock, color: "text-purple-500", description: "Testing responsiveness and mobile compatibility..." },
    { title: "Gathering Performance Data", icon: Gauge, color: "text-orange-500", description: message || "Fetching metrics from Google PageSpeed Insights..." },
    { title: "Generating Final Report", icon: BarChart, color: "text-indigo-500", description: "Compiling results and preparing recommendations..." }
  ];

  // Progress to next step every few seconds
  useEffect(() => {
    // Only progress if we haven't reached the final step
    if (currentStep < totalSteps - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 3000); // Progress every 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Calculate overall progress percentage
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  
  // Get current step data
  const currentStepData = analysisSteps[currentStep];
  const StepIcon = currentStepData.icon;
  
  return (
    <div className="px-4 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">SEO Assessment Results</h2>
            <p className="text-gray-500 text-sm mt-1">{url}</p>
            <div className="text-xs text-gray-500 mt-1">
              Analysis in progress...
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center max-w-lg w-full">
            {/* Animated gauge/speedometer */}
            <div className="flex items-center justify-center relative mb-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
                <div 
                  className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500 animate-spin" 
                  style={{animationDuration: '3s'}}
                ></div>
                <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                  <StepIcon className={`h-8 w-8 ${currentStepData.color}`} />
                </div>
              </div>
              
              {/* Completion indicators for steps */}
              <div className="absolute flex items-center justify-center w-full h-full">
                {analysisSteps.map((step, index) => (
                  <div 
                    key={index}
                    className={`absolute rounded-full transition-all duration-500 ${
                      index < currentStep 
                        ? 'bg-green-100 border border-green-300' 
                        : index === currentStep 
                          ? 'bg-blue-100 border border-blue-300 animate-pulse' 
                          : 'bg-gray-100 border border-gray-200'
                    }`}
                    style={{
                      width: '10px',
                      height: '10px',
                      transform: `rotate(${(index * 72)}deg) translateX(50px)`
                    }}
                  >
                    {index < currentStep && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-2 w-2 text-green-500" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center justify-center mb-2 text-sm text-gray-500">
              <span className="font-medium text-blue-600">Step {currentStep + 1}</span>
              <span className="mx-2">of</span>
              <span>{totalSteps}</span>
            </div>
            
            {/* Loading message */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-1">{currentStepData.title}</h3>
              <p className="text-gray-500 text-sm max-w-md">
                {currentStepData.description}
              </p>
              
              {/* Progress bar */}
              <div className="mt-4 w-full max-w-md mx-auto">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>0%</span>
                  <span>{Math.round(progressPercentage)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
