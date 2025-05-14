import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  RefreshCw,
  BarChart,
  LineChart,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Minus,
  AlertCircle,
  Download,
  ExternalLink,
} from "lucide-react";

// Import recharts components for beautiful graphs
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function RivalRankTrackerResultsPage() {
  const { id } = useParams();
  const keywordId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [checkingRanking, setCheckingRanking] = useState(false);
  const [updatingMetrics, setUpdatingMetrics] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/api/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch keyword data
  const { data: keyword, isLoading: keywordLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

  // Fetch keyword metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}/metrics`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

  // Fetch ranking history
  const { data: rankings, isLoading: rankingsLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}/rankings`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

  // Fetch competitor rankings
  const { data: competitors, isLoading: competitorsLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}/competitors`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

  // Function to check keyword ranking
  const checkRanking = async () => {
    try {
      setCheckingRanking(true);
      const response = await fetch(`/api/keywords/${keywordId}/check-ranking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check keyword ranking");
      }

      const data = await response.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}/rankings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}/competitors`] });
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}/metrics`] });
      
      toast({
        title: "Ranking Checked",
        description: data.rank 
          ? `Current ranking position: ${data.rank}` 
          : "Not found in top search results",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check keyword ranking",
        variant: "destructive",
      });
    } finally {
      setCheckingRanking(false);
    }
  };

  // Function to update keyword metrics
  const updateMetrics = async () => {
    try {
      setUpdatingMetrics(true);
      const response = await fetch(`/api/keywords/${keywordId}/update-metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update keyword metrics");
      }

      // Invalidate metrics query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}/metrics`] });
      
      toast({
        title: "Metrics Updated",
        description: "Keyword metrics have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update metrics",
        variant: "destructive",
      });
    } finally {
      setUpdatingMetrics(false);
    }
  };

  // Generate chart data for ranking history
  const getRankingChartData = () => {
    if (!rankings || rankings.length === 0) return [];
    
    return rankings.map(rank => ({
      date: new Date(rank.rankDate).toLocaleDateString(),
      position: rank.rank,
      url: rank.rankingUrl,
    })).reverse();
  };

  // Generate chart data for competitor comparison
  const getCompetitorChartData = () => {
    if (!competitors || competitors.length === 0) return [];

    // Group by URL and get latest ranking for each
    const latestByUrl = {};
    competitors.forEach(comp => {
      const hostname = new URL(comp.competitorUrl).hostname;
      if (!latestByUrl[hostname] || new Date(comp.rankDate) > new Date(latestByUrl[hostname].rankDate)) {
        latestByUrl[hostname] = comp;
      }
    });

    return Object.values(latestByUrl).map(comp => ({
      name: new URL(comp.competitorUrl).hostname,
      position: comp.rank,
    }));
  };

  // Loading state
  if (authLoading || keywordLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/rival-rank-tracker")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rank Tracker
        </Button>
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-slate-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-64 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
          <div className="h-80 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!keyword) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/rival-rank-tracker")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rank Tracker
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Keyword Not Found</CardTitle>
            <CardDescription>
              The keyword you're looking for does not exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="h-16 w-16 text-orange-500" />
              <p className="text-lg text-center">
                We couldn't find this keyword in our database.
              </p>
              <Button onClick={() => navigate("/rival-rank-tracker")}>
                Track a New Keyword
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rankingChartData = getRankingChartData();
  const competitorChartData = getCompetitorChartData();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate("/rival-rank-tracker")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Rank Tracker
      </Button>

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {keyword.keyword}
        </h1>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center">
          <span className="text-gray-500 font-mono text-sm mr-4">
            {keyword.targetUrl}
          </span>
          <a 
            href={keyword.targetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 sm:mt-0 text-primary hover:text-primary/80 text-sm inline-flex items-center"
          >
            Visit <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkRanking}
          disabled={checkingRanking}
        >
          {checkingRanking ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Check Ranking
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={updateMetrics}
          disabled={updatingMetrics}
        >
          {updatingMetrics ? (
            <BarChart className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <BarChart className="h-4 w-4 mr-2" />
          )}
          Update Metrics
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-blue-50 mr-4">
                <LineChart className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Rank</p>
                <h3 className="text-2xl font-bold">{keyword.latestRanking?.rank || "Not Ranked"}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-green-50 mr-4">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Search Volume</p>
                <h3 className="text-2xl font-bold">{metrics?.searchVolume?.toLocaleString() || "-"}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-purple-50 mr-4">
                <BarChart className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Keyword Difficulty</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold mr-2">{metrics?.keywordDifficulty || "-"}</h3>
                  {metrics?.keywordDifficulty && (
                    <KeywordDifficultyBadge difficulty={metrics.keywordDifficulty} />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-amber-50 mr-4">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <h3 className="text-lg font-bold">
                  {keyword.latestRanking 
                    ? new Date(keyword.latestRanking.rankDate).toLocaleDateString() 
                    : "Never"}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area with Tabs */}
      <Tabs defaultValue="overview" className="w-full mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle>Ranking Progress</CardTitle>
                <CardDescription>How your keyword position has changed over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {rankingsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : rankingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={rankingChartData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis reversed domain={[1, 'dataMax']} />
                      <Tooltip 
                        formatter={(value) => [`Position: ${value}`, 'Ranking']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <defs>
                        <linearGradient id="colorRank" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="position" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorRank)"
                        name="Ranking"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <LineChart className="h-12 w-12 mb-2 text-slate-300" />
                    <p>No ranking data available yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={checkRanking}
                      disabled={checkingRanking}
                    >
                      Check Ranking Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle>Competitors</CardTitle>
                <CardDescription>Top competitors for this keyword</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {competitorsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : competitorChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={competitorChartData}
                      margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[1, 'dataMax']} />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [`Position: ${value}`, 'Ranking']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="position" 
                        name="Ranking Position" 
                        fill="#8884d8"
                        radius={[0, 4, 4, 0]}
                      />
                    </ReBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <Users className="h-12 w-12 mb-2 text-slate-300" />
                    <p>No competitor data available yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={checkRanking}
                      disabled={checkingRanking}
                    >
                      Check Competitors Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {metrics && (
            <Card className="mt-6 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle>Keyword Insights</CardTitle>
                <CardDescription>Key metrics and insights about this keyword</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500">Search Volume</h4>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-2">
                        {metrics.searchVolume?.toLocaleString() || "-"}
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        US
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Monthly searches in the United States
                    </p>
                    
                    <h4 className="text-sm font-medium text-gray-500 mt-6">Global Volume</h4>
                    <div className="text-2xl font-bold">
                      {metrics.globalSearchVolume?.toLocaleString() || "-"}
                    </div>
                    <p className="text-sm text-gray-500">
                      Estimated monthly searches globally
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500">Competition Level</h4>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-2">
                        {metrics.competition 
                          ? (metrics.competition * 100).toFixed(0) + "%" 
                          : "-"}
                      </div>
                      <CompetitionLevelBadge level={metrics.competition} />
                    </div>
                    <p className="text-sm text-gray-500">
                      How competitive this keyword is
                    </p>
                    
                    {metrics.cpc && (
                      <>
                        <h4 className="text-sm font-medium text-gray-500 mt-6">CPC (Cost Per Click)</h4>
                        <div className="text-2xl font-bold">
                          ${metrics.cpc.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-500">
                          Average cost per click for ads
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500">Keyword Difficulty</h4>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-2">
                        {metrics.keywordDifficulty || "-"}
                      </div>
                      <KeywordDifficultyBadge difficulty={metrics.keywordDifficulty} />
                    </div>
                    <p className="text-sm text-gray-500">
                      How hard it is to rank for this term
                    </p>
                    
                    <KeywordDifficultyMeter difficulty={metrics.keywordDifficulty} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="mt-6">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Ranking History</CardTitle>
              <CardDescription>Historical rankings for this keyword</CardDescription>
            </CardHeader>
            <CardContent>
              {rankingsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : rankings && rankings.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankings.map((ranking) => (
                        <TableRow key={ranking.id}>
                          <TableCell className="font-medium">
                            {new Date(ranking.rankDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{ranking.rank || "-"}</TableCell>
                          <TableCell>
                            {ranking.previousRank ? (
                              <RankChange current={ranking.rank} previous={ranking.previousRank} />
                            ) : (
                              <Badge variant="outline">New</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs">
                            {ranking.rankingUrl ? (
                              <a 
                                href={ranking.rankingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center"
                              >
                                {new URL(ranking.rankingUrl).hostname}
                                <ExternalLink className="h-3 w-3 ml-1 inline" />
                              </a>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <LineChart className="h-12 w-12 mb-2 text-slate-300" />
                  <p className="mb-4">No ranking history available for this keyword</p>
                  <Button 
                    variant="outline" 
                    onClick={checkRanking}
                    disabled={checkingRanking}
                  >
                    {checkingRanking ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Check Ranking Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="mt-6">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Competitor Rankings</CardTitle>
              <CardDescription>How your competitors rank for this keyword</CardDescription>
            </CardHeader>
            <CardContent>
              {competitorsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : competitors && competitors.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competitor</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Last Checked</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitors.map((competitor) => (
                        <TableRow key={competitor.id}>
                          <TableCell className="font-medium">
                            {new URL(competitor.competitorUrl).hostname}
                          </TableCell>
                          <TableCell>{competitor.rank}</TableCell>
                          <TableCell>{new Date(competitor.rankDate).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs">
                            <a 
                              href={competitor.competitorUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center"
                            >
                              {competitor.competitorUrl}
                              <ExternalLink className="h-3 w-3 ml-1 inline" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Users className="h-12 w-12 mb-2 text-slate-300" />
                  <p className="mb-4">No competitor data available for this keyword</p>
                  <Button 
                    variant="outline" 
                    onClick={checkRanking}
                    disabled={checkingRanking}
                  >
                    {checkingRanking ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Check Competitors Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Keyword Metrics</CardTitle>
              <CardDescription>Detailed metrics for this keyword</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : metrics ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Search Trends</h3>
                      {metrics.trendsData ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ReLineChart
                              data={metrics.trendsData.months.map((month, index) => ({
                                month,
                                volume: metrics.trendsData.values[index]
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`${value.toLocaleString()}`, 'Search Volume']} />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="volume" 
                                stroke="#8884d8" 
                                activeDot={{ r: 8 }}
                                name="Search Volume"
                              />
                            </ReLineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-slate-500">
                          No trend data available
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Related Keywords</h3>
                      {metrics.relatedKeywords && metrics.relatedKeywords.length > 0 ? (
                        <div className="rounded-md border p-4 h-[300px] overflow-y-auto">
                          <div className="flex flex-wrap gap-2">
                            {metrics.relatedKeywords.map((keyword, index) => (
                              <div key={index} className="flex items-center">
                                <Badge 
                                  variant="outline" 
                                  className="px-3 py-1 text-sm mb-2"
                                >
                                  {keyword.keyword}
                                  <span className="ml-2 text-xs opacity-60">
                                    {keyword.source === 'related' ? 'related' : 'question'}
                                  </span>
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-slate-500 border rounded-md h-[300px]">
                          No related keywords available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Additional Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-white shadow-sm">
                        <CardContent className="pt-6">
                          <div className="text-sm text-gray-500">Search Volume</div>
                          <div className="text-2xl font-bold">{metrics.searchVolume?.toLocaleString() || "-"}</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white shadow-sm">
                        <CardContent className="pt-6">
                          <div className="text-sm text-gray-500">Global Volume</div>
                          <div className="text-2xl font-bold">{metrics.globalSearchVolume?.toLocaleString() || "-"}</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white shadow-sm">
                        <CardContent className="pt-6">
                          <div className="text-sm text-gray-500">Difficulty</div>
                          <div className="flex items-center">
                            <div className="text-2xl font-bold mr-2">{metrics.keywordDifficulty || "-"}</div>
                            {metrics.keywordDifficulty && (
                              <KeywordDifficultyBadge difficulty={metrics.keywordDifficulty} small />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white shadow-sm">
                        <CardContent className="pt-6">
                          <div className="text-sm text-gray-500">CPC</div>
                          <div className="text-2xl font-bold">${metrics.cpc?.toFixed(2) || "-"}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <BarChart className="h-12 w-12 mb-2 text-slate-300" />
                  <p className="mb-4">No metrics available for this keyword</p>
                  <Button 
                    variant="outline" 
                    onClick={updateMetrics}
                    disabled={updatingMetrics}
                  >
                    {updatingMetrics ? (
                      <BarChart className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <BarChart className="h-4 w-4 mr-2" />
                    )}
                    Generate Metrics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for showing rank changes
function RankChange({ current, previous }: { current: number; previous: number }) {
  const diff = previous - current;
  
  if (diff > 0) {
    return (
      <div className="flex items-center text-green-600">
        <ChevronUp className="h-4 w-4 mr-1" />
        <span>+{diff}</span>
      </div>
    );
  } else if (diff < 0) {
    return (
      <div className="flex items-center text-red-600">
        <ChevronDown className="h-4 w-4 mr-1" />
        <span>{diff}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-gray-600">
        <Minus className="h-4 w-4 mr-1" />
        <span>0</span>
      </div>
    );
  }
}

// Helper component for difficulty badge
function KeywordDifficultyBadge({ difficulty, small = false }: { difficulty: number; small?: boolean }) {
  let color = "bg-green-100 text-green-800";
  let label = "Easy";
  
  if (difficulty >= 80) {
    color = "bg-red-100 text-red-800";
    label = "Very Hard";
  } else if (difficulty >= 60) {
    color = "bg-orange-100 text-orange-800";
    label = "Hard";
  } else if (difficulty >= 40) {
    color = "bg-yellow-100 text-yellow-800";
    label = "Medium";
  } else if (difficulty >= 20) {
    color = "bg-blue-100 text-blue-800";
    label = "Moderate";
  }
  
  return (
    <span className={`inline-flex items-center ${small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm'} font-medium rounded-full ${color}`}>
      {label}
    </span>
  );
}

// Helper component for competition level badge
function CompetitionLevelBadge({ level }: { level: number }) {
  let color = "bg-green-100 text-green-800";
  let label = "Low";
  
  if (level >= 0.8) {
    color = "bg-red-100 text-red-800";
    label = "Very High";
  } else if (level >= 0.6) {
    color = "bg-orange-100 text-orange-800";
    label = "High";
  } else if (level >= 0.4) {
    color = "bg-yellow-100 text-yellow-800";
    label = "Medium";
  } else if (level >= 0.2) {
    color = "bg-blue-100 text-blue-800";
    label = "Moderate";
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-sm font-medium rounded-full ${color}`}>
      {label}
    </span>
  );
}

// Helper component for keyword difficulty meter
function KeywordDifficultyMeter({ difficulty }: { difficulty: number }) {
  if (!difficulty) return null;
  
  const COLORS = ["#4ade80", "#22d3ee", "#60a5fa", "#f97316", "#ef4444"];
  const getColor = (value: number) => {
    if (value < 20) return COLORS[0];
    if (value < 40) return COLORS[1];
    if (value < 60) return COLORS[2];
    if (value < 80) return COLORS[3];
    return COLORS[4];
  };
  
  return (
    <div className="mt-4">
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div 
          className="h-2.5 rounded-full transition-all duration-500" 
          style={{ 
            width: `${difficulty}%`,
            backgroundColor: getColor(difficulty)
          }} 
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Easy</span>
        <span>Medium</span>
        <span>Hard</span>
      </div>
    </div>
  );
}