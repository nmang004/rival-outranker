import React, { useRef } from 'react';
import { RivalAudit } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  ClipboardCheck,
  Phone,
  Briefcase,
  MapPin,
  Globe,
} from "lucide-react";
import { ChartExport } from "@/components/ui/chart-export";

interface RivalAuditDashboardProps {
  audit: RivalAudit;
  updatedSummary: {
    priorityOfiCount: number;
    ofiCount: number;
    okCount: number;
    naCount: number;
    total?: number;
  } | null;
}

export default function RivalAuditDashboard({ audit, updatedSummary }: RivalAuditDashboardProps) {
  // Chart refs for export functionality
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  // Calculate total issues for each category
  const getCategoryTotals = (categoryItems: any[]) => {
    return {
      priorityOfi: categoryItems.filter(item => item.status === "Priority OFI").length,
      ofi: categoryItems.filter(item => item.status === "OFI").length,
      ok: categoryItems.filter(item => item.status === "OK").length,
      na: categoryItems.filter(item => item.status === "N/A").length,
      total: categoryItems.length
    };
  };

  const onPageTotals = getCategoryTotals(audit.onPage.items);
  const structureTotals = getCategoryTotals(audit.structureNavigation.items);
  const contactTotals = getCategoryTotals(audit.contactPage.items);
  const serviceTotals = getCategoryTotals(audit.servicePages.items);
  const locationTotals = getCategoryTotals(audit.locationPages.items);
  const serviceAreaTotals = audit.serviceAreaPages
    ? getCategoryTotals(audit.serviceAreaPages.items)
    : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };

  // Get category progress as percentage (excluding N/A items)
  const getCategoryProgress = (totals: { priorityOfi: number, ofi: number, ok: number, na: number, total: number }) => {
    const relevantItems = totals.total - totals.na;
    return relevantItems > 0 ? (totals.ok / relevantItems) * 100 : 0;
  };

  // Prepare data for status distribution chart, using updatedSummary if available
  const statusDistributionData = [
    { 
      name: 'Priority Issues', 
      value: updatedSummary ? updatedSummary.priorityOfiCount : audit.summary.priorityOfiCount, 
      color: '#ef4444' 
    },
    { 
      name: 'Opportunities', 
      value: updatedSummary ? updatedSummary.ofiCount : audit.summary.ofiCount, 
      color: '#eab308' 
    },
    { 
      name: 'Completed', 
      value: updatedSummary ? updatedSummary.okCount : audit.summary.okCount, 
      color: '#22c55e' 
    },
    { 
      name: 'Not Applicable', 
      value: updatedSummary ? updatedSummary.naCount : audit.summary.naCount, 
      color: '#9ca3af' 
    },
  ];

  // Prepare data for category comparison chart
  // Ensure we have at least a minimal value (0.1) for all categories to ensure they display
  const ensureMinValue = (val: number) => val === 0 ? 0.1 : val;
  
  const categoryComparisonData = [
    {
      name: 'On-Page',
      'Priority Issues': ensureMinValue(onPageTotals.priorityOfi),
      'Opportunities': ensureMinValue(onPageTotals.ofi),
      'Completed': ensureMinValue(onPageTotals.ok),
      'Not Applicable': ensureMinValue(onPageTotals.na),
    },
    {
      name: 'Structure',
      'Priority Issues': ensureMinValue(structureTotals.priorityOfi),
      'Opportunities': ensureMinValue(structureTotals.ofi),
      'Completed': ensureMinValue(structureTotals.ok),
      'Not Applicable': ensureMinValue(structureTotals.na),
    },
    {
      name: 'Contact',
      'Priority Issues': ensureMinValue(contactTotals.priorityOfi),
      'Opportunities': ensureMinValue(contactTotals.ofi),
      'Completed': ensureMinValue(contactTotals.ok),
      'Not Applicable': ensureMinValue(contactTotals.na),
    },
    {
      name: 'Services',
      'Priority Issues': ensureMinValue(serviceTotals.priorityOfi),
      'Opportunities': ensureMinValue(serviceTotals.ofi),
      'Completed': ensureMinValue(serviceTotals.ok),
      'Not Applicable': ensureMinValue(serviceTotals.na),
    },
    {
      name: 'Locations',
      'Priority Issues': ensureMinValue(locationTotals.priorityOfi),
      'Opportunities': ensureMinValue(locationTotals.ofi),
      'Completed': ensureMinValue(locationTotals.ok),
      'Not Applicable': ensureMinValue(locationTotals.na),
    },
  ];

  if (audit.serviceAreaPages) {
    categoryComparisonData.push({
      name: 'Service Areas',
      'Priority Issues': ensureMinValue(serviceAreaTotals.priorityOfi),
      'Opportunities': ensureMinValue(serviceAreaTotals.ofi),
      'Completed': ensureMinValue(serviceAreaTotals.ok),
      'Not Applicable': ensureMinValue(serviceAreaTotals.na),
    });
  }

  // Prepare data for completion progress chart
  const completionProgressData = [
    {
      name: 'On-Page',
      progress: Math.round(getCategoryProgress(onPageTotals)),
      icon: <FileText className="h-4 w-4 text-primary" />,
    },
    {
      name: 'Structure',
      progress: Math.round(getCategoryProgress(structureTotals)),
      icon: <ClipboardCheck className="h-4 w-4 text-primary" />,
    },
    {
      name: 'Contact',
      progress: Math.round(getCategoryProgress(contactTotals)),
      icon: <Phone className="h-4 w-4 text-primary" />,
    },
    {
      name: 'Services',
      progress: Math.round(getCategoryProgress(serviceTotals)),
      icon: <Briefcase className="h-4 w-4 text-primary" />,
    },
    {
      name: 'Locations',
      progress: Math.round(getCategoryProgress(locationTotals)),
      icon: <MapPin className="h-4 w-4 text-primary" />,
    },
  ];

  if (audit.serviceAreaPages) {
    completionProgressData.push({
      name: 'Service Areas',
      progress: Math.round(getCategoryProgress(serviceAreaTotals)),
      icon: <Globe className="h-4 w-4 text-primary" />,
    });
  }

  // Generate critical issues list
  const criticalIssues = [
    ...audit.onPage.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'On-Page' })),
    ...audit.structureNavigation.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Structure' })),
    ...audit.contactPage.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Contact' })),
    ...audit.servicePages.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Services' })),
    ...audit.locationPages.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Locations' })),
  ];

  if (audit.serviceAreaPages) {
    criticalIssues.push(
      ...audit.serviceAreaPages.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Service Areas' }))
    );
  }

  // Calculate total audit progress
  const totalRelevantItems = 
    onPageTotals.total - onPageTotals.na +
    structureTotals.total - structureTotals.na +
    contactTotals.total - contactTotals.na +
    serviceTotals.total - serviceTotals.na +
    locationTotals.total - locationTotals.na +
    (serviceAreaTotals.total - serviceAreaTotals.na);
  
  const totalCompletedItems =
    onPageTotals.ok +
    structureTotals.ok +
    contactTotals.ok +
    serviceTotals.ok +
    locationTotals.ok +
    serviceAreaTotals.ok;
  
  const totalProgress = totalRelevantItems > 0 
    ? (totalCompletedItems / totalRelevantItems) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall progress card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>SEO Health & Performance Dashboard</CardTitle>
            <CardDescription>
              Comprehensive view of website's SEO health with key performance metrics
            </CardDescription>
          </div>
          <ChartExport 
            chartRef={pieChartRef}
            filename="seo-health-performance-dashboard"
            title="Export SEO Dashboard"
            size="sm"
          />
        </CardHeader>
        <CardContent ref={pieChartRef}>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <div className="text-sm font-medium">Overall Progress</div>
                <div className="text-sm font-medium">{Math.round(totalProgress)}%</div>
              </div>
              <Progress 
                value={totalProgress} 
                className={`h-3 ${
                  totalProgress > 70 ? "bg-green-500/20" : 
                  totalProgress > 40 ? "bg-yellow-500/20" :
                  "bg-red-500/20"
                }`}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="col-span-1">
                <div className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">SEO Issue Distribution</div>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        // External pie label removed - use legend instead
                        label={false}
                        labelLine={false}
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} name={entry.name} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => {
                          // Handle case where value is 0
                          if (!value || value === 0) {
                            return ["0 items (0%)", name];
                          }
                          
                          // Use updated summary if available
                          const summary = updatedSummary || audit.summary;
                          const total = summary.total || 
                            (summary.priorityOfiCount + summary.ofiCount + summary.okCount + summary.naCount);
                          return [`${value} items (${((Number(value)/total) * 100).toFixed(1)}%)`, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '8px', 
                          padding: '10px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconSize={12}
                        iconType="circle"
                        formatter={(value) => <span className="text-sm font-medium">{value}</span>}
                        wrapperStyle={{ paddingLeft: 20 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-lg font-semibold mb-3 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">SEO Optimization Status by Category</div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg space-y-4">
                  {completionProgressData.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-1 rounded-full bg-primary/10 mr-2">
                            {item.icon}
                          </div>
                          <span className="ml-1 text-sm font-medium">{item.name}</span>
                        </div>
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                          item.progress > 80 ? "bg-green-100 text-green-700" : 
                          item.progress > 60 ? "bg-emerald-100 text-emerald-700" :
                          item.progress > 40 ? "bg-yellow-100 text-yellow-700" :
                          item.progress > 20 ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>{item.progress}%</span>
                      </div>
                      <Progress 
                        value={item.progress} 
                        className={`h-2.5 ${
                          item.progress > 80 ? "bg-green-500/20" : 
                          item.progress > 60 ? "bg-emerald-500/20" : 
                          item.progress > 40 ? "bg-yellow-500/20" :
                          item.progress > 20 ? "bg-orange-500/20" :
                          "bg-red-500/20"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category comparison chart */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>SEO Category Performance Analysis</CardTitle>
            <CardDescription>
              Detailed breakdown of performance across all SEO categories with issue distribution
            </CardDescription>
          </div>
          <ChartExport 
            chartRef={barChartRef}
            filename="seo-category-performance"
            title="Export Category Performance Chart"
            size="sm"
          />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[400px]" ref={barChartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryComparisonData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis 
                  tickFormatter={(value) => Math.floor(value) === value ? value.toString() : ''}
                  domain={[0, 'dataMax']} 
                />
                <Tooltip formatter={(value, name) => {
                  // If it's our minimal value (0.1), display as 0 in the tooltip
                  const displayValue = value === 0.1 ? 0 : value;
                  return [`${displayValue} items`, name];
                }} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="Priority Issues" stackId="a" fill="#ef4444" name="Priority Issues" />
                <Bar dataKey="Opportunities" stackId="a" fill="#eab308" name="Opportunities" />
                <Bar dataKey="Completed" stackId="a" fill="#22c55e" name="Completed" />
                <Bar dataKey="Not Applicable" stackId="a" fill="#9ca3af" name="Not Applicable" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Critical issues card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-red-50/30 to-pink-50/30 dark:from-red-950/30 dark:to-pink-950/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span>Priority Action Items</span>
          </CardTitle>
          <CardDescription>
            High-impact SEO issues requiring immediate attention for maximum performance gain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criticalIssues.length > 0 ? (
            <div className="divide-y">
              {criticalIssues.map((issue, index) => (
                <div key={index} className="py-3">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div>
                      <div className="font-medium">{issue.name}</div>
                      <div className="text-sm text-muted-foreground">{issue.category}</div>
                      {issue.notes && (
                        <div className="mt-1 text-sm">{issue.notes}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-medium">No Critical Issues Found</div>
              <p className="text-muted-foreground mt-2">
                Great job! Your site doesn't have any priority issues that require immediate attention.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}