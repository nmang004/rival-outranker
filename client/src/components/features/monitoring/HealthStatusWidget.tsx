import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Activity, Database, Globe, MemoryStick, Cpu } from 'lucide-react';

interface HealthData {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  components: {
    database: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    crawler: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    memory: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    apis: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  };
  lastCheck: string;
  details?: {
    database?: {
      responseTime: number;
      connections: number;
      maxConnections: number;
    };
    memory?: {
      usage: number;
      limit: number;
      percentage: number;
    };
    crawler?: {
      activeJobs: number;
      queueSize: number;
      successRate: number;
    };
    apis?: {
      openai: 'healthy' | 'degraded' | 'unhealthy' | 'error';
      dataforseo: 'healthy' | 'degraded' | 'unhealthy' | 'error';
      google: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    };
  };
}

interface HealthStatusWidgetProps {
  health: HealthData;
}

export const HealthStatusWidget: React.FC<HealthStatusWidgetProps> = ({ health }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'unhealthy': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string, size = 'h-4 w-4') => {
    const className = `${size} ${getStatusColor(status)}`;
    switch (status) {
      case 'healthy': return <CheckCircle className={className} />;
      case 'degraded': return <AlertTriangle className={className} />;
      case 'unhealthy': return <AlertTriangle className={className} />;
      case 'error': return <XCircle className={className} />;
      default: return <Activity className={className} />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'database': return <Database className="h-5 w-5" />;
      case 'crawler': return <Globe className="h-5 w-5" />;
      case 'memory': return <MemoryStick className="h-5 w-5" />;
      case 'apis': return <Cpu className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(health.overall, 'h-5 w-5')}
            <span>Overall System Health</span>
          </CardTitle>
          <CardDescription>
            Last checked: {new Date(health.lastCheck).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className={`text-4xl font-bold ${getStatusColor(health.overall)} mb-2`}>
              {health.overall.toUpperCase()}
            </div>
            <Badge variant={getStatusBadgeVariant(health.overall)} className="text-sm">
              System Status
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Component Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Component Health</CardTitle>
          <CardDescription>Status of individual system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(health.components).map(([component, status]) => (
              <div key={component} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getComponentIcon(component)}
                  <span className="font-medium capitalize">{component}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <Badge variant={getStatusBadgeVariant(status)}>
                    {status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Details */}
      {health.details?.database && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Response Time</span>
                <span>{health.details.database.responseTime}ms</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Active Connections</span>
                <span>{health.details.database.connections}/{health.details.database.maxConnections}</span>
              </div>
              <Progress 
                value={(health.details.database.connections / health.details.database.maxConnections) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Usage */}
      {health.details?.memory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MemoryStick className="h-5 w-5" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{(health.details.memory.usage / (1024 * 1024 * 1024)).toFixed(1)}GB / {(health.details.memory.limit / (1024 * 1024 * 1024)).toFixed(1)}GB</span>
              </div>
              <Progress value={health.details.memory.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {health.details.memory.percentage.toFixed(1)}% used
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crawler Status */}
      {health.details?.crawler && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Crawler Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{health.details.crawler.activeJobs}</div>
                <div className="text-sm text-muted-foreground">Active Jobs</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{health.details.crawler.queueSize}</div>
                <div className="text-sm text-muted-foreground">Queue Size</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Success Rate</span>
                <span>{health.details.crawler.successRate.toFixed(1)}%</span>
              </div>
              <Progress value={health.details.crawler.successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* External APIs Status */}
      {health.details?.apis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5" />
              <span>External APIs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(health.details.apis).map(([api, status]) => (
                <div key={api} className="flex items-center justify-between">
                  <span className="font-medium capitalize">{api} API</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};