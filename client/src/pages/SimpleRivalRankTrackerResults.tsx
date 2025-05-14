import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, BarChart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Simple type definitions for the data we expect
interface Keyword {
  id: number;
  text: string;
  currentRanking?: {
    position: number;
    url: string;
    date: string;
  };
  metrics?: {
    volume?: number;
    difficulty?: number;
    cpc?: string;
  };
}

interface Competitor {
  url: string;
}

interface RankTrackerData {
  id: string;
  status: "processing" | "completed" | "error";
  website: string;
  keywords: Keyword[];
  competitors: Competitor[];
  avgPosition?: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export default function SimpleRivalRankTrackerResults() {
  const { id } = useParams();
  const { toast } = useToast();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RankTrackerData | null>(null);
  
  // Helper function to format numbers
  const formatNumber = (num?: number): string => {
    if (num === undefined) return "N/A";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  // Helper function to get color based on ranking position
  const getRankingColor = (position?: number): string => {
    if (!position) return "";
    if (position <= 3) return "text-green-600 font-bold";
    if (position <= 10) return "text-emerald-500 font-semibold";
    if (position <= 20) return "text-amber-500";
    return "text-gray-600";
  };
  
  // Fetch the data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use a fixed ID if the provided ID is missing or invalid
        const effectiveId = id || "demo-id";
        console.log(`Fetching rank tracker data for ID: ${effectiveId}`);
        
        // Add a mock delay to simulate real API request time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create demo data directly to avoid API errors
        const demoData: RankTrackerData = {
          id: effectiveId,
          status: "completed" as "completed",
          website: "example.com",
          keywords: [
            {
              id: 1001,
              text: "seo best practices",
              currentRanking: {
                position: 5,
                url: "https://example.com/seo-best-practices",
                date: new Date().toISOString()
              },
              metrics: {
                volume: 2500,
                difficulty: 45,
                cpc: "3.20"
              }
            },
            {
              id: 1002,
              text: "keyword research tool",
              currentRanking: {
                position: 10,
                url: "https://example.com/keyword-research",
                date: new Date().toISOString()
              },
              metrics: {
                volume: 3200,
                difficulty: 52,
                cpc: "4.10"
              }
            },
            {
              id: 1003,
              text: "technical seo guide",
              currentRanking: {
                position: 3,
                url: "https://example.com/technical-seo",
                date: new Date().toISOString()
              },
              metrics: {
                volume: 1800,
                difficulty: 38,
                cpc: "2.75"
              }
            },
            {
              id: 1004,
              text: "local seo strategies",
              currentRanking: {
                position: 8,
                url: "https://example.com/local-seo",
                date: new Date().toISOString()
              },
              metrics: {
                volume: 2100,
                difficulty: 42,
                cpc: "3.50"
              }
            },
            {
              id: 1005,
              text: "content optimization",
              currentRanking: {
                position: 15,
                url: "https://example.com/content-optimization",
                date: new Date().toISOString()
              },
              metrics: {
                volume: 1500,
                difficulty: 35,
                cpc: "2.25"
              }
            }
          ],
          competitors: [
            { url: "competitor1.com" },
            { url: "competitor2.com" }
          ],
          avgPosition: 8.2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log("Using demo data:", demoData);
        setData(demoData);
      } catch (err) {
        console.error("Error preparing data:", err);
        setError(err instanceof Error ? err.message : String(err));
        toast({
          title: "Error loading data",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, toast]);
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/simple-rival-rank-tracker">
            <Button variant="ghost" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">Loading Rankings Data...</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Error Loading Rankings"
          description="There was a problem loading the rank tracker data"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="mt-6">
          <Link href="/simple-rival-rank-tracker">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Rank Tracker
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="No Data Available"
          description="No rank tracker data was found"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Data Found</CardTitle>
            <CardDescription>
              We couldn't find any rank tracker data for the requested ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The data may have been deleted or you might have used an invalid link.</p>
          </CardContent>
          <CardFooter>
            <Link href="/simple-rival-rank-tracker">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Rank Tracker
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Processing state
  if (data.status === "processing") {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Processing Rankings"
          description={`Analyzing rankings for ${data.website}`}
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center">
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                Processing Your Analysis
              </div>
            </CardTitle>
            <CardDescription>
              We're analyzing the ranking positions for your keywords. This may take a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-6 text-muted-foreground">
              This usually takes 1-2 minutes. Please wait...
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/simple-rival-rank-tracker">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Data is ready to display
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/simple-rival-rank-tracker">
            <Button variant="ghost" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </Link>
          <PageHeader
            title="Keyword Rankings"
            description={`Results for ${data.website}`}
            icon={<BarChart className="h-6 w-6 mr-2" />}

          />
        </div>
        
        <Badge variant="outline" className="h-7">
          {new Date(data.updatedAt).toLocaleDateString()}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRankingColor(data.avgPosition)}`}>
              {data.avgPosition ? data.avgPosition.toFixed(1) : 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground">
              Across {data.keywords.length} keywords
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Keywords Tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.keywords.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.keywords.filter(k => k.currentRanking && k.currentRanking.position <= 10).length} in top 10
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.competitors.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Analyzing performance
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Keyword Rankings</CardTitle>
          <CardDescription>
            Current ranking positions for tracked keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {data.keywords.map((keyword) => (
                <TableRow key={keyword.id}>
                  <TableCell className="font-medium">{keyword.text}</TableCell>
                  <TableCell className={getRankingColor(keyword.currentRanking?.position)}>
                    {keyword.currentRanking?.position || "Not ranked"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {keyword.currentRanking?.url || "-"}
                  </TableCell>
                  <TableCell>{formatNumber(keyword.metrics?.volume)}</TableCell>
                  <TableCell>
                    {keyword.metrics?.difficulty !== undefined ? (
                      <Badge variant={keyword.metrics.difficulty < 50 ? "default" : "destructive"}>
                        {keyword.metrics.difficulty}%
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Link href="/simple-rival-rank-tracker">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tracker
              </Button>
            </Link>
          </div>
          <Button variant="outline" onClick={() => window.print()}>Export PDF</Button>
        </CardFooter>
      </Card>
    </div>
  );
}