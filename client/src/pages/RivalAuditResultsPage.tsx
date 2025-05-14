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
  
  // Get auditId from URL query params
  const params = new URLSearchParams(window.location.search);
  const auditId = params.get("id");
  
  // Fetch the audit data
  const { data: audit, isLoading, isError } = useQuery<RivalAudit>({
    queryKey: [`/api/rival-audit/${auditId}`],
    enabled: !!auditId,
  });

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
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
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
          <TabsList className="grid grid-cols-2 md:grid-cols-7 mb-6">
            <TabsTrigger value="summary" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" /> Summary
            </TabsTrigger>
            <TabsTrigger value="onPage" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" /> On-Page
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center">
              <ClipboardCheck className="h-4 w-4 mr-2" /> Structure
            </TabsTrigger>
            <TabsTrigger value="contactPage" className="flex items-center">
              <Phone className="h-4 w-4 mr-2" /> Contact
            </TabsTrigger>
            <TabsTrigger value="servicePages" className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2" /> Services
            </TabsTrigger>
            <TabsTrigger value="locationPages" className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" /> Locations
            </TabsTrigger>
            <TabsTrigger value="serviceAreaPages" className="flex items-center" disabled={!audit.serviceAreaPages}>
              <Globe className="h-4 w-4 mr-2" /> Areas
            </TabsTrigger>
          </TabsList>
          
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