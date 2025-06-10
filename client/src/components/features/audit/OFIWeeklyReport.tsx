import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  Calendar,
  Users,
  FileText,
  Download,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/ui/use-toast";

interface WeeklyReportData {
  period: { start: string; end: string };
  auditCount: number;
  totalItems: number;
  priorityOFICount: number;
  standardOFICount: number;
  priorityOFIRate: string;
  averageAccuracyRate: number;
  downgradedCount: number;
  flaggedForReview: number;
  targets: {
    priorityOFIReduction: { target: number; current: string; achieved: boolean };
    classificationAccuracy: { target: number; current: number; achieved: boolean };
    averageResolutionTime: { target: number; current: number; achieved: boolean };
    zeroFalsePositives: { target: number; current: number; achieved: boolean };
  };
  recommendations: string[];
  auditSummaries: Array<{
    auditId: string;
    url: string;
    timestamp: string;
    totalItems: number;
    priorityOFICount: number;
    standardOFICount: number;
    downgradedItems: string[];
    flaggedForReview: string[];
  }>;
}

interface ClassificationMetrics {
  period: string;
  auditCount: number;
  totalOFIItems: number;
  priorityOFIItems: number;
  priorityOFIRate: string;
  classificationCoverageRate: string;
  potentialDowngrades: number;
  potentialDowngradeRate: string;
  healthScore: string;
  healthStatus: string;
  recommendations: string[];
}

export default function OFIWeeklyReport() {
  const { toast } = useToast();
  const [weeklyData, setWeeklyData] = useState<WeeklyReportData | null>(null);
  const [metricsData, setMetricsData] = useState<ClassificationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchWeeklyReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      const response = await fetch(`/api/ofi-reports/weekly?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly report');
      }
      
      const result = await response.json();
      setWeeklyData(result.data);
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      toast({
        title: "Error",
        description: "Failed to load weekly OFI report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClassificationMetrics = async () => {
    try {
      const response = await fetch('/api/ofi-reports/classification-metrics', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch classification metrics');
      }
      
      const result = await response.json();
      setMetricsData(result.data);
    } catch (error) {
      console.error('Error fetching classification metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load classification metrics",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchWeeklyReport();
    fetchClassificationMetrics();
  }, []);

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTargetIcon = (achieved: boolean) => {
    return achieved ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (loading && !weeklyData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading OFI Classification Report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">OFI Classification Weekly Report</h1>
          <p className="text-gray-600">Monitor Priority OFI classification effectiveness and trends</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
            className="px-3 py-2 border rounded-md"
          />
          <Button onClick={fetchWeeklyReport} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Targets
          </TabsTrigger>
          <TabsTrigger value="audits" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Details
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {weeklyData && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Audits</span>
                    </div>
                    <div className="text-2xl font-bold">{weeklyData.auditCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Priority OFI</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{weeklyData.priorityOFICount}</div>
                    <div className="text-xs text-gray-600">{weeklyData.priorityOFIRate}% of total</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Standard OFI</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{weeklyData.standardOFICount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Downgraded</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{weeklyData.downgradedCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Classification Health Alert */}
              <Alert className={parseFloat(weeklyData.priorityOFIRate) > 30 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Classification Health Status</AlertTitle>
                <AlertDescription>
                  {parseFloat(weeklyData.priorityOFIRate) > 30 ? (
                    <>Priority OFI rate is {weeklyData.priorityOFIRate}% - above 30% threshold. Review classification criteria.</>
                  ) : (
                    <>Priority OFI rate is {weeklyData.priorityOFIRate}% - within acceptable range.</>
                  )}
                </AlertDescription>
              </Alert>

              {/* Recommendations */}
              {weeklyData.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Weekly Recommendations
                    </CardTitle>
                    <CardDescription>
                      Actions to improve OFI classification effectiveness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {weeklyData.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-6">
          {weeklyData && (
            <div className="grid gap-4">
              {Object.entries(weeklyData.targets).map(([key, target]) => (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTargetIcon(target.achieved)}
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <Badge className={target.achieved ? getHealthBadgeColor('Excellent') : getHealthBadgeColor('Poor')}>
                        {target.achieved ? 'Met' : 'Not Met'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Target</div>
                        <div className="font-bold">{target.target}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Current</div>
                        <div className="font-bold">{target.current}</div>
                      </div>
                    </div>
                    <Progress 
                      value={target.achieved ? 100 : 50} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit Details Tab */}
        <TabsContent value="audits" className="space-y-6">
          {weeklyData && weeklyData.auditSummaries.length > 0 ? (
            <div className="space-y-4">
              {weeklyData.auditSummaries.map((audit) => (
                <Card key={audit.auditId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{audit.url}</CardTitle>
                        <CardDescription>
                          {new Date(audit.timestamp).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Audit ID</div>
                        <div className="font-mono text-xs">{audit.auditId}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{audit.priorityOFICount}</div>
                        <div className="text-xs text-gray-600">Priority OFI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{audit.standardOFICount}</div>
                        <div className="text-xs text-gray-600">Standard OFI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{audit.downgradedItems.length}</div>
                        <div className="text-xs text-gray-600">Downgraded</div>
                      </div>
                    </div>
                    
                    {audit.downgradedItems.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">Downgraded Items:</h4>
                        <ul className="text-xs space-y-1">
                          {audit.downgradedItems.slice(0, 3).map((item, index) => (
                            <li key={index} className="text-gray-600 truncate">• {item}</li>
                          ))}
                          {audit.downgradedItems.length > 3 && (
                            <li className="text-gray-400">...and {audit.downgradedItems.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No audit data available for the selected period</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          {metricsData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Classification System Health
                  </CardTitle>
                  <CardDescription>
                    Overall health assessment for the last {metricsData.period}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{metricsData.healthScore}</div>
                      <div className="text-sm text-gray-600">Health Score</div>
                    </div>
                    <div className="flex-1">
                      <Badge className={getHealthBadgeColor(metricsData.healthStatus)}>
                        {metricsData.healthStatus}
                      </Badge>
                      <Progress value={parseInt(metricsData.healthScore)} className="mt-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{metricsData.auditCount}</div>
                      <div className="text-xs text-gray-600">Audits Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{metricsData.priorityOFIRate}%</div>
                      <div className="text-xs text-gray-600">Priority Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{metricsData.classificationCoverageRate}%</div>
                      <div className="text-xs text-gray-600">Classification Coverage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{metricsData.potentialDowngradeRate}%</div>
                      <div className="text-xs text-gray-600">Potential Downgrades</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {metricsData.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>System Health Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {metricsData.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}