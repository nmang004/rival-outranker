import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, Download, Share2, Globe, Search, Award, TrendingUp, BarChart2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import CompetitorAnalysis from "@/components/assessment/CompetitorAnalysis";

export default function CompetitorResultsPage() {
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  
  // Extract URL and city from query string
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get('url');
    const cityParam = searchParams.get('city');
    
    if (urlParam) {
      setUrl(urlParam);
    }
    
    if (cityParam) {
      setCity(cityParam);
    }
  }, []);
  
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/competitors?url=${encodeURIComponent(url || '')}&city=${encodeURIComponent(city || '')}`],
    enabled: !!url && !!city,
    refetchOnWindowFocus: false
  });
  
  if (!url || !city) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Required parameters missing. Please return to the competitor analysis page.</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setLocation('/competitor-analysis')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Competitor Analysis
        </Button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-[200px]" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load competitor analysis data. Please try again.</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setLocation('/competitor-analysis')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Competitor Analysis
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
              onClick={() => setLocation('/competitor-analysis')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Competitor Analysis
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
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Competitor Analysis</CardTitle>
                <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                  <div className="break-all">
                    URL: <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{url}</a>
                  </div>
                  <div className="px-2 border-l">Location: {city}</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data ? (
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="competitors">Top Competitors</TabsTrigger>
                  <TabsTrigger value="keywords">Keyword Gap</TabsTrigger>
                  <TabsTrigger value="content">Content Strategy</TabsTrigger>
                  <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Globe className="h-5 w-5 text-primary mr-2" />
                            <h3 className="text-sm font-medium">Top Competitors</h3>
                          </div>
                          <span className="text-2xl font-bold">{data.competitors?.length || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Search className="h-5 w-5 text-primary mr-2" />
                            <h3 className="text-sm font-medium">Keyword Opportunities</h3>
                          </div>
                          <span className="text-2xl font-bold">{data.keywordGap?.length || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Award className="h-5 w-5 text-primary mr-2" />
                            <h3 className="text-sm font-medium">Market Position</h3>
                          </div>
                          <span className="text-2xl font-bold">{data.marketPosition || "N/A"}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <TrendingUp className="h-5 w-5 text-primary mr-2" />
                            <h3 className="text-sm font-medium">Growth Potential</h3>
                          </div>
                          <span className="text-2xl font-bold">{data.growthScore || "N/A"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Competitive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-medium">Domain Authority</div>
                            <div className="text-sm text-muted-foreground">Score: {data.domainAuthority || "N/A"}</div>
                          </div>
                          <Progress value={data.domainAuthority || 0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-medium">Local Search Visibility</div>
                            <div className="text-sm text-muted-foreground">Score: {data.localVisibility || "N/A"}</div>
                          </div>
                          <Progress value={data.localVisibility || 0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-medium">Content Quality</div>
                            <div className="text-sm text-muted-foreground">Score: {data.contentQuality || "N/A"}</div>
                          </div>
                          <Progress value={data.contentQuality || 0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-medium">Backlink Profile</div>
                            <div className="text-sm text-muted-foreground">Score: {data.backlinkScore || "N/A"}</div>
                          </div>
                          <Progress value={data.backlinkScore || 0} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <BarChart2 className="h-5 w-5 mr-2 text-primary" />
                          Strength & Weaknesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Strengths</h4>
                            <ul className="space-y-1">
                              {data.strengths?.map((strength: string, index: number) => (
                                <li key={index} className="text-sm flex items-start">
                                  <span className="rounded-full h-5 w-5 bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2 mt-0.5">+</span>
                                  {strength}
                                </li>
                              )) || <li className="text-sm text-muted-foreground">No data available</li>}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Weaknesses</h4>
                            <ul className="space-y-1">
                              {data.weaknesses?.map((weakness: string, index: number) => (
                                <li key={index} className="text-sm flex items-start">
                                  <span className="rounded-full h-5 w-5 bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2 mt-0.5">-</span>
                                  {weakness}
                                </li>
                              )) || <li className="text-sm text-muted-foreground">No data available</li>}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Key Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {data.recommendations?.map((recommendation: string, index: number) => (
                            <li key={index} className="text-sm flex items-start">
                              <span className="rounded-full h-5 w-5 bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">✓</span>
                              {recommendation}
                            </li>
                          )) || (
                            <li className="text-sm text-muted-foreground">No recommendations available</li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="competitors">
                  <CompetitorAnalysis 
                    url={url} 
                    city={city} 
                  />
                </TabsContent>
                
                <TabsContent value="keywords">
                  <Card>
                    <CardHeader>
                      <CardTitle>Keyword Gap Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        This section identifies valuable keywords your competitors are ranking for that represent opportunities for your website.
                      </p>
                      
                      {data.keywordGap?.length > 0 ? (
                        <div className="border rounded-md">
                          <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                            <div>Keyword</div>
                            <div>Search Volume</div>
                            <div>Competition</div>
                            <div>Top Competitor</div>
                          </div>
                          <div className="divide-y">
                            {data.keywordGap.map((keyword: any, index: number) => (
                              <div key={index} className="grid grid-cols-4 gap-4 p-4 text-sm">
                                <div>{keyword.term}</div>
                                <div>{keyword.volume}</div>
                                <div>{keyword.competition}</div>
                                <div>{keyword.topCompetitor}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No keyword gap data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Strategy Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        This section compares your content strategy with your top competitors.
                      </p>
                      
                      {/* Content would be populated here */}
                      <div className="text-center py-8 text-muted-foreground">
                        Content strategy analysis data will be displayed here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="metrics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        This section compares key performance metrics between your site and competitors.
                      </p>
                      
                      {/* Metrics would be populated here */}
                      <div className="text-center py-8 text-muted-foreground">
                        Performance metrics comparison data will be displayed here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="py-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No competitor analysis data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}