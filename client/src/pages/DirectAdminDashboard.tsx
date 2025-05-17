import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Bar chart component
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Sample data transformation functions
const transformDataForEndpointChart = (endpointData: Record<string, number>) => {
  return Object.entries(endpointData || {}).map(([name, value]) => ({
    name: name.replace('/api/', ''),
    value
  })).sort((a, b) => b.value - a.value);
};

const transformDataForProviderChart = (providerData: Record<string, number>) => {
  return Object.entries(providerData || {}).map(([name, value]) => ({
    name,
    value
  }));
};

const transformTimeSeriesData = (timeSeriesData: any[]) => {
  // Group data by date
  const groupedByDate = timeSeriesData.reduce((acc, item) => {
    const { date, provider, count, cost } = item;
    if (!acc[date]) {
      acc[date] = {};
    }
    acc[date][`${provider}_count`] = count;
    acc[date][`${provider}_cost`] = cost;
    return acc;
  }, {});

  // Convert to array format for Recharts
  return Object.entries(groupedByDate).map(([date, data]) => ({
    date,
    ...data as Record<string, number>
  }));
};

// COLORS for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatusCodeColors = {
  '200': '#4CAF50', // Success - Green
  '400': '#FF9800', // Client Error - Orange
  '401': '#FF5722', // Auth Error - Deep Orange
  '404': '#FFC107', // Not Found - Amber
  '429': '#F44336', // Rate Limit - Red
  '500': '#9C27B0'  // Server Error - Purple
};

// Function to get providers list from stats
const getProviders = (stats: any) => {
  if (!stats || !stats.byApiProvider) return [];
  return Object.keys(stats.byApiProvider);
};

