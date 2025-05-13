import { useEffect, useState } from "react";
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
import { SeoAnalysisResult } from "@shared/schema";
import { formatDate, formatUrl } from "@/lib/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Clock, BarChart } from "lucide-react";

export default function ResultsPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract URL from search params
  const params = new URLSearchParams(search);
  const url = params.get("url");
  
  // State for selected URL
  const [selectedUrl, setSelectedUrl] = useState<string | null>(url);
  
  // For recent analyses dropdown
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  
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
  
  // Fetch the analysis for the selected URL
  const { data: apiResponse, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: [`/api/analysis?url=${encodeURIComponent(selectedUrl || "")}`],
    enabled: !!selectedUrl,
    refetchInterval: (data) => {
      // Poll until we get complete data with results
      return data && 'results' in data ? false : 1000;
    },
    retry: 5,
    retryDelay: 1000,
  });
  
  // Extract the actual analysis data from the response
  const data = apiResponse && 'results' in apiResponse ? apiResponse.results : {};

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
    window.history.replaceState({}, "", `${window.location.pathname}?${newParams.toString()}`);
  };

  if (!selectedUrl) {
    return null;
  }

  if (isLoading || !apiResponse || !apiResponse.results) {
    return <ResultsPageSkeleton url={selectedUrl} />;
  }

  const handleExportPDF = () => {
    toast({
      title: "Export Feature",
      description: "PDF export functionality will be available in the next update.",
    });
  };

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
            <Button 
              variant="outline"
              className="bg-primary-50 text-primary-700 border-primary-100 hover:bg-primary-100"
              onClick={handleExportPDF}
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export PDF
            </Button>
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
        <AssessmentTabs data={data} />
      </div>
      
      {/* Action Plan Section */}
      <ActionPlan data={data} />
      
      {/* Next Steps */}
      <NextSteps url={data.url} />
    </div>
  );
}

function ResultsPageSkeleton({ url }: { url: string }) {
  return (
    <div className="px-4 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">SEO Assessment Results</h2>
            <p className="text-gray-500 text-sm mt-1">{url}</p>
            <div className="text-xs text-gray-500 mt-1">
              Analyzing...
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-sm text-gray-500">Analyzing your website. This process may take up to 30 seconds...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
