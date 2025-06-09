import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { US_CITIES } from '@shared/constants/us-cities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe, Search, BarChart2, Loader2, AlertCircle, Tag, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// FeatureCard component for the competitor analysis display
function FeatureCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode 
}) {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center mb-2">
        <div className="rounded-full p-1.5 bg-primary/10 mr-2">
          {icon}
        </div>
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

interface CompetitorAnalysisProps {
  url: string;
  city?: string;
  keyword?: string;
  isRequested?: boolean; // New prop to track if competitor analysis was explicitly requested
}

export default function CompetitorAnalysis({ url, city, keyword, isRequested = false }: CompetitorAnalysisProps) {
  // Determine the search location - if city is provided use it, otherwise use a default
  const searchLocation = city || 'United States';
  
  // Determine the search keyword - if keyword is provided use it directly
  const searchKeyword = keyword || '';
  
  // API for competitor data - we don't auto-fetch it initially
  // But we will fetch it if the competitor analysis was explicitly requested 
  const competitorQueryKey = `/api/competitors?url=${encodeURIComponent(url)}${city ? `&city=${encodeURIComponent(city)}` : ''}`;
  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: [competitorQueryKey],
    refetchOnWindowFocus: false,
    refetchInterval: isRequested ? 3000 : false, // Poll every 3 seconds if analysis was requested
    enabled: isRequested, // Only auto-fetch if competitor analysis was explicitly requested
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
  
  // The query's response might include the actual keyword that was used
  const displayKeyword = data?.keyword || searchKeyword || 'Your industry';
  
  // State for location selection modal
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(city || "United States");
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  
  // Update selectedLocation if city prop changes
  useEffect(() => {
    if (city) {
      setSelectedLocation(city);
    }
  }, [city]);
  
  // Filter US cities based on search term
  const filteredCities = locationSearchTerm
    ? US_CITIES
        .filter(cityItem => 
          `${cityItem.city}, ${cityItem.state}`.toLowerCase().includes(locationSearchTerm.toLowerCase())
        )
        .slice(0, 8) // Limit to 8 results for performance
    : [];
    
  // Popular US cities and regions for quick selection
  const popularLocations = [
    "United States", 
    "New York, NY", 
    "Los Angeles, CA", 
    "Chicago, IL", 
    "Houston, TX", 
    "San Francisco, CA",
    "Miami, FL",
    "Seattle, WA",
    "Boston, MA"
  ];
  
  // Function to start competitor analysis
  const startCompetitorAnalysis = () => {
    setShowLocationModal(true);
  };
  
  // Function to run the analysis with selected location
  const runAnalysisWithLocation = async () => {
    setShowLocationModal(false);
    setRunningAnalysis(true);
    
    try {
      console.log(`Running competitor analysis for ${url} in location ${selectedLocation}`);
      
      // Create POST request body with all the data
      const requestBody = {
        url: url,
        city: selectedLocation, // Parameter name must match server expectation
        keyword: searchKeyword || ''
      };
      
      console.log("Request body:", requestBody);
      
      // Use POST endpoint for competitor analysis to ensure data is processed correctly
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Competitor analysis initiated:", result);
      
      // Show processing state for a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Invalidate both queries to force fresh data
      queryClient.invalidateQueries({ queryKey: [competitorQueryKey] });
      queryClient.invalidateQueries({ queryKey: [`/api/analysis?url=${encodeURIComponent(url)}`] });
      
      // Trigger multiple refetches to ensure we get the updated data
      // First refetch the competitor data
      await refetch();
      
      // Then get the latest analysis data which should now include competitor results
      try {
        const analysisResponse = await fetch(`/api/analysis?url=${encodeURIComponent(url)}`);
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          console.log("Analysis data refreshed with competitor results:", analysisData);
          
          // Force a full page reload to ensure all data is fresh
          window.location.reload();
        }
      } catch (err) {
        console.error("Error fetching latest analysis:", err);
      }
      
      setRunningAnalysis(false);
    } catch (error) {
      console.error("Error fetching competitor data:", error);
      setRunningAnalysis(false);
    }
  };
  
  // If competitor analysis wasn't requested, show a summary with option to run
  if (!isRequested) {
    return (
      <div className="space-y-6">
        <p className="text-base text-muted-foreground">
          Competitor Analysis identifies your top competitors based on search rankings 
          and helps you understand their strengths. This analysis evaluates:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureCard 
            title="Competitor Discovery" 
            description="Find who you're actually competing against in search results for your primary keywords"
            icon={<Globe className="h-4 w-4 text-primary" />}
          />
          
          <FeatureCard 
            title="SEO Analysis" 
            description="See competitors' SEO scores, domain authority, and backlink profiles"
            icon={<BarChart2 className="h-4 w-4 text-primary" />}
          />
          
          <FeatureCard 
            title="Keyword Gap Analysis" 
            description="Discover keywords your competitors are ranking for that you might be missing"
            icon={<Search className="h-4 w-4 text-primary" />}
          />
          
          <FeatureCard 
            title="Competitive Intelligence" 
            description="Learn from competitors' strengths and weaknesses to improve your strategy"
            icon={<ExternalLink className="h-4 w-4 text-primary" />}
          />
        </div>
        
        <button 
          onClick={startCompetitorAnalysis}
          disabled={runningAnalysis}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md flex items-center justify-center"
        >
          {runningAnalysis ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running Competitor Analysis...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-5 w-5" />
              Start Competitor Analysis
            </>
          )}
        </button>
        
        {/* Google API Query Count Information */}
        <div className="mt-4 text-xs text-muted-foreground flex flex-col border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Tag className="h-3 w-3 mr-1 text-gray-500" />
              <span>Google API Query Usage</span>
            </div>
            <div className="flex items-center">
              <div className="mr-3">
                <span className="font-medium">
                  {/* Show actual count from API if available */}
                  {data?.queryCount || "0"} / 100 daily limit
                </span>
              </div>
              <div className="py-1 px-2 bg-amber-100 text-amber-800 rounded-md flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span className="font-medium">Limited to 5 per analysis</span>
              </div>
            </div>
          </div>
          
          {/* API Usage Progress Bar */}
          <div className="mt-2 w-full">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${(data?.queryCount || 0) >= 80 ? 'bg-red-500' : (data?.queryCount || 0) >= 50 ? 'bg-amber-500' : 'bg-green-500'}`} 
                style={{ width: `${Math.min((data?.queryCount || 0) / 100 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Location selection modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-medium">Select Location for Competitor Analysis</h3>
              <p className="text-sm text-muted-foreground">
                To find the most relevant competitors, please select a location. This helps identify businesses competing in your target area.
              </p>
              
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <div className="relative">
                  <input
                    id="location"
                    type="text"
                    value={locationSearchTerm}
                    onChange={(e) => setLocationSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Search for a city (e.g. Seattle, New York)"
                  />
                  
                  {/* Search results dropdown */}
                  {locationSearchTerm && filteredCities.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-64 overflow-auto">
                      {filteredCities.map((cityItem, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const cityString = `${cityItem.city}, ${cityItem.state}`;
                            setSelectedLocation(cityString);
                            setLocationSearchTerm(cityString);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                        >
                          {cityItem.city}, {cityItem.state}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Show the current selection */}
                {selectedLocation && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-muted-foreground">Selected location: </span>
                    <span className="ml-2 text-sm font-medium">{selectedLocation}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Popular locations
                </label>
                <div className="flex flex-wrap gap-2">
                  {popularLocations.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(location);
                        setLocationSearchTerm(location);
                      }}
                      className={`text-xs px-2 py-1 rounded-full ${
                        selectedLocation === location
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={runAnalysisWithLocation}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  Start Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 xl:h-12 xl:w-12" />
          <div>
            <Skeleton className="h-6 w-[200px] xl:h-8 xl:w-[280px]" />
            <Skeleton className="h-4 w-[150px] xl:h-5 xl:w-[180px] mt-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 xl:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 xl:pb-3">
                <Skeleton className="h-5 xl:h-7 w-[180px] xl:w-[240px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 xl:h-5 w-full" />
                <Skeleton className="h-4 xl:h-5 w-full mt-2 xl:mt-3" />
                <Skeleton className="h-4 xl:h-5 w-3/4 mt-2 xl:mt-3" />
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
        <AlertCircle className="h-4 w-4 xl:h-5 xl:w-5" />
        <AlertTitle className="xl:text-lg">Error</AlertTitle>
        <AlertDescription className="xl:text-base">
          Failed to load competitor analysis data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6 high-res-layout">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg font-semibold xl:text-xl 2xl:text-2xl">Top Competitors in {searchLocation}</h3>
          
          <div className="flex items-center text-sm xl:text-base text-muted-foreground">
            <Tag className="h-4 w-4 xl:h-5 xl:w-5 mr-1.5" />
            <span>Keyword: <span className="font-medium text-foreground">{displayKeyword}</span></span>
            {data?.queryCount !== undefined && (
              <span className="ml-4 flex items-center">
                <Search className="h-3.5 w-3.5 xl:h-4 xl:w-4 mr-1.5 text-blue-500" />
                <span className="text-xs xl:text-sm">
                  API Queries: <span className="font-medium text-foreground">{data.queryCount}</span>
                  {data.usingRealSearch && <span className="ml-1 text-green-500 text-xs">(Live data)</span>}
                </span>
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-7 px-2 xl:h-8 xl:px-3"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5 xl:h-4 xl:w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        
        <p className="text-sm xl:text-base text-muted-foreground">
          Based on analysis of search rankings and online presence for "{displayKeyword}" in {searchLocation}.
          {data?.usingRealSearch && (
            <span className="ml-1 text-xs text-blue-500">
              Using real-time search data from Google Search API.
            </span>
          )}
        </p>
      </div>
      
      {data?.competitors && data.competitors.length > 0 ? (
        <div className="space-y-4">
          {data.competitors.map((competitor: any, index: number) => (
            <Card key={index} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex-grow p-6 xl:p-8">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg xl:text-xl font-semibold flex items-center">
                      <Globe className="h-4 w-4 xl:h-5 xl:w-5 mr-2 text-primary" />
                      {competitor.name || `Competitor ${index + 1}`}
                    </h4>
                    <Badge variant={index === 0 ? "destructive" : index === 1 ? "default" : "outline"} className="xl:text-sm xl:px-3 xl:py-1">
                      {index === 0 ? "Top Competitor" : index === 1 ? "Strong Competitor" : "Competitor"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm xl:text-base text-muted-foreground mb-4 flex items-center">
                    <ExternalLink className="h-3 w-3 xl:h-4 xl:w-4 mr-1 flex-shrink-0" />
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 xl:gap-6 mt-4">
                    <div>
                      <p className="text-xs xl:text-sm text-muted-foreground mb-1">SEO Score</p>
                      <div className="flex items-center">
                        <div className="bg-primary/10 text-primary font-medium rounded-md px-2 py-1 text-sm xl:text-base xl:px-3">
                          {competitor.score || 'N/A'}/100
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs xl:text-sm text-muted-foreground mb-1">Domain Authority</p>
                      <div className="flex items-center">
                        <Progress value={competitor.domainAuthority || 50} className="h-2 xl:h-3 w-24 xl:w-32" />
                        <span className="text-sm xl:text-base ml-2">{competitor.domainAuthority || '-'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs xl:text-sm text-muted-foreground mb-1">Backlinks</p>
                      <div className="flex items-center">
                        <span className="text-sm xl:text-base font-medium">{competitor.backlinks || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs xl:text-sm text-muted-foreground mb-1">Keywords</p>
                      <div className="flex items-center">
                        <span className="text-sm xl:text-base font-medium">{competitor.keywords || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {competitor.contentScore && (
                      <div>
                        <p className="text-xs xl:text-sm text-muted-foreground mb-1">Content Score</p>
                        <div className="flex items-center">
                          <span className="text-sm xl:text-base font-medium">{competitor.contentScore}/10</span>
                        </div>
                      </div>
                    )}
                    
                    {competitor.loadTime && (
                      <div>
                        <p className="text-xs xl:text-sm text-muted-foreground mb-1">Load Time</p>
                        <div className="flex items-center">
                          <span className="text-sm xl:text-base font-medium">{competitor.loadTime}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-1/3 xl:w-1/4 bg-muted p-6 xl:p-8 border-t md:border-t-0 md:border-l">
                  <h5 className="text-sm xl:text-base font-medium mb-2">Key Strengths</h5>
                  <ul className="space-y-1 xl:space-y-2 text-sm xl:text-base">
                    {competitor.strengths && competitor.strengths.length > 0 ? (
                      competitor.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="rounded-full h-4 w-4 xl:h-5 xl:w-5 bg-green-100 text-green-600 flex items-center justify-center text-xs xl:text-sm mr-2 mt-0.5 flex-shrink-0">+</span>
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
          <p className="text-muted-foreground xl:text-lg">No competitors found for this location.</p>
        </div>
      )}
      
      <div className="space-y-2 mt-6">
        <h3 className="text-lg xl:text-xl 2xl:text-2xl font-semibold">Keyword Gap Analysis</h3>
        <p className="text-sm xl:text-base text-muted-foreground">
          Keywords your competitors are ranking for that you might be missing.
        </p>
      </div>
      
      {data?.keywordGap && data.keywordGap.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-4 xl:p-6 font-medium bg-muted text-sm xl:text-base">
            <div>Keyword</div>
            <div>Monthly Volume</div>
            <div>Difficulty</div>
            <div>Top Competitor</div>
          </div>
          <div className="divide-y">
            {data.keywordGap.map((keyword: any, index: number) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 xl:p-6 text-sm xl:text-base hover:bg-muted/50">
                <div className="font-medium">{keyword.term}</div>
                <div>{keyword.volume}</div>
                <div>{keyword.competition}</div>
                <div className="truncate" title={keyword.topCompetitor}>{keyword.topCompetitor}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 xl:py-12 border rounded-md">
          <p className="text-muted-foreground xl:text-lg">No keyword gap data available.</p>
        </div>
      )}
      
      {/* Add query usage counter at the bottom */}
      {isRequested && !isLoading && data && (
        <div className="mt-8 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Powered by Google Custom Search API
              {data?.queryCount && (
                <span className="ml-1">• {data.queryCount} {data.queryCount === 1 ? 'query' : 'queries'} used</span>
              )}
              {data?.meta?.totalResults > 0 && (
                <span className="ml-1">• {data.meta.totalResults} results found</span>
              )}
              <span className="ml-1 text-amber-600">• Limited to max 5 queries per analysis</span>
            </div>
            {data?.queryCount && (
              <div className="text-xs font-medium">
                Data freshness: {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}