export default function DirectAdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  
  // Query for API usage stats with error handling
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['/api/direct-admin/api-usage/stats', startDate, endDate],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/direct-admin/api-usage/stats?startDate=${startDate}&endDate=${endDate}`);
      } catch (error) {
        console.error("Error fetching API usage stats:", error);
        // Fallback to sample data if real data fetch fails
        return {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageResponseTime: 0,
          totalCost: 0,
          costByProvider: {},
          byEndpoint: {},
          byMethod: {},
          byApiProvider: {},
          byStatusCode: {},
          timeSeriesData: []
        };
      }
    },
    retry: 1,
  });

  // Query for API usage records with error handling
  const { 
    data: records, 
    isLoading: isLoadingRecords,
    refetch: refetchRecords
  } = useQuery({
    queryKey: ['/api/direct-admin/api-usage/records', startDate, endDate, selectedProvider],
    queryFn: async () => {
      try {
        let url = `/api/direct-admin/api-usage/records?startDate=${startDate}&endDate=${endDate}`;
        if (selectedProvider) {
          url += `&provider=${selectedProvider}`;
        }
        const apiRecords = await apiRequest(url);
        // Create an array if the result isn't already an array
        return Array.isArray(apiRecords) ? apiRecords : [];
      } catch (error) {
        console.error("Error fetching API usage records:", error);
        return []; // Return empty array on error to prevent mapping errors
      }
    },
    enabled: activeTab === "records",
    retry: 1,
  });

  // Query for API errors with error handling
  const { 
    data: errors, 
    isLoading: isLoadingErrors,
    refetch: refetchErrors
  } = useQuery({
    queryKey: ['/api/direct-admin/api-usage/errors'],
    queryFn: async () => {
      try {
        const errorData = await apiRequest('/api/direct-admin/api-usage/errors');
        // Create an array if the result isn't already an array
        return Array.isArray(errorData) ? errorData : [];
      } catch (error) {
        console.error("Error fetching API errors:", error);
        return []; // Return empty array on error to prevent mapping errors
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
  
  // If loading stats in overview tab, show loading state
  if (activeTab === "overview" && isLoadingStats) {
    return <div className="flex justify-center items-center h-96">Loading API usage statistics...</div>;
  }
  
  // If loading records in records tab, show loading state
  if (activeTab === "records" && isLoadingRecords) {
    return <div className="flex justify-center items-center h-96">Loading API usage records...</div>;
  }
  
  // If loading errors in errors tab, show loading state
  if (activeTab === "errors" && isLoadingErrors) {
    return <div className="flex justify-center items-center h-96">Loading API error records...</div>;
  }
  
  // Prepare data for charts
  const endpointData = stats ? transformDataForEndpointChart(stats.byEndpoint) : [];
  const providerData = stats ? transformDataForProviderChart(stats.byApiProvider) : [];
  const timeSeriesData = stats ? transformTimeSeriesData(stats.timeSeriesData) : [];
  
  return (
    <div className="container py-10">
      <Helmet>
        <title>API Usage Dashboard</title>
        <meta name="description" content="Monitor and analyze API usage across your application with detailed metrics and visualizations." />
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Usage Dashboard</h1>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <p className="text-sm">From:</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[190px] justify-start text-left font-normal",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(new Date(startDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate ? new Date(startDate) : undefined}
                  onSelect={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-sm">To:</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[190px] justify-start text-left font-normal",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(new Date(endDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate ? new Date(endDate) : undefined}
                  onSelect={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {activeTab === "records" && (
            <div className="flex items-center gap-2">
              <p className="text-sm">API Provider:</p>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Providers</SelectItem>
                  {stats && getProviders(stats).map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button onClick={handleFilterChange}>Apply Filters</Button>
        </div>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCalls || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Success: {stats?.successfulCalls || 0} | Failed: {stats?.failedCalls || 0}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.averageResponseTime || 0} ms</div>
                <p className="text-xs text-muted-foreground">
                  Across all API endpoints
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalCalls ? Math.round((stats.successfulCalls / stats.totalCalls) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on HTTP status codes
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats?.totalCost?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">
                  For selected date range
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>API Calls by Endpoint</CardTitle>
                <CardDescription>Distribution of API calls across different endpoints</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={endpointData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value) => [`${value} calls`, 'Count']} />
                    <Bar dataKey="value" fill="#8884d8" name="API Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>API Calls by Provider</CardTitle>
                <CardDescription>Distribution of API calls by external provider</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {providerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} calls`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 mb-8">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>API Usage Over Time</CardTitle>
                <CardDescription>Number of API calls per day by provider</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: any) => {
                        const isCount = typeof name === 'string' && name.includes('_count');
                        const providerName = typeof name === 'string' ? name.split('_')[0] : 'Unknown';
                        return [
                          isCount 
                            ? `${value} calls` 
                            : `$${typeof value === 'number' ? value.toFixed(2) : value}`, 
                          `${providerName} ${isCount ? 'Count' : 'Cost'}`
                        ];
                      }} 
                    />
                    <Legend />
                    
                    {/* Lines for counts */}
                    <Line type="monotone" dataKey="google-ads_count" stroke="#8884d8" name="Google Ads Count" />
                    <Line type="monotone" dataKey="dataforseo_count" stroke="#82ca9d" name="DataForSEO Count" />
                    <Line type="monotone" dataKey="openai_count" stroke="#ffc658" name="OpenAI Count" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>API Costs by Provider</CardTitle>
                <CardDescription>Breakdown of API costs by provider</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(stats?.costByProvider || {}).map(([name, value]) => ({ name, value }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => {
                      const formattedValue = typeof value === 'number' ? `$${value.toFixed(2)}` : `$${value}`;
                      return [formattedValue, 'Cost'];
                    }} />
                    <Bar dataKey="value" fill="#8884d8" name="Cost ($)">
                      {Object.entries(stats?.costByProvider || {}).map(([name, value], index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Response Status Codes</CardTitle>
                <CardDescription>Distribution of API response status codes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats?.byStatusCode || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(stats?.byStatusCode || {}).map(([code], index) => (
                        <Cell key={`cell-${index}`} fill={StatusCodeColors[code as keyof typeof StatusCodeColors] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Records</CardTitle>
              <CardDescription>
                Detailed records of individual API calls
                {selectedProvider && ` for ${selectedProvider}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="py-2 px-4 text-left font-medium">Timestamp</th>
                      <th className="py-2 px-4 text-left font-medium">Endpoint</th>
                      <th className="py-2 px-4 text-left font-medium">Method</th>
                      <th className="py-2 px-4 text-left font-medium">Provider</th>
                      <th className="py-2 px-4 text-left font-medium">Status</th>
                      <th className="py-2 px-4 text-left font-medium">Response Time</th>
                      <th className="py-2 px-4 text-left font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records?.map((record: any) => (
                      <tr key={record.id} className="border-t">
                        <td className="py-2 px-4">{new Date(record.timestamp).toLocaleString()}</td>
                        <td className="py-2 px-4">{record.endpoint}</td>
                        <td className="py-2 px-4">{record.method}</td>
                        <td className="py-2 px-4">{record.apiProvider}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.statusCode >= 200 && record.statusCode < 300
                              ? 'bg-green-100 text-green-800'
                              : record.statusCode >= 400 && record.statusCode < 500
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {record.statusCode}
                          </span>
                        </td>
                        <td className="py-2 px-4">{record.responseTime} ms</td>
                        <td className="py-2 px-4">${record.estimatedCost?.toFixed(6) || '0.00'}</td>
                      </tr>
                    ))}
                    {(!records || records.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-muted-foreground">
                          No records found for the selected criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>API Error Log</CardTitle>
              <CardDescription>Recent API errors and failures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="py-2 px-4 text-left font-medium">Timestamp</th>
                      <th className="py-2 px-4 text-left font-medium">Endpoint</th>
                      <th className="py-2 px-4 text-left font-medium">Provider</th>
                      <th className="py-2 px-4 text-left font-medium">Status</th>
                      <th className="py-2 px-4 text-left font-medium">Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors?.map((error: any) => (
                      <tr key={error.id} className="border-t">
                        <td className="py-2 px-4">{new Date(error.timestamp).toLocaleString()}</td>
                        <td className="py-2 px-4">{error.endpoint}</td>
                        <td className="py-2 px-4">{error.apiProvider}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            error.statusCode >= 400 && error.statusCode < 500
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {error.statusCode}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <div className="max-w-md truncate" title={error.errorMessage}>
                            {error.errorMessage}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!errors || errors.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">
                          No errors found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}