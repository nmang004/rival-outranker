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

  // Get category progress using importance-weighted scoring (matching backend logic)
  const getCategoryProgress = (totals: { priorityOfi: number, ofi: number, ok: number, na: number, total: number }, items?: any[]) => {
    if (totals.total === 0) return 0;
    
    // If we have access to individual items with importance, use detailed calculation
    if (items && items.length > 0) {
      let totalWeightedScore = 0;
      
      items.forEach(item => {
        let finalScore = 0;
        
        // SIMPLIFIED IMPORTANCE-BASED SCORING (matching backend)
        switch (item.status) {
          case 'OK':
            // OK items are always perfect regardless of importance
            finalScore = 100;
            break;
            
          case 'N/A':
            // N/A items are always perfect (not applicable)
            finalScore = 100;
            break;
            
          case 'OFI':
            // OFI items: Base 60 points, minus importance penalty
            let ofiPenalty = 0;
            switch (item.importance) {
              case 'High':
                ofiPenalty = 15; // 60 - 15 = 45 points
                break;
              case 'Medium':
                ofiPenalty = 10; // 60 - 10 = 50 points
                break;
              case 'Low':
                ofiPenalty = 5;  // 60 - 5 = 55 points
                break;
              default:
                ofiPenalty = 10; // Default to Medium penalty
            }
            finalScore = 60 - ofiPenalty;
            break;
            
          case 'Priority OFI':
            // Priority OFI items: Base 30 points, minus importance penalty
            let priorityPenalty = 0;
            switch (item.importance) {
              case 'High':
                priorityPenalty = 15; // 30 - 15 = 15 points
                break;
              case 'Medium':
                priorityPenalty = 10; // 30 - 10 = 20 points
                break;
              case 'Low':
                priorityPenalty = 5;  // 30 - 5 = 25 points
                break;
              default:
                priorityPenalty = 10; // Default to Medium penalty
            }
            finalScore = 30 - priorityPenalty;
            break;
            
          default:
            finalScore = 0;
        }
        
        totalWeightedScore += finalScore;
      });
      
      return Math.round(totalWeightedScore / items.length);
    }
    
    // Fallback: Assume Medium importance for legacy data  
    // OK = 100, OFI = 50 (60-10), Priority OFI = 20 (30-10), N/A = 100
    const weightedScore = (
      (totals.ok * 100) + 
      (totals.ofi * 50) + 
      (totals.priorityOfi * 20) + 
      (totals.na * 100)
    ) / totals.total;
    
    return Math.round(weightedScore);
  };

  // Get category status based on SEO score
  const getCategoryStatus = (score: number) => {
    if (score >= 80) return "good";
    if (score >= 60) return "needs-improvement";
    return "critical";
  };
  
  // Legacy category status (for non-enhanced audits) - now using score-based logic
  const getLegacyCategoryStatus = (score: number) => {
    if (score >= 80) return "good";
    if (score >= 60) return "needs-improvement";
    return "critical";
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
      totalFactors: ('totalFactors' in audit.summary ? (audit.summary as any).totalFactors : ('total' in audit.summary ? (audit.summary as any).total : 0)) || 0
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
  
  // Get backend-calculated category scores (importance-weighted)
  const categoryScores = (audit.summary as any).categoryScores || {};
  const getBackendCategoryScore = (categoryName: string) => {
    return categoryScores[categoryName] || 0;
  };
  
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {getBackendCategoryScore('Content Quality')}/100
                    </div>
                  </div>
                  <Progress 
                    value={getBackendCategoryScore('Content Quality')} 
                    className={`h-2 ${
                      getCategoryStatus(getBackendCategoryScore('Content Quality')) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getBackendCategoryScore('Content Quality')) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {getBackendCategoryScore('Technical SEO')}/100
                    </div>
                  </div>
                  <Progress 
                    value={getBackendCategoryScore('Technical SEO')} 
                    className={`h-2 ${
                      getCategoryStatus(getBackendCategoryScore('Technical SEO')) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getBackendCategoryScore('Technical SEO')) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {getBackendCategoryScore('Local SEO & E-E-A-T')}/100
                    </div>
                  </div>
                  <Progress 
                    value={getBackendCategoryScore('Local SEO & E-E-A-T')} 
                    className={`h-2 ${
                      getCategoryStatus(getBackendCategoryScore('Local SEO & E-E-A-T')) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getBackendCategoryScore('Local SEO & E-E-A-T')) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {getBackendCategoryScore('UX & Performance')}/100
                    </div>
                  </div>
                  <Progress 
                    value={getBackendCategoryScore('UX & Performance')} 
                    className={`h-2 ${
                      getCategoryStatus(getBackendCategoryScore('UX & Performance')) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getBackendCategoryScore('UX & Performance')) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(onPageTotals, audit.onPage.items))}/100
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(onPageTotals, audit.onPage.items)} 
                    className={`h-2 ${
                      getCategoryStatus(getCategoryProgress(onPageTotals, audit.onPage.items)) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getCategoryProgress(onPageTotals, audit.onPage.items)) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(structureTotals, audit.structureNavigation.items))}/100
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(structureTotals, audit.structureNavigation.items)} 
                    className={`h-2 ${
                      getCategoryStatus(getCategoryProgress(structureTotals, audit.structureNavigation.items)) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getCategoryProgress(structureTotals, audit.structureNavigation.items)) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(contactTotals, audit.contactPage.items))}/100
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(contactTotals, audit.contactPage.items)} 
                    className={`h-2 ${
                      getCategoryStatus(getCategoryProgress(contactTotals, audit.contactPage.items)) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getCategoryProgress(contactTotals, audit.contactPage.items)) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(serviceTotals, audit.servicePages.items))}/100
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(serviceTotals, audit.servicePages.items)} 
                    className={`h-2 ${
                      getCategoryStatus(getCategoryProgress(serviceTotals, audit.servicePages.items)) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getCategoryProgress(serviceTotals, audit.servicePages.items)) === "needs-improvement" ? "bg-yellow-500/20" :
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
                    <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                    <div className="text-xs sm:text-sm font-medium">
                      {Math.round(getCategoryProgress(locationTotals, audit.locationPages.items))}/100
                    </div>
                  </div>
                  <Progress 
                    value={getCategoryProgress(locationTotals, audit.locationPages.items)} 
                    className={`h-2 ${
                      getCategoryStatus(getCategoryProgress(locationTotals, audit.locationPages.items)) === "good" ? "bg-green-500/20" : 
                      getCategoryStatus(getCategoryProgress(locationTotals, audit.locationPages.items)) === "needs-improvement" ? "bg-yellow-500/20" :
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
                      <div className="text-xs sm:text-sm font-medium">SEO Score</div>
                      <div className="text-xs sm:text-sm font-medium">
                        {Math.round(getCategoryProgress(serviceAreaTotals, audit.serviceAreaPages?.items))}/100
                      </div>
                    </div>
                    <Progress 
                      value={getCategoryProgress(serviceAreaTotals, audit.serviceAreaPages?.items)} 
                      className={`h-2 ${
                        getCategoryStatus(getCategoryProgress(serviceAreaTotals, audit.serviceAreaPages?.items)) === "good" ? "bg-green-500/20" : 
                        getCategoryStatus(getCategoryProgress(serviceAreaTotals, audit.serviceAreaPages?.items)) === "needs-improvement" ? "bg-yellow-500/20" :
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