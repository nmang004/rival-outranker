import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity, 
  MemoryStick, 
  Cpu, 
  Database,
  Gauge
} from 'lucide-react';

interface PerformanceData {
  activeUsers: number;
  auditsInProgress: number;
  avgResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface PerformanceChartProps {
  metrics: PerformanceData;
}

interface PerformanceHistory {
  timestamp: string;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  activeUsers: number;
}

export const PerformanceCharts: React.FC<PerformanceChartProps> = ({ metrics }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [history, setHistory] = useState<PerformanceHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPerformanceHistory();
  }, [timeRange]);

  const fetchPerformanceHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/metrics/history?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch performance history:', error);
      // Generate mock data if API call fails
      setHistory(generateMockHistory());
    } finally {
      setLoading(false);
    }
  };

  const generateMockHistory = (): PerformanceHistory[] => {
    const points = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 48 : 168;
    const interval = timeRange === '1h' ? 5 : timeRange === '6h' ? 15 : timeRange === '24h' ? 30 : 60;
    
    return Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(Date.now() - (points - i) * interval * 60000).toISOString();
      return {
        timestamp,
        responseTime: Math.random() * 200 + 100 + Math.sin(i / 10) * 50,
        memoryUsage: Math.random() * 20 + 60 + Math.sin(i / 5) * 10,
        cpuUsage: Math.random() * 30 + 40 + Math.sin(i / 8) * 15,
        errorRate: Math.random() * 0.02 + 0.001,
        activeUsers: Math.floor(Math.random() * 50 + 20 + Math.sin(i / 6) * 10)
      };
    });
  };

  const getPerformanceStatus = (current: number, historical: number[]) => {
    const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
    const trend = current > avg * 1.1 ? 'up' : current < avg * 0.9 ? 'down' : 'stable';
    return { avg, trend };
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderSimpleChart = (data: number[], label: string, color: string) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end space-x-1 h-20">
        {data.slice(-20).map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className={`w-2 ${color} rounded-t-sm`}
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`${label}: ${value.toFixed(1)}`}
            />
          );
        })}
      </div>
    );
  };

  const responseTimeHistory = history.map(h => h.responseTime);
  const memoryHistory = history.map(h => h.memoryUsage);
  const cpuHistory = history.map(h => h.cpuUsage);
  const errorRateHistory = history.map(h => h.errorRate * 100);

  const responseTimeStatus = getPerformanceStatus(metrics.avgResponseTime, responseTimeHistory);
  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, memoryHistory);
  const cpuStatus = getPerformanceStatus(metrics.cpuUsage, cpuHistory);
  const errorRateStatus = getPerformanceStatus(metrics.errorRate * 100, errorRateHistory);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Trends</h3>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="6h">Last 6 Hours</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Response Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(responseTimeStatus.trend)}
                <Badge variant="outline" className={getTrendColor(responseTimeStatus.trend)}>
                  {responseTimeStatus.trend}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Avg: {responseTimeStatus.avg.toFixed(0)}ms
            </div>
            {renderSimpleChart(responseTimeHistory, 'Response Time', 'bg-blue-500')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <MemoryStick className="h-4 w-4" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(memoryStatus.trend)}
                <Badge variant="outline" className={getTrendColor(memoryStatus.trend)}>
                  {memoryStatus.trend}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Avg: {memoryStatus.avg.toFixed(1)}%
            </div>
            {renderSimpleChart(memoryHistory, 'Memory Usage', 'bg-green-500')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span>CPU Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(cpuStatus.trend)}
                <Badge variant="outline" className={getTrendColor(cpuStatus.trend)}>
                  {cpuStatus.trend}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Avg: {cpuStatus.avg.toFixed(1)}%
            </div>
            {renderSimpleChart(cpuHistory, 'CPU Usage', 'bg-yellow-500')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Error Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{(metrics.errorRate * 100).toFixed(2)}%</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(errorRateStatus.trend)}
                <Badge variant="outline" className={getTrendColor(errorRateStatus.trend)}>
                  {errorRateStatus.trend}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Avg: {errorRateStatus.avg.toFixed(2)}%
            </div>
            {renderSimpleChart(errorRateHistory, 'Error Rate', 'bg-red-500')}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gauge className="h-5 w-5" />
              <span>System Health Score</span>
            </CardTitle>
            <CardDescription>Overall system performance rating</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Response Time', value: Math.max(0, 100 - (metrics.avgResponseTime / 10)), threshold: 80 },
              { name: 'Memory Usage', value: Math.max(0, 100 - metrics.memoryUsage), threshold: 70 },
              { name: 'CPU Usage', value: Math.max(0, 100 - metrics.cpuUsage), threshold: 75 },
              { name: 'Error Rate', value: Math.max(0, 100 - (metrics.errorRate * 1000)), threshold: 95 }
            ].map((metric) => (
              <div key={metric.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{metric.name}</span>
                  <span>{metric.value.toFixed(0)}/100</span>
                </div>
                <Progress value={metric.value} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{metric.value >= metric.threshold ? 'Good' : 'Needs Attention'}</span>
                  <span>Target: {metric.threshold}+</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Thresholds</CardTitle>
            <CardDescription>Current metrics vs recommended thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  name: 'Response Time', 
                  current: metrics.avgResponseTime, 
                  threshold: 200, 
                  unit: 'ms',
                  status: metrics.avgResponseTime <= 200 ? 'good' : metrics.avgResponseTime <= 500 ? 'warning' : 'critical'
                },
                { 
                  name: 'Memory Usage', 
                  current: metrics.memoryUsage, 
                  threshold: 80, 
                  unit: '%',
                  status: metrics.memoryUsage <= 80 ? 'good' : metrics.memoryUsage <= 90 ? 'warning' : 'critical'
                },
                { 
                  name: 'CPU Usage', 
                  current: metrics.cpuUsage, 
                  threshold: 75, 
                  unit: '%',
                  status: metrics.cpuUsage <= 75 ? 'good' : metrics.cpuUsage <= 85 ? 'warning' : 'critical'
                },
                { 
                  name: 'Error Rate', 
                  current: metrics.errorRate * 100, 
                  threshold: 1, 
                  unit: '%',
                  status: metrics.errorRate * 100 <= 1 ? 'good' : metrics.errorRate * 100 <= 5 ? 'warning' : 'critical'
                }
              ].map((metric) => (
                <div key={metric.name} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Threshold: {metric.threshold}{metric.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {metric.current.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}
                    </div>
                    <Badge 
                      variant={
                        metric.status === 'good' ? 'default' : 
                        metric.status === 'warning' ? 'secondary' : 'destructive'
                      }
                    >
                      {metric.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};