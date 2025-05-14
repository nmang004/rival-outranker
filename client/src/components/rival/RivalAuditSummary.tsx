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
import { RivalAudit } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface RivalAuditSummaryProps {
  audit: RivalAudit;
}

export default function RivalAuditSummary({ audit }: RivalAuditSummaryProps) {
  const { toast } = useToast();
  
  // Function to handle exporting to Excel
  const handleExportToExcel = () => {
    try {
      toast({
        title: "Exporting audit data",
        description: "Your Excel file is being generated and will download shortly.",
        duration: 3000
      });
      
      window.open(`/api/rival-audit/1/export?url=${encodeURIComponent(audit.url)}`, '_blank');
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the audit data. Please try again.",
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
    return relevantItems > 0 ? (totals.ok / relevantItems) * 100 : 0;
  };

  // Get category status
  const getCategoryStatus = (totals: { priorityOfi: number, ofi: number, ok: number, na: number, total: number }) => {
    if (totals.priorityOfi > 0) return "critical";
    if (totals.ofi > 0) return "needs-improvement";
    if (totals.ok > 0) return "good";
    return "unknown";
  };

  // Total audit progress
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Overall Audit Status</CardTitle>
            <CardDescription>
              Summary of findings across all audit categories
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handleExportToExcel}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export to Excel</span>
          </Button>
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 bg-destructive/10 p-2 rounded-md">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium">{audit.summary.priorityOfiCount} Priority Issues</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-500/10 p-2 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">{audit.summary.ofiCount} Opportunities</span>
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 p-2 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{audit.summary.okCount} Completed</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-500/10 p-2 rounded-md text-gray-600">
                <span className="text-sm font-medium">{audit.summary.naCount} Not Applicable</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* On-Page */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>On-Page SEO</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">Completion Status</div>
                <div className="text-sm font-medium">
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
              <div className="grid grid-cols-4 gap-2 text-xs mt-2">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <span>Structure & Navigation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">Completion Status</div>
                <div className="text-sm font-medium">
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
              <div className="grid grid-cols-4 gap-2 text-xs mt-2">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span>Contact Page</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">Completion Status</div>
                <div className="text-sm font-medium">
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
              <div className="grid grid-cols-4 gap-2 text-xs mt-2">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span>Service Pages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">Completion Status</div>
                <div className="text-sm font-medium">
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
              <div className="grid grid-cols-4 gap-2 text-xs mt-2">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Location Pages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">Completion Status</div>
                <div className="text-sm font-medium">
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
              <div className="grid grid-cols-4 gap-2 text-xs mt-2">
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

        {/* Service Area Pages - Only show if exists */}
        {audit.serviceAreaPages && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <span>Service Area Pages</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between mb-1">
                  <div className="text-sm font-medium">Completion Status</div>
                  <div className="text-sm font-medium">
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
                <div className="grid grid-cols-4 gap-2 text-xs mt-2">
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
      </div>
    </div>
  );
}