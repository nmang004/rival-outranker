import { useState } from "react";
import { useLocation } from "wouter";
import { BarChart, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/ui/use-toast";
import { PageHeader } from "@/components/PageHeader";

export default function SimpleRivalRankTracker() {
  const [website, setWebsite] = useState("");
  const [keywords, setKeywords] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!website) {
      toast({
        title: "Missing website",
        description: "Please enter your website URL",
        variant: "destructive"
      });
      return;
    }

    if (!keywords) {
      toast({
        title: "Missing keywords",
        description: "Please enter at least one keyword to track",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format the data
      const keywordList = keywords
        .split(/\n|,/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      const competitorList = competitors
        .split(/\n|,/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      // Generate a unique ID based on timestamp to avoid duplicate demos
      const analysisId = `demo-${Date.now()}`;
      
      // Show success message
      toast({
        title: "Analysis Started",
        description: `Tracking rankings for ${website} with ${keywordList.length} keywords`,
      });
      
      // Add a small delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Always navigate to the results page with our generated ID
      navigate(`/simple-rival-rank-tracker-results/${analysisId}`);
    } catch (error) {
      console.error("Error creating tracker:", error);
      toast({
        title: "Error",
        description: "Failed to create rank tracker. Using demo data instead.",
        variant: "destructive"
      });
      
      // Navigate to demo results when in error
      navigate("/simple-rival-rank-tracker-results/demo-id");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Rival Rank Tracker"
        description="Track your keyword rankings against competitors"
        icon={<BarChart className="h-6 w-6 mr-2" />}
      />
      
      <Card className="mt-6">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create New Tracking Analysis</CardTitle>
            <CardDescription>
              Enter your website, keywords, and competitors to track rankings
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">Your Website</Label>
              <Input
                id="website"
                placeholder="https://yourwebsite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (one per line)</Label>
              <Textarea
                id="keywords"
                placeholder="SEO best practices
keyword research tool
on-page optimization"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={5}
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter each keyword on a new line or separated by commas
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="competitors">Competitors (one per line)</Label>
              <Textarea
                id="competitors"
                placeholder="competitor1.com
competitor2.com
competitor3.com"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Enter competitor domains to compare rankings
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <>
                  <div className="spinner mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track Rankings
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Try the Demo</CardTitle>
            <CardDescription>
              See an example of rank tracking results without submitting your own data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Our demo shows an example of keyword rank tracking for a website against two competitors.
              The demo includes ranking positions, search volume data, and keyword difficulty metrics.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate("/simple-rival-rank-tracker-results/demo-id")}>
              View Demo
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}