import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  FileDown, 
  ChevronLeft, 
  BarChart3,
  FileText,
  ClipboardCheck,
  Globe,
  Phone,
  Briefcase,
  MapPin
} from "lucide-react";
import { RivalAudit, AuditItem, AuditStatus } from "@shared/schema";

// Import components for the Rival Audit
import RivalAuditSection from "../components/rival/RivalAuditSection";
import RivalAuditSummary from "../components/rival/RivalAuditSummary";

export default function RivalAuditResultsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("summary");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
      await refetch();
      
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
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "The audit report has been exported to Excel format.",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export the audit report. Please try again.",
      });
    }
  };

  const goBack = () => {
    navigate("/rival-audit");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !audit) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load audit results. The audit may still be in progress or an error occurred.
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={goBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold gradient-heading mb-2">Rival SEO Audit</h1>
            <p className="text-muted-foreground">
              Comprehensive SEO audit for <span className="font-medium">{audit.url}</span>
            </p>
            {audit.summary.total && (
              <p className="text-sm text-muted-foreground mt-1">
                Analyzed {audit.summary.total} SEO factors across all categories
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {websiteUrl && (
              <Button 
                variant="outline" 
                onClick={handleRefreshAudit}
                disabled={isRefreshing}
              >
                <svg className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh Audit'}
              </Button>
            )}
            <Button onClick={handleExportToExcel}>
              <FileDown className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-red-500/10 border border-red-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Priority Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audit.summary.priorityOfiCount}</div>
              <p className="text-xs text-muted-foreground">Critical findings requiring action</p>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-500/10 border border-yellow-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audit.summary.ofiCount}</div>
              <p className="text-xs text-muted-foreground">Areas for improvement</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-500/10 border border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audit.summary.okCount}</div>
              <p className="text-xs text-muted-foreground">No issues found</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-500/10 border border-gray-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Not Applicable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audit.summary.naCount}</div>
              <p className="text-xs text-muted-foreground">Items not relevant</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different audit sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex mb-6 w-max sm:w-full sm:grid sm:grid-cols-7">
              <TabsTrigger value="summary" className="flex items-center whitespace-nowrap px-3 sm:px-0">
                <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="block sm:inline">Summary</span>
              </TabsTrigger>
              <TabsTrigger value="onPage" className="flex items-center whitespace-nowrap px-3 sm:px-0">
                <FileText className="h-4 w-4 mr-1 sm:mr-2" /> <span className="block sm:inline">On-Page</span>
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center whitespace-nowrap px-3 sm:px-0">
                <ClipboardCheck className="h-4 w-4 mr-1 sm:mr-2" /> <span className="block sm:inline">Structure</span>
              </TabsTrigger>
              <TabsTrigger value="contactPage" className="flex items-center whitespace-nowrap px-3 sm:px-0">
                <Phone className="h-4 w-4 mr-1 sm:mr-2" /> <span className="block sm:inline">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="servicePages" className="flex items-center whitespace-nowrap px-3 sm:px-0">
                <Briefcase className="h-4 w-4 mr-1 sm:mr-2" /> <span className="block sm:inline">Services</span>
              </TabsTrigger>
              <TabsTrigger value="locationPages" className="flex items-center whitespace-nowrap px-3 sm:px-0">
                <MapPin className="h-4 w-4 mr-1 sm:mr-2" /> <span className="block sm:inline">Locations</span>
              </TabsTrigger>
              <TabsTrigger value="serviceAreaPages" className="flex items-center whitespace-nowrap px-3 sm:px-0" disabled={!audit.serviceAreaPages}>
                <Globe className="h-4 w-4 mr-1 sm:mr-2" /> <span className="block sm:inline">Areas</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="summary" className="mt-0">
            <RivalAuditSummary audit={audit} />
          </TabsContent>
          
          <TabsContent value="onPage" className="mt-0">
            <RivalAuditSection 
              title="On-Page SEO Audit" 
              description="Analysis of user experience, content quality, readability, and calls to action"
              items={audit.onPage.items}
            />
          </TabsContent>
          
          <TabsContent value="structure" className="mt-0">
            <RivalAuditSection 
              title="Structure & Navigation Audit" 
              description="Analysis of URL structure, site navigation, page titles, headings, and meta descriptions"
              items={audit.structureNavigation.items}
            />
          </TabsContent>
          
          <TabsContent value="contactPage" className="mt-0">
            <RivalAuditSection 
              title="Contact Page Audit" 
              description="Analysis of contact information, forms, phone numbers, maps, and business details"
              items={audit.contactPage.items}
            />
          </TabsContent>
          
          <TabsContent value="servicePages" className="mt-0">
            <RivalAuditSection 
              title="Service Pages Audit" 
              description="Analysis of service descriptions, clarity, calls to action, and structure"
              items={audit.servicePages.items}
            />
          </TabsContent>
          
          <TabsContent value="locationPages" className="mt-0">
            <RivalAuditSection 
              title="Location Pages Audit" 
              description="Analysis of local SEO, address information, maps, and geographic relevance"
              items={audit.locationPages.items}
            />
          </TabsContent>
          
          {audit.serviceAreaPages && (
            <TabsContent value="serviceAreaPages" className="mt-0">
              <RivalAuditSection 
                title="Service Area Pages Audit" 
                description="Analysis of geographic targeting, city pages, and local information"
                items={audit.serviceAreaPages.items}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}