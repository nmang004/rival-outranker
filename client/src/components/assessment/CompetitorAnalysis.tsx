import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUrl } from "@/lib/formatters";
import { Loader2, Globe, BarChart2, FileText, Star, AlertTriangle, MapPin, Search } from "lucide-react";

interface CompetitorAnalysisProps {
  url: string;
  keyword: string;
}

import { US_CITIES } from "@/lib/us-cities";

// Default locations for geo-based competitor analysis
// Organized by country with major cities
const GEO_DATA = {
  "United States": US_CITIES,
  "United Kingdom": [
    "London",
    "Manchester",
    "Birmingham",
    "Glasgow",
    "Liverpool",
    "Edinburgh",
    "Leeds",
    "Bristol",
    "Sheffield",
    "Newcastle",
    "Cardiff"
  ],
  "Canada": [
    "Toronto",
    "Montreal",
    "Vancouver", 
    "Calgary",
    "Edmonton",
    "Ottawa",
    "Quebec City",
    "Winnipeg",
    "Halifax"
  ],
  "Australia": [
    "Sydney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide",
    "Gold Coast",
    "Canberra",
    "Newcastle"
  ],
  "Germany": [
    "Berlin",
    "Hamburg",
    "Munich",
    "Cologne",
    "Frankfurt",
    "Stuttgart",
    "Düsseldorf",
    "Leipzig",
    "Dortmund"
  ],
  "France": [
    "Paris",
    "Marseille",
    "Lyon",
    "Toulouse",
    "Nice",
    "Nantes",
    "Strasbourg",
    "Bordeaux"
  ],
  "Spain": [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Seville",
    "Zaragoza",
    "Malaga",
    "Bilbao"
  ],
  "Italy": [
    "Rome",
    "Milan",
    "Naples",
    "Turin",
    "Palermo",
    "Bologna",
    "Florence",
    "Venice"
  ],
  "Japan": [
    "Tokyo",
    "Osaka",
    "Yokohama",
    "Nagoya",
    "Sapporo",
    "Fukuoka",
    "Kobe",
    "Kyoto"
  ],
  "India": [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur"
  ],
  "Brazil": [
    "São Paulo",
    "Rio de Janeiro",
    "Brasília",
    "Salvador",
    "Fortaleza",
    "Belo Horizonte",
    "Manaus",
    "Curitiba"
  ],
  "Mexico": [
    "Mexico City",
    "Guadalajara",
    "Monterrey",
    "Puebla",
    "Tijuana",
    "León",
    "Juárez",
    "Cancún"
  ],
  "China": [
    "Shanghai",
    "Beijing",
    "Guangzhou",
    "Shenzhen",
    "Chengdu",
    "Tianjin",
    "Wuhan",
    "Hangzhou"
  ],
  "South Korea": [
    "Seoul",
    "Busan",
    "Incheon",
    "Daegu",
    "Daejeon",
    "Gwangju"
  ],
  "Netherlands": [
    "Amsterdam",
    "Rotterdam",
    "Utrecht",
    "The Hague",
    "Eindhoven"
  ],
  "South Africa": [
    "Johannesburg",
    "Cape Town",
    "Durban",
    "Pretoria",
    "Port Elizabeth"
  ],
  "United Arab Emirates": [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Ajman"
  ],
  "Singapore": ["Singapore"]
};

// Get flat list of all countries for initial dropdown
const COUNTRIES = Object.keys(GEO_DATA);

