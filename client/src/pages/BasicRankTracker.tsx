import { useState } from "react";
import { BarChart, Search, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/PageHeader";

// Type definitions
interface Keyword {
  id: number;
  text: string;
  position: number;
  url: string;
  volume?: number;
  difficulty?: number;
  cpc?: string;
}

interface Competitor {
  url: string;
}

interface RankingData {
  website: string;
  keywords: Keyword[];
  competitors: Competitor[];
  avgPosition: number;
  date: string;
}

export default function BasicRankTracker() {
  // State variables
  const [view, setView] = useState<"form" | "results">("form");
  const [website, setWebsite] = useState("");
  const [keywords, setKeywords] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RankingData | null>(null);

  // Helper function to format numbers
  const formatNumber = (num?: number): string => {
    if (num === undefined) return "N/A";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  // Helper function to get color based on ranking position
  const getRankingColor = (position: number): string => {
    if (position <= 3) return "text-green-600 font-bold";
    if (position <= 10) return "text-emerald-500 font-semibold";
    if (position <= 20) return "text-amber-500";
    return "text-gray-600";
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!website) {
      setError("Please enter your website URL");
      return;
    }

    if (!keywords) {
      setError("Please enter at least one keyword to track");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Format the data
      const keywordList = keywords
        .split(/\n|,/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      const competitorList = competitors
        .split(/\n|,/)
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map(url => ({ url }));
      
      // Generate mock data for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create demo results
      const mockResults: RankingData = {
        website,
        keywords: keywordList.map((text, index) => ({
          id: index + 1,
          text,
          position: Math.floor(Math.random() * 30) + 1, // Random position 1-30
          url: `https://${website}/${text.toLowerCase().replace(/\s+/g, '-')}`,
          volume: Math.floor(Math.random() * 8000) + 500,
          difficulty: Math.floor(Math.random() * 70) + 20,
          cpc: `$${(Math.random() * 5 + 1).toFixed(2)}`
        })),
        competitors: competitorList.length > 0 ? competitorList : [
          { url: "competitor1.com" },
          { url: "competitor2.com" }
        ],
        avgPosition: Math.floor(Math.random() * 10) + 5, // Random avg position 5-15
        date: new Date().toISOString()
      };
      
      setResults(mockResults);
      setView("results");
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred while processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset and go back to form
  const handleReset = () => {
    setView("form");
    setResults(null);
  };

  // Render form view
  if (view === "form") {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Basic Rank Tracker"
          description="A simple, reliable keyword ranking tracker"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        {error && (
          <Alert variant="destructive" className="mt-4 mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="mt-6">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Track Keyword Rankings</CardTitle>
              <CardDescription>
                Enter your website, keywords, and optional competitors
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Your Website</Label>
                <Input
                  id="website"
                  placeholder="example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (one per line or comma-separated)</Label>
                <Textarea
                  id="keywords"
                  placeholder="SEO best practices
keyword research tool
on-page optimization"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Enter each keyword on a new line or separated by commas
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="competitors">Competitors (optional)</Label>
                <Textarea
                  id="competitors"
                  placeholder="competitor1.com
competitor2.com"
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
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Processing...
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
      </div>
    );
  }

  // Render results view
  return (
    <div className="container mx-auto py-8">
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-2" onClick={handleReset}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <PageHeader
            title="Keyword Rankings"
            description={`Results for ${results?.website || ""}`}
            icon={<BarChart className="h-6 w-6 mr-2" />}
          />
        </div>
        
        <Badge variant="outline" className="h-7">
          {new Date(results?.date || "").toLocaleDateString()}
        </Badge>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRankingColor(results?.avgPosition || 0)}`}>
              {results?.avgPosition.toFixed(1) || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground">
              Across {results?.keywords.length || 0} keywords
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Keywords Tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results?.keywords.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {results?.keywords.filter(k => k.position <= 10).length || 0} in top 10
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results?.competitors.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Performance tracking
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Keywords table */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword Rankings</CardTitle>
          <CardDescription>
            Current ranking positions for tracked keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results && results.keywords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Search Volume</TableHead>
                  <TableHead>Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.keywords.map((keyword) => (
                  <TableRow key={keyword.id}>
                    <TableCell className="font-medium">{keyword.text}</TableCell>
                    <TableCell className={getRankingColor(keyword.position)}>
                      {keyword.position}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {keyword.url}
                    </TableCell>
                    <TableCell>{formatNumber(keyword.volume)}</TableCell>
                    <TableCell>
                      {keyword.difficulty !== undefined ? (
                        <Badge variant={keyword.difficulty < 50 ? "default" : "destructive"}>
                          {keyword.difficulty}%
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No keyword data available
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tracker
          </Button>
          <Button variant="outline" onClick={() => window.print()}>Export PDF</Button>
        </CardFooter>
      </Card>
    </div>
  );
}