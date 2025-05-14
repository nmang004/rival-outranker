import { useState } from "react";
import { useLocation } from "wouter";
import UrlForm from "@/components/UrlForm";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { urlFormSchema } from "@shared/schema";
import { 
  Loader2, 
  ChevronDown, 
  LineChart, 
  BarChart2, 
  Search,
  Rocket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formUrl, setFormUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [useDeepContentAnalysis, setUseDeepContentAnalysis] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { url: string, runDeepContentAnalysis?: boolean }) => {
      // First check if the URL is our own API endpoint or Replit domain
      if (data.url.includes('/api/') || data.url.includes('replit.dev') || data.url.includes('replit.app')) {
        throw new Error('Cannot analyze our own API endpoints or Replit domains');
      }
      
      const response = await apiRequest<{
        message: string;
        url: string;
        runDeepContentAnalysis?: boolean;
      }>('/api/analyze', {
        method: 'POST',
        data: data
      });
      return response;
    },
    onSuccess: (data) => {
      let successMessage = "Analysis started";
      let description = "We've started analyzing your website. You'll be redirected to results soon.";
      
      const isDeepContentAnalysis = !!data.runDeepContentAnalysis;
      
      if (isDeepContentAnalysis) {
        successMessage = "Deep content analysis started";
        description = "We've started a comprehensive content analysis. You'll be redirected to results soon.";
      }
      
      toast({
        title: successMessage,
        description: description,
      });
      
      // Poll for results in the background, passing the deep content flag
      pollForResults(data.url, !!data.runDeepContentAnalysis);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "There was an error analyzing the URL. Please try again.";
      
      // Show a more specific message for API endpoint attempts
      const toastMessage = errorMessage.includes('API endpoints') 
        ? "Cannot analyze our own API endpoints or Replit domains. Please enter a regular website URL."
        : errorMessage;
      
      toast({
        title: "Analysis failed",
        description: toastMessage,
        variant: "destructive",
      });
      
      setIsSubmitting(false);
      setAnalysisProgress(0);
    }
  });

  const pollForResults = async (url: string, isDeepContentAnalysis: boolean = false) => {
    let attempts = 0;
    const maxAttempts = 15; // 15 seconds total polling time
    const minWaitTime = 5; // Minimum wait time in seconds to show analysis progress
    const startTime = Date.now();
    
    // For URL normalization purposes - sometimes trailing slashes or missing protocols can cause mismatches
    const normalizeUrl = (inputUrl: string) => {
      // Convert URL to lowercase
      let normalizedUrl = inputUrl.toLowerCase();
      
      // If there's no protocol, add https://
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      // Attempt to create URL object to handle other normalizations
      try {
        const urlObj = new URL(normalizedUrl);
        
        // Remove trailing slash from pathname if it exists (except for root path)
        if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
          urlObj.pathname = urlObj.pathname.slice(0, -1);
        }
        
        return urlObj.toString();
      } catch {
        // If URL parsing fails, return the original with basic normalization
        return normalizedUrl;
      }
    };
    
    const normalizedUrl = normalizeUrl(url);
    
    const checkResults = async () => {
      try {
        // Try both normalized and original URL in our requests
        const response = await fetch(`/api/analysis?url=${encodeURIComponent(normalizedUrl)}`);
        
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
            
            // Minimum wait time elapsed, redirect to the appropriate results page
            if (isDeepContentAnalysis && result.results.deepContentAnalysis) {
              console.log('Redirecting to deep content results');
              setLocation(`/deep-content-results?url=${encodeURIComponent(url)}`);
            } else {
              setLocation(`/results?url=${encodeURIComponent(url)}`);
            }
            return true;
          }
        }
        
        // If the normalized URL failed, try the original as fallback
        if (normalizedUrl !== url) {
          const fallbackResponse = await fetch(`/api/analysis?url=${encodeURIComponent(url)}`);
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            if (fallbackResult && typeof fallbackResult.overallScore === 'number' && fallbackResult.results) {
              const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
              if (elapsedSeconds < minWaitTime) {
                return false;
              }
              
              // Handle deep content analysis redirect if needed
              if (isDeepContentAnalysis && fallbackResult.results.deepContentAnalysis) {
                setLocation(`/deep-content-results?url=${encodeURIComponent(url)}`);
              } else {
                setLocation(`/results?url=${encodeURIComponent(url)}`);
              }
              return true;
            }
          }
        }
        
        // If we've made enough attempts, but a result might exist (just not at the expected URL),
        // check the latest analyses as a fallback
        if (attempts >= 10) {
          const latestResponse = await fetch('/api/analyses');
          if (latestResponse.ok) {
            const analyses = await latestResponse.json();
            // Check if any recent analyses match our URL or normalized URL
            const matchingAnalysis = analyses.find((analysis: any) => {
              const analysisUrl = analysis.url.toLowerCase();
              const targetUrl = url.toLowerCase();
              return (
                analysisUrl === targetUrl || 
                analysisUrl === normalizedUrl.toLowerCase() ||
                // Also check for partial matches (domain only)
                (new URL(analysisUrl)).hostname === (new URL(targetUrl)).hostname
              );
            });
            
            if (matchingAnalysis) {
              const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
              if (elapsedSeconds < minWaitTime) {
                return false;
              }
              
              // Check if we should redirect to deep content results
              if (isDeepContentAnalysis && matchingAnalysis.results && matchingAnalysis.results.deepContentAnalysis) {
                setLocation(`/deep-content-results?url=${encodeURIComponent(matchingAnalysis.url)}`);
              } else {
                setLocation(`/results?url=${encodeURIComponent(matchingAnalysis.url)}`);
              }
              return true;
            }
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
      
      // Add artificial delay to first few attempts to allow server to process
      if (attempts <= 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));  
      }
      
      const hasResults = await checkResults();
      
      if (hasResults) {
        // Set to 100% when complete
        setAnalysisProgress(100);
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(poll, 1000); // Poll every second
      } else {
        // If max attempts reached but we're near the end of polling,
        // just redirect to results anyway and let the results page handle any missing data
        if (attempts >= maxAttempts - 2) {
          setAnalysisProgress(100);
          // Use the appropriate results page based on the requested analysis type
          if (isDeepContentAnalysis) {
            setLocation(`/deep-content-results?url=${encodeURIComponent(url)}`);
          } else {
            setLocation(`/results?url=${encodeURIComponent(url)}`);
          }
          return;
        }
        
        // Otherwise show error state
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
      
      // Check if the URL is our own API endpoint or Replit domain
      if (url.includes('/api/') || url.includes('replit.dev') || url.includes('replit.app')) {
        throw new Error('Cannot analyze our own API endpoints or Replit domains');
      }
      
      // Include the deep content analysis option with the standard analysis request
      const requestData = { 
        url,
        runDeepContentAnalysis: useDeepContentAnalysis
      };
      
      // Use standard analysis with the deep content flag
      analyzeMutation.mutate(requestData);
    } catch (error) {
      setIsSubmitting(false);
      setAnalysisProgress(0);
      
      // Show specific error for API endpoint attempts
      if ((error as Error).message.includes('our own API endpoints')) {
        toast({
          title: "Invalid URL",
          description: "Cannot analyze our own API endpoints or Replit domains. Please enter a regular website URL.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL including http:// or https://",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-white to-primary/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
        
        {/* Decorative patterns */}
        <div className="absolute top-20 right-[10%] opacity-20">
          <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 0C26.863 0 0 26.863 0 60s26.863 60 60 60 60-26.863 60-60S93.137 0 60 0zm0 100c-22.091 0-40-17.909-40-40s17.909-40 40-40 40 17.909 40 40-17.909 40-40 40z" 
                  fill="currentColor" className="text-primary/40" />
          </svg>
        </div>
        
        <div className="absolute bottom-[20%] left-[5%] opacity-20 rotate-45">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" className="text-primary/70" />
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" className="text-primary/70" />
          </svg>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 sm:px-8 text-center relative z-10">
        <div className="animate-float inline-block mb-6">
          <div className="bg-white p-3 rounded-full shadow-md border border-primary/10">
            <div className="rounded-full bg-primary/10 p-2">
              <LineChart className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent leading-tight animate-fade-in">
          SEO Best Practices Assessment
        </h1>
        
        <h2 className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-fade-in">
          Analyze your website's SEO performance and get actionable recommendations to improve your rankings
        </h2>
        
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-8 mb-10 border border-primary/10 relative animate-fade-in">
          {/* Card decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 rounded-t-xl"></div>
          <div className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-lg border border-primary/10 z-10">
            <div className="rounded-full bg-primary p-2 text-white">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          
          <div className="text-left mb-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-primary/10 mr-4 animate-pulse-slow">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold gradient-text">Analyze Your Website</h3>
                <p className="text-muted-foreground mt-1">
                  Enter URLs below to receive a detailed analysis of their SEO performance across 10+ critical factors.
                </p>
              </div>
            </div>
          </div>
        
          <UrlForm 
            onSubmit={handleSubmit} 
            isLoading={analyzeMutation.isPending || isSubmitting}
            initialUrl={formUrl}
          />
          
          {/* Advanced Analysis Options */}
          <div className="mt-6">
            <button 
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-primary/10 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="rounded-full p-1.5 bg-primary/10 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <h4 className="text-sm font-medium">Advanced Analysis Options</h4>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showAdvancedOptions ? 'transform rotate-180' : ''}`} 
              />
            </button>
            
            {showAdvancedOptions && (
              <div className="overflow-hidden">
                <div className="p-4 pt-2 border border-t-0 border-primary/10 rounded-b-lg bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                      <div className="flex items-start">
                        <input 
                          type="checkbox" 
                          id="competitor-analysis"
                          className="rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                        />
                        <div className="ml-2">
                          <label htmlFor="competitor-analysis" className="flex items-center cursor-pointer">
                            <div className="rounded-full p-1 bg-primary/5 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/80">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                              </svg>
                            </div>
                            <span className="text-xs font-medium">Competitor Analysis</span>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">Identify and analyze your top competitors by location</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                      <div className="flex items-start">
                        <input 
                          type="checkbox" 
                          id="deep-content"
                          className="rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                          checked={useDeepContentAnalysis}
                          onChange={e => setUseDeepContentAnalysis(e.target.checked)}
                        />
                        <div className="ml-2">
                          <label htmlFor="deep-content" className="flex items-center cursor-pointer">
                            <div className="rounded-full p-1 bg-primary/5 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/80">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                              </svg>
                            </div>
                            <span className="text-xs font-medium">Deep Content Analysis</span>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">In-depth content review with section-by-section insights</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                      <div className="flex items-start">
                        <input 
                          type="checkbox" 
                          id="export-pdf"
                          className="rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                        />
                        <div className="ml-2">
                          <label htmlFor="export-pdf" className="flex items-center cursor-pointer">
                            <div className="rounded-full p-1 bg-primary/5 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/80">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                            </div>
                            <span className="text-xs font-medium">Export PDF Report</span>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">Generate a comprehensive PDF report for offline sharing</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                      <div className="flex items-start">
                        <input 
                          type="checkbox" 
                          id="recurring-scan"
                          className="rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                        />
                        <div className="ml-2">
                          <label htmlFor="recurring-scan" className="flex items-center cursor-pointer">
                            <div className="rounded-full p-1 bg-primary/5 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/80">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                                <path d="M16 21h5v-5"></path>
                              </svg>
                            </div>
                            <span className="text-xs font-medium">Schedule Recurring Scan</span>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">Monitor SEO performance with scheduled weekly scans</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                className="h-6 w-6 text-destructive mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-destructive font-medium">Error analyzing website</h3>
                <p className="text-muted-foreground text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Features Section */}
      <div className="bg-gradient-to-tr from-primary/5 to-white py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gradient-heading mb-4">Comprehensive SEO Analysis</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our tool analyzes over 70 SEO factors to provide actionable insights that help improve your website's visibility in search engines
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">On-Page SEO Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Analyze meta tags, heading structure, content quality, keyword usage, and internal linking to optimize individual pages
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Technical SEO Audit</h3>
              <p className="text-muted-foreground text-sm">
                Evaluate page speed, mobile-friendliness, schema markup, SSL security, and crawlability to improve technical performance
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">User Experience Signals</h3>
              <p className="text-muted-foreground text-sm">
                Measure readability, accessibility, and engagement metrics to ensure your content meets user expectations and search engine standards
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}