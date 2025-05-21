import { useState, useMemo } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AuditItem, AuditStatus, SeoImportance } from "@shared/schema";
import { AlertCircle, AlertTriangle, CheckCircle, CircleHelp, Search, Filter, ArrowUpDown, BarChart4, FileText, Map, MapPin, FileCheck, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QuickStatusChange from "./QuickStatusChange";

interface RivalAuditSectionProps {
  title: string;
  description: string;
  items: AuditItem[];
}

export default function RivalAuditSection({ title, description, items }: RivalAuditSectionProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [importanceFilter, setImportanceFilter] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "categories">("list");
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [sortField, setSortField] = useState<"name" | "status" | "importance">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editModeItem, setEditModeItem] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editStatus, setEditStatus] = useState<AuditStatus>("OK");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [currentItemForStatusChange, setCurrentItemForStatusChange] = useState<AuditItem | null>(null);
  const [isAnalyzingServicePages, setIsAnalyzingServicePages] = useState(false);
  
  // Get URL params to extract the audit ID
  const urlParams = new URLSearchParams(window.location.search);
  const auditId = urlParams.get('id') || "";
  
  // Get proper section name for API calls
  const getSectionNameFromTitle = (sectionTitle: string): string => {
    const titleMap: Record<string, string> = {
      "On-Page Audit": "onPage",
      "On-Page": "onPage",
      "On-Page SEO Audit": "onPage",
      "Structure & Navigation Audit": "structureNavigation",
      "Structure & Navigation": "structureNavigation",
      "Contact Page Audit": "contactPage",
      "Contact Page": "contactPage",
      "Service Pages Audit": "servicePages",
      "Service Pages": "servicePages",
      "Location Pages Audit": "locationPages",
      "Location Pages": "locationPages",
      "Service Area Pages Audit": "serviceAreaPages",
      "Service Area Pages": "serviceAreaPages"
    };
    
    const result = titleMap[sectionTitle];
    if (!result) {
      console.log(`No mapping found for section title: "${sectionTitle}"`);
    }
    return result || "onPage"; // Default to onPage if no mapping found
  };
  
  // Group items by categories
  const itemCategories = useMemo(() => {
    // Define categories based on the items we have
    const categories: Record<string, AuditItem[]> = {
      "UX/CTA": [],
      "On-Page": [],
      "Footer": [],
      "Content": [],
      "Other": []
    };
    
    // Categorize each item based on its name
    items.forEach(item => {
      if (item.name.includes("CTA") || 
          item.name.includes("usable") || 
          item.name.includes("intuitive") || 
          item.name.includes("appealing") || 
          item.name.includes("contact information")) {
        categories["UX/CTA"].push(item);
      } else if (item.name.includes("Footer") || 
                item.name.includes("NAP") || 
                item.name.includes("hours") || 
                item.name.includes("bottom nav")) {
        categories["Footer"].push(item);
      } else if (item.name.includes("content") || 
                item.name.includes("words") || 
                item.name.includes("read") || 
                item.name.includes("Blog") || 
                item.name.includes("copy")) {
        categories["Content"].push(item);
      } else if (item.name.includes("linked") || 
                item.name.includes("Localized") || 
                item.name.includes("city")) {
        categories["On-Page"].push(item);
      } else {
        categories["Other"].push(item);
      }
    });
    
    return categories;
  }, [items]);
  
  // Toggle sort
  const toggleSort = (field: "name" | "status" | "importance") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get icon based on status
  const getStatusIcon = (status: AuditStatus) => {
    switch (status) {
      case "Priority OFI":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "OFI":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "OK":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "N/A":
        return <CircleHelp className="h-4 w-4 text-gray-500" />;
      default:
        return <CircleHelp className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status badge styling with click handler for quick updates
  const getStatusBadge = (item: AuditItem, clickable: boolean = true) => {
    // Open the status change dialog when clicked
    const handleStatusClick = (e: React.MouseEvent) => {
      if (!clickable) return;
      e.stopPropagation();
      
      // Set up for quick edit
      setCurrentItemForStatusChange(item);
      setStatusDialogOpen(true);
    };
    
    const badgeProps = clickable ? {
      onClick: handleStatusClick,
      style: { cursor: 'pointer' }
    } : {};
    
    switch (item.status) {
      case "Priority OFI":
        return (
          <Badge 
            variant="outline" 
            className={`border-destructive bg-destructive/10 text-destructive ${clickable ? 'hover:opacity-80' : ''}`}
            {...badgeProps}
          >
            {item.status}
          </Badge>
        );
      case "OFI":
        return (
          <Badge 
            variant="outline" 
            className={`border-yellow-500 bg-yellow-500/10 text-yellow-600 ${clickable ? 'hover:opacity-80' : ''}`}
            {...badgeProps}
          >
            {item.status}
          </Badge>
        );
      case "OK":
        return (
          <Badge 
            variant="outline" 
            className={`border-green-500 bg-green-500/10 text-green-600 ${clickable ? 'hover:opacity-80' : ''}`}
            {...badgeProps}
          >
            {item.status}
          </Badge>
        );
      case "N/A":
        return (
          <Badge 
            variant="outline" 
            className={`border-gray-500 bg-gray-500/10 text-gray-600 ${clickable ? 'hover:opacity-80' : ''}`}
            {...badgeProps}
          >
            {item.status}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get importance badge styling
  const getImportanceBadge = (importance: SeoImportance) => {
    switch (importance) {
      case "High":
        return (
          <Badge variant="outline" className="border-blue-500 bg-blue-500/10 text-blue-600">
            {importance}
          </Badge>
        );
      case "Medium":
        return (
          <Badge variant="outline" className="border-purple-500 bg-purple-500/10 text-purple-600">
            {importance}
          </Badge>
        );
      case "Low":
        return (
          <Badge variant="outline" className="border-gray-500 bg-gray-500/10 text-gray-600">
            {importance}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !statusFilter || statusFilter === "all-statuses" || item.status === statusFilter;
      const matchesImportance = !importanceFilter || importanceFilter === "all-importance" || item.importance === importanceFilter;
      
      return matchesSearch && matchesStatus && matchesImportance;
    });
    
    // Apply filtering to category items as well
    const filteredCategories: Record<string, AuditItem[]> = {};
    Object.keys(itemCategories).forEach(category => {
      filteredCategories[category] = itemCategories[category].filter(item => {
        const matchesSearch = !searchTerm || 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = !statusFilter || statusFilter === "all-statuses" || item.status === statusFilter;
        const matchesImportance = !importanceFilter || importanceFilter === "all-importance" || item.importance === importanceFilter;
        
        return matchesSearch && matchesStatus && matchesImportance;
      });
    });
    
    // Sort the items
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortField === "status") {
        const statusOrder: Record<AuditStatus, number> = { 
          "Priority OFI": 0, 
          "OFI": 1, 
          "OK": 2, 
          "N/A": 3 
        };
        return sortDirection === "asc" 
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
      } else {
        const importanceOrder: Record<SeoImportance, number> = { 
          "High": 0, 
          "Medium": 1, 
          "Low": 2 
        };
        return sortDirection === "asc" 
          ? importanceOrder[a.importance] - importanceOrder[b.importance]
          : importanceOrder[b.importance] - importanceOrder[a.importance];
      }
    });
    
    return { sorted, filteredCategories };
  }, [items, searchTerm, statusFilter, importanceFilter, sortField, sortDirection, itemCategories]);
  
  const filteredItems = filteredAndSortedItems.sorted;

  // Handle edit item
  const handleEditClick = (item: AuditItem) => {
    setEditModeItem(item.name);
    setEditNotes(item.notes || "");
    setEditStatus(item.status);
  };

  const handleSaveItem = async (item: AuditItem) => {
    try {
      setIsUpdating(true);
      
      if (!auditId) {
        toast({
          title: "Error",
          description: "No audit ID found in URL params",
          variant: "destructive"
        });
        return;
      }
      
      // Ensure we have a valid status - if not, use the current status
      const newStatus = editStatus || item.status;
      const newNotes = editNotes !== undefined ? editNotes : item.notes || "";
      
      console.log("Saving item with status:", newStatus);
      
      // Convert title to proper section name for API
      const sectionName = getSectionNameFromTitle(title);
      
      // Send update to the backend
      const response = await fetch(`/api/rival-audit/${auditId}/update-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionName,
          itemName: item.name,
          status: newStatus,
          notes: newNotes
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update item: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update the item in the local state
      item.status = newStatus;
      item.notes = newNotes;
      
      // This will trigger a re-render with the updated data
      setEditModeItem(null);
      
      // Show success toast
      toast({
        title: "Item updated",
        description: `Status changed to ${newStatus}`,
        duration: 3000,
      });
      
      // Force a re-render of the parent component with updated summary
      if (typeof window !== 'undefined') {
        // Create and dispatch a custom event that the parent can listen for
        const updateEvent = new CustomEvent('audit-item-updated', { 
          detail: { 
            summary: result.summary,
            oldStatus: result.oldStatus,
            newStatus: result.newStatus,
          } 
        });
        window.dispatchEvent(updateEvent);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Failed to update item",
        description: "Please try again or reload the page",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModeItem(null);
  };

  // Handle item update from the QuickStatusChange dialog
  const handleItemUpdated = (updatedItem: AuditItem) => {
    // Find and update the item in the items array
    const itemIndex = items.findIndex(item => item.name === updatedItem.name);
    if (itemIndex !== -1) {
      // Create a new array with the updated item
      const updatedItems = [...items];
      updatedItems[itemIndex] = updatedItem;
      
      // Force update by directly modifying the items array using mutable approach
      // This is necessary since items is passed as a prop and we can't setState on it
      items.splice(0, items.length);
      updatedItems.forEach(item => items.push(item));
      
      // Force component to re-render
      setSearchTerm(searchTerm + " ");
      setTimeout(() => setSearchTerm(searchTerm.trim()), 10);
    }
  };

  // Function to analyze service pages if they're marked as N/A but exist
  const handleAnalyzeServicePages = async () => {
    if (!title.includes("Service Pages")) return;
    
    setIsAnalyzingServicePages(true);
    
    try {      
      if (!auditId) {
        toast({
          title: "Cannot analyze service pages",
          description: "Missing audit ID in URL",
          variant: "destructive"
        });
        return;
      }
      
      // Show loading toast
      toast({
        title: "Analyzing service pages",
        description: "Updating service page analysis based on discovered pages...",
      });
      
      // Call our new endpoint to analyze service pages
      const response = await fetch(`/api/rival-audit/${auditId}/analyze-service-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Force update the UI with the updated audit data
        if (result.updatedAudit) {
          // Create an update event to notify other components
          const updateEvent = new CustomEvent('audit-updated', { 
            detail: { 
              audit: result.updatedAudit,
              updatedAt: new Date().getTime()
            } 
          });
          
          window.dispatchEvent(updateEvent);
          
          // Force page reload to refresh with the new data
          window.location.reload();
        }
        
        toast({
          title: "Service page analysis complete",
          description: "Service page items have been updated based on discovered pages.",
        });
      } else {
        toast({
          title: "Service page analysis failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error analyzing service pages:", error);
      toast({
        title: "Service page analysis failed",
        description: "Please try again or reload the page",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingServicePages(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center justify-between mb-2">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          {title.includes("Service Pages") && items.some(item => item.status === "N/A") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAnalyzeServicePages}
              disabled={isAnalyzingServicePages}
              className="flex items-center"
            >
              {isAnalyzingServicePages ? "Analyzing..." : "Analyze Service Pages"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 w-full flex overflow-x-auto no-scrollbar mb-4 border-b rounded-none p-0 h-auto">
            <TabsTrigger 
              value="summary" 
              className="flex items-center gap-1.5 py-2.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <BarChart4 className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
            <TabsTrigger 
              value="onpage" 
              className="flex items-center gap-1.5 py-2.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4" />
              <span>On-Page</span>
            </TabsTrigger>
            <TabsTrigger 
              value="structure" 
              className="flex items-center gap-1.5 py-2.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <ListChecks className="h-4 w-4" />
              <span>Structure</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="flex items-center gap-1.5 py-2.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Contact</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex items-center gap-1.5 py-2.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FileCheck className="h-4 w-4" />
              <span>Services</span>
            </TabsTrigger>
            <TabsTrigger 
              value="locations" 
              className="flex items-center gap-1.5 py-2.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <MapPin className="h-4 w-4" />
              <span>Locations</span>
            </TabsTrigger>
            <TabsTrigger 
              value="service-areas" 
              className="flex items-center gap-1.5 py-2.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Map className="h-4 w-4" />
              <span>Service Areas</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search audit items..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="Priority OFI">Priority OFI</SelectItem>
                  <SelectItem value="OFI">OFI</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={importanceFilter || ""} onValueChange={(value) => setImportanceFilter(value || null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-importance">All Importance</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortField} onValueChange={(value: "name" | "status" | "importance") => toggleSort(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}</SelectItem>
                  <SelectItem value="status">Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}</SelectItem>
                  <SelectItem value="importance">Importance {sortField === "importance" && (sortDirection === "asc" ? "↑" : "↓")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value="summary" className="mt-0">
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="text-lg font-semibold">Summary Dashboard</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-md p-3 bg-muted/20 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">Priority OFIs</span>
                  <span className="text-2xl font-bold text-destructive">
                    {items.filter(item => item.status === "Priority OFI").length}
                  </span>
                </div>
                <div className="border rounded-md p-3 bg-muted/20 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">OFIs</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {items.filter(item => item.status === "OFI").length}
                  </span>
                </div>
                <div className="border rounded-md p-3 bg-muted/20 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">OK</span>
                  <span className="text-2xl font-bold text-green-600">
                    {items.filter(item => item.status === "OK").length}
                  </span>
                </div>
                <div className="border rounded-md p-3 bg-muted/20 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">N/A</span>
                  <span className="text-2xl font-bold text-gray-500">
                    {items.filter(item => item.status === "N/A").length}
                  </span>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="text-sm font-semibold mb-3">Priority OFIs</h4>
                {items.filter(item => item.status === "Priority OFI").length > 0 ? (
                  <div className="space-y-2">
                    {items.filter(item => item.status === "Priority OFI").map((item, index) => (
                      <div key={`${item.name}-${index}`} className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No Priority OFIs found</div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value={activeTab !== "summary" ? activeTab : ""} className="mt-0">
            <div className="flex mb-4 space-x-2">
              <Button 
                variant={currentView === "list" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setCurrentView("list")}
                className="flex items-center"
              >
                <ArrowUpDown className="mr-1 h-4 w-4" />
                List
              </Button>
              <Button 
                variant={currentView === "categories" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setCurrentView("categories")}
                className="flex items-center"
              >
                <Filter className="mr-1 h-4 w-4" />
                Categories
              </Button>
            </div>
          
            {currentView === "list" && activeTab !== "summary" ? (
              // List view
              <div className="border rounded-md">
                <div className="bg-muted px-2 sm:px-4 py-2 rounded-t-md grid grid-cols-12 gap-2 sm:gap-4 font-medium text-xs sm:text-sm">
                  <div className="col-span-12 sm:col-span-5 flex items-center cursor-pointer" onClick={() => toggleSort("name")}>
                    Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    <div className="flex ml-auto space-x-2 sm:hidden text-[10px]">
                      <span className="px-2" onClick={(e) => { e.stopPropagation(); toggleSort("status"); }}>
                        Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                      </span>
                      <span className="px-2" onClick={(e) => { e.stopPropagation(); toggleSort("importance"); }}>
                        Imp. {sortField === "importance" && (sortDirection === "asc" ? "↑" : "↓")}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex col-span-2 items-center cursor-pointer" onClick={() => toggleSort("status")}>
                    Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                  <div className="hidden sm:flex col-span-2 items-center cursor-pointer" onClick={() => toggleSort("importance")}>
                    Importance {sortField === "importance" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                  <div className="hidden sm:block col-span-3">Notes</div>
                </div>
                
                <Accordion type="multiple" className="rounded-b-md">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => (
                      <AccordionItem 
                        value={`item-${index}`} 
                        key={`${item.name}-${index}`}
                        className="border-b last:border-b-0"
                      >
                        <AccordionTrigger className="py-3 px-2 sm:px-4 hover:no-underline">
                          <div className="grid grid-cols-12 gap-2 sm:gap-4 w-full text-left">
                            <div className="col-span-12 sm:col-span-5 flex items-center gap-2">
                              <span className="flex-shrink-0">{getStatusIcon(item.status)}</span>
                              <span className="text-xs sm:text-sm font-medium line-clamp-1">{item.name}</span>
                              
                              <div className="sm:hidden ml-auto space-x-2">
                                {getStatusBadge(item, true)}
                                <span className="hidden xs:inline-block">{getImportanceBadge(item.importance)}</span>
                              </div>
                            </div>
                            <div className="hidden sm:flex col-span-2 items-center">
                              {getStatusBadge(item, true)}
                            </div>
                            <div className="hidden sm:flex col-span-2 items-center">
                              {getImportanceBadge(item.importance)}
                            </div>
                            <div className="hidden sm:block col-span-3 text-xs text-muted-foreground line-clamp-1">
                              {item.notes || "No notes"}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-2 sm:px-4 pb-3">
                          {editModeItem === item.name ? (
                            // Edit mode
                            <div className="space-y-3 pl-6">
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Description</h4>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Status</h4>
                                <div className="flex flex-wrap gap-2">
                                  <Badge 
                                    variant={editStatus === "Priority OFI" ? "default" : "outline"} 
                                    className="cursor-pointer border-destructive hover:bg-destructive/10"
                                    onClick={() => setEditStatus("Priority OFI")}
                                  >
                                    Priority OFI
                                  </Badge>
                                  <Badge 
                                    variant={editStatus === "OFI" ? "default" : "outline"} 
                                    className="cursor-pointer border-yellow-500 hover:bg-yellow-500/10"
                                    onClick={() => setEditStatus("OFI")}
                                  >
                                    OFI
                                  </Badge>
                                  <Badge 
                                    variant={editStatus === "OK" ? "default" : "outline"} 
                                    className="cursor-pointer border-green-500 hover:bg-green-500/10"
                                    onClick={() => setEditStatus("OK")}
                                  >
                                    OK
                                  </Badge>
                                  <Badge 
                                    variant={editStatus === "N/A" ? "default" : "outline"} 
                                    className="cursor-pointer border-gray-500 hover:bg-gray-500/10"
                                    onClick={() => setEditStatus("N/A")}
                                  >
                                    N/A
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-semibold">Notes</h4>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span>{editNotes.length} chars</span>
                                    {editNotes.length === 0 ? (
                                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                </div>
                                <Textarea 
                                  value={editNotes} 
                                  onChange={(e) => setEditNotes(e.target.value)} 
                                  placeholder="Add detailed notes about this audit item to help your team understand the issue and take action..."
                                  className="min-h-[120px] focus:border-primary"
                                />
                                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                                  <span>Use detailed notes to explain reasoning behind status changes</span>
                                  <span>{new Date().toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleSaveItem(item)}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "Saving..." : "Save"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="space-y-3 pl-6">
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Description</h4>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Status</h4>
                                {getStatusBadge(item, true)}
                              </div>
                              
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="text-sm font-semibold">Notes</h4>
                                  {item.notes && (
                                    <Badge variant="outline" className="text-xs px-2 py-0">
                                      {item.notes.length} chars
                                    </Badge>
                                  )}
                                </div>
                                {item.notes ? (
                                  <div className="bg-muted/30 p-3 rounded-md border border-muted relative">
                                    <p className="text-sm whitespace-pre-wrap">
                                      {item.notes}
                                    </p>
                                    <span className="absolute top-1 right-1 text-xs text-muted-foreground opacity-70">
                                      {new Date().toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="bg-muted/20 p-3 rounded-md border border-dashed border-muted flex items-center justify-center">
                                    <p className="text-sm text-muted-foreground italic">No notes added yet</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex items-center text-xs"
                                  onClick={() => handleEditClick(item)}
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No items match your search or filter criteria
                    </div>
                  )}
                </Accordion>
              </div>
            ) : (
              // Categories view
              <div>
                <div className="space-y-6">
                  {Object.keys(filteredAndSortedItems.filteredCategories).map((category) => {
                    const categoryItems = filteredAndSortedItems.filteredCategories[category];
                    
                    // Only show categories that have items after filtering
                    if (categoryItems.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="text-base font-semibold mb-2 flex items-center">
                          <span>{category}</span>
                          <Badge variant="outline" className="ml-2 text-xs bg-muted">
                            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                          </Badge>
                        </h3>
                        
                        <div className="border rounded-md">
                          <Accordion type="multiple" className="rounded-md">
                            {categoryItems.map((item, index) => (
                              <AccordionItem 
                                value={`${category}-item-${index}`} 
                                key={`${category}-${item.name}-${index}`}
                                className="border-b last:border-b-0"
                              >
                                <AccordionTrigger className="p-3 hover:no-underline">
                                  <div className="flex items-center gap-2 w-full text-left">
                                    <span className="flex-shrink-0">{getStatusIcon(item.status)}</span>
                                    <span className="text-sm font-medium">{item.name}</span>
                                    <div className="ml-auto flex space-x-2 items-center">
                                      {getStatusBadge(item, true)}
                                      <span className="hidden sm:inline-block">{getImportanceBadge(item.importance)}</span>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  {editModeItem === item.name ? (
                                    // Edit mode (same as in list view)
                                    <div className="space-y-3 pl-6">
                                      <div>
                                        <h4 className="text-sm font-semibold mb-1">Description</h4>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-sm font-semibold mb-1">Status</h4>
                                        <div className="flex flex-wrap gap-2">
                                          <Badge 
                                            variant={editStatus === "Priority OFI" ? "default" : "outline"} 
                                            className="cursor-pointer border-destructive hover:bg-destructive/10"
                                            onClick={() => setEditStatus("Priority OFI")}
                                          >
                                            Priority OFI
                                          </Badge>
                                          <Badge 
                                            variant={editStatus === "OFI" ? "default" : "outline"} 
                                            className="cursor-pointer border-yellow-500 hover:bg-yellow-500/10"
                                            onClick={() => setEditStatus("OFI")}
                                          >
                                            OFI
                                          </Badge>
                                          <Badge 
                                            variant={editStatus === "OK" ? "default" : "outline"} 
                                            className="cursor-pointer border-green-500 hover:bg-green-500/10"
                                            onClick={() => setEditStatus("OK")}
                                          >
                                            OK
                                          </Badge>
                                          <Badge 
                                            variant={editStatus === "N/A" ? "default" : "outline"} 
                                            className="cursor-pointer border-gray-500 hover:bg-gray-500/10"
                                            onClick={() => setEditStatus("N/A")}
                                          >
                                            N/A
                                          </Badge>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <h4 className="text-sm font-semibold">Notes</h4>
                                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <span>{editNotes.length} chars</span>
                                            {editNotes.length === 0 ? (
                                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                                            ) : (
                                              <CheckCircle className="h-3 w-3 text-green-500" />
                                            )}
                                          </div>
                                        </div>
                                        <Textarea 
                                          value={editNotes} 
                                          onChange={(e) => setEditNotes(e.target.value)} 
                                          placeholder="Add detailed notes about this audit item to help your team understand the issue and take action..."
                                          className="min-h-[120px] focus:border-primary"
                                        />
                                        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                                          <span>Use detailed notes to explain reasoning behind status changes</span>
                                          <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="outline" onClick={handleCancelEdit}>
                                          Cancel
                                        </Button>
                                        <Button 
                                          onClick={() => handleSaveItem(item)}
                                          disabled={isUpdating}
                                        >
                                          {isUpdating ? "Saving..." : "Save"}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    // View mode (same as in list view)
                                    <div className="space-y-3 pl-6">
                                      <div>
                                        <h4 className="text-sm font-semibold mb-1">Description</h4>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-sm font-semibold mb-1">Status</h4>
                                        {getStatusBadge(item, true)}
                                      </div>
                                      
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <h4 className="text-sm font-semibold">Notes</h4>
                                          {item.notes && (
                                            <Badge variant="outline" className="text-xs px-2 py-0">
                                              {item.notes.length} chars
                                            </Badge>
                                          )}
                                        </div>
                                        {item.notes ? (
                                          <div className="bg-muted/30 p-3 rounded-md border border-muted relative">
                                            <p className="text-sm whitespace-pre-wrap">
                                              {item.notes}
                                            </p>
                                            <span className="absolute top-1 right-1 text-xs text-muted-foreground opacity-70">
                                              {new Date().toLocaleDateString()}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="bg-muted/20 p-3 rounded-md border border-dashed border-muted flex items-center justify-center">
                                            <p className="text-sm text-muted-foreground italic">No notes added yet</p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex justify-end">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="flex items-center text-xs"
                                          onClick={() => handleEditClick(item)}
                                        >
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Quick Status Change Dialog */}
      {currentItemForStatusChange && (
        <QuickStatusChange
          open={statusDialogOpen}
          setOpen={setStatusDialogOpen}
          item={currentItemForStatusChange}
          onItemUpdated={handleItemUpdated}
          auditId={auditId}
          sectionName={getSectionNameFromTitle(title)}
        />
      )}
    </Card>
  );
}