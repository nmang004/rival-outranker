import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe, Search, BarChart2, Loader2, AlertCircle, Tag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface CompetitorAnalysisProps {
  url: string;
  city?: string;
  keyword?: string;
}

export default function CompetitorAnalysis({ url, city, keyword }: CompetitorAnalysisProps) {
  // Determine the search location - if city is provided use it, otherwise use a default
  const searchLocation = city || 'United States';
  
  // Determine the search keyword - if keyword is provided use it directly
  const searchKeyword = keyword || '';
  
  // Use API endpoint with all parameters for best keyword selection
  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: [`/api/competitors?url=${encodeURIComponent(url)}&city=${encodeURIComponent(searchLocation)}&keyword=${encodeURIComponent(searchKeyword)}`],
    refetchOnWindowFocus: false
  });
  
  // The query's response might include the actual keyword that was used
  const displayKeyword = data?.keyword || searchKeyword || 'Your industry';
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px] mt-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-[180px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load competitor analysis data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg font-semibold">Top Competitors in {searchLocation}</h3>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Tag className="h-4 w-4 mr-1.5" />
            <span>Keyword: <span className="font-medium text-foreground">{displayKeyword}</span></span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-7 px-2"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Based on analysis of search rankings and online presence for "{displayKeyword}" in {searchLocation}.
        </p>
      </div>
      
      {data?.competitors && data.competitors.length > 0 ? (
        <div className="space-y-4">
          {data.competitors.map((competitor: any, index: number) => (
            <Card key={index} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex-grow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-primary" />
                      {competitor.name || `Competitor ${index + 1}`}
                    </h4>
                    <Badge variant={index === 0 ? "destructive" : index === 1 ? "default" : "outline"}>
                      {index === 0 ? "Top Competitor" : index === 1 ? "Strong Competitor" : "Competitor"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                    <a 
                      href={competitor.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:underline truncate"
                      title={competitor.url}
                    >
                      {competitor.url}
                    </a>
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">SEO Score</p>
                      <div className="flex items-center">
                        <div className="bg-primary/10 text-primary font-medium rounded-md px-2 py-1 text-sm">
                          {competitor.score || 'N/A'}/100
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Domain Authority</p>
                      <div className="flex items-center">
                        <Progress value={competitor.domainAuthority || 50} className="h-2 w-24" />
                        <span className="text-sm ml-2">{competitor.domainAuthority || '-'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Backlinks</p>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{competitor.backlinks || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Keywords</p>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{competitor.keywords || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {competitor.contentScore && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Content Score</p>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{competitor.contentScore}/10</span>
                        </div>
                      </div>
                    )}
                    
                    {competitor.loadTime && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Load Time</p>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{competitor.loadTime}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-1/3 xl:w-1/4 bg-muted p-6 border-t md:border-t-0 md:border-l">
                  <h5 className="text-sm font-medium mb-2">Key Strengths</h5>
                  <ul className="space-y-1 text-sm">
                    {competitor.strengths && competitor.strengths.length > 0 ? (
                      competitor.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="rounded-full h-4 w-4 bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">+</span>
                          <span className="break-words">{strength}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No data available</li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No competitors found for this location.</p>
        </div>
      )}
      
      <div className="space-y-2 mt-6">
        <h3 className="text-lg font-semibold">Keyword Gap Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Keywords your competitors are ranking for that you might be missing.
        </p>
      </div>
      
      {data?.keywordGap && data.keywordGap.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-4 font-medium bg-muted text-sm">
            <div>Keyword</div>
            <div>Monthly Volume</div>
            <div>Difficulty</div>
            <div>Top Competitor</div>
          </div>
          <div className="divide-y">
            {data.keywordGap.map((keyword: any, index: number) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 text-sm hover:bg-muted/50">
                <div className="font-medium">{keyword.term}</div>
                <div>{keyword.volume}</div>
                <div>{keyword.competition}</div>
                <div className="truncate" title={keyword.topCompetitor}>{keyword.topCompetitor}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No keyword gap data available.</p>
        </div>
      )}
    </div>
  );
}