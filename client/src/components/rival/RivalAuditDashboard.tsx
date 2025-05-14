import React from 'react';
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

interface RivalAuditDashboardProps {
  audit: RivalAudit;
}

export default function RivalAuditDashboard({ audit }: RivalAuditDashboardProps) {
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

  // Prepare data for status distribution chart
  const statusDistributionData = [
    { name: 'Priority Issues', value: audit.summary.priorityOfiCount, color: '#ef4444' },
    { name: 'Opportunities', value: audit.summary.ofiCount, color: '#eab308' },
    { name: 'Completed', value: audit.summary.okCount, color: '#22c55e' },
    { name: 'Not Applicable', value: audit.summary.naCount, color: '#9ca3af' },
  ];

  // Prepare data for category comparison chart
  const categoryComparisonData = [
    {
      name: 'On-Page',
      'Priority Issues': onPageTotals.priorityOfi,
      'Opportunities': onPageTotals.ofi,
      'Completed': onPageTotals.ok,
      'Not Applicable': onPageTotals.na,
    },
    {
      name: 'Structure',
      'Priority Issues': structureTotals.priorityOfi,
      'Opportunities': structureTotals.ofi,
      'Completed': structureTotals.ok,
      'Not Applicable': structureTotals.na,
    },
    {
      name: 'Contact',
      'Priority Issues': contactTotals.priorityOfi,
      'Opportunities': contactTotals.ofi,
      'Completed': contactTotals.ok,
      'Not Applicable': contactTotals.na,
    },
    {
      name: 'Services',
      'Priority Issues': serviceTotals.priorityOfi,
      'Opportunities': serviceTotals.ofi,
      'Completed': serviceTotals.ok,
      'Not Applicable': serviceTotals.na,
    },
    {
      name: 'Locations',
      'Priority Issues': locationTotals.priorityOfi,
      'Opportunities': locationTotals.ofi,
      'Completed': locationTotals.ok,
      'Not Applicable': locationTotals.na,
    },
  ];

  if (audit.serviceAreaPages) {
    categoryComparisonData.push({
      name: 'Service Areas',
      'Priority Issues': serviceAreaTotals.priorityOfi,
      'Opportunities': serviceAreaTotals.ofi,
      'Completed': serviceAreaTotals.ok,
      'Not Applicable': serviceAreaTotals.na,
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
        <CardHeader>
          <CardTitle>Overall SEO Health</CardTitle>
          <CardDescription>
            Overall progress across all audit categories
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <div className="text-lg font-semibold mb-2">Issue Distribution</div>
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
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} items`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-lg font-semibold mb-2">Category Completion</div>
                <div className="space-y-3">
                  {completionProgressData.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {item.icon}
                          <span className="ml-2 text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.progress}%</span>
                      </div>
                      <Progress 
                        value={item.progress} 
                        className={`h-2 ${
                          item.progress > 70 ? "bg-green-500/20" : 
                          item.progress > 40 ? "bg-yellow-500/20" :
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
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
          <CardDescription>
            Compare status distribution across different audit categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[400px]">
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
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Priority Issues" stackId="a" fill="#ef4444" />
                <Bar dataKey="Opportunities" stackId="a" fill="#eab308" />
                <Bar dataKey="Completed" stackId="a" fill="#22c55e" />
                <Bar dataKey="Not Applicable" stackId="a" fill="#9ca3af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Critical issues card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span>Critical Issues Requiring Attention</span>
          </CardTitle>
          <CardDescription>
            Priority issues that should be addressed first
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