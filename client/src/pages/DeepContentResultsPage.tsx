import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeepContentAnalysis from "@/components/assessment/DeepContentAnalysis";
import { AlertCircle, ArrowLeft, Download, Share2 } from "lucide-react";

export default function DeepContentResultsPage() {
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState<string | null>(null);
  
  // Extract URL from query string
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setUrl(urlParam);
    }
  }, []);
  
  if (!url) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No URL specified for analysis. Please return to the main page and try again.</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setLocation('/deep-content')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Deep Content Analysis
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/deep-content')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deep Content Analysis
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share Report
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Deep Content Analysis</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 break-all">
                    URL: <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{url}</a>
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DeepContentAnalysis url={url} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}