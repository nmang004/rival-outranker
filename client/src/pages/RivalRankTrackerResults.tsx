import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { BarChart, ArrowLeft } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "@/hooks/useAuth";

export default function RivalRankTrackerResults() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  
  // Fetch the analysis data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching analysis for ID:", id);
        
        // Use a fixed ID for testing
        const testId = "demo-id";
        const response = await fetch(`/api/rival-rank-tracker/${testId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Received data:", result);
        
        if (!result || !result.keywords || !Array.isArray(result.keywords)) {
          throw new Error("Invalid data format received");
        }
        
        setData(result);
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Loading state
  if (loading || authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => navigate("/rival-rank-tracker")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Loading Analysis</h2>
        </div>
        
        <Card className="mb-4">
          <CardHeader>
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => navigate("/rival-rank-tracker")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold text-red-500">Error Loading Data</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Error Occurred</CardTitle>
            <CardDescription>There was a problem loading the analysis data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error.message}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // No data state
  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader 
          title="No Data Found"
          description="No analysis data was found for the requested ID"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>No Analysis Data</CardTitle>
            <CardDescription>We couldn't find any data for this analysis ID</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The analysis may have been deleted or you may have used an invalid link.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/rival-rank-tracker")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tracker
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Data is loaded and available
  return (
    <div className="container mx-auto py-8">
      <PageHeader 
        title="Keyword Analysis Results"
        description={`Analysis for ${data.website}`}
        icon={<BarChart className="h-6 w-6 mr-2" />}
      />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
          <CardDescription>
            Tracking {data.keywords.length} keywords with {data.competitors?.length || 0} competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-medium">Average Position</h3>
              <p className="text-3xl font-bold text-blue-600">{data.avgPosition?.toFixed(1) || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Keywords Tracked</h3>
              <p className="text-3xl font-bold">{data.keywords.length}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Last Updated</h3>
              <p className="text-muted-foreground">
                {new Date(data.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tracked Keywords</CardTitle>
          <CardDescription>Current rankings for your website</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.keywords.map((keyword: any) => (
                <TableRow key={keyword.id}>
                  <TableCell className="font-medium">{keyword.text}</TableCell>
                  <TableCell className={keyword.currentRanking?.position <= 10 ? "text-green-600 font-bold" : ""}>{
                    keyword.currentRanking?.position || "Not ranked"
                  }</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                    {keyword.currentRanking?.url || "-"}
                  </TableCell>
                  <TableCell>{keyword.metrics?.volume || "Unknown"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate("/rival-rank-tracker")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tracker
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}