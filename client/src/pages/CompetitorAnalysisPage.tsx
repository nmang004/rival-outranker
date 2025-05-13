import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { urlFormSchema } from "@shared/schema";
import { Loader2, Search, Map, Globe, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { US_CITIES } from "@shared/us-cities";

export default function CompetitorAnalysisPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formUrl, setFormUrl] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const cityOptions = US_CITIES.map(city => ({
    value: `${city.city}, ${city.state}`,
    label: `${city.city}, ${city.state}`
  }));

  const analyzeMutation = useMutation({
    mutationFn: async (data: { url: string, city: string }) => {
      const response = await apiRequest('POST', '/api/competitors', data);
      return response;
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      setAnalysisProgress(100);
      
      // Redirect to results page with the analysis parameters
      setTimeout(() => {
        setLocation(`/competitor-results?url=${encodeURIComponent(formUrl)}&city=${encodeURIComponent(selectedCity)}`);
      }, 500);
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      setError(error.message || "An error occurred during analysis");
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze competitors.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setAnalysisProgress(0);
    
    try {
      // Validate URL
      const parsed = urlFormSchema.safeParse({ url: formUrl });
      
      if (!parsed.success) {
        setError("Please enter a valid URL");
        setIsSubmitting(false);
        return;
      }

      if (!selectedCity) {
        setError("Please select a city for local competitor analysis");
        setIsSubmitting(false);
        return;
      }
      
      // Start progress simulation
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + (100 - prev) * 0.1;
          return Math.min(newProgress, 95);
        });
      }, 800);
      
      // Submit URL for analysis
      analyzeMutation.mutate({ url: formUrl, city: selectedCity });
      
      return () => clearInterval(interval);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container py-8 px-4 mx-auto">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Competitor Analysis
          </h1>
          <p className="text-muted-foreground">
            Identify and analyze your top competitors based on location and industry
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden mb-8">
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Enter URL and Location</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll find your top local competitors and analyze their SEO strategies.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="url">Your Website URL</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Select City for Local Analysis</Label>
                    <div className="mt-1.5">
                      <Combobox
                        options={cityOptions}
                        value={selectedCity}
                        onChange={setSelectedCity}
                        placeholder="Select a city..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formUrl || !selectedCity}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Competitors...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Find & Analyze Competitors
                      </>
                    )}
                  </Button>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </div>
          </div>
          
          {(analyzeMutation.isPending || isSubmitting) && (
            <div className="p-4 pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing competitors...</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Map className="h-5 w-5 mr-2 text-primary" />
                Geo-Targeted Analysis
              </CardTitle>
              <CardDescription>Location-specific competitor data</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Local search visibility comparison</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Location-based keyword rankings</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>City-specific competitor identification</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Local business listing comparison</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" />
                Competitive Landscape
              </CardTitle>
              <CardDescription>Industry positioning insights</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Top competitor identification</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Market share estimation</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Competitive strength assessment</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Audience overlap analysis</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChart2 className="h-5 w-5 mr-2 text-primary" />
                Performance Benchmarking
              </CardTitle>
              <CardDescription>Compare metrics against competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Domain authority comparison</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Backlink profile analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Content quality assessment</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Page speed benchmarking</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Search className="h-5 w-5 mr-2 text-primary" />
                Strategy Insights
              </CardTitle>
              <CardDescription>Actionable competitive intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Keyword gap analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Content strategy comparison</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Technical SEO comparison</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Growth opportunity identification</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-primary/10 p-6">
          <h2 className="text-lg font-semibold mb-3">How Competitor Analysis Works</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">1</div>
              <div>
                <h3 className="font-medium">Local Competitor Identification</h3>
                <p className="text-sm text-muted-foreground">
                  We identify your top competitors based on your location and industry to ensure relevant comparisons.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">2</div>
              <div>
                <h3 className="font-medium">Competitive Metrics Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  We analyze key SEO metrics of your competitors and benchmark your performance against them.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">3</div>
              <div>
                <h3 className="font-medium">Keyword Gap Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  We identify valuable keywords your competitors are ranking for that you're missing.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">4</div>
              <div>
                <h3 className="font-medium">Content and Link Strategy Comparison</h3>
                <p className="text-sm text-muted-foreground">
                  We compare content quality, backlink profiles, and overall SEO strategy with your competitors.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">5</div>
              <div>
                <h3 className="font-medium">Actionable Opportunity Identification</h3>
                <p className="text-sm text-muted-foreground">
                  We provide specific recommendations based on competitor strengths and weaknesses to improve your SEO.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}