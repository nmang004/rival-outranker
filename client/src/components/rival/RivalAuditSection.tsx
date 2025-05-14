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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AuditItem, AuditStatus, SeoImportance } from "@shared/schema";
import { AlertCircle, AlertTriangle, CheckCircle, CircleHelp, Search, Filter, ArrowUpDown } from "lucide-react";

interface RivalAuditSectionProps {
  title: string;
  description: string;
  items: AuditItem[];
}

export default function RivalAuditSection({ title, description, items }: RivalAuditSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [importanceFilter, setImportanceFilter] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "categories">("list");
  const [sortField, setSortField] = useState<"name" | "status" | "importance">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editModeItem, setEditModeItem] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  
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
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case "Priority OFI":
        return (
          <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive">
            {status}
          </Badge>
        );
      case "OFI":
        return (
          <Badge variant="outline" className="border-yellow-500 bg-yellow-500/10 text-yellow-600">
            {status}
          </Badge>
        );
      case "OK":
        return (
          <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-600">
            {status}
          </Badge>
        );
      case "N/A":
        return (
          <Badge variant="outline" className="border-gray-500 bg-gray-500/10 text-gray-600">
            {status}
          </Badge>
        );
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

  // Handle edit notes
  const handleEditClick = (item: AuditItem) => {
    setEditModeItem(item.name);
    setEditNotes(item.notes || "");
  };

  const handleSaveNotes = (item: AuditItem) => {
    // In a real implementation, this would save to the backend
    console.log("Saving notes for:", item.name, "Notes:", editNotes);
    setEditModeItem(null);
  };

  const handleCancelEdit = () => {
    setEditModeItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex space-x-2 mt-2 md:mt-0">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search audit items..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
              <SelectTrigger className="w-full md:w-[150px]">
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
              <SelectTrigger className="w-full md:w-[150px]">
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
              <SelectTrigger className="w-full md:w-[150px]">
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
        
        {currentView === "list" ? (
          // List view
          <div className="border rounded-md">
            <div className="bg-muted px-4 py-2 rounded-t-md grid grid-cols-12 gap-4 font-medium text-sm">
              <div className="col-span-5 flex items-center cursor-pointer" onClick={() => toggleSort("name")}>
                Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => toggleSort("status")}>
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => toggleSort("importance")}>
                Importance {sortField === "importance" && (sortDirection === "asc" ? "↑" : "↓")}
              </div>
              <div className="col-span-3">Notes</div>
            </div>
            
            <Accordion type="multiple" className="rounded-b-md">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <AccordionItem key={`list-${index}`} value={`item-${index}`}>
                    <AccordionTrigger className="grid grid-cols-12 gap-4 px-4 py-3 hover:no-underline">
                      <div className="col-span-5 font-medium flex items-center">
                        {getStatusIcon(item.status)}
                        <span className="ml-2 text-left">{item.name}</span>
                      </div>
                      <div className="col-span-2">
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="col-span-2">
                        {getImportanceBadge(item.importance)}
                      </div>
                      <div className="col-span-3 truncate text-muted-foreground">
                        {item.notes ? item.notes.substring(0, 50) + (item.notes.length > 50 ? "..." : "") : "No notes"}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 border-t">
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 md:col-span-8 space-y-4">
                          <div>
                            <h4 className="font-medium">Description</h4>
                            <p className="text-muted-foreground mt-1">
                              {item.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-12 md:col-span-4 space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Notes</h4>
                            {editModeItem === item.name ? (
                              <div className="space-y-2">
                                <Textarea 
                                  value={editNotes} 
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="Add notes about this audit item..."
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveNotes(item)}>Save</Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-muted-foreground">
                                  {item.notes || "No notes added yet"}
                                </p>
                                <Button size="sm" variant="outline" onClick={() => handleEditClick(item)}>
                                  Edit Notes
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No audit items found matching your filters
                </div>
              )}
            </Accordion>
          </div>
        ) : (
          // Category view
          <Tabs defaultValue="UX/CTA" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="UX/CTA">UX/CTA ({filteredAndSortedItems.filteredCategories["UX/CTA"].length})</TabsTrigger>
              <TabsTrigger value="On-Page">On-Page ({filteredAndSortedItems.filteredCategories["On-Page"].length})</TabsTrigger>
              <TabsTrigger value="Footer">Footer ({filteredAndSortedItems.filteredCategories["Footer"].length})</TabsTrigger>
              <TabsTrigger value="Content">Content ({filteredAndSortedItems.filteredCategories["Content"].length})</TabsTrigger>
              <TabsTrigger value="Other">Other ({filteredAndSortedItems.filteredCategories["Other"].length})</TabsTrigger>
            </TabsList>
            
            {Object.keys(filteredAndSortedItems.filteredCategories).map(category => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="border rounded-md">
                  <div className="bg-muted px-4 py-2 rounded-t-md grid grid-cols-12 gap-4 font-medium text-sm">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Importance</div>
                    <div className="col-span-3">Notes</div>
                  </div>
                  
                  <Accordion type="multiple" className="rounded-b-md">
                    {filteredAndSortedItems.filteredCategories[category].length > 0 ? (
                      filteredAndSortedItems.filteredCategories[category].map((item, index) => (
                        <AccordionItem key={`${category}-${index}`} value={`${category}-${index}`}>
                          <AccordionTrigger className="grid grid-cols-12 gap-4 px-4 py-3 hover:no-underline">
                            <div className="col-span-5 font-medium flex items-center">
                              {getStatusIcon(item.status)}
                              <span className="ml-2 text-left">{item.name}</span>
                            </div>
                            <div className="col-span-2">
                              {getStatusBadge(item.status)}
                            </div>
                            <div className="col-span-2">
                              {getImportanceBadge(item.importance)}
                            </div>
                            <div className="col-span-3 truncate text-muted-foreground">
                              {item.notes ? item.notes.substring(0, 50) + (item.notes.length > 50 ? "..." : "") : "No notes"}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 py-3 border-t">
                            <div className="grid grid-cols-12 gap-6">
                              <div className="col-span-12 md:col-span-8 space-y-4">
                                <div>
                                  <h4 className="font-medium">Description</h4>
                                  <p className="text-muted-foreground mt-1">
                                    {item.description || "No description provided"}
                                  </p>
                                </div>
                              </div>
                              <div className="col-span-12 md:col-span-4 space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Notes</h4>
                                  {editModeItem === item.name ? (
                                    <div className="space-y-2">
                                      <Textarea 
                                        value={editNotes} 
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        placeholder="Add notes about this audit item..."
                                        className="min-h-[100px]"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleSaveNotes(item)}>Save</Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-muted-foreground">
                                        {item.notes || "No notes added yet"}
                                      </p>
                                      <Button size="sm" variant="outline" onClick={() => handleEditClick(item)}>
                                        Edit Notes
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No audit items found in this category matching your filters
                      </div>
                    )}
                  </Accordion>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}