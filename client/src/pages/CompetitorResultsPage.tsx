import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Share2, Printer, RefreshCw, Globe, ChevronLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CompetitorAnalysis from '@/components/assessment/CompetitorAnalysis';

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
  
  const handleExportPDF = () => {
    setIsLoading(true);
    // Simulating PDF export
    setTimeout(() => {
      setIsLoading(false);
      alert('PDF Export feature will be implemented in a future update.');
    }, 1500);
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
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <Card>
          <CardHeader>
            <CardTitle>Missing Information</CardTitle>
            <CardDescription>
              URL or city parameter is missing. Please return to the competitor analysis page.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/competitor-analysis">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Go to Competitor Analysis
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
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
          <h1 className="text-3xl font-bold tracking-tight gradient-heading">
            Competitor Analysis Results
          </h1>
          <p className="text-muted-foreground mt-2">
            Analysis for <span className="font-medium text-foreground">{url}</span> in <span className="font-medium text-foreground">{city}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-xl">
            <Globe className="mr-2 h-5 w-5 text-primary" />
            Competitive Landscape in {city}
          </CardTitle>
          <CardDescription>
            Detailed analysis of your top competitors in this market and how they compare to your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompetitorAnalysis url={url} city={city} />
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center mt-8">
        <Button variant="ghost" asChild>
          <Link href="/competitor-analysis">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Competitor Analysis
          </Link>
        </Button>
        
        <Button asChild>
          <Link href="/deep-content">
            Try Deep Content Analysis
          </Link>
        </Button>
      </div>
    </div>
  );
}