export default function CompetitorAnalysis({ url, keyword }: CompetitorAnalysisProps) {
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("all-cities");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{country: string, city: string} | null>(null);
  const [showDetectedAlert, setShowDetectedAlert] = useState(false);
  const [openCityPopover, setOpenCityPopover] = useState(false);

  // Generate the full location string (country or city + country)
  const fullLocation = city && city !== "all-cities" ? `${city}, ${country}` : country;

  // Cities available for the selected country
  const availableCities = GEO_DATA[country as keyof typeof GEO_DATA] || [];
  
  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearchTerm) return availableCities;
    return availableCities.filter(cityName => 
      cityName.toLowerCase().includes(citySearchTerm.toLowerCase())
    );
  }, [availableCities, citySearchTerm]);

  // Fetch competitor analysis data
  const { data, isLoading, isError, refetch } = useQuery<any>({
    queryKey: [`/api/competitors?url=${encodeURIComponent(url)}&keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(fullLocation)}`],
    enabled: isAnalyzing,
    refetchOnWindowFocus: false
  });

  // Detect geo-location from URL on component mount
  useEffect(() => {
    detectGeoFromUrl(url);
  }, [url]);

  // Detect potential geo-location information from URL
  const detectGeoFromUrl = (urlString: string) => {
    try {
      // Parse URL to get domain and path information
      const parsedUrl = new URL(urlString);
      const domain = parsedUrl.hostname;
      const path = parsedUrl.pathname;
      
      // Look for country TLDs
      const tldMatches: {[key: string]: string} = {
        '.uk': 'United Kingdom',
        '.ca': 'Canada',
        '.au': 'Australia',
        '.de': 'Germany',
        '.fr': 'France',
        '.es': 'Spain',
        '.it': 'Italy',
        '.jp': 'Japan',
        '.in': 'India',
        '.br': 'Brazil',
        '.mx': 'Mexico',
        '.cn': 'China',
        '.kr': 'South Korea',
        '.nl': 'Netherlands',
        '.za': 'South Africa',
        '.ae': 'United Arab Emirates',
        '.sg': 'Singapore'
      };
      
      let detectedCountry = 'United States'; // Default
      let detectedCity = '';
      
      // Check for country TLD
      for (const [tld, countryName] of Object.entries(tldMatches)) {
        if (domain.endsWith(tld)) {
          detectedCountry = countryName;
          break;
        }
      }
      
      // Check for cities in URL (domain or path)
      const urlText = domain + path;
      
      // Try to find cities from the detected country in the URL
      if (GEO_DATA[detectedCountry as keyof typeof GEO_DATA]) {
        for (const city of GEO_DATA[detectedCountry as keyof typeof GEO_DATA]) {
          // Convert to lowercase and replace spaces with dashes or nothing for comparison
          const cityLower = city.toLowerCase();
          const cityDashed = cityLower.replace(/\s+/g, '-');
          const cityNoSpace = cityLower.replace(/\s+/g, '');
          
          if (
            urlText.toLowerCase().includes(cityLower) || 
            urlText.toLowerCase().includes(cityDashed) || 
            urlText.toLowerCase().includes(cityNoSpace)
          ) {
            detectedCity = city;
            break;
          }
        }
      }
      
      // If location info was detected, save it and show alert
      if (detectedCountry !== 'United States' || detectedCity) {
        setDetectedLocation({
          country: detectedCountry,
          city: detectedCity
        });
        setShowDetectedAlert(true);
      }
    } catch (error) {
      console.error('Error detecting geo from URL:', error);
      // Silently fail - we'll just use default location
    }
  };

  // Apply detected location values
  const applyDetectedLocation = () => {
    if (detectedLocation) {
      setCountry(detectedLocation.country);
      setCity(detectedLocation.city || "all-cities");
    }
    setShowDetectedAlert(false);
  };

  // Reset city when country changes
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setCity("all-cities");
  };

  // Handle city selection
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    refetch();
  };

  if (!isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Globe className="mr-2 h-5 w-5 text-primary" />
            Geographic Competitor Analysis
          </CardTitle>
          <CardDescription>
            Analyze competitors targeting your keyword across different locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">This feature helps you identify competitors targeting your primary keyword in specific regions.</p>
              <h4 className="font-medium mb-2">Primary Keyword: <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{keyword}</Badge></h4>
            </div>
            
            {/* Alert for detected location from URL */}
            {showDetectedAlert && detectedLocation && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <MapPin className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      Detected location from URL!
                    </h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>
                        We detected that your URL might be targeting: 
                        <span className="font-medium">
                          {detectedLocation.city 
                            ? ` ${detectedLocation.city}, ${detectedLocation.country}` 
                            : ` ${detectedLocation.country}`}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex">
                      <Button
                        size="sm"
                        onClick={applyDetectedLocation}
                        className="mr-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Use this location
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDetectedAlert(false)}
                      >
                        Ignore
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="country" className="text-sm font-medium">
                  Select Country:
                </label>
                <Select defaultValue={country} onValueChange={handleCountryChange}>
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {COUNTRIES.map((countryName) => (
                      <SelectItem key={countryName} value={countryName}>
                        {countryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-2">
                <label htmlFor="city-search" className="text-sm font-medium mb-2 block">
                  Select City (Optional):
                </label>
                <Popover open={openCityPopover} onOpenChange={setOpenCityPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCityPopover}
                      className="w-full justify-between"
                    >
                      {city !== "all-cities" ? city : `All cities in ${country}`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder={`Search cities in ${country}...`} 
                        value={citySearchTerm}
                        onValueChange={setCitySearchTerm}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No cities found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all-cities"
                            onSelect={() => {
                              handleCityChange("all-cities");
                              setOpenCityPopover(false);
                              setCitySearchTerm("");
                            }}
                            className="cursor-pointer"
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                city === "all-cities" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All cities in {country}
                          </CommandItem>
                          {filteredCities.map((cityName) => (
                            <CommandItem
                              key={cityName}
                              value={cityName}
                              onSelect={() => {
                                handleCityChange(cityName);
                                setOpenCityPopover(false);
                                setCitySearchTerm("");
                              }}
                              className="cursor-pointer"
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  city === cityName ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {cityName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button
                onClick={handleAnalyze}
                className="w-full mt-4 sage-bg-gradient hover:opacity-90 transition-opacity"
              >
                <Globe className="mr-2 h-4 w-4" />
                Analyze Competitors in {fullLocation}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <CompetitorAnalysisLoading location={fullLocation} />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">Failed to analyze competitors. Please try again.</p>
          <Button 
            onClick={() => setIsAnalyzing(false)} 
            variant="outline"
          >
            Back to Analysis Options
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { competitors, comparisonMetrics } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Globe className="mr-2 h-5 w-5 text-primary" />
          Competitor Analysis: {fullLocation}
        </CardTitle>
        <CardDescription>
          Top competitors for keyword "{keyword}" in {fullLocation}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComparisonMetricCard 
            title="Avg. Content Length" 
            value={comparisonMetrics.avgContentLength.toLocaleString()}
            icon={<FileText className="h-4 w-4 text-primary" />}
            description="words"
          />
          <ComparisonMetricCard 
            title="Avg. Keyword Density" 
            value={comparisonMetrics.avgKeywordDensity.toFixed(2)}
            icon={<BarChart2 className="h-4 w-4 text-primary" />}
            description="%"
          />
          <ComparisonMetricCard 
            title="Successful Strategies" 
            value={comparisonMetrics.topKeywords[0] || "Keyword in title"}
            icon={<Star className="h-4 w-4 text-primary" />}
            description="common approach"
          />
        </div>

        <Separator className="my-4" />

        <h3 className="font-medium text-lg mb-2">Top Competitors ({competitors.length})</h3>
        
        <div className="space-y-4">
          {competitors.map((competitor: any, index: number) => (
            <CompetitorCard key={index} competitor={competitor} keyword={keyword} />
          ))}
          
          {competitors.length === 0 && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-muted-foreground">No competitors found for this keyword and location</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button 
            onClick={() => setIsAnalyzing(false)} 
            variant="outline"
            className="mr-2"
          >
            Change Location
          </Button>
          <Button 
            onClick={() => refetch()} 
            className="sage-bg-gradient hover:opacity-90 transition-opacity"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Refresh Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompetitorCard({ competitor, keyword }: { competitor: any, keyword: string }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start">
        <div>
          <a 
            href={competitor.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline font-medium flex items-center"
          >
            <Globe className="h-4 w-4 mr-1" />
            {formatUrl(competitor.url, 45)}
          </a>
          <h4 className="font-medium mt-1">{competitor.title || "Untitled Page"}</h4>
        </div>
        <div className="flex items-center space-x-1">
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
            {competitor.contentLength.toLocaleString()} words
          </Badge>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
            {competitor.keywordDensity.toFixed(2)}% density
          </Badge>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{competitor.description || "No description available"}</p>
      
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <h5 className="text-sm font-medium flex items-center">
            <Star className="h-3 w-3 text-primary mr-1" />
            Strengths
          </h5>
          <ul className="mt-1 text-xs text-muted-foreground">
            {competitor.strengths.slice(0, 3).map((strength: string, index: number) => (
              <li key={index} className="flex items-center">
                <svg className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="line-clamp-1">{strength}</span>
              </li>
            ))}
            {competitor.strengths.length === 0 && <li className="text-muted-foreground">No notable strengths</li>}
          </ul>
        </div>
        
        <div>
          <h5 className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-3 w-3 text-destructive mr-1" />
            Weaknesses
          </h5>
          <ul className="mt-1 text-xs text-muted-foreground">
            {competitor.weaknesses.slice(0, 3).map((weakness: string, index: number) => (
              <li key={index} className="flex items-center">
                <svg className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="line-clamp-1">{weakness}</span>
              </li>
            ))}
            {competitor.weaknesses.length === 0 && <li className="text-muted-foreground">No notable weaknesses</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ComparisonMetricCard({ 
  title, 
  value, 
  icon,
  description 
}: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode,
  description: string 
}) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center mb-2">
        {icon}
        <h3 className="text-sm font-medium ml-1">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function CompetitorAnalysisLoading({ location }: { location: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Globe className="mr-2 h-5 w-5 text-primary" />
          Competitor Analysis: {location}
        </CardTitle>
        <CardDescription>
          Analyzing competitors in this location...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg border">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <h3 className="font-medium text-lg mb-2">Top Competitors</h3>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-4 w-full mt-4 mb-2" />
              <Skeleton className="h-4 w-3/4" />
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-3 w-32 mb-1" />
                  <Skeleton className="h-3 w-28 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-3 w-32 mb-1" />
                  <Skeleton className="h-3 w-28 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center mt-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin mr-2" />
          <span className="text-muted-foreground">Analyzing competitors in {location}...</span>
        </div>
      </CardContent>
    </Card>
  );
}