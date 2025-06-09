import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Share2, Printer, RefreshCw, FileText, ChevronLeft } from 'lucide-react';
import { exportDeepContentToPDF } from '@/lib/deepContentPdfExport';
import { useToast } from '@/hooks/ui/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function DeepContentResultsPage() {
  const [location] = useLocation();
  const [url, setUrl] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [includeBody, setIncludeBody] = useState<boolean>(true);
  const [includeCTA, setIncludeCTA] = useState<boolean>(true);
  const [includeImpressions, setIncludeImpressions] = useState<boolean>(true);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  
  // Parse URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get('url');
    const keywordsParam = searchParams.get('keywords');
    const includeHeadersParam = searchParams.get('includeHeaders');
    const includeBodyParam = searchParams.get('includeBody');
    const includeCTAParam = searchParams.get('includeCTA');
    const includeImpressionsParam = searchParams.get('includeImpressions');
    
    if (urlParam) setUrl(urlParam);
    if (keywordsParam) setKeywords(keywordsParam);
    if (includeHeadersParam) setIncludeHeaders(includeHeadersParam === 'true');
    if (includeBodyParam) setIncludeBody(includeBodyParam === 'true');
    if (includeCTAParam) setIncludeCTA(includeCTAParam === 'true');
    if (includeImpressionsParam) setIncludeImpressions(includeImpressionsParam === 'true');
  }, [location]);
  
  // Add toast hook
  const { toast } = useToast();

  const handleExportPDF = async () => {
    try {
      setIsPdfLoading(true);
      
      if (!contentAnalysis) {
        throw new Error('No analysis data available for export');
      }
      
      // Export the PDF using the deep content PDF export functionality
      await exportDeepContentToPDF(contentAnalysis, url, keywords);
      
      // Show success toast
      toast({
        title: "PDF Exported Successfully",
        description: "Your deep content analysis has been exported as a PDF.",
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
      setIsPdfLoading(false);
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
  
  // Set up API query
  const { data: contentAnalysis, isLoading: isDataLoading, error } = useQuery<any>({
    queryKey: [`/api/deep-content?url=${encodeURIComponent(url)}`],
    refetchOnWindowFocus: false,
    enabled: !!url,
    retry: 1,
  });
  
  // Fallback data in case API call fails
  const defaultData = {
    url: url,
    keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : [],
    overallScore: { score: 0, category: 'needs-work' as const },
    structure: {
      headingStructure: { score: 0, category: 'needs-work' as const },
      paragraphStructure: { score: 0, category: 'needs-work' as const },
      contentDistribution: { score: 0, category: 'needs-work' as const }
    },
    readability: {
      fleschReadingEase: { score: 0, category: 'needs-work' as const },
      sentenceComplexity: { score: 0, category: 'needs-work' as const },
      wordChoice: { score: 0, category: 'needs-work' as const }
    },
    semanticRelevance: {
      topicCoverage: { score: 0, category: 'needs-work' as const },
      keywordContext: { score: 0, category: 'needs-work' as const },
      entityAnalysis: { score: 0, category: 'needs-work' as const }
    },
    engagement: {
      contentFormats: { score: 0, category: 'needs-work' as const },
      interactiveElements: { score: 0, category: 'needs-work' as const },
      callsToAction: { score: 0, category: 'needs-work' as const }
    },
    recommendations: ["Analyzing content..."],
    annotatedContent: {
      title: url,
      introduction: { content: "Loading content...", annotations: [] },
      mainContent: [{ content: "Please wait while we analyze your content...", annotations: [] }],
      conclusion: { content: "Analysis in progress...", annotations: [] }
    }
  };
  
  if (!url) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <Card>
          <CardHeader>
            <CardTitle>Missing Information</CardTitle>
            <CardDescription>
              URL parameter is missing. Please return to the deep content analysis page.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/deep-content">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Go to Deep Content Analysis
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If loading or error, show appropriate UI
  if (isDataLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight gradient-heading mb-4">
            Analyzing Content
          </h1>
          <p className="text-muted-foreground mb-8">Please wait while we analyze your content in depth.</p>
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Analysis Error</CardTitle>
            <CardDescription>
              There was a problem analyzing the content for {url}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The server encountered an error while processing your request. Please try again later.</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild variant="outline">
              <Link href="/deep-content">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Return to Deep Content Analysis
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Use actual API data or fallback to default
  const analysisData = contentAnalysis || defaultData;
  
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
              <BreadcrumbLink href="/deep-content">Deep Content Analysis</BreadcrumbLink>
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
            Deep Content Analysis Results
          </h1>
          <p className="text-muted-foreground mt-2">
            Analysis for <span className="font-medium text-foreground">{url}</span>
            {keywords && (
              <> - Keywords: <span className="font-medium text-foreground">{keywords}</span></>
            )}
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
            disabled={isPdfLoading}
          >
            {isPdfLoading ? (
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className={`h-32 w-32 rounded-full flex items-center justify-center text-3xl font-bold border-8 ${
                analysisData.overallScore.score >= 80 ? 'border-green-500 text-green-600' :
                analysisData.overallScore.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                'border-red-500 text-red-600'
              }`}>
                {analysisData.overallScore.score}
              </div>
            </div>
            <p className="text-center mt-4 text-sm text-muted-foreground">
              {
                analysisData.overallScore.score >= 80 ? 'Excellent content quality with minor improvements needed' :
                analysisData.overallScore.score >= 60 ? 'Good content with several opportunities for improvement' :
                'Content needs significant improvements to be effective'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Section Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {includeHeaders && (
                <div className="flex flex-col items-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                    analysisData.structure.headingStructure.score >= 80 ? 'border-green-500 text-green-600' :
                    analysisData.structure.headingStructure.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {analysisData.structure.headingStructure.score}
                  </div>
                  <p className="text-center mt-2 font-medium">Headers</p>
                </div>
              )}
              
              {includeBody && (
                <div className="flex flex-col items-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                    analysisData.structure.paragraphStructure.score >= 80 ? 'border-green-500 text-green-600' :
                    analysisData.structure.paragraphStructure.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {analysisData.structure.paragraphStructure.score}
                  </div>
                  <p className="text-center mt-2 font-medium">Body Content</p>
                </div>
              )}
              
              {includeCTA && (
                <div className="flex flex-col items-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                    analysisData.engagement.callsToAction.score >= 80 ? 'border-green-500 text-green-600' :
                    analysisData.engagement.callsToAction.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {analysisData.engagement.callsToAction.score}
                  </div>
                  <p className="text-center mt-2 font-medium">CTAs</p>
                </div>
              )}
              
              {includeImpressions && (
                <div className="flex flex-col items-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                    analysisData.structure.contentDistribution.score >= 80 ? 'border-green-500 text-green-600' :
                    analysisData.structure.contentDistribution.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {analysisData.structure.contentDistribution.score}
                  </div>
                  <p className="text-center mt-2 font-medium">First Impressions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="summary" className="mb-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="sections">Section Analysis</TabsTrigger>
          <TabsTrigger value="readability">Readability</TabsTrigger>
          <TabsTrigger value="annotations">Content Annotations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Content Analysis Summary
              </CardTitle>
              <CardDescription>
                Overview of the content analysis with key strengths and improvement opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Key Recommendations</h3>
                  <ul className="space-y-2">
                    {analysisData.recommendations.slice(0, 5).map((recommendation: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">→</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Content Quality Breakdown</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Structure</span>
                        <span className="font-medium">{Math.round((
                          analysisData.structure.headingStructure.score + 
                          analysisData.structure.paragraphStructure.score + 
                          analysisData.structure.contentDistribution.score
                        ) / 3)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ 
                            width: `${Math.round((
                              analysisData.structure.headingStructure.score + 
                              analysisData.structure.paragraphStructure.score + 
                              analysisData.structure.contentDistribution.score
                            ) / 3)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Readability</span>
                        <span className="font-medium">{Math.round((
                          analysisData.readability.fleschReadingEase.score + 
                          analysisData.readability.sentenceComplexity.score + 
                          analysisData.readability.wordChoice.score
                        ) / 3)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ 
                            width: `${Math.round((
                              analysisData.readability.fleschReadingEase.score + 
                              analysisData.readability.sentenceComplexity.score + 
                              analysisData.readability.wordChoice.score
                            ) / 3)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Semantic Relevance</span>
                        <span className="font-medium">{Math.round((
                          analysisData.semanticRelevance.topicCoverage.score + 
                          analysisData.semanticRelevance.keywordContext.score + 
                          analysisData.semanticRelevance.entityAnalysis.score
                        ) / 3)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ 
                            width: `${Math.round((
                              analysisData.semanticRelevance.topicCoverage.score + 
                              analysisData.semanticRelevance.keywordContext.score + 
                              analysisData.semanticRelevance.entityAnalysis.score
                            ) / 3)}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Engagement</span>
                        <span className="font-medium">{Math.round((
                          analysisData.engagement.contentFormats.score + 
                          analysisData.engagement.interactiveElements.score + 
                          analysisData.engagement.callsToAction.score
                        ) / 3)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ 
                            width: `${Math.round((
                              analysisData.engagement.contentFormats.score + 
                              analysisData.engagement.interactiveElements.score + 
                              analysisData.engagement.callsToAction.score
                            ) / 3)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sections">
          <div className="space-y-6">
            {includeHeaders && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      analysisData.structure.headingStructure.score >= 80 ? 'bg-green-500' :
                      analysisData.structure.headingStructure.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    Headers Analysis
                  </CardTitle>
                  <CardDescription>
                    Score: {analysisData.structure.headingStructure.score}/100 – {analysisData.structure.headingStructure.category.charAt(0).toUpperCase() + analysisData.structure.headingStructure.category.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Total Headings</p>
                          <p className="text-lg font-medium">{analysisData.structure.headingStructure.totalHeadings}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Headings with Keywords</p>
                          <p className="text-lg font-medium">{analysisData.structure.headingStructure.headingsWithKeywords}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysisData.recommendations.filter((rec: any) => rec.toLowerCase().includes('head') || rec.toLowerCase().includes('title')).slice(0, 3).map((rec: any, i: number) => (
                          <li key={i} className="text-sm flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {includeBody && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      analysisData.structure.paragraphStructure.score >= 80 ? 'bg-green-500' :
                      analysisData.structure.paragraphStructure.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    Body Content Analysis
                  </CardTitle>
                  <CardDescription>
                    Score: {analysisData.structure.paragraphStructure.score}/100 – {analysisData.structure.paragraphStructure.category.charAt(0).toUpperCase() + analysisData.structure.paragraphStructure.category.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Total Paragraphs</p>
                          <p className="text-lg font-medium">{analysisData.structure.paragraphStructure.totalParagraphs}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Avg Paragraph Length</p>
                          <p className="text-lg font-medium">{Math.round(analysisData.structure.paragraphStructure.avgParagraphLength)} words</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Short Paragraphs</p>
                          <p className="text-lg font-medium">{analysisData.structure.paragraphStructure.shortParagraphCount}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Long Paragraphs</p>
                          <p className="text-lg font-medium">{analysisData.structure.paragraphStructure.longParagraphCount}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysisData.recommendations.filter((rec: any) => rec.toLowerCase().includes('paragraph') || rec.toLowerCase().includes('content') || rec.toLowerCase().includes('text')).slice(0, 3).map((rec: any, i: number) => (
                          <li key={i} className="text-sm flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {includeCTA && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      analysisData.engagement.callsToAction.score >= 80 ? 'bg-green-500' :
                      analysisData.engagement.callsToAction.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    Call-to-Action Analysis
                  </CardTitle>
                  <CardDescription>
                    Score: {analysisData.engagement.callsToAction.score}/100 – {analysisData.engagement.callsToAction.category.charAt(0).toUpperCase() + analysisData.engagement.callsToAction.category.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">CTA Count</p>
                          <p className="text-lg font-medium">{analysisData.engagement.callsToAction.ctaCount || 0}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Has Clear CTAs</p>
                          <p className="text-lg font-medium">{analysisData.engagement.callsToAction.hasCTA ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysisData.recommendations.filter((rec: any) => rec.toLowerCase().includes('cta') || rec.toLowerCase().includes('call to action') || rec.toLowerCase().includes('button')).slice(0, 3).map((rec: any, i: number) => (
                          <li key={i} className="text-sm flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {includeImpressions && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      analysisData.structure.contentDistribution.score >= 80 ? 'bg-green-500' :
                      analysisData.structure.contentDistribution.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    First Impression Analysis
                  </CardTitle>
                  <CardDescription>
                    Score: {analysisData.structure.contentDistribution.score}/100 – {analysisData.structure.contentDistribution.category.charAt(0).toUpperCase() + analysisData.structure.contentDistribution.category.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Metrics</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Introduction Quality</p>
                          <p className="text-lg font-medium">{analysisData.structure.contentDistribution.introductionQuality}/100</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Body Content Quality</p>
                          <p className="text-lg font-medium">{analysisData.structure.contentDistribution.bodyContentQuality}/100</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-xs text-muted-foreground">Conclusion Quality</p>
                          <p className="text-lg font-medium">{analysisData.structure.contentDistribution.conclusionQuality}/100</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysisData.recommendations.filter((rec: any) => rec.toLowerCase().includes('introduction') || rec.toLowerCase().includes('opening') || rec.toLowerCase().includes('first')).slice(0, 3).map((rec: any, i: number) => (
                          <li key={i} className="text-sm flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="readability">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Readability Analysis
              </CardTitle>
              <CardDescription>
                Detailed metrics on how easy your content is to read and comprehend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Flesch Reading Ease</h3>
                    <div className={`text-2xl font-bold mb-1 ${
                      analysisData.readability.fleschReadingEase.score >= 70 ? 'text-green-600' :
                      analysisData.readability.fleschReadingEase.score >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysisData.readability.fleschReadingEase.score}/100
                    </div>
                    <p className="text-xs text-muted-foreground">{analysisData.readability.fleschReadingEase.interpretation || 'This measures how easy your text is to read. Higher scores indicate easier readability.'}</p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Sentence Complexity</h3>
                    <div className={`text-2xl font-bold mb-1 ${
                      analysisData.readability.sentenceComplexity.score >= 70 ? 'text-green-600' :
                      analysisData.readability.sentenceComplexity.score >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysisData.readability.sentenceComplexity.score}/100
                    </div>
                    <p className="text-xs text-muted-foreground">Average sentence length: {Math.round(analysisData.readability.sentenceComplexity.avgSentenceLength)} words</p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Word Choice</h3>
                    <div className={`text-2xl font-bold mb-1 ${
                      analysisData.readability.wordChoice.score >= 70 ? 'text-green-600' :
                      analysisData.readability.wordChoice.score >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysisData.readability.wordChoice.score}/100
                    </div>
                    <p className="text-xs text-muted-foreground">Complex words: {analysisData.readability.wordChoice.complexWordPercentage}% of total</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Reading Level Assessment</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm">
                      {analysisData.readability.fleschReadingEase.score >= 80 ? (
                        "Your content is very easy to read and understand. It can be comprehended by an average 11-year-old student or someone with a 5th-grade education level. This makes your content highly accessible to a wide audience."
                      ) : analysisData.readability.fleschReadingEase.score >= 60 ? (
                        "Your content is easily understood by 13 to 15-year-old students or those with an 8th to 9th-grade education level. It strikes a good balance between readability and sophistication."
                      ) : analysisData.readability.fleschReadingEase.score >= 50 ? (
                        "Your content is fairly difficult to read, suitable for 10th to 12th-grade students. Consider simplifying some sentences to improve readability for a broader audience."
                      ) : (
                        "Your content is difficult to read, appropriate for college-level education. Consider breaking down complex sentences and using simpler words to improve accessibility."
                      )}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Readability Recommendations</h3>
                  <ul className="space-y-2">
                    {analysisData.recommendations.filter((rec: any) => 
                      rec.toLowerCase().includes('read') || 
                      rec.toLowerCase().includes('sentence') || 
                      rec.toLowerCase().includes('word') ||
                      rec.toLowerCase().includes('complex')
                    ).slice(0, 5).map((rec: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="annotations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Content Annotations
              </CardTitle>
              <CardDescription>
                Specific improvements for highlighted content elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Introduction section */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 flex items-center justify-between">
                    <h3 className="font-medium">Introduction</h3>
                    <span className="text-xs text-muted-foreground">{analysisData.annotatedContent.introduction.annotations.length} annotations</span>
                  </div>
                  
                  <div className="p-4">
                    <div className="bg-muted/30 p-3 rounded-md mb-4">
                      <p className="text-sm font-mono whitespace-pre-wrap">{analysisData.annotatedContent.introduction.content}</p>
                    </div>
                    
                    {analysisData.annotatedContent.introduction.annotations.length > 0 ? (
                      <div className="space-y-4">
                        {/* Deduplicate annotations by suggestion text */}
                        {(() => {
                          const uniqueAnnotations: any[] = [];
                          const seenSuggestions = new Set();
                          
                          for (const annotation of analysisData.annotatedContent.introduction.annotations) {
                            if (!seenSuggestions.has(annotation.suggestion)) {
                              uniqueAnnotations.push(annotation);
                              seenSuggestions.add(annotation.suggestion);
                            }
                          }
                          
                          return uniqueAnnotations.map((annotation: any, index: number) => (
                            <div key={index} className="border-l-2 border-primary pl-4 py-1">
                              <div className="flex items-center mb-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                                  annotation.severity === 'high' ? 'bg-red-100 text-red-700' :
                                  annotation.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {annotation.severity.toUpperCase()}
                                </span>
                                <span className="text-sm text-muted-foreground">{annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)} Issue</span>
                              </div>
                              <p className="text-sm font-medium text-foreground mb-1">{annotation.issue}</p>
                              <p className="text-sm text-muted-foreground">{annotation.suggestion}</p>
                              <p className="text-xs text-muted-foreground mt-1 italic">Found in: {annotation.content.substring(0, 60)}...</p>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No issues found in the introduction.</p>
                    )}
                  </div>
                </div>
                
                {/* Main content sections */}
                {analysisData.annotatedContent.mainContent.map((section: any, sectionIndex: number) => (
                  <div key={sectionIndex} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 flex items-center justify-between">
                      <h3 className="font-medium">Content Section {sectionIndex + 1}</h3>
                      <span className="text-xs text-muted-foreground">{section.annotations.length} annotations</span>
                    </div>
                    
                    <div className="p-4">
                      <div className="bg-muted/30 p-3 rounded-md mb-4">
                        <p className="text-sm font-mono whitespace-pre-wrap">{section.content}</p>
                      </div>
                      
                      {section.annotations.length > 0 ? (
                        <div className="space-y-4">
                          {(() => {
                            const uniqueAnnotations: any[] = [];
                            const seenSuggestions = new Set();
                            
                            for (const annotation of section.annotations) {
                              if (!seenSuggestions.has(annotation.suggestion)) {
                                uniqueAnnotations.push(annotation);
                                seenSuggestions.add(annotation.suggestion);
                              }
                            }
                            
                            return uniqueAnnotations.map((annotation: any, annotationIndex: number) => (
                              <div key={annotationIndex} className="border-l-2 border-primary pl-4 py-1">
                                <div className="flex items-center mb-1">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                                    annotation.severity === 'high' ? 'bg-red-100 text-red-700' :
                                    annotation.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {annotation.severity.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-muted-foreground">{annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)} Issue</span>
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">{annotation.issue}</p>
                                <p className="text-sm text-muted-foreground">{annotation.suggestion}</p>
                                <p className="text-xs text-muted-foreground mt-1 italic">Found in: {annotation.content.substring(0, 60)}...</p>
                              </div>
                            ));
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No issues found in this section.</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Conclusion section */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 flex items-center justify-between">
                    <h3 className="font-medium">Conclusion</h3>
                    <span className="text-xs text-muted-foreground">{analysisData.annotatedContent.conclusion.annotations.length} annotations</span>
                  </div>
                  
                  <div className="p-4">
                    <div className="bg-muted/30 p-3 rounded-md mb-4">
                      <p className="text-sm font-mono whitespace-pre-wrap">{analysisData.annotatedContent.conclusion.content}</p>
                    </div>
                    
                    {analysisData.annotatedContent.conclusion.annotations.length > 0 ? (
                      <div className="space-y-4">
                        {(() => {
                          const uniqueAnnotations: any[] = [];
                          const seenSuggestions = new Set();
                          
                          for (const annotation of analysisData.annotatedContent.conclusion.annotations) {
                            if (!seenSuggestions.has(annotation.suggestion)) {
                              uniqueAnnotations.push(annotation);
                              seenSuggestions.add(annotation.suggestion);
                            }
                          }
                          
                          return uniqueAnnotations.map((annotation: any, index: number) => (
                            <div key={index} className="border-l-2 border-primary pl-4 py-1">
                              <div className="flex items-center mb-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                                  annotation.severity === 'high' ? 'bg-red-100 text-red-700' :
                                  annotation.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {annotation.severity.toUpperCase()}
                                </span>
                                <span className="text-sm text-muted-foreground">{annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)} Issue</span>
                              </div>
                              <p className="text-sm font-medium text-foreground mb-1">{annotation.issue}</p>
                              <p className="text-sm text-muted-foreground">{annotation.suggestion}</p>
                              <p className="text-xs text-muted-foreground mt-1 italic">Found in: {annotation.content.substring(0, 60)}...</p>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No issues found in the conclusion.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between items-center mt-8">
        <Button variant="ghost" asChild>
          <Link href="/deep-content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deep Content Analysis
          </Link>
        </Button>
      </div>
    </div>
  );
}