import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Target,
  BarChart3
} from 'lucide-react';

interface MetricsData {
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
}

interface MetricsVisualizationProps {
  metrics: MetricsData;
}

export const MetricsVisualization: React.FC<MetricsVisualizationProps> = ({ metrics }) => {
  const successRate = metrics.business.totalAudits > 0 
    ? (metrics.business.successfulAudits / metrics.business.totalAudits) * 100 
    : 0;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value <= thresholds.warning) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* System Performance Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">System Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Active Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.current.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Active Audits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.current.auditsInProgress}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Response Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.current.avgResponseTime, { good: 200, warning: 500 })}`}>
                  {metrics.current.avgResponseTime}ms
                </div>
                {getPerformanceIcon(metrics.current.avgResponseTime, { good: 200, warning: 500 })}
              </div>
              <p className="text-xs text-muted-foreground">Average response</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resource Usage */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{metrics.current.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.current.memoryUsage} className="h-2" />
              <div className="flex justify-between">
                <Badge variant={metrics.current.memoryUsage > 80 ? 'destructive' : 'secondary'}>
                  {metrics.current.memoryUsage > 80 ? 'High' : 'Normal'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {metrics.current.memoryUsage > 90 ? 'Critical' : 
                   metrics.current.memoryUsage > 80 ? 'Warning' : 'Good'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{metrics.current.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.current.cpuUsage} className="h-2" />
              <div className="flex justify-between">
                <Badge variant={metrics.current.cpuUsage > 75 ? 'destructive' : 'secondary'}>
                  {metrics.current.cpuUsage > 75 ? 'High' : 'Normal'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {metrics.current.cpuUsage > 90 ? 'Critical' : 
                   metrics.current.cpuUsage > 75 ? 'Warning' : 'Good'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Business Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Total Audits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.business.totalAudits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Success Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-green-600">
                  {successRate.toFixed(1)}%
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="mt-2">
                <Progress value={successRate} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Failed Audits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.business.failedAudits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((metrics.business.failedAudits / metrics.business.totalAudits) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Avg Audit Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(metrics.business.avgAuditTime)}
              </div>
              <p className="text-xs text-muted-foreground">Per audit</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quality Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quality Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>User Satisfaction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rating</span>
                <span>{metrics.business.userSatisfaction.toFixed(1)}/5.0</span>
              </div>
              <Progress value={(metrics.business.userSatisfaction / 5) * 100} className="h-2" />
              <div className="flex justify-between">
                <Badge variant={metrics.business.userSatisfaction >= 4.5 ? 'default' : 
                                metrics.business.userSatisfaction >= 4.0 ? 'secondary' : 'outline'}>
                  {metrics.business.userSatisfaction >= 4.5 ? 'Excellent' : 
                   metrics.business.userSatisfaction >= 4.0 ? 'Good' : 
                   metrics.business.userSatisfaction >= 3.0 ? 'Average' : 'Poor'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {((metrics.business.userSatisfaction / 5) * 100).toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Error Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Rate</span>
                <span>{(metrics.current.errorRate * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.current.errorRate * 100} className="h-2" />
              <div className="flex justify-between">
                <Badge variant={metrics.current.errorRate > 0.05 ? 'destructive' : 
                                metrics.current.errorRate > 0.01 ? 'secondary' : 'default'}>
                  {metrics.current.errorRate > 0.05 ? 'High' : 
                   metrics.current.errorRate > 0.01 ? 'Moderate' : 'Low'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Target: &lt;1%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};