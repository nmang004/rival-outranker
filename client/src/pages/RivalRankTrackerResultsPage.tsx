import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { BarChart, ArrowLeft, LineChart, SearchCheck, ArrowUpRight, Clock, Layers, BarChart2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart as RechartsLineChart,
  Line
} from "recharts";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/auth/LoginButton";

// Helper function to format search volume
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Helper function to get color based on ranking position
const getRankingColor = (position: number): string => {
  if (position <= 3) return "text-green-600";
  if (position <= 10) return "text-emerald-500";
  if (position <= 20) return "text-amber-500";
  if (position <= 50) return "text-orange-500";
  return "text-rose-500";
};

// Helper function to get badge variant based on difficulty
const getDifficultyVariant = (difficulty: number): "default" | "outline" | "secondary" | "destructive" => {
  if (difficulty < 30) return "default";
  if (difficulty < 50) return "secondary";
  if (difficulty < 70) return "outline";
  return "destructive";
};

// Helper function to convert keyword competition to descriptive text
const getDifficultyText = (difficulty: number): string => {
  if (difficulty < 30) return "Easy";
  if (difficulty < 50) return "Moderate";
  if (difficulty < 70) return "Difficult";
  return "Very Difficult";
};

export default function RivalRankTrackerResultsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch keyword tracking analysis
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ["/api/rival-rank-tracker", id],
    retry: false,
    refetchInterval: (data) => {
      // If the analysis is still processing, poll every 5 seconds
      return data?.status === "processing" ? 5000 : false;
    },
  });

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <PageHeader
          title="Rival Rank Tracker"
          description="Track your keyword rankings against competitors over time"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You need to be logged in to view tracking results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <LoginButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center mb-4">
          <Button variant="ghost" className="mr-2" onClick={() => navigate("/rival-rank-tracker")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <PageHeader
          title="Error Loading Results"
          description="We couldn't load the tracking results"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Analysis Not Found</CardTitle>
            <CardDescription>
              We couldn't find the keyword tracking analysis you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              {(error as Error).message || "An unknown error occurred"}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/rival-rank-tracker")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Keyword Tracker
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (analysis?.status === "processing") {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-2" onClick={() => navigate("/rival-rank-tracker")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Keyword Tracking Analysis</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500 animate-pulse" />
              Processing Your Analysis
            </CardTitle>
            <CardDescription>
              Please wait while we track your keywords and generate insights
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-md mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-progress"></div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-lg font-medium">Checking keyword rankings...</p>
                  <p className="text-gray-500 mt-2">
                    This process may take a few minutes depending on the number of keywords.
                  </p>
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis?.keywords?.length) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <PageHeader
          title="No Keywords Found"
          description="Your analysis doesn't contain any keywords"
          icon={<BarChart className="h-6 w-6 mr-2" />}
        />
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>No Keywords Found</CardTitle>
            <CardDescription>
              We couldn't find any keywords in this analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This could be because the keywords weren't tracked properly or there was an error
              during processing.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/rival-rank-tracker")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Keyword Tracker
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Create data for the ranking chart
  const rankingChartData = analysis.keywords.map((keyword: any) => {
    const competitors = analysis.competitors || [];
    const data: any = {
      keyword: keyword.text,
      "Your Website": keyword.currentRanking?.position || 100,
    };
    
    // Add competitor data to chart
    competitors.forEach((competitor: any) => {
      const competitorRanking = keyword.competitorRankings?.find(
        (r: any) => r.competitorUrl === competitor.url
      );
      data[competitor.url] = competitorRanking?.position || 100;
    });
    
    return data;
  });

  // Data for summary stats
  const topRankedKeywords = analysis.keywords.filter((k: any) => 
    (k.currentRanking?.position || 101) <= 10
  ).length;
  
  const keywordsWithDifficulty = analysis.keywords.filter((k: any) => k.metrics?.difficulty).length;
  const avgDifficulty = keywordsWithDifficulty > 0 
    ? analysis.keywords.reduce((acc: number, k: any) => 
        acc + (k.metrics?.difficulty || 0), 0) / keywordsWithDifficulty
    : 0;
  
  const totalSearchVolume = analysis.keywords.reduce(
    (acc: number, k: any) => acc + (k.metrics?.volume || 0), 0
  );

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-2" onClick={() => navigate("/rival-rank-tracker")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <PageHeader 
            title={analysis.website}
            description="Keyword Ranking Analysis"
            icon={<BarChart className="h-6 w-6 mr-2" />}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Export as PDF
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Keywords Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.keywords.length}</div>
            <p className="text-sm text-muted-foreground">
              {topRankedKeywords} in top 10 positions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDifficulty.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {getDifficultyText(avgDifficulty)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Search Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalSearchVolume)}/mo
            </div>
            <p className="text-sm text-muted-foreground">
              Estimated monthly searches
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different analysis views */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Rankings</CardTitle>
              <CardDescription>
                How your website ranks compared to competitors for each keyword
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={rankingChartData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis 
                      type="number" 
                      domain={[1, 100]} 
                      reversed={true}
                      label={{ value: 'Position', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      dataKey="keyword" 
                      type="category" 
                      width={120} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [
                        value > 100 ? 'Not ranked' : `Position ${value}`, 
                        'Ranking'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="Your Website" 
                      fill="#4f46e5" 
                      radius={[0, 4, 4, 0]}
                    />
                    {analysis.competitors && analysis.competitors.map((competitor: any, index: number) => (
                      <Bar 
                        key={competitor.url}
                        dataKey={competitor.url}
                        fill={`hsl(${index * 60}, 70%, 60%)`}
                        radius={[0, 4, 4, 0]}
                      />
                    ))}
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Search Volume vs. Difficulty</CardTitle>
              <CardDescription>
                Keyword difficulty compared to monthly search volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={analysis.keywords.map((keyword: any) => ({
                      keyword: keyword.text,
                      volume: keyword.metrics?.volume || 0,
                      difficulty: keyword.metrics?.difficulty || 0,
                      position: keyword.currentRanking?.position || 100
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="difficulty" 
                      type="number" 
                      name="Difficulty" 
                      domain={[0, 100]}
                      label={{ value: 'Difficulty (%)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Search Volume', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        if (name === "volume") return [formatNumber(value as number), "Search Volume"];
                        if (name === "difficulty") return [`${value}%`, "Difficulty"];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const item = analysis.keywords.find((k: any) => 
                          (k.metrics?.difficulty || 0) === label
                        );
                        return item ? item.text : '';
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      name="Search Volume"
                      stroke="#4f46e5" 
                      dot={{ 
                        r: 5, 
                        stroke: '#4f46e5',
                        strokeWidth: 1,
                        fill: 'white' 
                      }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Rankings Tab */}
        <TabsContent value="rankings">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Rankings</CardTitle>
              <CardDescription>
                Current rankings for all tracked keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Keyword</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Search Volume</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.keywords.sort((a: any, b: any) => {
                    // Sort by position (unranked at the bottom)
                    const posA = a.currentRanking?.position || 101;
                    const posB = b.currentRanking?.position || 101;
                    return posA - posB;
                  }).map((keyword: any) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.text}</TableCell>
                      <TableCell className={getRankingColor(keyword.currentRanking?.position || 101)}>
                        {keyword.currentRanking?.position 
                          ? `#${keyword.currentRanking.position}` 
                          : "Not ranked"}
                      </TableCell>
                      <TableCell>
                        {keyword.metrics?.volume
                          ? `${formatNumber(keyword.metrics.volume)}/mo`
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {keyword.metrics?.difficulty !== undefined ? (
                          <Badge variant={getDifficultyVariant(keyword.metrics.difficulty)}>
                            {keyword.metrics.difficulty}% - {getDifficultyText(keyword.metrics.difficulty)}
                          </Badge>
                        ) : (
                          "Unknown"
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.metrics?.trend ? (
                          <div className="w-32 h-10">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={keyword.metrics.trend.map((point: number, i: number) => ({
                                  date: i,
                                  value: point
                                }))}
                              >
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#4f46e5"
                                  fill="#4f46e580"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          "No data"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Competitors Tab */}
        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>
                How your website compares to competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.competitors && analysis.competitors.length > 0 ? (
                <div className="space-y-8">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={analysis.keywords.map((k: any) => {
                          const data: any = {
                            keyword: k.text,
                            "Your Website": k.currentRanking?.position 
                              ? 100 - Math.min(k.currentRanking.position, 100) 
                              : 0,
                          };
                          
                          analysis.competitors.forEach((c: any) => {
                            const ranking = k.competitorRankings?.find(
                              (r: any) => r.competitorUrl === c.url
                            );
                            data[c.url] = ranking?.position 
                              ? 100 - Math.min(ranking.position, 100) 
                              : 0;
                          });
                          
                          return data;
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="keyword" 
                          tick={{ angle: -45, textAnchor: 'end', fontSize: 12 }}
                          height={70}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          label={{ 
                            value: 'Ranking Score (higher is better)', 
                            angle: -90, 
                            position: 'insideLeft' 
                          }}
                        />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Legend />
                        <Bar 
                          dataKey="Your Website" 
                          fill="#4f46e5" 
                        />
                        {analysis.competitors.map((competitor: any, index: number) => (
                          <Bar 
                            key={competitor.url}
                            dataKey={competitor.url}
                            fill={`hsl(${index * 60}, 70%, 60%)`}
                          />
                        ))}
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Competitor Rankings</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Website</TableHead>
                          <TableHead>Avg. Position</TableHead>
                          <TableHead>Top 10 Keywords</TableHead>
                          <TableHead>Keywords Ranked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            {analysis.website}
                            <Badge variant="outline" className="ml-2">Your Website</Badge>
                          </TableCell>
                          <TableCell>
                            {analysis.avgPosition ? `#${analysis.avgPosition.toFixed(1)}` : "N/A"}
                          </TableCell>
                          <TableCell>
                            {topRankedKeywords} of {analysis.keywords.length}
                          </TableCell>
                          <TableCell>
                            {analysis.keywords.filter((k: any) => k.currentRanking?.position).length} of {analysis.keywords.length}
                          </TableCell>
                        </TableRow>
                        
                        {analysis.competitors.map((competitor: any) => {
                          const competitorRankings = analysis.keywords
                            .flatMap((k: any) => k.competitorRankings || [])
                            .filter((r: any) => r.competitorUrl === competitor.url);
                          
                          const avgPosition = competitorRankings.length
                            ? competitorRankings.reduce((acc: number, r: any) => 
                                acc + (r.position || 0), 0) / competitorRankings.length
                            : null;
                          
                          const top10Count = competitorRankings.filter(
                            (r: any) => (r.position || 101) <= 10
                          ).length;
                          
                          return (
                            <TableRow key={competitor.url}>
                              <TableCell className="font-medium">
                                <a 
                                  href={competitor.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center hover:underline"
                                >
                                  {competitor.url.replace(/^https?:\/\/(www\.)?/, '')}
                                  <ArrowUpRight className="h-3 w-3 ml-1" />
                                </a>
                              </TableCell>
                              <TableCell>
                                {avgPosition ? `#${avgPosition.toFixed(1)}` : "N/A"}
                              </TableCell>
                              <TableCell>
                                {top10Count} of {analysis.keywords.length}
                              </TableCell>
                              <TableCell>
                                {competitorRankings.filter(r => r.position).length} of {analysis.keywords.length}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No competitors data</h3>
                  <p className="text-gray-500 mt-2">
                    No competitor data was provided for this analysis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Trends</CardTitle>
              <CardDescription>
                Search volume trends for your tracked keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.keywords.some((k: any) => k.metrics?.trend?.length > 0) ? (
                <div className="space-y-8">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={Array.from({ length: 12 }, (_, i) => ({
                          month: i,
                          ...analysis.keywords.reduce((acc: any, keyword: any) => {
                            if (keyword.metrics?.trend && keyword.metrics.trend[i] !== undefined) {
                              acc[keyword.text] = keyword.metrics.trend[i];
                            }
                            return acc;
                          }, {})
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tickFormatter={(value) => {
                            const date = new Date();
                            date.setMonth(date.getMonth() - (11 - value));
                            return format(date, 'MMM');
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(label) => {
                            const date = new Date();
                            date.setMonth(date.getMonth() - (11 - Number(label)));
                            return format(date, 'MMMM yyyy');
                          }}
                        />
                        <Legend />
                        {analysis.keywords
                          .filter((k: any) => k.metrics?.trend?.length > 0)
                          .slice(0, 5) // Limit to 5 keywords for readability
                          .map((keyword: any, index: number) => (
                            <Line
                              key={keyword.id}
                              type="monotone"
                              dataKey={keyword.text}
                              stroke={`hsl(${index * 50}, 70%, 50%)`}
                              activeDot={{ r: 8 }}
                            />
                          ))}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Search Volume by Keyword</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Current Volume</TableHead>
                          <TableHead>Year Trend</TableHead>
                          <TableHead>Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.keywords
                          .filter((k: any) => k.metrics?.volume)
                          .sort((a: any, b: any) => 
                            (b.metrics?.volume || 0) - (a.metrics?.volume || 0)
                          )
                          .map((keyword: any) => {
                            const trend = keyword.metrics?.trend || [];
                            const startVolume = trend[0] || 0;
                            const endVolume = trend[trend.length - 1] || keyword.metrics?.volume || 0;
                            const change = startVolume > 0 
                              ? ((endVolume - startVolume) / startVolume) * 100 
                              : 0;
                              
                            return (
                              <TableRow key={keyword.id}>
                                <TableCell className="font-medium">{keyword.text}</TableCell>
                                <TableCell>{formatNumber(keyword.metrics?.volume || 0)}/mo</TableCell>
                                <TableCell>
                                  {trend.length > 0 ? (
                                    <div className="w-32 h-10">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trend.map((v: number, i: number) => ({ date: i, value: v }))}>
                                          <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={change >= 0 ? "#10b981" : "#ef4444"}
                                            fill={change >= 0 ? "#10b98180" : "#ef444480"}
                                          />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                    </div>
                                  ) : (
                                    "No data"
                                  )}
                                </TableCell>
                                <TableCell 
                                  className={
                                    change > 0 
                                      ? "text-green-600" 
                                      : change < 0 
                                        ? "text-red-600" 
                                        : ""
                                  }
                                >
                                  {change !== 0 ? (
                                    <>
                                      {change > 0 ? "+" : ""}
                                      {change.toFixed(1)}%
                                    </>
                                  ) : (
                                    "No change"
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No trend data available</h3>
                  <p className="text-gray-500 mt-2">
                    We don't have trend data for these keywords yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}