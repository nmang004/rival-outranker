import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { urlFormSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DeepContentAnalysisPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formUrl, setFormUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest('POST', '/api/deep-content', { url });
      return response;
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      setAnalysisProgress(100);
      
      // Redirect to results page with the analysis ID
      setTimeout(() => {
        setLocation(`/deep-content-results?url=${encodeURIComponent(formUrl)}`);
      }, 500);
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      setError(error.message || "An error occurred during analysis");
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze the URL.",
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
      
      // Start progress simulation
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + (100 - prev) * 0.1;
          return Math.min(newProgress, 95);
        });
      }, 800);
      
      // Submit URL for analysis
      analyzeMutation.mutate(formUrl);
      
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
            Deep Content Analysis
          </h1>
          <p className="text-muted-foreground">
            Get comprehensive section-by-section content evaluation with specific recommendations
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden mb-8">
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Enter URL to Analyze</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll perform an in-depth analysis of your content structure, readability, semantic relevance, and engagement factors.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formUrl}
                    className="whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : "Analyze Content"}
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
                  <span>Analyzing content...</span>
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
              <CardTitle className="text-lg">Content Structure Analysis</CardTitle>
              <CardDescription>Evaluate your content organization</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Heading structure evaluation</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Paragraph length optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Content distribution assessment</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Section balance evaluation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Readability Metrics</CardTitle>
              <CardDescription>Measure reading ease and complexity</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Flesch Reading Ease scoring</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Sentence complexity analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Word choice evaluation</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Passive voice detection</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Semantic Relevance</CardTitle>
              <CardDescription>Check topic coverage and context</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Keyword context analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Topic depth evaluation</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Entity analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Keyword density optimization</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement Factors</CardTitle>
              <CardDescription>Measure audience engagement potential</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Content format diversity</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Interactive elements detection</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Call-to-action quality analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                  <span>Multimedia content evaluation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-primary/10 p-6">
          <h2 className="text-lg font-semibold mb-3">How Deep Content Analysis Works</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">1</div>
              <div>
                <h3 className="font-medium">Content Structure Evaluation</h3>
                <p className="text-sm text-muted-foreground">
                  We analyze your headings, paragraph structure, and content distribution to ensure optimal organization.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">2</div>
              <div>
                <h3 className="font-medium">Readability Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  We measure reading ease scores, sentence complexity, and word choice to ensure your content is accessible.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">3</div>
              <div>
                <h3 className="font-medium">Semantic Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  We evaluate topic coverage, keyword context, and entity recognition to ensure content relevance.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">4</div>
              <div>
                <h3 className="font-medium">Engagement Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  We analyze content formats, interactive elements, and call-to-actions to maximize audience engagement.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full h-6 w-6 bg-primary/10 text-primary flex items-center justify-center font-medium mr-3 mt-0.5">5</div>
              <div>
                <h3 className="font-medium">Actionable Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  We provide specific, prioritized recommendations for improving your content with section-by-section guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}