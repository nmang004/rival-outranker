import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Share2, Printer, RefreshCw, Globe, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportCompetitorToPDF } from '@/lib/competitorPdfExport';
import { useQuery } from '@tanstack/react-query';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CompetitorAnalysis from '@/components/assessment/CompetitorAnalysis';
import FullCompetitorResults from '@/components/assessment/FullCompetitorResults';

export default function CompetitorResultsPage() {
  const [location] = useLocation();
  const [url, setUrl] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Parse URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get('url');
    const cityParam = searchParams.get('city');
    
    if (urlParam) setUrl(urlParam);
    if (cityParam) setCity(cityParam);
  }, [location]);
  
  // Setup the Toast hook
  const { toast } = useToast();
  
  // Get the competitor analysis data
  const { data: competitorData } = useQuery<any>({
    queryKey: [`/api/competitors?url=${encodeURIComponent(url)}&city=${encodeURIComponent(city)}`],
    enabled: !!url && !!city,
  });
  
  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      
      if (!competitorData) {
        throw new Error('No competitor data available for export');
      }
      
      // Export the PDF
      await exportCompetitorToPDF(competitorData, url, city);
      
      // Show success toast
      toast({
        title: "PDF Exported Successfully",
        description: "Your competitor analysis has been exported as a PDF.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      
      // Show error toast
      toast({
        title: "Export Failed",
        description: "There was an error exporting the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShare = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (!url || !city) {
    return (
      <div className="high-res-layout py-12 text-center">
        <Card className="mx-auto max-w-4xl xl:max-w-5xl">
          <CardHeader>
            <CardTitle className="xl:text-3xl">Missing Information</CardTitle>
            <CardDescription className="xl:text-lg">
              URL or city parameter is missing. Please return to the competitor analysis page.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild className="xl:text-base xl:h-10 xl:px-5">
              <Link href="/competitor-analysis">
                <ChevronLeft className="mr-2 h-4 w-4 xl:h-5 xl:w-5" />
                Go to Competitor Analysis
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="high-res-layout py-6">
      <div className="mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/competitor-analysis">Competitor Analysis</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Results</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-heading md:text-4xl xl:text-5xl">
            Competitor Analysis Results
          </h1>
          <p className="text-muted-foreground mt-2 xl:text-lg">
            Analysis for <span className="font-medium text-foreground">{url}</span> in <span className="font-medium text-foreground">{city}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="xl:text-base xl:h-10 xl:px-5">
            <Printer className="mr-2 h-4 w-4 xl:h-5 xl:w-5" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} className="xl:text-base xl:h-10 xl:px-5">
            <Share2 className="mr-2 h-4 w-4 xl:h-5 xl:w-5" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={isLoading}
            className="xl:text-base xl:h-10 xl:px-5"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 xl:h-5 xl:w-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4 xl:h-5 xl:w-5" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-xl xl:text-2xl">
            <Globe className="mr-2 h-5 w-5 text-primary xl:h-6 xl:w-6" />
            Competitive Landscape in {city}
          </CardTitle>
          <CardDescription className="xl:text-lg">
            Detailed analysis of your top competitors in this market and how they compare to your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Main competitor analysis section - top competitors */}
          <CompetitorAnalysis url={url} city={city} isRequested={true} keyword="" />
          
          {/* Full SERP results with pagination */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Complete Search Results</h3>
            <div className="text-sm text-muted-foreground mb-4">
              Showing all websites ranking for your target keyword in {city || "your location"}
            </div>
            <FullCompetitorResults url={url} city={city} />
          </div>
        </CardContent>
      </Card>
      
      {/* Query usage indicator */}
      <Card className="mt-8 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-center md:text-left text-muted-foreground">
              <span className="font-medium">Google Custom Search API Usage</span>
              <div className="text-xs mt-1">
                Competitor analysis powered by Google Custom Search API.
                {competitorData?.queryCount !== undefined && (
                  <> Used {competitorData.queryCount} of max 5 queries</>
                )}
              </div>
              
              {/* API Usage Bar */}
              {competitorData?.queryCount !== undefined && (
                <div className="mt-2 w-full max-w-[300px]">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${competitorData.queryCount >= 5 ? 'bg-amber-500' : 'bg-green-500'}`} 
                      style={{ width: `${Math.min(competitorData.queryCount / 5 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>0</span>
                    <span className="text-amber-600 font-medium">Limit: 5 per analysis</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" asChild className="text-sm">
                <Link href="/competitor-analysis">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  New Analysis
                </Link>
              </Button>
              <Button asChild className="text-sm">
                <Link href="/deep-content">
                  Try Deep Content Analysis
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}