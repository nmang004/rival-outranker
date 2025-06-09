import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/hooks/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, BarChart, CheckCircle, DownloadIcon, FileJson, LineChart, RefreshCw, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Line,
  LineChart as RechartsLineChart,
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell
} from "recharts";
import { Helmet } from "react-helmet";
import { ChartExport } from "@/components/ui/chart-export";

// API usage interface
interface ApiUsage {
  id: number;
  userId?: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
  timestamp: string;
  apiProvider: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

// API usage stats interface
interface ApiUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  totalCost: number;
  costByProvider: Record<string, number>;
  byEndpoint: Record<string, number>;
  byMethod: Record<string, number>;
  byApiProvider: Record<string, number>;
  byStatusCode: Record<string, number>;
  timeSeriesData: {
    date: string;
    count: number;
    provider: string;
    cost?: number;
  }[];
}

// API request function
const apiRequest = async (url: string, options?: { method?: string; data?: any }) => {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {};
  }
  
  return response.json();
};

// Color palette for charts
const COLORS = [
  "#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", 
  "#1abc9c", "#d35400", "#34495e", "#16a085", "#c0392b"
];

// Transform data for charts
const transformDataForEndpointChart = (data: Record<string, number>) => {
  return Object.entries(data)
    .map(([name, value]) => ({ name: name.substring(0, 30), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

const transformDataForProviderChart = (data: Record<string, number>) => {
  return Object.entries(data)
    .map(([name, value]) => ({ name, value }));
};

const transformTimeSeriesData = (data: ApiUsageStats["timeSeriesData"]) => {
  // Group by date
  const groupedByDate: Record<string, Record<string, number>> = {};
  
  data.forEach(item => {
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = {};
    }
    groupedByDate[item.date][item.provider] = item.count;
  });
  
  // Convert to recharts format
  return Object.entries(groupedByDate).map(([date, providers]) => ({
    date,
    ...providers
  }));
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [loginRedirectRequired, setLoginRedirectRequired] = useState(false);
  
  // Chart refs for export functionality
  const usageChartRef = useRef<HTMLDivElement>(null);
  const providerChartRef = useRef<HTMLDivElement>(null);
  const costChartRef = useRef<HTMLDivElement>(null);
  const endpointChartRef = useRef<HTMLDivElement>(null);
  
  // Check for admin status
  const { data: adminStatus, isLoading: adminCheckLoading } = useQuery({
    queryKey: ['/api/admin/is-admin'],
    queryFn: async () => {
      try {
        if (!isAuthenticated) return { isAdmin: false };
        return await apiRequest('/api/admin/is-admin');
      } catch (error) {
        console.error("Error checking admin status:", error);
        return { isAdmin: false };
      }
    },
    enabled: isAuthenticated && !authLoading,
  });
  
  // Query for API usage stats with error handling
  const { 
    data: stats, 
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery<ApiUsageStats>({
    queryKey: ['/api/admin/dev/api-usage/stats', startDate, endDate],
    queryFn: async () => {
      try {
        // Use the development route that doesn't require authentication
        return await apiRequest(`/api/admin/dev/api-usage/stats?startDate=${startDate}&endDate=${endDate}`);
      } catch (error) {
        console.error("Error fetching stats:", error);
        throw error;
      }
    },
    retry: 1,
  });
  
  // Query for API usage records with error handling
  const { 
    data: records, 
    isLoading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords
  } = useQuery<ApiUsage[]>({
    queryKey: ['/api/admin/dev/api-usage/records', startDate, endDate, selectedProvider],
    queryFn: async () => {
      try {
        // Use the development route that doesn't require authentication
        let url = `/api/admin/dev/api-usage/records?startDate=${startDate}&endDate=${endDate}`;
        if (selectedProvider) {
          url += `&provider=${selectedProvider}`;
        }
        return await apiRequest(url);
      } catch (error) {
        console.error("Error fetching records:", error);
        throw error;
      }
    },
    enabled: activeTab === "records",
    retry: 1,
  });
  
  // Query for API errors with error handling
  const { 
    data: errors, 
    isLoading: errorsLoading,
    error: errorsError,
    refetch: refetchErrors
  } = useQuery<ApiUsage[]>({
    queryKey: ['/api/admin/dev/api-usage/errors'],
    queryFn: async () => {
      try {
        // Use the development route that doesn't require authentication
        return await apiRequest('/api/admin/dev/api-usage/errors');
      } catch (error) {
        console.error("Error fetching API errors:", error);
        throw error;
      }
    },
    enabled: activeTab === "errors",
    retry: 1,
  });
  
  // Handle date filter change
  const handleFilterChange = () => {
    refetchStats();
    refetchRecords();
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refetchStats();
    refetchRecords();
    refetchErrors();
    toast({
      title: "Refreshed",
      description: "API usage data has been refreshed.",
    });
  };
  
  // Export data as JSON
  const handleExport = () => {
    const dataToExport = activeTab === "overview" 
      ? stats 
      : activeTab === "records" 
        ? records 
        : errors;
    
    if (!dataToExport) return;
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `api-usage-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Use effect for handling authentication check
  useEffect(() => {
    if (authLoading || adminCheckLoading) return;

    // Check authentication status
    if (!isAuthenticated || !user) {
      setLoginRedirectRequired(true);
      toast({
        title: "Authentication required",
        description: "Please log in to access the admin dashboard.",
        variant: "destructive"
      });
    } else if (!adminStatus?.isAdmin) {
      // User is logged in but not an admin
      toast({
        title: "Admin Access Required",
        description: "You need admin privileges to access this dashboard.",
        variant: "destructive"
      });
      setLoginRedirectRequired(true);
    } else {
      setLoginRedirectRequired(false);
    }
  }, [isAuthenticated, user, authLoading, adminStatus, adminCheckLoading, toast]);

  // If loading, show a loading state
  if (authLoading || adminCheckLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }
  
  // If not authenticated, redirect or show access denied
  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-md mt-20">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You need to log in to access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please log in with an administrator account to view this page.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.href = '/api/login'}>Log In</Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Prepare data for charts
  const endpointData = stats ? transformDataForEndpointChart(stats.byEndpoint) : [];
  const providerData = stats ? transformDataForProviderChart(stats.byApiProvider) : [];
  const timeSeriesData = stats ? transformTimeSeriesData(stats.timeSeriesData) : [];
  
  return (
    <div className="container py-10">
      <Helmet>
        <title>Admin Dashboard - API Usage</title>
        <meta name="description" content="Monitor and analyze API usage across your application with detailed metrics and visualizations." />
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard: API Usage</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
        <div className="col-span-1">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mb-4"
          />
        </div>
        <div className="col-span-1">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mb-4"
          />
        </div>
        <div className="col-span-1">
          <Label htmlFor="provider">API Provider</Label>
          <Select 
            value={selectedProvider} 
            onValueChange={setSelectedProvider}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Providers</SelectItem>
              {stats && Object.keys(stats.byApiProvider).map(provider => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 flex items-end">
          <Button onClick={handleFilterChange} className="mb-4">Apply Filter</Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {statsLoading ? (
            <div className="flex justify-center items-center h-96">Loading stats...</div>
          ) : stats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total API Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.totalCalls.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats.totalCalls > 0 
                        ? ((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.successfulCalls.toLocaleString()} successful / {stats.failedCalls.toLocaleString()} failed
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Estimated Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${stats.totalCost.toFixed(4)}</div>
                    <div className="text-sm text-muted-foreground">
                      ${(stats.totalCost / stats.totalCalls).toFixed(6)} per call avg
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Avg Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.averageResponseTime} ms</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Time Series Chart */}
                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>API Calls Over Time</CardTitle>
                      <CardDescription>Daily API call volume by provider</CardDescription>
                    </div>
                    <ChartExport 
                      chartRef={usageChartRef}
                      filename="api-calls-over-time"
                      title="Export API Calls Chart"
                      size="sm"
                    />
                  </CardHeader>
                  <CardContent className="h-80" ref={usageChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {providerData.map((entry, index) => (
                          <Line 
                            key={entry.name}
                            type="monotone" 
                            dataKey={entry.name} 
                            stroke={COLORS[index % COLORS.length]} 
                            activeDot={{ r: 8 }} 
                          />
                        ))}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* API Provider Usage Chart */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>API Usage by Provider</CardTitle>
                      <CardDescription>Distribution of API calls across providers</CardDescription>
                    </div>
                    <ChartExport 
                      chartRef={providerChartRef}
                      filename="api-usage-by-provider"
                      title="Export Provider Usage Chart"
                      size="sm"
                    />
                  </CardHeader>
                  <CardContent className="h-80" ref={providerChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={providerData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {providerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* API Cost Chart */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>API Cost Distribution</CardTitle>
                      <CardDescription>Cost breakdown by provider (USD)</CardDescription>
                    </div>
                    <ChartExport 
                      chartRef={costChartRef}
                      filename="api-cost-distribution"
                      title="Export Cost Distribution Chart"
                      size="sm"
                    />
                  </CardHeader>
                  <CardContent className="h-80" ref={costChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.costByProvider || {}).map(([name, value]) => ({ 
                            name, 
                            value: parseFloat(value.toFixed(6))
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => 
                            `${name}: $${value} (${(percent * 100).toFixed(1)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(stats.costByProvider || {}).map((_, index) => (
                            <Cell 
                              key={`cost-cell-${index}`} 
                              fill={COLORS[(index + 3) % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Top Endpoints Chart */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Top 10 Endpoints</CardTitle>
                      <CardDescription>Most frequently called API endpoints</CardDescription>
                    </div>
                    <ChartExport 
                      chartRef={endpointChartRef}
                      filename="top-endpoints"
                      title="Export Endpoints Chart"
                      size="sm"
                    />
                  </CardHeader>
                  <CardContent className="h-80" ref={endpointChartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={endpointData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3498db" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              {/* Status Code and Method Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>HTTP Status Codes</CardTitle>
                    <CardDescription>Distribution of response status codes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status Code</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(stats.byStatusCode)
                          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                          .map(([code, count]) => (
                            <TableRow key={code}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {code.startsWith('2') && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {code.startsWith('4') && <AlertCircle className="h-4 w-4 text-amber-500" />}
                                  {code.startsWith('5') && <XCircle className="h-4 w-4 text-red-500" />}
                                  {code}
                                </div>
                              </TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>
                                {((count / stats.totalCalls) * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>HTTP Methods</CardTitle>
                    <CardDescription>API calls by HTTP method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(stats.byMethod)
                          .sort((a, b) => b[1] - a[1])
                          .map(([method, count]) => (
                            <TableRow key={method}>
                              <TableCell>
                                <span className={`font-mono ${
                                  method === 'GET' ? 'text-blue-500' :
                                  method === 'POST' ? 'text-green-500' :
                                  method === 'PUT' ? 'text-amber-500' :
                                  method === 'DELETE' ? 'text-red-500' : ''
                                }`}>
                                  {method}
                                </span>
                              </TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>
                                {((count / stats.totalCalls) * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Data Available</CardTitle>
                <CardDescription>There is no API usage data for the selected date range.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Try selecting a different date range or ensure API tracking is properly set up.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Records Tab */}
        <TabsContent value="records">
          {recordsLoading ? (
            <div className="flex justify-center items-center h-96">Loading records...</div>
          ) : records && records.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>API Call Records</CardTitle>
                <CardDescription>
                  Detailed records of API calls {selectedProvider && `for ${selectedProvider}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Response Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={record.endpoint}>
                            {record.endpoint}
                          </TableCell>
                          <TableCell>
                            <span className={`font-mono ${
                              record.method === 'GET' ? 'text-blue-500' :
                              record.method === 'POST' ? 'text-green-500' :
                              record.method === 'PUT' ? 'text-amber-500' :
                              record.method === 'DELETE' ? 'text-red-500' : ''
                            }`}>
                              {record.method}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {record.statusCode && record.statusCode >= 200 && record.statusCode < 300 && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {record.statusCode && record.statusCode >= 400 && record.statusCode < 500 && (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                              {record.statusCode && record.statusCode >= 500 && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {record.statusCode || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>{record.apiProvider}</TableCell>
                          <TableCell>
                            {record.responseTime ? `${record.responseTime} ms` : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Records Available</CardTitle>
                <CardDescription>There are no API records for the selected filters.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Try selecting a different date range or API provider.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Errors Tab */}
        <TabsContent value="errors">
          {errorsLoading ? (
            <div className="flex justify-center items-center h-96">Loading errors...</div>
          ) : errors && errors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>API Errors</CardTitle>
                <CardDescription>Recent API calls that resulted in errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Error Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error) => (
                        <TableRow key={error.id}>
                          <TableCell>
                            {new Date(error.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={error.endpoint}>
                            {error.endpoint}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                              {error.statusCode && error.statusCode >= 500 && (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              {error.statusCode || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>{error.apiProvider}</TableCell>
                          <TableCell className="max-w-md truncate" title={error.errorMessage}>
                            {error.errorMessage || 'No error message'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Errors</CardTitle>
                <CardDescription>No API errors have been recorded.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is good news! Your APIs are working correctly.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}