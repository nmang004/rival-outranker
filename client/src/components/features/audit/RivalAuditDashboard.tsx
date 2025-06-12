import React, { useRef } from 'react';
import { RivalAudit, EnhancedRivalAudit } from '@shared/schema';
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
import PageIssuesDropdown from "./PageIssuesDropdown";

interface RivalAuditDashboardProps {
  audit: RivalAudit | EnhancedRivalAudit;
  updatedSummary: {
    priorityOfiCount: number;
    ofiCount: number;
    okCount: number;
    naCount: number;
    total?: number;
    totalFactors?: number;
  } | null;
}

export default function RivalAuditDashboard({ audit, updatedSummary }: RivalAuditDashboardProps) {
  // Chart refs for export functionality
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  
  // Early return if audit is not loaded
  if (!audit || !audit.summary) {
    return <div>Loading audit data...</div>;
  }
  
  // Check if this is an enhanced audit
  const isEnhancedAudit = 'totalFactors' in audit.summary;
  
  // Debug: Log enhanced audit detection
  console.log('[Dashboard] Enhanced audit detection:', {
    isEnhancedAudit,
    summaryKeys: Object.keys(audit.summary),
    hasTotalFactors: 'totalFactors' in audit.summary,
    totalFactors: audit.summary.totalFactors,
    auditKeys: Object.keys(audit)
  });
  
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

  // Enhanced audit categories - use dedicated enhanced categories if available
  const getEnhancedCategories = () => {
    if (!isEnhancedAudit || !audit) return null;
    
    // Debug: Log what we received
    console.log('[Dashboard] Enhanced audit data received:', {
      hasContentQuality: audit && 'contentQuality' in audit,
      hasTechnicalSEO: audit && 'technicalSEO' in audit,
      hasLocalSEO: audit && 'localSEO' in audit,
      hasUxPerformance: audit && 'uxPerformance' in audit,
      contentQualityItems: (audit as any)?.contentQuality?.items?.length || 0,
      technicalSEOItems: (audit as any)?.technicalSEO?.items?.length || 0,
      localSEOItems: (audit as any)?.localSEO?.items?.length || 0,
      uxPerformanceItems: (audit as any)?.uxPerformance?.items?.length || 0,
      totalFactors: audit?.summary?.totalFactors || audit?.summary?.total || 0
    });
    
    // Check if audit has dedicated enhanced categories with actual items
    const hasEnhancedCategories = audit && 'contentQuality' in audit && 'technicalSEO' in audit && 'localSEO' in audit && 'uxPerformance' in audit;
    const hasEnhancedItems = hasEnhancedCategories && (
      ((audit as any).contentQuality?.items?.length || 0) > 0 ||
      ((audit as any).technicalSEO?.items?.length || 0) > 0 ||
      ((audit as any).localSEO?.items?.length || 0) > 0 ||
      ((audit as any).uxPerformance?.items?.length || 0) > 0
    );
    
    if (hasEnhancedCategories && hasEnhancedItems) {
      console.log('[Dashboard] Using dedicated enhanced categories');
      return {
        contentQuality: (audit as any).contentQuality?.items || [],
        technicalSEO: (audit as any).technicalSEO?.items || [],
        localSEO: (audit as any).localSEO?.items || [],
        uxPerformance: (audit as any).uxPerformance?.items || []
      };
    }
    
    // Enhanced audit without dedicated categories - need to categorize all legacy items by category field
    console.log('[Dashboard] Enhanced audit without dedicated categories - categorizing legacy items');
    const allItems = [
      ...(audit?.onPage?.items || []),
      ...(audit?.structureNavigation?.items || []),
      ...(audit?.contactPage?.items || []),
      ...(audit?.servicePages?.items || []),
      ...(audit?.locationPages?.items || []),
      ...(audit?.serviceAreaPages?.items || [])
    ];
    
    console.log('[Dashboard] Total legacy items to categorize:', allItems.length);
    console.log('[Dashboard] Sample item categories:', allItems.slice(0, 5).map(item => ('category' in item ? item.category : 'no category')));
    
    const contentQuality = allItems.filter(item => 
      'category' in item && item.category && (
        item.category.includes('Content Quality') ||
        item.category.includes('Content') ||
        item.category.includes('Readability') ||
        item.category.includes('Engagement') ||
        item.category.includes('Social Proof') ||
        item.category.includes('Review') ||
        item.category.includes('CTA')
      )
    );
    
    const technicalSEO = allItems.filter(item => 
      'category' in item && item.category && (
        item.category.includes('Technical SEO') ||
        item.category.includes('Technical') ||
        item.category.includes('Schema') ||
        item.category.includes('URL') ||
        item.category.includes('Meta') ||
        item.category.includes('Navigation') ||
        item.category.includes('Internal Linking') ||
        item.category.includes('Duplicate Content')
      )
    );
    
    const localSEO = allItems.filter(item => 
      'category' in item && item.category && (
        item.category.includes('Local SEO') ||
        item.category.includes('Local') ||
        item.category.includes('NAP') ||
        item.category.includes('E-E-A-T') ||
        item.category.includes('Trust') ||
        item.category.includes('Contact') ||
        item.category.includes('Service Area') ||
        item.category.includes('Location')
      )
    );
    
    const uxPerformance = allItems.filter(item => 
      'category' in item && item.category && (
        item.category.includes('UX') ||
        item.category.includes('Performance') ||
        item.category.includes('Mobile') ||
        item.category.includes('Accessibility') ||
        item.category.includes('User Experience') ||
        item.category.includes('Form') ||
        item.category.includes('Visual')
      )
    );
    
    // Items that don't match any enhanced category
    const categorizedItems = new Set([...contentQuality, ...technicalSEO, ...localSEO, ...uxPerformance]);
    const uncategorized = allItems.filter(item => !categorizedItems.has(item));
    
    console.log('[Dashboard] Categorization results:', {
      contentQuality: contentQuality.length,
      technicalSEO: technicalSEO.length,
      localSEO: localSEO.length,
      uxPerformance: uxPerformance.length,
      uncategorized: uncategorized.length,
      total: allItems.length
    });
    
    // If we have very few items in enhanced categories but many uncategorized,
    // the category field matching isn't working - distribute items more evenly
    if (uncategorized.length > (contentQuality.length + technicalSEO.length + localSEO.length + uxPerformance.length)) {
      console.log('[Dashboard] Many uncategorized items detected - applying smart categorization');
      
      // Smart categorization based on item names and context when category field is missing
      uncategorized.forEach(item => {
        const itemName = item.name.toLowerCase();
        const itemDescription = (item.description || '').toLowerCase();
        const combined = itemName + ' ' + itemDescription;
        
        if (combined.includes('content') || combined.includes('text') || combined.includes('readability') || 
            combined.includes('heading') || combined.includes('title') || combined.includes('description') ||
            combined.includes('review') || combined.includes('social') || combined.includes('cta') || combined.includes('call')) {
          contentQuality.push(item);
        } else if (combined.includes('meta') || combined.includes('schema') || combined.includes('url') || 
                   combined.includes('link') || combined.includes('navigation') || combined.includes('technical') ||
                   combined.includes('seo') || combined.includes('duplicate') || combined.includes('canonical')) {
          technicalSEO.push(item);
        } else if (combined.includes('local') || combined.includes('contact') || combined.includes('address') || 
                   combined.includes('phone') || combined.includes('location') || combined.includes('nap') ||
                   combined.includes('trust') || combined.includes('expertise') || combined.includes('authority')) {
          localSEO.push(item);
        } else if (combined.includes('mobile') || combined.includes('performance') || combined.includes('speed') || 
                   combined.includes('accessibility') || combined.includes('form') || combined.includes('user') ||
                   combined.includes('ux') || combined.includes('visual') || combined.includes('loading')) {
          uxPerformance.push(item);
        } else {
          // Default to technical SEO for remaining items
          technicalSEO.push(item);
        }
      });
      
      console.log('[Dashboard] After smart categorization:', {
        contentQuality: contentQuality.length,
        technicalSEO: technicalSEO.length,
        localSEO: localSEO.length,
        uxPerformance: uxPerformance.length
      });
    }
    
    return {
      contentQuality,
      technicalSEO,
      localSEO,
      uxPerformance
    };
  };

  const enhancedCategories = getEnhancedCategories();

  // Legacy category totals with null safety
  const onPageTotals = getCategoryTotals(audit?.onPage?.items || []);
  const structureTotals = getCategoryTotals(audit?.structureNavigation?.items || []);
  const contactTotals = getCategoryTotals(audit?.contactPage?.items || []);
  const serviceTotals = getCategoryTotals(audit?.servicePages?.items || []);
  const locationTotals = getCategoryTotals(audit?.locationPages?.items || []);
  const serviceAreaTotals = audit?.serviceAreaPages
    ? getCategoryTotals(audit.serviceAreaPages.items || [])
    : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };

  // Enhanced category totals
  const contentQualityTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.contentQuality) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };
  const technicalSEOTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.technicalSEO) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };
  const localSEOTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.localSEO) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };
  const uxPerformanceTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.uxPerformance) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };

  // Define isEnhancedAuditWithCategories here, before it's used
  const isEnhancedAuditWithCategories = enhancedCategories !== null;

  // Get category progress as percentage (excluding N/A items)
  const getCategoryProgress = (totals: { priorityOfi: number, ofi: number, ok: number, na: number, total: number }) => {
    const relevantItems = totals.total - totals.na;
    return relevantItems > 0 ? Math.round((totals.ok / relevantItems) * 100) : 0;
  };

  // Calculate accurate status distribution from our categorized data
  const calculateStatusDistribution = () => {
    // CRITICAL FIX: Always prioritize updatedSummary if available for real-time updates
    if (updatedSummary) {
      console.log('[Dashboard] Using updatedSummary for status distribution:', updatedSummary);
      return {
        priorityOfiCount: updatedSummary.priorityOfiCount,
        ofiCount: updatedSummary.ofiCount,
        okCount: updatedSummary.okCount,
        naCount: updatedSummary.naCount
      };
    } else if (isEnhancedAuditWithCategories && enhancedCategories) {
      // Use our enhanced category totals for accurate counts when no real-time updates
      console.log('[Dashboard] Using enhanced category totals for status distribution');
      return {
        priorityOfiCount: contentQualityTotals.priorityOfi + technicalSEOTotals.priorityOfi + localSEOTotals.priorityOfi + uxPerformanceTotals.priorityOfi,
        ofiCount: contentQualityTotals.ofi + technicalSEOTotals.ofi + localSEOTotals.ofi + uxPerformanceTotals.ofi,
        okCount: contentQualityTotals.ok + technicalSEOTotals.ok + localSEOTotals.ok + uxPerformanceTotals.ok,
        naCount: contentQualityTotals.na + technicalSEOTotals.na + localSEOTotals.na + uxPerformanceTotals.na
      };
    } else {
      // Fall back to audit summary for legacy audits
      console.log('[Dashboard] Using audit summary for status distribution');
      return {
        priorityOfiCount: audit.summary.priorityOfiCount,
        ofiCount: audit.summary.ofiCount,
        okCount: audit.summary.okCount,
        naCount: audit.summary.naCount
      };
    }
  };
  
  const statusCounts = calculateStatusDistribution();
  
  // Prepare data for status distribution chart
  const statusDistributionData = [
    { 
      name: 'Priority Issues', 
      value: statusCounts.priorityOfiCount, 
      color: '#ef4444' 
    },
    { 
      name: 'Opportunities', 
      value: statusCounts.ofiCount, 
      color: '#eab308' 
    },
    { 
      name: 'Completed', 
      value: statusCounts.okCount, 
      color: '#22c55e' 
    },
    { 
      name: 'Not Applicable', 
      value: statusCounts.naCount, 
      color: '#9ca3af' 
    },
  ];

  // Prepare data for category comparison chart
  // Ensure we have at least a minimal value (0.1) for all categories to ensure they display
  const ensureMinValue = (val: number) => val === 0 ? 0.1 : val;
  
  const categoryComparisonData = isEnhancedAudit ? [
    {
      name: 'Content Quality',
      'Priority Issues': ensureMinValue(contentQualityTotals.priorityOfi),
      'Opportunities': ensureMinValue(contentQualityTotals.ofi),
      'Completed': ensureMinValue(contentQualityTotals.ok),
      'Not Applicable': ensureMinValue(contentQualityTotals.na),
    },
    {
      name: 'Technical SEO',
      'Priority Issues': ensureMinValue(technicalSEOTotals.priorityOfi),
      'Opportunities': ensureMinValue(technicalSEOTotals.ofi),
      'Completed': ensureMinValue(technicalSEOTotals.ok),
      'Not Applicable': ensureMinValue(technicalSEOTotals.na),
    },
    {
      name: 'Local SEO & E-E-A-T',
      'Priority Issues': ensureMinValue(localSEOTotals.priorityOfi),
      'Opportunities': ensureMinValue(localSEOTotals.ofi),
      'Completed': ensureMinValue(localSEOTotals.ok),
      'Not Applicable': ensureMinValue(localSEOTotals.na),
    },
    {
      name: 'UX & Performance',
      'Priority Issues': ensureMinValue(uxPerformanceTotals.priorityOfi),
      'Opportunities': ensureMinValue(uxPerformanceTotals.ofi),
      'Completed': ensureMinValue(uxPerformanceTotals.ok),
      'Not Applicable': ensureMinValue(uxPerformanceTotals.na),
    },
  ] : [
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

  if (!isEnhancedAudit && audit.serviceAreaPages) {
    categoryComparisonData.push({
      name: 'Service Areas',
      'Priority Issues': ensureMinValue(serviceAreaTotals.priorityOfi),
      'Opportunities': ensureMinValue(serviceAreaTotals.ofi),
      'Completed': ensureMinValue(serviceAreaTotals.ok),
      'Not Applicable': ensureMinValue(serviceAreaTotals.na),
    });
  }

  // Prepare data for completion progress chart
  const completionProgressData = isEnhancedAudit ? [
    {
      name: 'Content Quality',
      progress: Math.round(getCategoryProgress(contentQualityTotals)),
      icon: <FileText className="h-4 w-4 text-primary" />,
    },
    {
      name: 'Technical SEO',
      progress: Math.round(getCategoryProgress(technicalSEOTotals)),
      icon: <ClipboardCheck className="h-4 w-4 text-primary" />,
    },
    {
      name: 'Local SEO & E-E-A-T',
      progress: Math.round(getCategoryProgress(localSEOTotals)),
      icon: <Phone className="h-4 w-4 text-primary" />,
    },
    {
      name: 'UX & Performance',
      progress: Math.round(getCategoryProgress(uxPerformanceTotals)),
      icon: <Briefcase className="h-4 w-4 text-primary" />,
    },
  ] : [
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

  if (!isEnhancedAudit && audit.serviceAreaPages) {
    completionProgressData.push({
      name: 'Service Areas',
      progress: Math.round(getCategoryProgress(serviceAreaTotals)),
      icon: <Globe className="h-4 w-4 text-primary" />,
    });
  }

  // Generate critical issues list with null safety
  const criticalIssues = isEnhancedAudit && enhancedCategories ? [
    ...enhancedCategories.contentQuality.filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Content Quality' })),
    ...enhancedCategories.technicalSEO.filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Technical SEO' })),
    ...enhancedCategories.localSEO.filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Local SEO & E-E-A-T' })),
    ...enhancedCategories.uxPerformance.filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'UX & Performance' })),
  ] : [
    ...(audit?.onPage?.items || []).filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'On-Page' })),
    ...(audit?.structureNavigation?.items || []).filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Structure' })),
    ...(audit?.contactPage?.items || []).filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Contact' })),
    ...(audit?.servicePages?.items || []).filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Services' })),
    ...(audit?.locationPages?.items || []).filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Locations' })),
  ];

  if (!isEnhancedAudit && audit?.serviceAreaPages) {
    criticalIssues.push(
      ...(audit.serviceAreaPages.items || []).filter(item => item.status === "Priority OFI").map(item => ({ ...item, categoryLabel: 'Service Areas' }))
    );
  }

  // Calculate total audit progress - ensure consistency with category totals
  // Note: isEnhancedAuditWithCategories is already defined above
  
  // Debug: Log totals to verify consistency
  console.log('[Dashboard] Progress calculation:', {
    isEnhancedAuditWithCategories,
    contentQualityTotals,
    technicalSEOTotals,
    localSEOTotals,
    uxPerformanceTotals,
    legacyTotals: { onPageTotals, structureTotals, contactTotals, serviceTotals, locationTotals, serviceAreaTotals }
  });
  
  const totalRelevantItems = isEnhancedAuditWithCategories && enhancedCategories ? 
    // Enhanced audit calculation - use the same data source as individual categories
    (contentQualityTotals.total - contentQualityTotals.na) +
    (technicalSEOTotals.total - technicalSEOTotals.na) +
    (localSEOTotals.total - localSEOTotals.na) +
    (uxPerformanceTotals.total - uxPerformanceTotals.na) :
    // Legacy audit calculation
    onPageTotals.total - onPageTotals.na +
    structureTotals.total - structureTotals.na +
    contactTotals.total - contactTotals.na +
    serviceTotals.total - serviceTotals.na +
    locationTotals.total - locationTotals.na +
    (serviceAreaTotals.total - serviceAreaTotals.na);
  
  const totalCompletedItems = isEnhancedAuditWithCategories && enhancedCategories ?
    // Enhanced audit calculation - use the same data source as individual categories
    contentQualityTotals.ok +
    technicalSEOTotals.ok +
    localSEOTotals.ok +
    uxPerformanceTotals.ok :
    // Legacy audit calculation
    onPageTotals.ok +
    structureTotals.ok +
    contactTotals.ok +
    serviceTotals.ok +
    locationTotals.ok +
    serviceAreaTotals.ok;
  
  const totalProgress = totalRelevantItems > 0 
    ? (totalCompletedItems / totalRelevantItems) * 100 
    : 0;
    
  // Calculate grand total of all items for verification
  const grandTotalItems = isEnhancedAuditWithCategories && enhancedCategories ?
    contentQualityTotals.total + technicalSEOTotals.total + localSEOTotals.total + uxPerformanceTotals.total :
    onPageTotals.total + structureTotals.total + contactTotals.total + serviceTotals.total + locationTotals.total + serviceAreaTotals.total;
    
  console.log('[Dashboard] Total calculation verification:', {
    grandTotalItems,
    totalRelevantItems,
    totalCompletedItems,
    totalProgress: Math.round(totalProgress),
    summaryTotal: audit.summary.totalFactors || audit.summary.total || 0
  });

  // Get total factors for display - use calculated grand total for consistency
  const totalFactors = isEnhancedAuditWithCategories ? 
    grandTotalItems : // Use our calculated total for enhanced audits to ensure consistency
    (updatedSummary?.total || ('total' in audit.summary ? audit.summary.total : 0));

  // Check if audit has priority breakdown data (new weighted OFI feature)
  const hasPriorityBreakdown = isEnhancedAudit && 'priorityBreakdown' in audit.summary && audit.summary.priorityBreakdown;
  
  // Prepare priority breakdown data for visualization
  const priorityBreakdownData = hasPriorityBreakdown ? [
    {
      name: 'High Priority (Tier 1)',
      pages: audit.summary.priorityBreakdown!.tier1.pages,
      weight: audit.summary.priorityBreakdown!.tier1.weight,
      ofi: audit.summary.priorityBreakdown!.tier1.ofi,
      color: '#ef4444',
      multiplier: '3x'
    },
    {
      name: 'Medium Priority (Tier 2)', 
      pages: audit.summary.priorityBreakdown!.tier2.pages,
      weight: audit.summary.priorityBreakdown!.tier2.weight,
      ofi: audit.summary.priorityBreakdown!.tier2.ofi,
      color: '#f59e0b',
      multiplier: '2x'
    },
    {
      name: 'Low Priority (Tier 3)',
      pages: audit.summary.priorityBreakdown!.tier3.pages,
      weight: audit.summary.priorityBreakdown!.tier3.weight,
      ofi: audit.summary.priorityBreakdown!.tier3.ofi,
      color: '#10b981',
      multiplier: '1x'
    }
  ] : null;

  return (
    <div className="space-y-6">
      {/* Overall progress card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>
              {isEnhancedAudit || isEnhancedAuditWithCategories ? 'Enhanced ' : ''}SEO Health & Performance Dashboard
            </CardTitle>
            <CardDescription>
              Comprehensive view of website's SEO health with {totalFactors} analyzed factors
              {(isEnhancedAudit || isEnhancedAuditWithCategories) && ' including advanced content quality, technical SEO, and E-E-A-T analysis'}
            </CardDescription>
          </div>
          <ChartExport 
            chartRef={pieChartRef}
            filename={(isEnhancedAudit || isEnhancedAuditWithCategories) ? "enhanced-seo-health-performance-dashboard" : "seo-health-performance-dashboard"}
            title={`Export ${(isEnhancedAudit || isEnhancedAuditWithCategories) ? 'Enhanced ' : ''}SEO Dashboard`}
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
                  <div className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                    {(isEnhancedAudit || isEnhancedAuditWithCategories) ? 'Enhanced ' : ''}SEO Issue Distribution
                  </div>
                  <div className="h-[200px] sm:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
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
                          
                          // Use our calculated totals for accuracy
                          const total = statusCounts.priorityOfiCount + statusCounts.ofiCount + statusCounts.okCount + statusCounts.naCount;
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
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full min-w-[50px] text-center ${
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

      {/* Priority-Weighted OFI Breakdown - Show weighted scoring impact */}
      {hasPriorityBreakdown && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b">
            <CardTitle className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50 mr-3">
                <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Priority-Weighted OFI Analysis
            </CardTitle>
            <CardDescription>
              Pages are weighted by business importance: High Priority (3x), Medium Priority (2x), Low Priority (1x)
              {audit.summary.priorityBreakdown!.confidence && (
                <span className="block mt-1 text-sm">
                  Analysis confidence: {Math.round(audit.summary.priorityBreakdown!.confidence * 100)}%
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority tier breakdown */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Page Priority Distribution
                </h4>
                <div className="space-y-3">
                  {priorityBreakdownData!.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3" 
                          style={{ backgroundColor: tier.color }}
                        />
                        <div>
                          <div className="font-medium text-sm">{tier.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Weight: {tier.multiplier}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{tier.pages} pages</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {tier.ofi} OFI issues
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weighted OFI metrics */}
              <div>
                <h4 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Weighted OFI Impact
                </h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Raw Weighted OFI</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(audit.summary.priorityBreakdown!.totalWeightedOFI * 100) / 100}
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-900 dark:text-green-100">Normalized OFI</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {Math.round(audit.summary.priorityBreakdown!.normalizedOFI * 100) / 100}
                    </div>
                  </div>

                  {audit.summary.priorityBreakdown!.sizeAdjustedOFI && (
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Size-Adjusted OFI</div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {Math.round(audit.summary.priorityBreakdown!.sizeAdjustedOFI * 100) / 100}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        Accounts for site size and distribution
                      </div>
                    </div>
                  )}
                </div>

                {/* Normalization factors display */}
                {audit.summary.priorityBreakdown!.normalizationFactors && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Normalization Factors:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">Size</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {audit.summary.priorityBreakdown!.normalizationFactors.sizeNormalization}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Balance</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {Math.round(audit.summary.priorityBreakdown!.normalizationFactors.distributionBalance * 100) / 100}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Representation</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {audit.summary.priorityBreakdown!.normalizationFactors.tierRepresentation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Weighted overall score display */}
            {audit.summary.weightedOverallScore && (
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                      Priority-Weighted Overall Score
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">
                      Accounts for page business importance
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round(audit.summary.weightedOverallScore)}%
                    </div>
                    {audit.summary.overallScore && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Standard: {Math.round(audit.summary.overallScore)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Page Issues Dropdown - Show pages with Priority OFI/OFI issues */}
      {'pageIssues' in audit && audit.pageIssues && (
        <PageIssuesDropdown pageIssues={audit.pageIssues} />
      )}

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
                      <div className="text-sm text-muted-foreground">{(issue as any).categoryLabel || (issue as any).category}</div>
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