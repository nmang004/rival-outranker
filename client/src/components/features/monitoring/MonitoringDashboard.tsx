import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { HealthStatusWidget } from './HealthStatusWidget';
import { MetricsVisualization } from './MetricsVisualization';
import { AlertsPanel } from './AlertsPanel';
import { PerformanceCharts } from './PerformanceCharts';

interface MonitoringData {
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    components: {
      database: 'healthy' | 'degraded' | 'unhealthy' | 'error';
      crawler: 'healthy' | 'degraded' | 'unhealthy' | 'error';
      memory: 'healthy' | 'degraded' | 'unhealthy' | 'error';
      apis: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    };
    lastCheck: string;
  };
  metrics: {
    current: {
      activeUsers: number;
      auditsInProgress: number;
      avgResponseTime: number;
      errorRate: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    business: {
      totalAudits: number;
      successfulAudits: number;
      failedAudits: number;
      avgAuditTime: number;
      userSatisfaction: number;
    };
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export const MonitoringDashboard: React.FC = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthRes, metricsRes, businessRes, alertsRes] = await Promise.all([
        fetch('/api/health/detailed'),
        fetch('/api/metrics/current'),
        fetch('/api/metrics/business'),
        fetch('/api/alerts/active')
      ]);

      if (!healthRes.ok || !metricsRes.ok || !businessRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const [health, metrics, business, alerts] = await Promise.all([
        healthRes.json(),
        metricsRes.json(),
        businessRes.json(),
        alertsRes.json()
      ]);

      setData({
        health,
        metrics: {
          current: metrics,
          business
        },
        alerts
      });
      
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMonitoringData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No monitoring data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.health.overall)}
              <span className={`text-lg font-bold ${getStatusColor(data.health.overall)}`}>
                {data.health.overall.toUpperCase()}
              </span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
            <div className="text-2xl font-bold">{data.metrics.current.auditsInProgress}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <div className="text-2xl font-bold">{data.metrics.current.avgResponseTime}ms</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <div className="text-2xl font-bold">
              {(data.metrics.current.errorRate * 100).toFixed(2)}%
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Active Alerts */}
      {data.alerts.length > 0 && (
        <Alert className="border-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                {data.alerts.length} active alert{data.alerts.length !== 1 ? 's' : ''}
              </span>
              <div className="flex space-x-2">
                {data.alerts.map((alert) => (
                  <Badge
                    key={alert.id}
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                  >
                    {alert.severity}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <HealthStatusWidget health={data.health} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <MetricsVisualization metrics={data.metrics} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel alerts={data.alerts} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceCharts metrics={data.metrics.current} />
        </TabsContent>
      </Tabs>
    </div>
  );
};