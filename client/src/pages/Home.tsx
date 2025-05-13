import { useState } from "react";
import { useLocation } from "wouter";
import UrlForm from "@/components/UrlForm";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { urlFormSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formUrl, setFormUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest('POST', '/api/analyze', { url });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis started",
        description: "We've started analyzing your website. You'll be redirected to results soon.",
      });
      
      // Poll for results in the background
      pollForResults(data.url);
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message || "There was an error analyzing the URL. Please try again.",
        variant: "destructive",
      });
    }
  });

  const pollForResults = async (url: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    const minWaitTime = 5; // Minimum wait time in seconds to show analysis progress
    const startTime = Date.now();
    
    const checkResults = async () => {
      try {
        const response = await fetch(`/api/analysis?url=${encodeURIComponent(url)}`);
        
        if (response.ok) {
          const result = await response.json();
          
          // Check if the result has actual analysis data
          if (result && typeof result.overallScore === 'number' && result.results) {
            // Calculate elapsed time since we started polling
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            
            // If we haven't waited the minimum time, don't redirect yet
            if (elapsedSeconds < minWaitTime) {
              console.log(`Results ready but waiting for minimum display time (${elapsedSeconds}/${minWaitTime}s)`);
              return false; // Keep polling until minimum time elapsed
            }
            
            // Minimum wait time elapsed, redirect to results
            setLocation(`/results?url=${encodeURIComponent(url)}`);
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error("Error checking results:", error);
        return false;
      }
    };
    
    const poll = async () => {
      attempts++;
      
      // Update the progress percentage based on the minimum wait time
      // Progress goes from 0 to 90% during the minimum wait period
      // The last 10% is reserved for when actual results come in
      const progressPerAttempt = 90 / minWaitTime;
      const newProgress = Math.min(90, progressPerAttempt * attempts);
      setAnalysisProgress(newProgress);
      
      const hasResults = await checkResults();
      
      if (hasResults) {
        // Set to 100% when complete
        setAnalysisProgress(100);
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(poll, 1000); // Poll every second
      } else {
        // If max attempts reached, show error state instead of redirecting
        setError("Analysis timed out. Please try again.");
        setIsSubmitting(false);
        setAnalysisProgress(0);
        
        toast({
          title: "Analysis timed out",
          description: "The analysis is taking longer than expected. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    poll();
  };

  const handleSubmit = async (url: string) => {
    setFormUrl(url);
    setError(null);
    setIsSubmitting(true);
    setAnalysisProgress(0); // Reset progress bar
    
    // Validate URL
    try {
      urlFormSchema.parse({ url });
      analyzeMutation.mutate(url);
    } catch (error) {
      setIsSubmitting(false);
      setAnalysisProgress(0);
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-6 py-8 sm:px-8 bg-muted/30">
      <div className="bg-white shadow-md rounded-lg p-8 mb-6 sage-border card-hover">
        <h1 className="text-3xl gradient-heading mb-3">SEO Best Practices Assessment</h1>
        <h2 className="text-xl text-muted-foreground mb-6">Comprehensive Website Analysis & Optimization</h2>
        
        <div className="bg-muted/30 p-6 rounded-lg mb-8">
          <p className="text-foreground mb-6">Enter any website URL below to receive a detailed analysis of its SEO performance across 10+ critical factors. Our tool provides actionable recommendations to improve search visibility and drive more organic traffic.</p>
        
          <UrlForm 
            onSubmit={handleSubmit} 
            isLoading={analyzeMutation.isPending || isSubmitting}
            initialUrl={formUrl}
          />
        </div>
        
        {(analyzeMutation.isPending || isSubmitting) && (
          <div className="mt-6 p-5 bg-muted rounded-lg border border-primary/20">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin mr-3" />
              <div className="w-full">
                <p className="text-primary font-medium">Analyzing your website...</p>
                <p className="text-muted-foreground text-sm mt-1 mb-3">
                  We're evaluating key SEO factors including keywords, meta tags, content quality, 
                  mobile optimization, technical performance, and user experience signals.
                </p>
                <div className="w-full">
                  <Progress value={analysisProgress} className="h-2.5 bg-muted sage-bg-gradient" />
                  <p className="text-xs text-right mt-1 text-muted-foreground">
                    {analysisProgress < 100 ? `${Math.round(analysisProgress)}% complete` : "Analysis complete!"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-5 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-destructive mr-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p className="text-destructive font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Features Highlight */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-muted/20 p-5 rounded-lg border border-primary/10 card-hover">
            <div className="text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 11-8-8-8 8"/>
                <path d="M21 16H3"/>
                <path d="M10 3v18"/>
              </svg>
            </div>
            <h3 className="font-medium mb-2">Comprehensive Analysis</h3>
            <p className="text-sm text-muted-foreground">Our tool evaluates 10+ SEO factors including keywords, content, technical aspects, and user signals.</p>
          </div>
          
          <div className="bg-muted/20 p-5 rounded-lg border border-primary/10 card-hover">
            <div className="text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                <line x1="16" y1="8" x2="2" y2="22"/>
                <line x1="17.5" y1="15" x2="9" y2="15"/>
              </svg>
            </div>
            <h3 className="font-medium mb-2">Actionable Recommendations</h3>
            <p className="text-sm text-muted-foreground">Get specific, prioritized recommendations to improve your website's search performance.</p>
          </div>
          
          <div className="bg-muted/20 p-5 rounded-lg border border-primary/10 card-hover">
            <div className="text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h3 className="font-medium mb-2">Deep Content Analysis</h3>
            <p className="text-sm text-muted-foreground">Analyze keyword density, readability scores, content structure, and engagement factors.</p>
          </div>
        </div>
        
        {/* Advanced Options Section */}
        <div className="border-t border-primary/10 pt-6 mt-8">
          <details className="group">
            <summary className="flex items-center text-sm font-medium text-primary cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Advanced Options</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-2 transform transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-primary/50 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-foreground">Deep content analysis</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-primary/50 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-foreground">Include competitor analysis</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-primary/50 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-foreground">Generate PDF report</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-primary/50 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-foreground">Schedule regular monitoring</span>
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
