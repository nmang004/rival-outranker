import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  AlertTriangle,
  CheckCircle,
  CircleHelp,
  FileDown, 
  ChevronLeft, 
  BarChart3,
  FileText,
  ClipboardCheck,
  Globe,
  Phone,
  Briefcase,
  MapPin,
  ListFilter,
  LineChart,
  ArrowRight,
  Plus
} from "lucide-react";
import { RivalAudit, AuditItem, AuditStatus } from "@shared/schema";

// Import components for the Rival Audit
import RivalAuditSection from "@/components/features/audit/RivalAuditSection";
import RivalAuditSummary from "@/components/features/audit/RivalAuditSummary";
import RivalAuditDashboard from "@/components/features/audit/RivalAuditDashboard";
import RivalAuditRecommendations from "@/components/features/audit/RivalAuditRecommendations";
import RivalAuditLoadingScreen from "@/components/features/audit/RivalAuditLoadingScreen";

export default function RivalAuditResultsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("summary");
  const [isRefreshing, setIsRefreshing] = useState(false);
  // State to manage real-time updates to summary counts without refetching
  const [updatedSummary, setUpdatedSummary] = useState<{
    priorityOfiCount: number;
    ofiCount: number;
    okCount: number;
    naCount: number;
    total?: number;
  } | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "dashboard">("list");
  
  // Get auditId and URL from URL query params
  const params = new URLSearchParams(window.location.search);
  const auditId = params.get("id");
  const websiteUrl = params.get("url");
  
  // Fetch the audit data, including the website URL if available
  const { data: audit, isLoading, isError, refetch } = useQuery<RivalAudit>({
    queryKey: [`/api/rival-audit/${auditId}`],
    queryFn: async () => {
      // Include URL in the request to ensure we get the right data
      const endpoint = websiteUrl
        ? `/api/rival-audit/${auditId}?url=${encodeURIComponent(websiteUrl)}`
        : `/api/rival-audit/${auditId}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch audit data");
      }
      return response.json();
    },
    enabled: !!auditId,
  });

  // Listen for status updates from the RivalAuditSection components
  useEffect(() => {
    function handleAuditItemUpdated(event: CustomEvent) {
      // Update the local summary state with the new counts
      if (event.detail && event.detail.summary) {
        setUpdatedSummary(event.detail.summary);
        
        // Show notification of the status change
        if (event.detail.oldStatus && event.detail.newStatus) {
          toast({
            title: "Item Status Updated",
            description: `Status changed from "${event.detail.oldStatus}" to "${event.detail.newStatus}"`,
            variant: "default"
          });
        }
      }
    }
    
    // Add event listener for our custom event
    window.addEventListener('audit-item-updated', handleAuditItemUpdated as EventListener);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('audit-item-updated', handleAuditItemUpdated as EventListener);
    };
  }, [toast]);
  
  // Function to refresh/recrawl the audit
  const handleRefreshAudit = async () => {
    if (!websiteUrl || !auditId) {
      toast({
        title: "Cannot refresh audit",
        description: "Missing website URL or audit ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsRefreshing(true);
    try {
      toast({
        title: "Refreshing audit data",
        description: "Starting fresh crawl of the website. This may take a minute...",
      });
      
      // Force a fresh crawl with the refresh parameter
      await fetch(`/api/rival-audit/${auditId}?url=${encodeURIComponent(websiteUrl)}&refresh=true`);
      
      // Refetch the data
      const { data: refreshedData } = await refetch();
      
      // Reset the updated summary to null so it uses the new data
      setUpdatedSummary(null);
      
      // Force a re-render of the summary component
      if (refreshedData) {
        // Create a synthetic update event to trigger UI updates
        const updateEvent = new CustomEvent('audit-item-updated', { 
          detail: { 
            summary: refreshedData.summary,
            updatedAt: new Date().getTime(),
            isRefresh: true
          } 
        });
        
        // Dispatch the event with a slight delay
        setTimeout(() => {
          window.dispatchEvent(updateEvent);
          
          // Force UI refresh
          document.querySelectorAll('.audit-summary-container').forEach(el => {
            el.classList.add('updating');
            setTimeout(() => el.classList.remove('updating'), 300);
          });
        }, 100);
      }
      
      toast({
        title: "Audit refreshed",
        description: "Successfully updated audit data with fresh crawl results",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh the audit data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to continue crawling beyond the page limit  
  const handleContinueAudit = async () => {
    if (!websiteUrl || !auditId) {
      toast({
        title: "Cannot continue audit",
        description: "Missing website URL or audit ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsContinuing(true);
    try {
      toast({
        title: "Continuing website crawl",
        description: "Resuming audit to analyze more pages. This may take a minute...",
      });
      
      // Continue crawl with the continue parameter
      await fetch(`/api/rival-audit/${auditId}?url=${encodeURIComponent(websiteUrl)}&continue=true`);
      
      // Refetch the data
      await refetch();
      
      toast({
        title: "Audit continued",
        description: "Successfully crawled more pages and updated the audit results",
      });
    } catch (error) {
      toast({
        title: "Failed to continue crawl",
        description: "Could not continue the audit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsContinuing(false);
    }
  };

  // Handle export to Excel
  const handleExportToExcel = async () => {
    if (!audit) return;
    
    try {
      const response = await fetch(`/api/rival-audit/${auditId}/export`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rival-audit-${audit.url.replace(/https?:\/\//i, '')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Audit data has been exported to Excel",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export failed",
        description: "Could not export the audit data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle continue crawl to find more pages
  // This function is now deprecated - using handleContinueAudit instead
  const handleContinueCrawl = async () => {
    return handleContinueAudit();
  };
  
  // Handle export to CSV
  const handleExportToCSV = async () => {
    if (!audit) return;
    
    try {
      const response = await fetch(`/api/rival-audit/${auditId}/export?format=csv`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rival-audit-${audit.url.replace(/https?:\/\//i, '')}-${new Date().toISOString().split('T')[0]}.csv`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Audit data has been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Export failed",
        description: "Could not export the audit data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Go back to the audit page
  const goBack = () => {
    navigate('/rival-audit');
  };

  if (isLoading || isRefreshing || isContinuing) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6">
        {websiteUrl ? (
          <RivalAuditLoadingScreen url={websiteUrl} />
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex flex-col">
              <h1 className="text-3xl font-bold mb-2">Loading Rival Audit Results...</h1>
              <p className="text-muted-foreground">Please wait while we load your audit results</p>
            </div>
            <div className="grid gap-6">
              <Skeleton className="h-[300px] w-full" />
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
              </div>
              <Skeleton className="h-[500px] w-full" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isError || !audit) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load audit results. Please try again or create a new audit.
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={goBack} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
            {websiteUrl && (
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col mb-4 sm:mb-6">
          <div className="mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-heading mb-1 sm:mb-2">Rival SEO Audit</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Comprehensive SEO audit for <span className="font-medium break-all">{audit.url}</span>
            </p>
            {audit.summary.total && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Analyzed {audit.summary.total} SEO factors across all categories
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-full sm:w-auto flex gap-2 mb-2 sm:mb-0">
              <Button variant="outline" size="sm" onClick={goBack} className="text-xs sm:text-sm">
                <ChevronLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Back
              </Button>
              
              <div className="ml-auto sm:ml-0 border rounded-md flex">
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="sm" 
                  className="rounded-r-none text-xs h-8"
                  onClick={() => setViewMode("list")}
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> List
                </Button>
                <Button 
                  variant={viewMode === "dashboard" ? "default" : "ghost"} 
                  size="sm" 
                  className="rounded-l-none text-xs h-8"
                  onClick={() => setViewMode("dashboard")}
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Dashboard
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex gap-2 flex-wrap justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshAudit} 
                disabled={isRefreshing}
                className="text-xs sm:text-sm h-8"
              >
                {isRefreshing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                    Refresh
                  </span>
                )}
              </Button>
              
              {audit.reachedMaxPages && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleContinueAudit} 
                  disabled={isContinuing}
                  className="text-xs sm:text-sm h-8"
                >
                  {isContinuing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Continuing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Continue Crawl
                    </span>
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportToExcel}
                className="text-xs sm:text-sm h-8"
              >
                <FileDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Export Excel
              </Button>
            </div>
          </div>
        </div>
        
        {viewMode === "dashboard" ? (
          <RivalAuditDashboard 
            audit={audit} 
            updatedSummary={updatedSummary}
          />
        ) : (
          <div className="w-full">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full md:w-[280px]">
                    <SelectValue>
                      {activeTab === "summary" && <div className="flex items-center"><LineChart className="h-4 w-4 mr-2" />Summary</div>}
                      {activeTab === "onPage" && <div className="flex items-center"><Globe className="h-4 w-4 mr-2" />On-Page</div>}
                      {activeTab === "structure" && <div className="flex items-center"><ClipboardCheck className="h-4 w-4 mr-2" />Structure</div>}
                      {activeTab === "contactPage" && <div className="flex items-center"><Phone className="h-4 w-4 mr-2" />Contact</div>}
                      {activeTab === "servicePages" && <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2" />Services</div>}
                      {activeTab === "locationPages" && <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" />Locations</div>}
                      {activeTab === "serviceAreaPages" && <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" />Service Areas</div>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">
                      <div className="flex items-center">
                        <LineChart className="h-4 w-4 mr-2 text-primary" />
                        <span>Summary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="onPage">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-primary" />
                        <span>On-Page</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="structure">
                      <div className="flex items-center">
                        <ClipboardCheck className="h-4 w-4 mr-2 text-primary" />
                        <span>Structure</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="contactPage">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        <span>Contact</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="servicePages">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-primary" />
                        <span>Services</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="locationPages">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>Locations</span>
                      </div>
                    </SelectItem>
                    {audit.serviceAreaPages && (
                      <SelectItem value="serviceAreaPages">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <span>Service Areas</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">
                  <span className="font-medium">{activeTab === "summary" ? "Viewing Summary" : 
                      activeTab === "onPage" ? "Viewing On-Page SEO" :
                      activeTab === "structure" ? "Viewing Structure & Navigation" :
                      activeTab === "contactPage" ? "Viewing Contact Page" :
                      activeTab === "servicePages" ? "Viewing Service Pages" :
                      activeTab === "locationPages" ? "Viewing Location Pages" :
                      "Viewing Service Area Pages"}</span>
                </div>
              </div>
            </div>
            
            {activeTab === "summary" && (
              <div className="mt-0">
                <RivalAuditSummary audit={audit} updatedSummary={updatedSummary} />
              </div>
            )}
            
            {activeTab === "onPage" && (
              <div className="mt-0">
                <RivalAuditSection 
                  title="On-Page SEO Audit" 
                  description="Analysis of meta tags, headings, content, and technical issues"
                  items={audit.onPage.items}
                />
              </div>
            )}
            
            {activeTab === "structure" && (
              <div className="mt-0">
                <RivalAuditSection 
                  title="Structure & Navigation Audit" 
                  description="Analysis of URL structure, site navigation, page titles, headings, and meta descriptions"
                  items={audit.structureNavigation.items}
                />
              </div>
            )}
            
            {activeTab === "contactPage" && (
              <div className="mt-0">
                <RivalAuditSection 
                  title="Contact Page Audit" 
                  description="Analysis of contact information, forms, phone numbers, maps, and business details"
                  items={audit.contactPage.items}
                />
              </div>
            )}
            
            {activeTab === "servicePages" && (
              <div className="mt-0">
                <RivalAuditSection 
                  title="Service Pages Audit" 
                  description="Analysis of service descriptions, clarity, calls to action, and structure"
                  items={audit.servicePages.items}
                />
              </div>
            )}
            
            {activeTab === "locationPages" && (
              <div className="mt-0">
                <RivalAuditSection 
                  title="Location Pages Audit" 
                  description="Analysis of local SEO, address information, maps, and geographic relevance"
                  items={audit.locationPages.items}
                />
              </div>
            )}
            
            {activeTab === "serviceAreaPages" && audit.serviceAreaPages && (
              <div className="mt-0">
                <RivalAuditSection 
                  title="Service Area Pages Audit" 
                  description="Analysis of geographic targeting, city pages, and local information"
                  items={audit.serviceAreaPages.items}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Recommendations Section - always shown at bottom */}
        <div className="mt-12">
          <RivalAuditRecommendations audit={audit} />
        </div>
      </div>
    </div>
  );
}