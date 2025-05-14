import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { PageHeader } from '@/components/PageHeader';
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PaperclipIcon, CopyIcon, TrendingUpIcon, SearchIcon, SaveIcon, ChevronDown, ChevronUp, DownloadIcon, ArrowRightIcon, InfoIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface KeywordData {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: string;
  competition?: number;
  trend?: number[];
  relatedKeywords?: RelatedKeyword[];
}

interface RelatedKeyword {
  id?: number;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: string;
  relevance?: number;
}

export default function KeywordResearch() {
  const { user, isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [keywordData, setKeywordData] = useState<KeywordData | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({ key: 'relevance', direction: 'descending' });

  // Helper function to format numbers with K/M suffixes
  const formatNumber = (num?: number): string => {
    if (num === undefined) return "N/A";
    
    // Format large numbers with K/M suffixes
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

  // Helper function to get color based on keyword difficulty
  const getDifficultyColor = (difficulty?: number): string => {
    if (difficulty === undefined) return "text-gray-400";
    if (difficulty < 30) return "text-green-600";
    if (difficulty < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getDifficultyText = (difficulty?: number): string => {
    if (difficulty === undefined) return "Unknown";
    if (difficulty < 30) return "Easy";
    if (difficulty < 60) return "Moderate";
    return "Difficult";
  };

  // Sort related keywords based on the sort configuration
  const sortedRelatedKeywords = [...relatedKeywords].sort((a, b) => {
    const sortKey = sortConfig.key as keyof RelatedKeyword;
    
    if (sortKey === 'keyword') {
      // String comparison for keyword
      const aValue = String(a[sortKey] || '');
      const bValue = String(b[sortKey] || '');
      
      return sortConfig.direction === 'ascending'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      // Numeric comparison for other fields
      const aValue = Number(a[sortKey] || 0);
      const bValue = Number(b[sortKey] || 0);
      
      return sortConfig.direction === 'ascending'
        ? aValue - bValue
        : bValue - aValue;
    }
  });

  // Handle sort by column
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator for a column
  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="ml-1 inline-block h-4 w-4" /> : <ChevronDown className="ml-1 inline-block h-4 w-4" />;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    
    setIsLoading(true);
    setKeywordData(null);
    setRelatedKeywords([]);
    
    try {
      // Get keyword data from API
      const keywordResponse = await apiRequest('/api/keyword-research', {
        method: 'POST',
        data: { keyword: keyword.trim() }
      });
      
      setKeywordData(keywordResponse);
      
      // Get related keywords from API
      const relatedResponse = await apiRequest('/api/keyword-suggestions', {
        method: 'POST',
        data: { keyword: keyword.trim() }
      });
      
      setRelatedKeywords(relatedResponse || []);
      setActiveTab('overview');
    } catch (error) {
      console.error("Error fetching keyword data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mini trend chart component
  const TrendChart = ({ data }: { data?: number[] }) => {
    if (!data || data.length === 0) {
      return <div className="h-8 w-32 bg-gray-100 rounded"></div>;
    }
    
    const max = Math.max(...data);
    
    return (
      <div className="flex items-end h-8 w-32 gap-1">
        {data.map((value, index) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div 
              key={index}
              className="bg-blue-500 rounded-sm w-2"
              style={{ height: `${Math.max(10, height)}%` }}
            ></div>
          );
        })}
      </div>
    );
  };

  // Generate CSV export of related keywords
  const exportToCsv = () => {
    if (!relatedKeywords.length) return;
    
    const headers = ['Keyword', 'Search Volume', 'Difficulty', 'CPC', 'Relevance'];
    const rows = relatedKeywords.map(kw => [
      kw.keyword,
      kw.searchVolume || 'N/A',
      kw.difficulty || 'N/A',
      kw.cpc || 'N/A',
      kw.relevance || 'N/A'
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `keywords-${keyword.replace(/\s+/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Keyword Research Tool"
        description="Analyze keywords and discover new opportunities with real search data"
        icon={<SearchIcon className="h-6 w-6" />}
      />
      
      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter a keyword to research..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !keyword.trim()}>
          {isLoading ? 'Researching...' : 'Research Keyword'}
        </Button>
      </form>
      
      {isLoading && (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[100px] rounded-xl" />
            <Skeleton className="h-[100px] rounded-xl" />
            <Skeleton className="h-[100px] rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      )}
      
      {!isLoading && keywordData && (
        <div className="mt-8">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="related" disabled={!relatedKeywords.length}>
                Related Keywords {relatedKeywords.length > 0 && `(${relatedKeywords.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-800">
                    {keywordData.keyword}
                  </CardTitle>
                  <CardDescription>
                    Keyword metrics and search insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <div className="text-sm font-medium text-gray-500 mb-1">Search Volume</div>
                      <div className="text-3xl font-bold text-blue-700">
                        {keywordData.searchVolume === 0 ? (
                          <span className="text-amber-500">N/A</span>
                        ) : (
                          formatNumber(keywordData.searchVolume)
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Average monthly searches
                        {keywordData.searchVolume === 0 && (
                          <div className="text-xs text-amber-500 font-medium mt-1">
                            No data available from API
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <div className="text-sm font-medium text-gray-500 mb-1">Keyword Difficulty</div>
                      <div className="flex items-center">
                        <div className={`text-3xl font-bold ${getDifficultyColor(keywordData.difficulty)}`}>
                          {keywordData.difficulty || 'N/A'}
                        </div>
                        <Badge className={`ml-2 ${
                          keywordData.difficulty && keywordData.difficulty < 30 ? 'bg-green-100 text-green-800' :
                          keywordData.difficulty && keywordData.difficulty < 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getDifficultyText(keywordData.difficulty)}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <Progress 
                          value={keywordData.difficulty || 0} 
                          className={`h-1.5 ${
                            keywordData.difficulty && keywordData.difficulty < 30 ? 'bg-green-100' :
                            keywordData.difficulty && keywordData.difficulty < 60 ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">0-100 scale (lower is easier to rank)</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <div className="text-sm font-medium text-gray-500 mb-1">Cost Per Click</div>
                      <div className="text-3xl font-bold text-green-700">
                        {keywordData.cpc || '$0.00'}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">Average cost per click in Google Ads</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-md font-medium mb-2">Search Trend</h3>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 h-80 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-700">Monthly Search Volume Trends</div>
                        {keywordData.trend && keywordData.trend.length > 0 && (
                          <div className="flex items-center">
                            <span className="text-xs text-gray-600 mr-1">Highest volume:</span>
                            <span className="text-xs font-semibold text-blue-700">{Math.max(...keywordData.trend)}</span>
                          </div>
                        )}
                      </div>
                      
                      {keywordData.trend && keywordData.trend.length > 0 ? (
                        <div className="w-full h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={keywordData.trend.map((value, index) => {
                                // Calculate month names for the last 12 months
                                const date = new Date();
                                date.setMonth(date.getMonth() - (keywordData.trend!.length - 1 - index));
                                return {
                                  month: date.toLocaleString('default', { month: 'short' }),
                                  fullMonth: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
                                  value: value
                                };
                              })}
                              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                            >
                              <defs>
                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                              <XAxis 
                                dataKey="month" 
                                tickLine={false}
                                axisLine={{ stroke: '#E5E7EB' }}
                                tick={{ fontSize: 11, fill: '#6B7280' }}
                              />
                              <YAxis 
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: '#6B7280' }}
                                tickFormatter={(value) => value}
                              />
                              <RechartsTooltip 
                                labelFormatter={(label, payload) => {
                                  if (payload && payload.length > 0) {
                                    return payload[0].payload.fullMonth;
                                  }
                                  return label;
                                }}
                                formatter={(value) => [`${value} searches`, 'Volume']}
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '6px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3b82f6" 
                                strokeWidth={2.5}
                                fillOpacity={1} 
                                fill="url(#colorTrend)" 
                                activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                              />
                              <Legend 
                                verticalAlign="top" 
                                height={36}
                                formatter={() => `Search volume for "${keywordData.keyword}"`}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                          <div className="text-xs text-center text-gray-500 mt-1">Monthly search volume (past 12 months)</div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                          <div className="text-center">
                            <svg className="h-8 w-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div>No trend data available</div>
                            <p className="text-xs mt-1">Try another keyword to see search trends</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-gray-500">
                    <InfoIcon className="inline-block mr-1 h-4 w-4" /> 
                    Data sourced from Google Keyword Planner via DataForSEO API
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('related')}
                    disabled={!relatedKeywords.length}
                  >
                    <ArrowRightIcon className="mr-1 h-4 w-4" /> View Related Keywords
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="related" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Related Keywords</CardTitle>
                      <CardDescription>
                        Discover additional keywords related to "{keywordData.keyword}"
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportToCsv}
                      disabled={!relatedKeywords.length}
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" /> Export to CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => requestSort('keyword')}
                          >
                            Keyword
                            {getSortIndicator('keyword')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => requestSort('searchVolume')}
                          >
                            Search Volume
                            {getSortIndicator('searchVolume')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => requestSort('difficulty')}
                          >
                            Difficulty
                            {getSortIndicator('difficulty')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => requestSort('cpc')}
                          >
                            CPC
                            {getSortIndicator('cpc')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => requestSort('relevance')}
                          >
                            Relevance
                            {getSortIndicator('relevance')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRelatedKeywords.length > 0 ? (
                          sortedRelatedKeywords.map((kw, index) => (
                            <TableRow key={kw.id || index}>
                              <TableCell className="font-medium">{kw.keyword}</TableCell>
                              <TableCell>{formatNumber(kw.searchVolume)}</TableCell>
                              <TableCell>
                                <span className={getDifficultyColor(kw.difficulty)}>
                                  {kw.difficulty || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>{kw.cpc || 'N/A'}</TableCell>
                              <TableCell>
                                {kw.relevance ? (
                                  <Progress 
                                    value={kw.relevance} 
                                    className="h-2 w-24 bg-gray-100"
                                  />
                                ) : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                              No related keywords found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {!isLoading && !keywordData && (
        <div className="mt-12 text-center">
          <div className="inline-flex rounded-full bg-blue-100 p-6">
            <SearchIcon className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Enter a keyword to get started</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Research any keyword to get detailed metrics including search volume, 
            difficulty, CPC, and related terms.
          </p>
        </div>
      )}
    </div>
  );
}