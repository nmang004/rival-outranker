import React from 'react';
import { RivalAudit } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Rocket,
  Zap
} from "lucide-react";

interface RivalAuditRecommendationsProps {
  audit: RivalAudit;
}

export default function RivalAuditRecommendations({ audit }: RivalAuditRecommendationsProps) {
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

  // Get all priority issues
  const allPriorityIssues = [
    ...audit.onPage.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'On-Page' })),
    ...audit.structureNavigation.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Structure' })),
    ...audit.contactPage.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Contact' })),
    ...audit.servicePages.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Services' })),
    ...audit.locationPages.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Locations' })),
  ];

  if (audit.serviceAreaPages) {
    allPriorityIssues.push(
      ...audit.serviceAreaPages.items.filter(item => item.status === "Priority OFI").map(item => ({ ...item, category: 'Service Areas' }))
    );
  }

  // Determine which categories need the most attention
  const categoriesWithIssues = [
    { name: 'On-Page', issues: onPageTotals.priorityOfi + onPageTotals.ofi, priorityIssues: onPageTotals.priorityOfi },
    { name: 'Structure', issues: structureTotals.priorityOfi + structureTotals.ofi, priorityIssues: structureTotals.priorityOfi },
    { name: 'Contact', issues: contactTotals.priorityOfi + contactTotals.ofi, priorityIssues: contactTotals.priorityOfi },
    { name: 'Services', issues: serviceTotals.priorityOfi + serviceTotals.ofi, priorityIssues: serviceTotals.priorityOfi },
    { name: 'Locations', issues: locationTotals.priorityOfi + locationTotals.ofi, priorityIssues: locationTotals.priorityOfi },
  ];

  if (audit.serviceAreaPages) {
    categoriesWithIssues.push({
      name: 'Service Areas',
      issues: serviceAreaTotals.priorityOfi + serviceAreaTotals.ofi,
      priorityIssues: serviceAreaTotals.priorityOfi
    });
  }

  // Sort by priority issues (highest first), then by total issues
  categoriesWithIssues.sort((a, b) => {
    if (b.priorityIssues !== a.priorityIssues) {
      return b.priorityIssues - a.priorityIssues;
    }
    return b.issues - a.issues;
  });

  // Get top categories that need attention
  const topCategoriesNeedingAttention = categoriesWithIssues
    .filter(cat => cat.issues > 0)
    .slice(0, 3);

  // Generate recommendations
  const getRecommendationText = () => {
    if (allPriorityIssues.length === 0) {
      if (audit.summary.ofiCount === 0) {
        return "Your site is performing exceptionally well, with no critical issues or opportunities for improvement detected. Continue monitoring your site to maintain this excellent standard.";
      } else {
        return "Your site is performing well with no critical issues, but there are still some opportunities for improvement that could enhance your SEO performance.";
      }
    } else if (allPriorityIssues.length > 10) {
      return "Your site has significant SEO issues that require immediate attention. Focus on addressing the priority issues first, particularly those related to on-page elements and site structure.";
    } else {
      return "Your site has some critical SEO issues that should be addressed soon. Resolving these priority items will help improve your search visibility and user experience.";
    }
  };

  // Calculate timeline estimate
  const getTimelineEstimate = () => {
    const totalIssues = audit.summary.priorityOfiCount + audit.summary.ofiCount;
    
    if (totalIssues === 0) {
      return "No timeline needed - site is already optimized";
    } else if (totalIssues <= 5) {
      return "1-2 weeks";
    } else if (totalIssues <= 15) {
      return "2-4 weeks";
    } else if (totalIssues <= 30) {
      return "1-2 months";
    } else {
      return "2-3 months";
    }
  };

  // Determine expected impact
  const getExpectedImpact = () => {
    if (audit.summary.priorityOfiCount === 0 && audit.summary.ofiCount < 5) {
      return "Minimal - Site is already well-optimized";
    } else if (audit.summary.priorityOfiCount >= 10) {
      return "High - Significant improvement potential";
    } else if (audit.summary.priorityOfiCount >= 5) {
      return "Medium-High - Notable improvement potential";
    } else if (audit.summary.priorityOfiCount > 0) {
      return "Medium - Moderate improvement potential";
    } else {
      return "Low-Medium - Some improvement potential";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b">
          <div className="flex items-center">
            <Lightbulb className="h-6 w-6 mr-2 text-yellow-500" />
            <CardTitle>Rival Recommendations</CardTitle>
          </div>
          <CardDescription>
            Based on your audit results, here are our recommended actions for improving SEO performance and outperforming competitors
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Summary & Strategy</h3>
              <p className="text-muted-foreground">
                {getRecommendationText()}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Priority Focus Areas</h3>
              {topCategoriesNeedingAttention.length > 0 ? (
                <div className="space-y-4">
                  {topCategoriesNeedingAttention.map((category, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {category.priorityIssues > 0 ? (
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <p className="text-sm text-muted-foreground">
                          {category.priorityIssues > 0 
                            ? `${category.priorityIssues} priority issues and ${category.issues - category.priorityIssues} opportunities for improvement` 
                            : `${category.issues} opportunities for improvement`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">All Areas Optimized</div>
                    <p className="text-sm text-muted-foreground">
                      Your site is well-optimized across all categories. Continue to monitor for maintaining performance.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">Estimated Timeline</h4>
                </div>
                <p className="text-muted-foreground text-sm">{getTimelineEstimate()}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium">Expected Impact</h4>
                </div>
                <p className="text-muted-foreground text-sm">{getExpectedImpact()}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h4 className="font-medium">Quick Wins</h4>
                </div>
                <p className="text-muted-foreground text-sm">
                  {allPriorityIssues.length > 0 
                    ? `Address ${allPriorityIssues.length} priority issues first` 
                    : "Focus on remaining OFI items"}
                </p>
              </div>
            </div>
            
            {allPriorityIssues.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
                <ol className="space-y-2 ml-5 list-decimal">
                  <li className="text-muted-foreground">Review and address all priority issues highlighted in the audit</li>
                  <li className="text-muted-foreground">Focus on the most critical categories first: {topCategoriesNeedingAttention.map(c => c.name).join(', ')}</li>
                  <li className="text-muted-foreground">After fixing priority issues, work on opportunities for improvement</li>
                  <li className="text-muted-foreground">Re-audit your site after implementing changes to track progress</li>
                </ol>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t flex justify-end">
          <Button className="gap-2">
            <span>Get Implementation Quote</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}