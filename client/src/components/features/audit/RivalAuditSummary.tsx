import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  FileText, 
  ClipboardCheck, 
  Phone, 
  Briefcase, 
  MapPin, 
  Globe, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle,
  FileSpreadsheet,
  Download
} from "lucide-react";
import { RivalAudit, EnhancedRivalAudit } from "@shared/schema";
import { useToast } from "@/hooks/ui/use-toast";

interface RivalAuditSummaryProps {
  audit: RivalAudit | EnhancedRivalAudit;
  updatedSummary?: {
    priorityOfiCount: number;
    ofiCount: number;
    okCount: number;
    naCount: number;
    total?: number;
    totalFactors?: number;
  } | null;
}

export default function RivalAuditSummary({ audit, updatedSummary }: RivalAuditSummaryProps) {
  const { toast } = useToast();
  
  // Function to handle exporting to different formats
  const handleExport = (format: 'excel' | 'csv') => {
    try {
      toast({
        title: `Exporting audit data as ${format.toUpperCase()}`,
        description: `Your ${format.toUpperCase()} file is being generated and will download shortly.`,
        duration: 3000
      });
      
      window.open(`/api/rival-audit/1/export?url=${encodeURIComponent(audit.url)}&format=${format}`, '_blank');
    } catch (error) {
      toast({
        title: "Export failed",
        description: `There was an error exporting the audit data to ${format.toUpperCase()}. Please try again.`,
        variant: "destructive",
        duration: 5000
      });
    }
  };
  // Calculate total items for each category
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
    return relevantItems > 0 ? Math.round((totals.ok / relevantItems) * 100) : 0;
  };

  // Get category status
  const getCategoryStatus = (totals: { priorityOfi: number, ofi: number, ok: number, na: number, total: number }) => {
    if (totals.priorityOfi > 0) return "critical";
    if (totals.ofi > 0) return "needs-improvement";
    if (totals.ok > 0) return "good";
    return "unknown";
  };

  // Calculate progress using either the updated summary or the original data
  const summary = updatedSummary || audit.summary;
  
  // Check if this is an enhanced audit (140+ factors)
  const isEnhancedAudit = 'totalFactors' in audit.summary || (audit as any).type === 'enhanced';
  
  // Enhanced audit categories based on the 140+ factor analysis structure
  const getEnhancedCategories = () => {
    if (!isEnhancedAudit) return null;
    
    console.log('[Summary] Enhanced audit data structure:', {
      hasContentQuality: 'contentQuality' in audit,
      hasTechnicalSEO: 'technicalSEO' in audit,
      hasLocalSEO: 'localSEO' in audit,
      hasUxPerformance: 'uxPerformance' in audit,
      contentQualityItems: (audit as any).contentQuality?.items?.length || 0,
      technicalSEOItems: (audit as any).technicalSEO?.items?.length || 0,
      localSEOItems: (audit as any).localSEO?.items?.length || 0,
      uxPerformanceItems: (audit as any).uxPerformance?.items?.length || 0,
      totalFactors: audit.summary.totalFactors || 0
    });
    
    // Check if audit has dedicated enhanced categories with actual items
    const hasEnhancedCategories = 'contentQuality' in audit && 'technicalSEO' in audit && 'localSEO' in audit && 'uxPerformance' in audit;
    const hasEnhancedItems = hasEnhancedCategories && (
      ((audit as any).contentQuality?.items?.length || 0) > 0 ||
      ((audit as any).technicalSEO?.items?.length || 0) > 0 ||
      ((audit as any).localSEO?.items?.length || 0) > 0 ||
      ((audit as any).uxPerformance?.items?.length || 0) > 0
    );
    
    if (hasEnhancedCategories && hasEnhancedItems) {
      console.log('[Summary] Using dedicated enhanced categories from API');
      return {
        contentQuality: (audit as any).contentQuality?.items || [],
        technicalSEO: (audit as any).technicalSEO?.items || [],
        localSEO: (audit as any).localSEO?.items || [],
        uxPerformance: (audit as any).uxPerformance?.items || []
      };
    }
    
    // Enhanced audit without dedicated categories - need to categorize all legacy items by category field
    console.log('[Summary] Enhanced audit without dedicated categories - categorizing legacy items');
    const allItems = [
      ...(audit?.onPage?.items || []),
      ...(audit?.structureNavigation?.items || []),
      ...(audit?.contactPage?.items || []),
      ...(audit?.servicePages?.items || []),
      ...(audit?.locationPages?.items || []),
      ...(audit?.serviceAreaPages?.items || [])
    ];
    
    console.log('[Summary] Total legacy items to categorize:', allItems.length);
    
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
    
    console.log('[Summary] Categorization results:', {
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
      console.log('[Summary] Many uncategorized items detected - applying smart categorization');
      
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
      
      console.log('[Summary] After smart categorization:', {
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
  const isEnhancedAuditWithCategories = enhancedCategories !== null;
  
  // Enhanced category totals
  const contentQualityTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.contentQuality) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };
  const technicalSEOTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.technicalSEO) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };
  const localSEOTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.localSEO) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };
  const uxPerformanceTotals = enhancedCategories ? getCategoryTotals(enhancedCategories.uxPerformance) : { priorityOfi: 0, ofi: 0, ok: 0, na: 0, total: 0 };
  
  // Get total items - prioritize totalFactors for enhanced audits
  const totalItems = isEnhancedAudit && 'totalFactors' in audit.summary 
    ? audit.summary.totalFactors 
    : ('total' in summary ? summary.total : 0) || (
        onPageTotals.total +
        structureTotals.total +
        contactTotals.total +
        serviceTotals.total +
        locationTotals.total +
        serviceAreaTotals.total
      );
  
  // Get total N/A items
  const totalNaItems = summary.naCount;
  
  // Get total OK items
  const totalOkItems = summary.okCount;
  
  // Calculate total relevant items (excluding N/A items)
  const totalRelevantItems = totalItems - totalNaItems;
  
  // Use the OK count as completed items
  const totalCompletedItems = totalOkItems;
  
  // Calculate progress percentage
  const totalProgress = totalRelevantItems > 0 
    ? (totalCompletedItems / totalRelevantItems) * 100 
    : 0;

  return (
    <div className="space-y-6 audit-summary-container">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {isEnhancedAudit ? 'Enhanced ' : ''}Overall Audit Status
            </CardTitle>
            <CardDescription>
              Summary of findings across all audit categories
              {isEnhancedAudit && ` (${totalItems} total factors analyzed)`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 text-xs sm:text-sm" 
              onClick={() => handleExport('excel')}
            >
              <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 text-xs sm:text-sm" 
              onClick={() => handleExport('csv')}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">Overall Progress</div>
                <div className="text-sm font-medium">{Math.round(totalProgress)}%</div>
              </div>
              <Progress 
                value={totalProgress} 
                className={`h-2 ${
                  totalProgress > 70 ? "bg-green-500/20" : 
                  totalProgress > 40 ? "bg-yellow-500/20" :
                  "bg-red-500/20"
                }`}
              />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mt-4">
              <div className="flex items-center gap-1 sm:gap-2 bg-destructive/10 p-2 rounded-md">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                <span className="text-xs sm:text-sm font-medium">{updatedSummary?.priorityOfiCount ?? audit.summary.priorityOfiCount} Priority</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-yellow-500/10 p-2 rounded-md">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <span className="text-xs sm:text-sm font-medium">{updatedSummary?.ofiCount ?? audit.summary.ofiCount} OFI</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-green-500/10 p-2 rounded-md">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">{updatedSummary?.okCount ?? audit.summary.okCount} OK</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-gray-500/10 p-2 rounded-md text-gray-600">
                <span className="text-xs sm:text-sm font-medium">{updatedSummary?.naCount ?? audit.summary.naCount} N/A</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-blue-500/10 p-2 rounded-md text-blue-600 col-span-2 sm:col-span-1">
                <span className="text-xs sm:text-sm font-medium">
                  {totalItems} {isEnhancedAudit ? 'Factors' : 'Total'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        {isEnhancedAuditWithCategories ? (
          // Enhanced Audit Categories
          <>
            {/* Content Quality */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Content Quality</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(contentQualityTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(contentQualityTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(contentQualityTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(contentQualityTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{contentQualityTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{contentQualityTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{contentQualityTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{contentQualityTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical SEO */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Technical SEO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(technicalSEOTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(technicalSEOTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(technicalSEOTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(technicalSEOTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{technicalSEOTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{technicalSEOTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{technicalSEOTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{technicalSEOTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local SEO & E-E-A-T */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Local SEO & E-E-A-T</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(localSEOTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(localSEOTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(localSEOTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(localSEOTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{localSEOTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{localSEOTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{localSEOTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{localSEOTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UX & Performance */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>UX & Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(uxPerformanceTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(uxPerformanceTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(uxPerformanceTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(uxPerformanceTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{uxPerformanceTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{uxPerformanceTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{uxPerformanceTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{uxPerformanceTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Legacy Audit Categories
          <>
            {/* On-Page */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>On-Page SEO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(onPageTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(onPageTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(onPageTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(onPageTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{onPageTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{onPageTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{onPageTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{onPageTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Structure & Navigation */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Structure & Navigation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(structureTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(structureTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(structureTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(structureTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{structureTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{structureTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{structureTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{structureTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Pages */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Contact Page</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(contactTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(contactTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(contactTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(contactTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{contactTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{contactTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{contactTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{contactTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Pages */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Service Pages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(serviceTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(serviceTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(serviceTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(serviceTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{serviceTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{serviceTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{serviceTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{serviceTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Pages */}
            <Card>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span>Location Pages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(locationTotals))}%
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(locationTotals)} 
                    className={`h-2 ${
                      getCategoryStatus(locationTotals) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(locationTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                      "bg-red-500/20"
                    }`}
                  />
                  <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                    <div className="text-center">
                      <div className="text-destructive font-medium">{locationTotals.priorityOfi}</div>
                      <div className="text-muted-foreground">Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{locationTotals.ofi}</div>
                      <div className="text-muted-foreground">OFI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{locationTotals.ok}</div>
                      <div className="text-muted-foreground">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-medium">{locationTotals.na}</div>
                      <div className="text-muted-foreground">N/A</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Area Pages */}
            {audit.serviceAreaPages && (
              <Card>
                <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span>Service Area Pages</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-2">
                    <div className="flex justify-between mb-1">
                      <div className="text-xs sm:text-sm font-medium">Completion Status</div>
                      <div className="text-xs sm:text-sm font-medium">
                        {Math.round(getCategoryProgress(serviceAreaTotals))}%
                      </div>
                    </div>
                    <Progress 
                      value={getCategoryProgress(serviceAreaTotals)} 
                      className={`h-2 ${
                        getCategoryStatus(serviceAreaTotals) === "good" ? "bg-green-500/20" : 
                        getCategoryStatus(serviceAreaTotals) === "needs-improvement" ? "bg-yellow-500/20" :
                        "bg-red-500/20"
                      }`}
                    />
                    <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs mt-2">
                      <div className="text-center">
                        <div className="text-destructive font-medium">{serviceAreaTotals.priorityOfi}</div>
                        <div className="text-muted-foreground">Priority</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-600 font-medium">{serviceAreaTotals.ofi}</div>
                        <div className="text-muted-foreground">OFI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 font-medium">{serviceAreaTotals.ok}</div>
                        <div className="text-muted-foreground">OK</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600 font-medium">{serviceAreaTotals.na}</div>
                        <div className="text-muted-foreground">N/A</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}