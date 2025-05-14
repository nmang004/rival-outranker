import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Share2, Printer, RefreshCw, FileText, ChevronLeft } from 'lucide-react';
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
  
  const handleExportPDF = () => {
    setIsPdfLoading(true);
    // Simulating PDF export
    setTimeout(() => {
      setIsPdfLoading(false);
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className={`h-32 w-32 rounded-full flex items-center justify-center text-3xl font-bold border-8 ${
                contentAnalysis.overallScore >= 80 ? 'border-green-500 text-green-600' :
                contentAnalysis.overallScore >= 60 ? 'border-yellow-500 text-yellow-600' :
                'border-red-500 text-red-600'
              }`}>
                {contentAnalysis.overallScore}
              </div>
            </div>
            <p className="text-center mt-4 text-sm text-muted-foreground">
              {
                contentAnalysis.overallScore >= 80 ? 'Excellent content quality with minor improvements needed' :
                contentAnalysis.overallScore >= 60 ? 'Good content with several opportunities for improvement' :
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
                    contentAnalysis.sections.headers.score >= 80 ? 'border-green-500 text-green-600' :
                    contentAnalysis.sections.headers.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {contentAnalysis.sections.headers.score}
                  </div>
                  <p className="text-center mt-2 font-medium">Headers</p>
                </div>
              )}
              
              {includeBody && (
                <div className="flex flex-col items-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                    contentAnalysis.sections.body.score >= 80 ? 'border-green-500 text-green-600' :
                    contentAnalysis.sections.body.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {contentAnalysis.sections.body.score}
                  </div>
                  <p className="text-center mt-2 font-medium">Body Content</p>
                </div>
              )}
              
              {includeCTA && (
                <div className="flex flex-col items-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                    contentAnalysis.sections.cta.score >= 80 ? 'border-green-500 text-green-600' :
                    contentAnalysis.sections.cta.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {contentAnalysis.sections.cta.score}
                  </div>
                  <p className="text-center mt-2 font-medium">CTAs</p>
                </div>
              )}
              
              {includeImpressions && (
                <div className="flex flex-col items-center">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                    contentAnalysis.sections.impressions.score >= 80 ? 'border-green-500 text-green-600' :
                    contentAnalysis.sections.impressions.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}>
                    {contentAnalysis.sections.impressions.score}
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
                  <h3 className="text-lg font-medium mb-3">Key Strengths</h3>
                  <ul className="space-y-2">
                    {[
                      ...includeHeaders ? contentAnalysis.sections.headers.strengths : [],
                      ...includeBody ? contentAnalysis.sections.body.strengths : [],
                      ...includeCTA ? contentAnalysis.sections.cta.strengths : [],
                      ...includeImpressions ? contentAnalysis.sections.impressions.strengths : []
                    ].slice(0, 5).map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="rounded-full h-5 w-5 bg-green-500/10 text-green-600 flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Top Improvement Opportunities</h3>
                  <ul className="space-y-2">
                    {[
                      ...includeHeaders ? contentAnalysis.sections.headers.weaknesses : [],
                      ...includeBody ? contentAnalysis.sections.body.weaknesses : [],
                      ...includeCTA ? contentAnalysis.sections.cta.weaknesses : [],
                      ...includeImpressions ? contentAnalysis.sections.impressions.weaknesses : []
                    ].slice(0, 5).map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="rounded-full h-5 w-5 bg-red-500/10 text-red-600 flex items-center justify-center text-xs mr-2 mt-0.5">!</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-3">Priority Recommendations</h3>
                <ol className="space-y-2">
                  {[
                    ...includeHeaders ? contentAnalysis.sections.headers.recommendations : [],
                    ...includeBody ? contentAnalysis.sections.body.recommendations : [],
                    ...includeCTA ? contentAnalysis.sections.cta.recommendations : [],
                    ...includeImpressions ? contentAnalysis.sections.impressions.recommendations : []
                  ].slice(0, 5).map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="rounded-full h-5 w-5 bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">{index + 1}</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Section-by-Section Analysis
              </CardTitle>
              <CardDescription>
                Detailed analysis of each content section with specific recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {includeHeaders && (
                  <AccordionItem value="headers">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <span>Headers & Titles</span>
                        <span className={`ml-3 text-sm px-2 py-0.5 rounded-full ${
                          contentAnalysis.sections.headers.score >= 80 ? 'bg-green-100 text-green-700' :
                          contentAnalysis.sections.headers.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Score: {contentAnalysis.sections.headers.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">STRENGTHS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.headers.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">WEAKNESSES</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.headers.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-red-600 mr-2">✗</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">RECOMMENDATIONS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.headers.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-blue-600 mr-2">→</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {includeBody && (
                  <AccordionItem value="body">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <span>Body Content</span>
                        <span className={`ml-3 text-sm px-2 py-0.5 rounded-full ${
                          contentAnalysis.sections.body.score >= 80 ? 'bg-green-100 text-green-700' :
                          contentAnalysis.sections.body.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Score: {contentAnalysis.sections.body.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">STRENGTHS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.body.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">WEAKNESSES</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.body.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-red-600 mr-2">✗</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">RECOMMENDATIONS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.body.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-blue-600 mr-2">→</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {includeCTA && (
                  <AccordionItem value="cta">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <span>Call-to-Actions</span>
                        <span className={`ml-3 text-sm px-2 py-0.5 rounded-full ${
                          contentAnalysis.sections.cta.score >= 80 ? 'bg-green-100 text-green-700' :
                          contentAnalysis.sections.cta.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Score: {contentAnalysis.sections.cta.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">STRENGTHS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.cta.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">WEAKNESSES</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.cta.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-red-600 mr-2">✗</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">RECOMMENDATIONS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.cta.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-blue-600 mr-2">→</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {includeImpressions && (
                  <AccordionItem value="impressions">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <span>First Impressions</span>
                        <span className={`ml-3 text-sm px-2 py-0.5 rounded-full ${
                          contentAnalysis.sections.impressions.score >= 80 ? 'bg-green-100 text-green-700' :
                          contentAnalysis.sections.impressions.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Score: {contentAnalysis.sections.impressions.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">STRENGTHS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.impressions.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">WEAKNESSES</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.impressions.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-red-600 mr-2">✗</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">RECOMMENDATIONS</h4>
                          <ul className="space-y-1">
                            {contentAnalysis.sections.impressions.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-blue-600 mr-2">→</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="readability">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Readability Analysis
              </CardTitle>
              <CardDescription>
                Analysis of your content's readability metrics and how they impact user engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">FLESCH-KINCAID SCORE</h3>
                  <div className={`text-3xl font-bold ${
                    contentAnalysis.readabilityMetrics.fleschKincaidScore >= 70 ? 'text-green-600' :
                    contentAnalysis.readabilityMetrics.fleschKincaidScore >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {contentAnalysis.readabilityMetrics.fleschKincaidScore}
                  </div>
                  <p className="text-xs text-center mt-2">
                    {
                      contentAnalysis.readabilityMetrics.fleschKincaidScore >= 80 ? 'Very easy to read - 6th grade level' :
                      contentAnalysis.readabilityMetrics.fleschKincaidScore >= 70 ? 'Easy to read - 7th grade level' :
                      contentAnalysis.readabilityMetrics.fleschKincaidScore >= 60 ? 'Standard - 8-9th grade level' :
                      contentAnalysis.readabilityMetrics.fleschKincaidScore >= 50 ? 'Fairly difficult - 10-12th grade level' :
                      'Difficult - College level'
                    }
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">AVG. SENTENCE LENGTH</h3>
                  <div className={`text-3xl font-bold ${
                    contentAnalysis.readabilityMetrics.avgSentenceLength <= 14 ? 'text-green-600' :
                    contentAnalysis.readabilityMetrics.avgSentenceLength <= 20 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {contentAnalysis.readabilityMetrics.avgSentenceLength}
                  </div>
                  <p className="text-xs text-center mt-2">
                    {
                      contentAnalysis.readabilityMetrics.avgSentenceLength <= 14 ? 'Excellent - Easy to read' :
                      contentAnalysis.readabilityMetrics.avgSentenceLength <= 20 ? 'Good - Fairly readable' :
                      'Needs improvement - Consider shortening sentences'
                    }
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">PASSIVE VOICE</h3>
                  <div className={`text-3xl font-bold ${
                    contentAnalysis.readabilityMetrics.passiveVoicePercentage <= 10 ? 'text-green-600' :
                    contentAnalysis.readabilityMetrics.passiveVoicePercentage <= 20 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {contentAnalysis.readabilityMetrics.passiveVoicePercentage}%
                  </div>
                  <p className="text-xs text-center mt-2">
                    {
                      contentAnalysis.readabilityMetrics.passiveVoicePercentage <= 10 ? 'Excellent - Active voice dominant' :
                      contentAnalysis.readabilityMetrics.passiveVoicePercentage <= 20 ? 'Good - Could reduce passive voice slightly' :
                      'Needs improvement - Too much passive voice'
                    }
                  </p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Readability Recommendations</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="rounded-full h-5 w-5 bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                    <span>
                      {contentAnalysis.readabilityMetrics.avgSentenceLength > 14 ? 
                        'Reduce average sentence length to 12-14 words per sentence for optimal readability.' : 
                        'Maintain your excellent average sentence length of less than 14 words per sentence.'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="rounded-full h-5 w-5 bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                    <span>
                      {contentAnalysis.readabilityMetrics.passiveVoicePercentage > 10 ? 
                        'Reduce passive voice usage to less than 10% of your content to improve clarity and impact.' : 
                        'Continue using predominantly active voice to maintain directness and clarity.'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="rounded-full h-5 w-5 bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                    <span>
                      {contentAnalysis.readabilityMetrics.complexWordsPercentage > 10 ? 
                        'Replace complex words with simpler alternatives when possible to improve readability.' : 
                        'Your use of simple, direct language enhances readability - keep it up!'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="rounded-full h-5 w-5 bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                    <span>
                      {contentAnalysis.readabilityMetrics.fleschKincaidScore < 60 ? 
                        'Break down complex ideas into smaller, more digestible pieces to improve comprehension.' : 
                        'Your content has a good readability level, making it accessible to a broad audience.'}
                    </span>
                  </li>
                </ul>
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
                {contentAnalysis.contentAnnotations.map((annotation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full mr-2 ${
                        annotation.type === 'header' ? 'bg-purple-100 text-purple-700' :
                        annotation.type === 'body' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {annotation.type === 'header' ? 'HEADER' : annotation.type === 'body' ? 'BODY' : 'CTA'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Element {index + 1}
                      </span>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md mb-3">
                      <p className="text-sm font-mono">{annotation.content}</p>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-1">Issues:</h4>
                      <ul className="text-sm space-y-1">
                        {annotation.issues && annotation.issues.map((issue, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Suggestion:</h4>
                      <div className="bg-green-50 border border-green-100 p-3 rounded-md">
                        <p className="text-sm font-mono text-green-800">{annotation.suggestions}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
        
        <Button asChild>
          <Link href="/competitor-analysis">
            Try Competitor Analysis
          </Link>
        </Button>
      </div>
    </div>
  );
}