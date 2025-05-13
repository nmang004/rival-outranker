import { useState } from "react";
import { useLocation } from "wouter";
import UrlForm from "@/components/UrlForm";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { urlFormSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formUrl, setFormUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    const checkResults = async () => {
      try {
        const response = await fetch(`/api/analysis?url=${encodeURIComponent(url)}`);
        
        if (response.ok) {
          const result = await response.json();
          
          // Check if the result has actual analysis data
          if (result && typeof result.overallScore === 'number' && result.results) {
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
      
      const hasResults = await checkResults();
      
      if (hasResults) {
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(poll, 1000); // Poll every second
      } else {
        // If max attempts reached, show error state instead of redirecting
        setError("Analysis timed out. Please try again.");
        setIsSubmitting(false);
        
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
    
    // Validate URL
    try {
      urlFormSchema.parse({ url });
      analyzeMutation.mutate(url);
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">SEO Best Practices Assessment Tool</h1>
        <p className="text-gray-600 mb-6">Enter a URL below to analyze the webpage's SEO performance across multiple factors. We'll generate a detailed report with actionable recommendations.</p>
        
        <UrlForm 
          onSubmit={handleSubmit} 
          isLoading={analyzeMutation.isPending || isSubmitting}
          initialUrl={formUrl}
        />
        
        {(analyzeMutation.isPending || isSubmitting) && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              <p className="text-blue-700">Analyzing your website. This may take up to 30 seconds...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500 mr-2"
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
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Advanced Options Section */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <details className="group">
            <summary className="flex items-center text-sm font-medium text-primary-600 cursor-pointer">
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
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-600">Deep content analysis</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-600">Include competitor analysis</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-600">Generate PDF report</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600">Schedule regular monitoring</span>
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
