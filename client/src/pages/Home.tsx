import { useState, FormEvent } from "react";
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
    <div className="bg-gradient-to-b from-white to-muted/20">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-16 sm:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">
          SEO Best Practices Assessment
        </h1>
        <h2 className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto">
          Analyze your website's SEO performance and get actionable recommendations to improve your rankings
        </h2>
        
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 mb-10 border border-primary/10">
          <div className="text-left mb-4">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-primary/10 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M9.5 3H4a2 2 0 0 0-2 2v5.5"></path>
                  <path d="M14.5 21H20a2 2 0 0 0 2-2v-5.5"></path>
                  <path d="M3 10V3"></path>
                  <path d="M21 14v7"></path>
                  <path d="M14 21h-4"></path>
                  <path d="M10 3h4"></path>
                  <path d="m7.5 8.5 9 9"></path>
                  <path d="m7.5 15.5 9-9"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium">Analyze Your Website</h3>
            </div>
            <p className="text-muted-foreground mt-2 mb-4 ml-10">
              Enter URLs below to receive a detailed analysis of their SEO performance across 10+ critical factors.
            </p>
          </div>
        
          <UrlForm 
            onSubmit={handleSubmit} 
            isLoading={analyzeMutation.isPending || isSubmitting}
            initialUrl={formUrl}
          />
        </div>
        
        {(analyzeMutation.isPending || isSubmitting) && (
          <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-primary/10">
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
          <div className="max-w-3xl mx-auto p-5 bg-destructive/10 rounded-xl shadow-lg border border-destructive/20">
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
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gradient-heading mb-3">Complete SEO Analysis In Minutes</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our comprehensive analysis tool evaluates all critical SEO factors to help you improve your search rankings
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-primary/10 card-hover relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-3xl rounded-tr-xl z-0"></div>
              <div className="relative z-10">
                <div className="p-2.5 bg-primary/10 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M3 3v18h18"></path>
                    <path d="m18 17-2-4-3 3-2-8-3 6"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Comprehensive Analysis</h3>
                <p className="text-muted-foreground">
                  Our tool evaluates 10+ SEO factors including:
                </p>
                <ul className="text-sm text-muted-foreground mt-3 space-y-2">
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Keyword optimization & usage</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>On-page technical factors</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Content quality evaluation</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-primary/10 card-hover relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-3xl rounded-tr-xl z-0"></div>
              <div className="relative z-10">
                <div className="p-2.5 bg-primary/10 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                    <line x1="16" y1="8" x2="2" y2="22"/>
                    <line x1="17.5" y1="15" x2="9" y2="15"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Actionable Recommendations</h3>
                <p className="text-muted-foreground">
                  Get specific, prioritized action items with:
                </p>
                <ul className="text-sm text-muted-foreground mt-3 space-y-2">
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Step-by-step implementation guides</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Priority-based action plans</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Code examples & implementation details</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-primary/10 card-hover relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-3xl rounded-tr-xl z-0"></div>
              <div className="relative z-10">
                <div className="p-2.5 bg-primary/10 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Deep Content Analysis</h3>
                <p className="text-muted-foreground">
                  Advanced evaluation of content factors:
                </p>
                <ul className="text-sm text-muted-foreground mt-3 space-y-2">
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Keyword density & distribution</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Readability & engagement metrics</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>E-E-A-T signal analysis</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Options Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 sm:px-8">
        <div className="bg-white p-8 rounded-xl shadow-md border border-primary/10">
          <h3 className="text-xl font-semibold mb-6 flex items-center text-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-primary"
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
            Advanced Analysis Options
          </h3>
            
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="h-5 w-5 rounded border border-primary/50 group-hover:border-primary peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                  <div className="absolute top-[3px] left-[4px] opacity-0 peer-checked:opacity-100 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <span className="text-foreground font-medium">Deep content analysis</span>
                  <p className="text-xs text-muted-foreground mt-1">Advanced content evaluation with NLP analysis</p>
                </div>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="h-5 w-5 rounded border border-primary/50 group-hover:border-primary peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                  <div className="absolute top-[3px] left-[4px] opacity-0 peer-checked:opacity-100 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <span className="text-foreground font-medium">Include competitor analysis</span>
                  <p className="text-xs text-muted-foreground mt-1">Compare your site with top-ranking competitors</p>
                </div>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="h-5 w-5 rounded border border-primary/50 group-hover:border-primary peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                  <div className="absolute top-[3px] left-[4px] opacity-0 peer-checked:opacity-100 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <span className="text-foreground font-medium">Generate PDF report</span>
                  <p className="text-xs text-muted-foreground mt-1">Receive a downloadable report with all analysis data</p>
                </div>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="h-5 w-5 rounded border border-primary/50 group-hover:border-primary peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                  <div className="absolute top-[3px] left-[4px] opacity-0 peer-checked:opacity-100 text-white">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <span className="text-foreground font-medium">Schedule regular monitoring</span>
                  <p className="text-xs text-muted-foreground mt-1">Set up recurring analysis to track performance over time</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}