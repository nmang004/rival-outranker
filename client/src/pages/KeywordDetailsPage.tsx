import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, useParams } from "wouter";
import { 
  RefreshCw, 
  ArrowLeft, 
  ChevronUp, 
  ChevronDown, 
  Minus, 
  BarChart, 
  Users, 
  CalendarDays,
  TrendingUp,
  Lightbulb
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function KeywordDetailsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [checkingRanking, setCheckingRanking] = useState(false);
  const [, navigate] = useLocation();
  const { id } = useParams();
  const keywordId = parseInt(id);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/api/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: keyword, isLoading: keywordLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

  const { data: rankings, isLoading: rankingsLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}/rankings`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}/metrics`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

  const { data: competitors, isLoading: competitorsLoading } = useQuery({
    queryKey: [`/api/keywords/${keywordId}/competitors`],
    enabled: isAuthenticated && !isNaN(keywordId),
  });

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
      
      // Invalidate rankings data to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}/rankings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/keywords/${keywordId}/competitors`] });
      
      toast({
        title: "Ranking Checked",
        description: data.rank 
          ? `Current ranking position: ${data.rank}` 
          : "Not found in top search results",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check keyword ranking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingRanking(false);
    }
  };

  if (authLoading || keywordLoading) {
    return (
      <div className="container py-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/keywords")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Keywords
        </Button>
        <KeywordDetailsSkeleton />
      </div>
    );
  }

  if (!keyword) {
    return (
      <div className="container py-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/keywords")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Keywords
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Keyword Not Found</CardTitle>
            <CardDescription>
              The keyword you're looking for does not exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/keywords")}>
              View All Keywords
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate("/keywords")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Keywords
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{keyword.keyword}</CardTitle>
              <CardDescription className="mt-1">
                <span className="font-mono">{keyword.targetUrl}</span>
              </CardDescription>
            </div>
            <Button
              onClick={checkRanking}
              disabled={checkingRanking}
            >
              {checkingRanking ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Ranking
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 mb-1 flex items-center">
                  <BarChart className="h-4 w-4 mr-1" />
                  Current Rank
                </div>
                <div className="text-3xl font-bold">
                  {keyword.latestRanking?.rank || "-"}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 mb-1 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Ranking Change
                </div>
                <div className="text-3xl font-bold">
                  {keyword.latestRanking && keyword.latestRanking.previousRank ? (
                    <RankChange 
                      current={keyword.latestRanking.rank} 
                      previous={keyword.latestRanking.previousRank} 
                    />
                  ) : (
                    "-"
                  )}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 mb-1 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Search Volume
                </div>
                <div className="text-3xl font-bold">
                  {metrics?.searchVolume ? metrics.searchVolume.toLocaleString() : "-"}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 mb-1 flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Last Checked
                </div>
                <div className="text-lg font-semibold">
                  {keyword.latestRanking 
                    ? new Date(keyword.latestRanking.rankDate).toLocaleDateString() 
                    : "Never"
                  }
                </div>
              </div>
            </div>
            {keyword.notes && (
              <div className="mt-4 bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 mb-1 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Notes
                </div>
                <div className="text-sm">{keyword.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keyword Metrics</CardTitle>
            <CardDescription>
              Performance metrics for this keyword
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : metrics ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Search Volume</div>
                  <div className="text-lg font-semibold">{metrics.searchVolume?.toLocaleString() || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Global Search Volume</div>
                  <div className="text-lg font-semibold">{metrics.globalSearchVolume?.toLocaleString() || "Unknown"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Keyword Difficulty</div>
                  <div className="flex items-center">
                    <div className="text-lg font-semibold mr-2">
                      {metrics.keywordDifficulty || "Unknown"}
                    </div>
                    {metrics.keywordDifficulty && (
                      <KeywordDifficultyBadge difficulty={metrics.keywordDifficulty} />
                    )}
                  </div>
                </div>
                {metrics.cpc && (
                  <div>
                    <div className="text-sm text-slate-500 mb-1">CPC</div>
                    <div className="text-lg font-semibold">${metrics.cpc.toFixed(2)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500">
                No metrics available for this keyword
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history">Ranking History</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Ranking History</CardTitle>
              <CardDescription>
                Track how your keyword ranking has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rankingsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : rankings && rankings.length > 0 ? (
                <Table>
                  <TableCaption>Ranking history for {keyword.keyword}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Previous Rank</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((ranking: any) => (
                      <TableRow key={ranking.id}>
                        <TableCell>{new Date(ranking.rankDate).toLocaleDateString()}</TableCell>
                        <TableCell>{ranking.rank || "-"}</TableCell>
                        <TableCell>{ranking.previousRank || "-"}</TableCell>
                        <TableCell>
                          {ranking.rank && ranking.previousRank ? (
                            <RankChange 
                              current={ranking.rank} 
                              previous={ranking.previousRank} 
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {ranking.rankingUrl ? new URL(ranking.rankingUrl).hostname : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No ranking history available for this keyword
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Rankings</CardTitle>
              <CardDescription>
                See how you compare to your competitors for this keyword
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competitorsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : competitors && competitors.length > 0 ? (
                <Table>
                  <TableCaption>Competitor rankings for {keyword.keyword}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competitor</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Last Checked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((competitor: any) => (
                      <TableRow key={competitor.id}>
                        <TableCell className="font-mono text-xs">
                          {new URL(competitor.competitorUrl).hostname}
                        </TableCell>
                        <TableCell>{competitor.rank}</TableCell>
                        <TableCell>{new Date(competitor.rankDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No competitor data available for this keyword
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

function KeywordDifficultyBadge({ difficulty }: { difficulty: number }) {
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
  }
  
  return (
    <Badge variant="outline" className={`${color}`}>
      {label}
    </Badge>
  );
}

function KeywordDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}