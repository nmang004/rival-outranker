import { useState, useEffect } from "react";
import { AuditItem, EnhancedAuditItem, AuditStatus, RivalAudit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/ui/use-toast";
import { PriorityOFIWarningDialog } from "./PriorityOFIWarningDialog";

interface QuickStatusChangeProps {
  item: AuditItem | EnhancedAuditItem;
  auditId: string;
  sectionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedItem: AuditItem | EnhancedAuditItem) => void;
}

export default function QuickStatusChange({
  item, 
  auditId, 
  sectionName, 
  open, 
  onOpenChange,
  onSuccess
}: QuickStatusChangeProps) {
  const { toast } = useToast();
  const [editStatus, setEditStatus] = useState<AuditStatus>(item.status);
  const [editNotes, setEditNotes] = useState(item.notes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPriorityWarning, setShowPriorityWarning] = useState(false);
  const [priorityOFIConfirmed, setPriorityOFIConfirmed] = useState(false);
  const [auditStats, setAuditStats] = useState<{ priorityOFIPercentage: number; totalPriorityOFI: number; totalItems: number } | null>(null);

  // Reset edit status when dialog opens (but not if Priority OFI is selected)
  useEffect(() => {
    if (open && editStatus !== "Priority OFI") {
      console.log('🔧 useEffect: Resetting editStatus from', editStatus, 'to', item.status);
      setEditStatus(item.status);
      setEditNotes(item.notes || "");
    } else if (open) {
      console.log('🔧 useEffect: NOT resetting because editStatus is Priority OFI');
    }
  }, [open]);

  // Fetch current audit stats on mount
  useEffect(() => {
    const fetchAuditStats = async () => {
      try {
        const response = await fetch(`/api/rival-audit/${auditId}`);
        if (response.ok) {
          const audit: RivalAudit = await response.json();
          
          // Handle both enhanced and legacy category structures
          let allItems: any[] = [];
          
          // Check for enhanced categories first
          if ((audit as any).contentQuality || (audit as any).technicalSEO || (audit as any).localSEO || (audit as any).uxPerformance) {
            allItems = [
              ...((audit as any).contentQuality?.items || []),
              ...((audit as any).technicalSEO?.items || []),
              ...((audit as any).localSEO?.items || []),
              ...((audit as any).uxPerformance?.items || [])
            ];
          } else {
            // Fallback to legacy categories
            allItems = [
              ...audit.onPage.items,
              ...audit.structureNavigation.items,
              ...audit.contactPage.items,
              ...audit.servicePages.items,
              ...audit.locationPages.items,
              ...(audit.serviceAreaPages?.items || [])
            ];
          }
          const totalItems = allItems.length;
          const totalPriorityOFI = allItems.filter(item => item.status === 'Priority OFI').length;
          const priorityOFIPercentage = totalItems > 0 ? (totalPriorityOFI / totalItems) * 100 : 0;
          
          setAuditStats({
            priorityOFIPercentage,
            totalPriorityOFI,
            totalItems
          });
        }
      } catch (error) {
        console.error('Error fetching audit stats:', error);
      }
    };
    
    if (open && auditId) {
      fetchAuditStats();
    }
  }, [open, auditId]);

  const handleStatusClick = (status: AuditStatus) => {
    console.log('🔧 handleStatusClick called with:', status, 'current editStatus:', editStatus);
    if (status === "Priority OFI" && item.status !== "Priority OFI") {
      // Show warning dialog when selecting Priority OFI
      setEditStatus(status);
      setShowPriorityWarning(true);
      console.log('🔧 Set editStatus to Priority OFI and showing warning dialog');
    } else {
      setEditStatus(status);
      console.log('🔧 Set editStatus to:', status);
    }
  };

  const handlePriorityOFIConfirm = (justification: string) => {
    // Add justification to notes
    setEditNotes(editNotes + (editNotes ? "\n\n" : "") + "[Priority OFI Justification] " + justification);
    // Mark as confirmed and keep Priority OFI status
    setPriorityOFIConfirmed(true);
    setEditStatus("Priority OFI");
    setShowPriorityWarning(false);
    
    // DEBUG: Confirm Priority OFI status is set
    console.log('🔧 Priority OFI confirmed, editStatus set to:', "Priority OFI");
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      // DEBUG: Log what we're sending to backend
      console.log('🔧 QuickStatusChange: Sending to backend:', {
        sectionName,
        itemName: item.name,
        status: editStatus,
        notes: editNotes,
        originalItemStatus: item.status
      });
      
      // Send update to the backend
      const response = await fetch(`/api/rival-audit/${auditId}/update-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionName,
          itemName: item.name,
          status: editStatus,
          notes: editNotes
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update item: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // DEBUG: Log backend response
      console.log('🔧 QuickStatusChange: Backend response:', result);
      
      // Create updated item with new status and notes
      const updatedItem = {
        ...item,
        status: editStatus,
        notes: editNotes
      };
      
      // Show success toast using backend response
      toast({
        title: "Item updated",
        description: result.oldStatus && result.newStatus ? 
          `Status changed from "${result.oldStatus}" to "${result.newStatus}"` :
          `Status changed to ${editStatus}`,
        duration: 3000,
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Callback with updated item
      if (onSuccess) {
        onSuccess(updatedItem);
      }
      
      // Force a re-render of the parent component with updated summary
      if (typeof window !== 'undefined') {
        // Create and dispatch a custom event that the parent can listen for
        const updateEvent = new CustomEvent('audit-item-updated', { 
          detail: { 
            summary: result.summary,
            oldStatus: result.oldStatus,
            newStatus: result.newStatus,
            updatedAt: new Date().getTime(), // Add timestamp for forcing rerenders
          } 
        });
        
        // Dispatch event with a slight delay to ensure UI updates
        setTimeout(() => {
          window.dispatchEvent(updateEvent);
        }, 50);
        
        // Force a re-render of the summary component directly
        document.querySelectorAll('.audit-summary-container').forEach(el => {
          el.classList.add('updating');
          setTimeout(() => el.classList.remove('updating'), 300);
        });
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Failed to update item",
        description: "Please try again or reload the page",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            Quickly change the status for this audit item
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Item</h4>
            <p className="text-sm">{item.name}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status</h4>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className={`border-destructive bg-destructive/10 text-destructive cursor-pointer ${editStatus === "Priority OFI" ? 'ring-2 ring-destructive' : ''}`}
                onClick={() => handleStatusClick("Priority OFI")}
              >
                Priority OFI
              </Badge>
              <Badge 
                variant="outline" 
                className={`border-yellow-500 bg-yellow-500/10 text-yellow-600 cursor-pointer ${editStatus === "OFI" ? 'ring-2 ring-yellow-500' : ''}`}
                onClick={() => setEditStatus("OFI")}
              >
                OFI
              </Badge>
              <Badge 
                variant="outline" 
                className={`border-green-500 bg-green-500/10 text-green-600 cursor-pointer ${editStatus === "OK" ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setEditStatus("OK")}
              >
                OK
              </Badge>
              <Badge 
                variant="outline" 
                className={`border-gray-500 bg-gray-500/10 text-gray-600 cursor-pointer ${editStatus === "N/A" ? 'ring-2 ring-gray-500' : ''}`}
                onClick={() => setEditStatus("N/A")}
              >
                N/A
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Notes</h4>
            <Textarea 
              value={editNotes} 
              onChange={(e) => setEditNotes(e.target.value)} 
              placeholder="Add or update notes (optional)"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Priority OFI Warning Dialog */}
    {auditStats && (
      <PriorityOFIWarningDialog
        open={showPriorityWarning}
        onOpenChange={(open) => {
          if (!open && !priorityOFIConfirmed) {
            // If user cancelled (not confirmed), revert status change
            setEditStatus(item.status);
          }
          setShowPriorityWarning(open);
          // Reset confirmation flag when dialog opens
          if (open) {
            setPriorityOFIConfirmed(false);
          }
        }}
        onConfirm={handlePriorityOFIConfirm}
        currentStats={auditStats}
        itemName={item.name}
      />
    )}
    </>
  );
}