import { useState, useEffect } from "react";
import { BarChart, Search, ArrowLeft, FileDown, ChevronDown, ChevronUp, Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BarChart as BarChartComponent, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

// Type definitions
interface Keyword {
  id: number;
  text: string;
  position: number;
  url: string;
  volume?: number;
  difficulty?: number;
  cpc?: string;
  trend?: number[]; // Historical positions
  competitorRankings?: CompetitorRanking[];
}

interface CompetitorRanking {
  competitorUrl: string;
  position: number;
  url: string;
}

interface Competitor {
  url: string;
  avgPosition?: number;
}

interface KeywordSuggestion {
  id: number;
  text: string;
  volume?: number;
  difficulty?: number;
  cpc?: string;
  relevance?: number;
}

interface RankingData {
  website: string;
  keywords: Keyword[];
  competitors: Competitor[];
  avgPosition: number;
  date: string;
  keywordSuggestions?: KeywordSuggestion[];
}

export default function BasicRankTracker() {
  // State variables
  const [view, setView] = useState<"form" | "results">("form");
  const [website, setWebsite] = useState("");
  const [keywords, setKeywords] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RankingData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({ key: 'position', direction: 'ascending' });

  // Helper function to format numbers in SEO industry standard format
  const formatNumber = (num?: number): string => {
    if (num === undefined) return "N/A";
    
    // Format large numbers with K/M suffixes like industry tools
    if (num >= 1000000) {
      // For millions, use decimal point for values under 10M
      if (num < 10000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      }
      return `${Math.round(num / 1000000)}M`;
    }
    
    if (num >= 10000) {
      // For larger K values, round to nearest K
      return `${Math.round(num / 1000)}K`;
    }
    
    if (num >= 1000) {
      // For smaller K values (1K-10K), use decimal point
      return `${(num / 1000).toFixed(1)}K`;
    }
    
    // For small numbers, just show the value
    return num.toString();
  };
  
  // Helper function to get color based on ranking position
  const getRankingColor = (position: number): string => {
    if (position <= 3) return "text-green-600 font-bold";
    if (position <= 10) return "text-emerald-500 font-semibold";
    if (position <= 20) return "text-amber-500";
    return "text-gray-600";
  };
  
  // Helper function to generate trend history data
  const generateTrendData = (keyword: string): number[] => {
    // Generate a semi-realistic trend (7 days)
    const seed = keyword.charCodeAt(0) + (keyword.length * 3);
    const currentPosition = Math.floor(seed % 30) + 1;
    const trend: number[] = [];
    
    for (let i = 0; i < 7; i++) {
      // Add some variance around the current position
      const variance = Math.floor(Math.sin(seed + i) * 5);
      const pos = Math.max(1, currentPosition + variance);
      trend.push(pos);
    }
    
    return trend;
  };
  
  // Helper function to generate keyword suggestions
  const generateKeywordSuggestions = (baseKeywords: string[]): KeywordSuggestion[] => {
    if (!baseKeywords.length) return [];
    
    const suggestions: KeywordSuggestion[] = [];
    const modifiers = ['best', 'top', 'cheap', 'affordable', 'premium', 'professional', 'local', 'online'];
    const suffixes = ['service', 'tool', 'software', 'solution', 'provider', 'company', 'platform'];
    
    baseKeywords.forEach((keyword, index) => {
      const words = keyword.split(' ');
      
      // Base word variations
      if (words.length === 1) {
        suggestions.push({
          id: suggestions.length + 1,
          text: `${keyword}s`,
          volume: Math.floor(Math.random() * 5000) + 200,
          difficulty: Math.floor(Math.random() * 70) + 20,
          cpc: `$${(Math.random() * 3 + 0.5).toFixed(2)}`,
          relevance: 90
        });
      }
      
      // Add modifiers
      const modifier = modifiers[index % modifiers.length];
      suggestions.push({
        id: suggestions.length + 1,
        text: `${modifier} ${keyword}`,
        volume: Math.floor(Math.random() * 3000) + 100,
        difficulty: Math.floor(Math.random() * 70) + 20,
        cpc: `$${(Math.random() * 3 + 0.5).toFixed(2)}`,
        relevance: 85
      });
      
      // Add suffix
      const suffix = suffixes[(index + 3) % suffixes.length];
      suggestions.push({
        id: suggestions.length + 1,
        text: `${keyword} ${suffix}`,
        volume: Math.floor(Math.random() * 2000) + 100,
        difficulty: Math.floor(Math.random() * 60) + 30,
        cpc: `$${(Math.random() * 4 + 1).toFixed(2)}`,
        relevance: 75
      });
    });
    
    return suggestions.slice(0, 10); // Limit to 10 suggestions
  };
  
  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Helper function to sort keywords
  const sortedKeywords = (keywords: Keyword[]): Keyword[] => {
    if (!keywords?.length) return [];
    
    return [...keywords].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Keyword];
      const bValue = b[sortConfig.key as keyof Keyword];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (sortConfig.direction === 'ascending') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Helper function to request sort
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!website) {
      setError("Please enter your website URL");
      return;
    }

    if (!keywords) {
      setError("Please enter at least one keyword to track");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Format the data
      const keywordList = keywords
        .split(/\n|,/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      const rawCompetitorList = competitors
        .split(/\n|,/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      // Use default competitors if none provided
      const finalCompetitorList = rawCompetitorList.length > 0 ? 
        rawCompetitorList : 
        ["competitor1.com", "competitor2.com", "competitor3.com"];
      
      // Generate mock data for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate enhanced keywords with trends and competitor rankings
      const enhancedKeywords = keywordList.map((text, index) => {
        // More realistic position based on keyword length and uniqueness
        const baseDifficulty = 20 + (text.length > 15 ? 10 : 30); // Longer terms are often less competitive
        const wordCount = text.split(' ').length;
        const uniqueScore = new Set(text.toLowerCase().split('')).size / text.length;
        
        // Generate position based on these factors - more unique/specific queries rank better
        const positionBase = wordCount > 2 ? 10 : 25;
        const position = Math.max(1, Math.floor(positionBase * (0.7 + (Math.random() * 0.6))));
        
        // Generate realistic trend data
        const trend = generateTrendData(text);
        
        // Calculate search volume - more realistic data patterns
        // Short/common terms have higher volume
        const baseVolume = wordCount === 1 ? 
          Math.floor(Math.random() * 60000) + 5000 : // Single words have higher volume
          wordCount === 2 ? 
            Math.floor(Math.random() * 20000) + 1000 : // Two words have medium volume
            Math.floor(Math.random() * 5000) + 100;    // Long phrases have lower volume
            
        // Keyword difficulty - more realistic patterns
        // Short/common terms are more difficult to rank for
        const difficulty = Math.min(95, Math.max(5, Math.floor(baseDifficulty * (0.7 + (Math.random() * 0.6)))));
        
        // More realistic CPC values based on term length (shorter terms usually cost more)
        const baseCpc = 1.5 + (3 / Math.max(1, wordCount));
        const cpc = `$${(baseCpc + (Math.random() * 2)).toFixed(2)}`;
        
        // Generate competitor rankings for this keyword
        const competitorRankings = finalCompetitorList.map(competitorUrl => {
          // Make competitor rankings somewhat correlated with difficulty
          const competitorPosition = Math.floor((Math.random() * 40) + (difficulty * 0.2));
          
          // Fix URL to avoid double https://
          const urlPath = text.toLowerCase().replace(/\s+/g, "-");
          const url = competitorUrl.startsWith('http') ? 
            `${competitorUrl}/${urlPath}` : 
            `https://${competitorUrl}/${urlPath}`;
            
          return {
            competitorUrl,
            position: competitorPosition,
            url,
          };
        });
        
        // Fix URL to avoid double https://
        const urlPath = text.toLowerCase().replace(/\s+/g, '-');
        const url = website.startsWith('http') ? 
          `${website}/${urlPath}` : 
          `https://${website}/${urlPath}`;
          
        return {
          id: index + 1,
          text,
          position,
          url,
          volume: baseVolume,
          difficulty,
          cpc,
          trend,
          competitorRankings,
        };
      });
      
      // Calculate competitor average positions
      const enhancedCompetitors = finalCompetitorList.map(url => {
        const rankings = enhancedKeywords.flatMap(k => 
          k.competitorRankings?.filter(cr => cr.competitorUrl === url)
            .map(cr => cr.position) || []
        );
        
        const avgPosition = rankings.length 
          ? Math.round(rankings.reduce((sum, pos) => sum + pos, 0) / rankings.length) 
          : undefined;
          
        return {
          url,
          avgPosition
        };
      });
      
      // Generate keyword suggestions
      const keywordSuggestions = generateKeywordSuggestions(keywordList);
      
      // Calculate overall average position
      let avgPosition = 0;
      if (enhancedKeywords.length) {
        const sum = enhancedKeywords.reduce((acc, k) => acc + k.position, 0);
        avgPosition = Math.round(sum / enhancedKeywords.length);
      }
      
      // Create enhanced results
      const mockResults: RankingData = {
        website,
        keywords: enhancedKeywords,
        competitors: enhancedCompetitors,
        avgPosition,
        date: new Date().toISOString(),
        keywordSuggestions
      };
      
      setResults(mockResults);
      setView("results");
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred while processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset and go back to form
  const handleReset = () => {
    setView("form");
    setResults(null);
  };

  // Render form view
  if (view === "form") {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Basic Rank Tracker"
          description="A simple, reliable keyword ranking tracker"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        {error && (
          <Alert variant="destructive" className="mt-4 mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="mt-6">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Track Keyword Rankings</CardTitle>
              <CardDescription>
                Enter your website, keywords, and optional competitors
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Your Website</Label>
                <Input
                  id="website"
                  placeholder="example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (one per line or comma-separated)</Label>
                <Textarea
                  id="keywords"
                  placeholder="SEO best practices
keyword research tool
on-page optimization"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Enter each keyword on a new line or separated by commas
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="competitors">Competitors (optional)</Label>
                <Textarea
                  id="competitors"
                  placeholder="competitor1.com
competitor2.com"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Enter competitor domains to compare rankings
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track Rankings
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Export functionality
  const handleExport = () => {
    if (!results) return;
    
    setIsExporting(true);
    
    try {
      const csvContent = [
        // Headers
        ['Keyword', 'Position', 'URL', 'Search Volume', 'Difficulty', 'CPC'],
        // Data rows
        ...results.keywords.map(k => [
          k.text,
          k.position.toString(),
          k.url,
          k.volume?.toString() || 'N/A',
          k.difficulty?.toString() || 'N/A',
          k.cpc || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${results.website}-keyword-rankings.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Functions to render trend data
  const renderTrendChart = (trend: number[]) => {
    if (!trend?.length) return null;
    
    const data = trend.map((position, index) => ({
      day: index,
      position
    }));
    
    return (
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Line 
            type="monotone" 
            dataKey="position" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Function to render competitor comparison
  const renderCompetitorComparison = (keyword: Keyword) => {
    if (!keyword.competitorRankings?.length) return null;
    
    // Format the data for the bar chart
    const data = [
      {
        name: 'Your Site',
        position: keyword.position,
        fill: '#10b981' // green
      },
      ...keyword.competitorRankings.map(cr => ({
        name: cr.competitorUrl.replace(/^https?:\/\/(www\.)?/, '').split('.')[0],
        position: cr.position,
        fill: '#f59e0b' // amber
      }))
    ];
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Competitor Comparison</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChartComponent 
            data={data} 
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 'dataMax']} />
            <YAxis type="category" dataKey="name" width={70} />
            <RechartsTooltip 
              formatter={(value: number) => [`Position: ${value}`, 'Ranking']}
              labelFormatter={(name) => `${name}`}
            />
            <Bar dataKey="position" />
          </BarChartComponent>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render results view
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Keyword Rankings"
        description={`Results for ${results?.website || ""}`}
        icon={<BarChart className="h-6 w-6 mr-2" />}
      />
      
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={handleReset} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Tracker
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1"
          >
            <FileDown className="h-4 w-4" /> {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Badge variant="outline" className="h-8">
            {formatDate(results?.date || "")}
          </Badge>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRankingColor(results?.avgPosition || 0)}`}>
              {results?.avgPosition.toFixed(1) || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground">
              Across {results?.keywords.length || 0} keywords
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Keywords Tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results?.keywords.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              {results?.keywords.filter(k => k.position <= 10).length || 0} in top 10
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {results?.competitors.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Performance tracking
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Keyword Rankings</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="suggestions">Keyword Ideas</TabsTrigger>
        </TabsList>
        
        {/* Keywords Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Rankings</CardTitle>
              <CardDescription>
                Current ranking positions for tracked keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results && results.keywords.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('text')}>
                          Keyword
                          {sortConfig.key === 'text' && (
                            sortConfig.direction === 'ascending' ? 
                            <ChevronUp className="inline ml-1 h-3 w-3" /> : 
                            <ChevronDown className="inline ml-1 h-3 w-3" />
                          )}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => requestSort('position')}>
                          Position
                          {sortConfig.key === 'position' && (
                            sortConfig.direction === 'ascending' ? 
                            <ChevronUp className="inline ml-1 h-3 w-3" /> : 
                            <ChevronDown className="inline ml-1 h-3 w-3" />
                          )}
                        </TableHead>
                        <TableHead className="hidden md:table-cell">Trend</TableHead>
                        <TableHead className="hidden lg:table-cell">URL</TableHead>
                        <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => requestSort('volume')}>
                          Volume
                          {sortConfig.key === 'volume' && (
                            sortConfig.direction === 'ascending' ? 
                            <ChevronUp className="inline ml-1 h-3 w-3" /> : 
                            <ChevronDown className="inline ml-1 h-3 w-3" />
                          )}
                        </TableHead>
                        <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => requestSort('difficulty')}>
                          Difficulty
                          {sortConfig.key === 'difficulty' && (
                            sortConfig.direction === 'ascending' ? 
                            <ChevronUp className="inline ml-1 h-3 w-3" /> : 
                            <ChevronDown className="inline ml-1 h-3 w-3" />
                          )}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedKeywords(results.keywords).map((keyword) => (
                        <TableRow 
                          key={keyword.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedKeyword(keyword)}
                        >
                          <TableCell className="font-medium">{keyword.text}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRankingColor(keyword.position)}>
                              {keyword.position}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {keyword.trend && renderTrendChart(keyword.trend)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground truncate max-w-xs">
                            {keyword.url}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{formatNumber(keyword.volume)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {keyword.difficulty !== undefined ? (
                              <Badge variant={keyword.difficulty < 50 ? "default" : "secondary"}>
                                {keyword.difficulty}
                              </Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No keyword data available
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Selected Keyword Details */}
          {selectedKeyword && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedKeyword.text}</CardTitle>
                <CardDescription>
                  Detailed ranking information and competitor comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Current Ranking</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground">Position</div>
                        <div className={`text-2xl font-bold ${getRankingColor(selectedKeyword.position)}`}>
                          {selectedKeyword.position}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground">Search Volume</div>
                        <div className="text-2xl font-bold">{formatNumber(selectedKeyword.volume)}</div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">Ranking URL</h3>
                    <div className="p-4 rounded-lg border break-all">
                      <div className="text-sm font-medium">{selectedKeyword.url}</div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mt-4 mb-2">7-Day Trend</h3>
                    <div className="p-4 rounded-lg border">
                      {selectedKeyword.trend && (
                        <ResponsiveContainer width="100%" height={100}>
                          <LineChart data={selectedKeyword.trend.map((pos, idx) => ({ day: idx, position: pos }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" tickFormatter={(val) => {
                              const date = new Date();
                              date.setDate(date.getDate() - (6 - val));
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }} />
                            <YAxis domain={['dataMin', 'dataMax']} reversed />
                            <RechartsTooltip />
                            <Line 
                              type="monotone" 
                              dataKey="position" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              isAnimationActive={true}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Keyword Metrics</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground">Difficulty</div>
                        <div className="text-2xl font-bold">{selectedKeyword.difficulty}</div>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground">CPC</div>
                        <div className="text-2xl font-bold">{selectedKeyword.cpc}</div>
                      </div>
                    </div>
                    
                    {renderCompetitorComparison(selectedKeyword)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setSelectedKeyword(null)}>
                  Close Details
                </Button>
                <div className="text-sm text-muted-foreground">
                  Last updated: {formatDate(results?.date || "")}
                </div>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Competitors Tab */}
        <TabsContent value="competitors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>
                Websites competing for your target keywords and their average positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                {results?.competitors.map((competitor, index) => (
                  <div key={index} className="p-6 rounded-lg border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{competitor.url}</h3>
                        <p className="text-sm text-muted-foreground">
                          Competing for {results.keywords.length} keywords
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Avg. Position</div>
                        <div className="text-2xl font-bold">{competitor.avgPosition || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Top Ranking Keywords</h4>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Keyword</TableHead>
                              <TableHead>Their Position</TableHead>
                              <TableHead>Your Position</TableHead>
                              <TableHead className="hidden md:table-cell">Difference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.keywords
                              .filter(k => k.competitorRankings?.some(cr => cr.competitorUrl === competitor.url))
                              .sort((a, b) => {
                                const aPos = a.competitorRankings?.find(cr => cr.competitorUrl === competitor.url)?.position || 100;
                                const bPos = b.competitorRankings?.find(cr => cr.competitorUrl === competitor.url)?.position || 100;
                                return aPos - bPos;
                              })
                              .slice(0, 5)
                              .map(keyword => {
                                const compRank = keyword.competitorRankings?.find(cr => cr.competitorUrl === competitor.url);
                                const diff = keyword.position - (compRank?.position || 0);
                                
                                return (
                                  <TableRow key={`${keyword.id}-${competitor.url}`}>
                                    <TableCell className="font-medium">{keyword.text}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={getRankingColor(compRank?.position || 100)}>
                                        {compRank?.position || 'N/A'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={getRankingColor(keyword.position)}>
                                        {keyword.position}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                      {diff > 0 ? (
                                        <span className="text-red-500">-{diff}</span>
                                      ) : diff < 0 ? (
                                        <span className="text-green-500">+{Math.abs(diff)}</span>
                                      ) : (
                                        <span className="text-gray-500">0</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Keyword Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Keyword Suggestions
              </CardTitle>
              <CardDescription>
                Related keywords you might want to consider targeting based on your current keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results?.keywordSuggestions && results.keywordSuggestions.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Relevance</TableHead>
                        <TableHead className="hidden sm:table-cell">Search Volume</TableHead>
                        <TableHead className="hidden md:table-cell">Difficulty</TableHead>
                        <TableHead className="hidden md:table-cell">CPC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.keywordSuggestions.map((suggestion) => (
                        <TableRow key={suggestion.id}>
                          <TableCell className="font-medium">{suggestion.text}</TableCell>
                          <TableCell>
                            {suggestion.relevance ? (
                              <div className="flex items-center">
                                <div className="w-16 h-2 rounded-full bg-gray-200 mr-2">
                                  <div 
                                    className="h-full rounded-full bg-green-500" 
                                    style={{ width: `${suggestion.relevance}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm">{suggestion.relevance}%</span>
                              </div>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{formatNumber(suggestion.volume)}</TableCell>
                          <TableCell className="hidden md:table-cell">{suggestion.difficulty || 'N/A'}</TableCell>
                          <TableCell className="hidden md:table-cell">{suggestion.cpc || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No keyword suggestions available
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Based on the keywords you're currently tracking
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}