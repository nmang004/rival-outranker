import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, RefreshCw, TrendingDown, AlertCircle, Activity } from "lucide-react";
import { useToast } from "@/hooks/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function OFIClassificationAdmin() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ClassificationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBulkReclassifyDialog, setShowBulkReclassifyDialog] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [dryRunResults, setDryRunResults] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ofi-reports/classification-metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load classification metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runQuickReclassification = async () => {
    try {
      setReclassifying(true);
      const response = await fetch('/api/ofi-reports/reclassify-all-recent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to run reclassification');
      
      const data = await response.json();
      
      toast({
        title: "Emergency Reclassification Complete!",
        description: `Successfully processed ${data.data.auditsProcessed} audits. Downgraded ${data.data.totalDowngraded} Priority OFI items, converted ${data.data.totalConverted || 0} items to OK. New Priority OFI rate: ${data.data.newPriorityOFIRate}%`,
        duration: 7000,
      });
      
      fetchMetrics(); // Refresh metrics
    } catch (error) {
      console.error('Error running quick reclassification:', error);
      toast({
        title: "Error",
        description: "Failed to run quick reclassification",
        variant: "destructive"
      });
    } finally {
      setReclassifying(false);
    }
  };

  const runDryRunReclassification = async () => {
    try {
      setReclassifying(true);
      const response = await fetch('/api/ofi-reports/bulk-reclassify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ days: 30, dryRun: true })
      });
      
      if (!response.ok) throw new Error('Failed to run dry run');
      
      const data = await response.json();
      setDryRunResults(data.data);
      setShowBulkReclassifyDialog(true);
    } catch (error) {
      console.error('Error running dry run:', error);
      toast({
        title: "Error",
        description: "Failed to run reclassification dry run",
        variant: "destructive"
      });
    } finally {
      setReclassifying(false);
    }
  };

  const executeBulkReclassification = async () => {
    try {
      setReclassifying(true);
      const response = await fetch('/api/ofi-reports/bulk-reclassify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ days: 30, dryRun: false })
      });
      
      if (!response.ok) throw new Error('Failed to execute reclassification');
      
      const data = await response.json();
      
      toast({
        title: "Reclassification Complete",
        description: `Successfully downgraded ${data.data.totalDowngraded} items from Priority OFI to Standard OFI`,
      });
      
      setShowBulkReclassifyDialog(false);
      fetchMetrics(); // Refresh metrics
    } catch (error) {
      console.error('Error executing reclassification:', error);
      toast({
        title: "Error",
        description: "Failed to execute bulk reclassification",
        variant: "destructive"
      });
    } finally {
      setReclassifying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'Excellent':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Good':
        return <Activity className="h-5 w-5 text-yellow-500" />;
      case 'Fair':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const priorityRate = parseFloat(metrics.priorityOFIRate);
  const isHighRate = priorityRate > 30;
  const isWarningRate = priorityRate > 15;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>OFI Classification Health Monitor</span>
            <Button onClick={fetchMetrics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Monitor and manage the health of the OFI classification system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Health Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health Score</span>
                <div className="flex items-center gap-2">
                  {getHealthIcon(metrics.healthStatus)}
                  <span className={`text-2xl font-bold ${getHealthColor(parseInt(metrics.healthScore))}`}>
                    {metrics.healthScore}%
                  </span>
                </div>
              </div>
              <Progress value={parseInt(metrics.healthScore)} className="h-3" />
              <Badge variant={metrics.healthStatus === 'Excellent' ? 'default' : 
                          metrics.healthStatus === 'Good' ? 'secondary' :
                          metrics.healthStatus === 'Fair' ? 'outline' : 'destructive'}>
                {metrics.healthStatus} Health
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Key Metrics ({metrics.period})</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Audits Analyzed</div>
                  <div className="font-semibold">{metrics.auditCount}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total OFI Items</div>
                  <div className="font-semibold">{metrics.totalOFIItems}</div>
                </div>
                <div>
                  <div className="text-gray-600">Classification Coverage</div>
                  <div className="font-semibold">{metrics.classificationCoverageRate}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Potential Downgrades</div>
                  <div className="font-semibold">{metrics.potentialDowngrades}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Priority OFI Rate Alert */}
          <div className={`p-4 rounded-lg mb-6 ${
            isHighRate ? 'bg-red-50 border border-red-200' :
            isWarningRate ? 'bg-amber-50 border border-amber-200' :
            'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              {isHighRate ? <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" /> :
               isWarningRate ? <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" /> :
               <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  isHighRate ? 'text-red-900' :
                  isWarningRate ? 'text-amber-900' :
                  'text-green-900'
                }`}>
                  Priority OFI Rate: {metrics.priorityOFIRate}%
                </h4>
                <p className={`text-sm mt-1 ${
                  isHighRate ? 'text-red-700' :
                  isWarningRate ? 'text-amber-700' :
                  'text-green-700'
                }`}>
                  {isHighRate ? 
                    `Critical: ${metrics.priorityOFIItems} of ${metrics.totalOFIItems} items are Priority OFI. Target is <10%.` :
                   isWarningRate ?
                    `Warning: Priority OFI rate is above target. Consider reviewing classification criteria.` :
                    `Excellent: Priority OFI rate is within acceptable range.`}
                </p>
                {metrics.potentialDowngradeRate && parseFloat(metrics.potentialDowngradeRate) > 20 && (
                  <p className="text-sm mt-2 text-gray-600">
                    {metrics.potentialDowngradeRate}% of current Priority OFI items could be downgraded with new criteria.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {metrics.recommendations.length > 0 && (
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-medium">Recommendations</h4>
              <ul className="space-y-2">
                {metrics.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={runQuickReclassification}
              disabled={reclassifying}
              variant={isHighRate ? "default" : "outline"}
            >
              {reclassifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Quick Fix: Reclassify Recent Audits
                </>
              )}
            </Button>
            
            <Button 
              onClick={runDryRunReclassification}
              disabled={reclassifying || metrics.potentialDowngrades === 0}
              variant="outline"
            >
              {reclassifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Bulk Reclassify (Preview)
                </>
              )}
            </Button>
            
            <Button variant="outline" asChild>
              <a href="/api/ofi-reports/weekly" target="_blank">
                Generate Weekly Report
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Reclassify Dialog */}
      <Dialog open={showBulkReclassifyDialog} onOpenChange={setShowBulkReclassifyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Reclassification Preview</DialogTitle>
            <DialogDescription>
              Review the proposed changes before applying them
            </DialogDescription>
          </DialogHeader>
          
          {dryRunResults && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Audits Processed:</span>
                    <span className="ml-2 font-semibold">{dryRunResults.auditsProcessed}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Items to Downgrade:</span>
                    <span className="ml-2 font-semibold text-green-600">{dryRunResults.totalDowngraded}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Success Rate:</span>
                    <span className="ml-2 font-semibold">{dryRunResults.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">New Priority OFI Rate:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      ~{((metrics.priorityOFIItems - dryRunResults.totalDowngraded) / metrics.totalOFIItems * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {dryRunResults.recommendation && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">{dryRunResults.recommendation}</p>
                </div>
              )}

              {dryRunResults.details.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-lg p-3">
                  <h4 className="font-medium mb-2 text-sm">Sample Changes</h4>
                  {dryRunResults.details.slice(0, 5).map((audit: any, index: number) => (
                    <div key={index} className="text-xs mb-2 pb-2 border-b last:border-0">
                      <p className="font-medium">{audit.url}</p>
                      <p className="text-gray-600">{audit.changes.length} items to be downgraded</p>
                    </div>
                  ))}
                  {dryRunResults.details.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2">
                      And {dryRunResults.details.length - 5} more audits...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkReclassifyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeBulkReclassification} disabled={reclassifying}>
              {reclassifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                'Apply Reclassification'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}