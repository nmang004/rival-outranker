import { useEffect } from "react";
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
import { formatDate } from "@/lib/formatters";

export default function ResultsPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract URL from search params
  const params = new URLSearchParams(search);
  const url = params.get("url");
  
  // Redirect to home if no URL is provided
  useEffect(() => {
    if (!url) {
      setLocation("/");
    }
  }, [url, setLocation]);
  
  const { data, isLoading, isError, error } = useQuery<SeoAnalysisResult>({
    queryKey: [`/api/analysis?url=${encodeURIComponent(url || "")}`],
    enabled: !!url,
    refetchInterval: (data) => {
      // Poll until we get complete data with results
      return (data && typeof data.overallScore === 'number' && data.results) ? false : 1000;
    },
    retry: 5,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error fetching results",
        description: (error as Error)?.message || "Failed to load analysis results. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  if (!url) {
    return null;
  }

  if (isLoading || !data) {
    return <ResultsPageSkeleton url={url} />;
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
