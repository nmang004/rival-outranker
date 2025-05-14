import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AuditItem, AuditStatus, SeoImportance } from "@shared/schema";
import { AlertCircle, AlertTriangle, CheckCircle, CircleHelp, Search } from "lucide-react";

interface RivalAuditSectionProps {
  title: string;
  description: string;
  items: AuditItem[];
}

export default function RivalAuditSection({ title, description, items }: RivalAuditSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [importanceFilter, setImportanceFilter] = useState<string | null>(null);
  const [editModeItem, setEditModeItem] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");

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

  // Filter items based on search term and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || statusFilter === "all-statuses" || item.status === statusFilter;
    const matchesImportance = !importanceFilter || importanceFilter === "all-importance" || item.importance === importanceFilter;
    
    return matchesSearch && matchesStatus && matchesImportance;
  });

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
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
          <div className="flex gap-2">
            <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
              <SelectTrigger className="w-[160px]">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by importance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-importance">All Importance</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="border rounded-md">
          <div className="bg-muted px-4 py-2 rounded-t-md grid grid-cols-12 gap-4 font-medium text-sm">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Importance</div>
            <div className="col-span-3">Notes</div>
          </div>
          
          <Accordion type="multiple" className="rounded-b-md">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="grid grid-cols-12 gap-4 px-4 py-3 hover:no-underline">
                    <div className="col-span-5 font-medium flex items-center">
                      {getStatusIcon(item.status)}
                      <span className="ml-2">{item.name}</span>
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
      </CardContent>
    </Card>
  );
}