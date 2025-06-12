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
  
  // Track if we're in a Priority OFI flow to prevent resets
  const [isPriorityOFIFlow, setIsPriorityOFIFlow] = useState(false);

  // Reset edit status when dialog opens (but NEVER if we're in Priority OFI flow)
  useEffect(() => {
    if (open && !isPriorityOFIFlow) {
      console.log('🔧 useEffect: Resetting editStatus from', editStatus, 'to', item.status);
      setEditStatus(item.status);
      setEditNotes(item.notes || "");
      setPriorityOFIConfirmed(false);
    } else if (open) {
      console.log('🔧 useEffect: NOT resetting because isPriorityOFIFlow is true');
    }
  }, [open, isPriorityOFIFlow]);

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
    console.log('🔧 handleStatusClick called with:', status, 'current editStatus:', editStatus, 'item.status:', item.status);
    if (status === "Priority OFI" && item.status !== "Priority OFI") {
      // Enter Priority OFI flow - prevent any resets from this point
      console.log('🔧 ENTERING Priority OFI flow - showing warning dialog');
      setIsPriorityOFIFlow(true);
      setEditStatus(status);
      setPriorityOFIConfirmed(false); // Reset confirmation for new attempt
      setShowPriorityWarning(true);
      console.log('🔧 Priority OFI flow state set:', {
        isPriorityOFIFlow: true,
        editStatus: status,
        priorityOFIConfirmed: false,
        showPriorityWarning: true
      });
    } else if (status === "Priority OFI" && item.status === "Priority OFI") {
      // Already Priority OFI, no warning needed
      console.log('🔧 Item already Priority OFI, no confirmation needed');
      setEditStatus(status);
    } else {
      // Reset Priority OFI flow flag for other statuses
      console.log('🔧 Resetting Priority OFI flow for status:', status);
      setIsPriorityOFIFlow(false);
      setEditStatus(status);
      setPriorityOFIConfirmed(false);
      console.log('🔧 Set editStatus to:', status, 'and reset Priority OFI flow');
    }
  };

  const handlePriorityOFIConfirm = (justification: string) => {
    console.log('🔧 CONFIRMING Priority OFI with justification:', justification.substring(0, 50) + '...');
    
    // Add justification to notes
    const newNotes = editNotes + (editNotes ? "\n\n" : "") + "[Priority OFI Justification] " + justification;
    setEditNotes(newNotes);
    
    // Mark as confirmed and FORCE Priority OFI status (defensive programming)
    setPriorityOFIConfirmed(true);
    setEditStatus("Priority OFI");
    setIsPriorityOFIFlow(true); // Ensure flow flag remains true
    setShowPriorityWarning(false);
    
    // DEBUG: Confirm Priority OFI status is set
    console.log('🔧 Priority OFI CONFIRMED and state locked:', {
      editStatus: "Priority OFI",
      priorityOFIConfirmed: true,
      isPriorityOFIFlow: true,
      notesLength: newNotes.length,
      justificationAdded: true
    });
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      // CRITICAL: Ensure Priority OFI status is maintained if confirmed
      // Multiple checks to ensure Priority OFI is preserved
      let finalStatus: AuditStatus;
      
      if (priorityOFIConfirmed && isPriorityOFIFlow && editStatus === "Priority OFI") {
        finalStatus = "Priority OFI";
        console.log('🔧 PRIORITY OFI CONFIRMED: Using confirmed Priority OFI status');
      } else if (editStatus === "Priority OFI" && priorityOFIConfirmed) {
        finalStatus = "Priority OFI";
        console.log('🔧 PRIORITY OFI CONFIRMED (fallback): Using confirmed Priority OFI status');
      } else if (editStatus === "Priority OFI" && !priorityOFIConfirmed) {
        // This should not happen if validation is working correctly
        console.log('🔧 ERROR: Priority OFI selected but not confirmed - this should not happen!');
        finalStatus = editStatus; // Allow it through for now, but log error
      } else {
        finalStatus = editStatus;
        console.log('🔧 Using regular editStatus:', editStatus);
      }
      
      // DEBUG: Comprehensive logging of finalStatus determination
      console.log('🔧 SAVE FUNCTION: Determining final status:', {
        editStatus: editStatus,
        priorityOFIConfirmed: priorityOFIConfirmed,
        isPriorityOFIFlow: isPriorityOFIFlow,
        conditionalCheck: priorityOFIConfirmed && isPriorityOFIFlow,
        finalStatus: finalStatus,
        originalItemStatus: item.status
      });
      
      // DEBUG: Log what we're sending to backend with extra validation
      console.log('🔧 QuickStatusChange: Preparing to send to backend:', {
        sectionName,
        itemName: item.name,
        editStatus: editStatus,
        finalStatus: finalStatus,
        notes: editNotes.substring(0, 100) + '...',
        originalItemStatus: item.status,
        priorityOFIConfirmed: priorityOFIConfirmed,
        isPriorityOFIFlow: isPriorityOFIFlow
      });
      
      // Additional validation for Priority OFI
      if (finalStatus === "Priority OFI") {
        console.log('🔧 ✅ CONFIRMED: Sending Priority OFI status to backend');
      } else {
        console.log('🔧 ❌ WARNING: NOT sending Priority OFI - sending:', finalStatus);
      }
      
      // Send update to the backend using finalStatus
      const response = await fetch(`/api/rival-audit/${auditId}/update-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionName,
          itemName: item.name,
          status: finalStatus,
          notes: editNotes
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update item: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // DEBUG: Log backend response
      console.log('🔧 QuickStatusChange: Backend response:', result);
      
      // Create updated item with new status and notes using finalStatus
      const updatedItem = {
        ...item,
        status: finalStatus as AuditStatus,
        notes: editNotes
      };
      
      // Show success toast using backend response
      toast({
        title: "Item updated",
        description: result.oldStatus && result.newStatus ? 
          `Status changed from "${result.oldStatus}" to "${result.newStatus}"` :
          `Status changed to ${finalStatus}`,
        duration: 3000,
      });
      
      // Reset Priority OFI flow state after successful save
      setIsPriorityOFIFlow(false);
      setPriorityOFIConfirmed(false);
      
      // Close dialog
      onOpenChange(false);
      
      // Callback with updated item
      if (onSuccess) {
        onSuccess(updatedItem);
      }
      
      // Force a re-render of the parent component with updated summary
      if (typeof window !== 'undefined') {
        console.log('🔧 Dispatching audit-item-updated event with summary:', result.summary);
        
        // Create and dispatch a custom event that the parent can listen for
        const updateEvent = new CustomEvent('audit-item-updated', { 
          detail: { 
            summary: result.summary,
            oldStatus: result.oldStatus,
            newStatus: result.newStatus,
            updatedAt: new Date().getTime(), // Add timestamp for forcing rerenders
            item: item.name,
            finalStatusUsed: finalStatus
          } 
        });
        
        console.log('🔧 Event detail being dispatched:', updateEvent.detail);
        
        // Dispatch event with a slight delay to ensure UI updates
        setTimeout(() => {
          console.log('🔧 Dispatching audit-item-updated event now');
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
            disabled={isUpdating || (editStatus === "Priority OFI" && !priorityOFIConfirmed)}
          >
            {isUpdating ? "Saving..." : 
             editStatus === "Priority OFI" && !priorityOFIConfirmed ? "Confirm Priority OFI First" : 
             "Save"}
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
            // If user cancelled (not confirmed), revert status change and reset flow
            console.log('🔧 Priority OFI dialog cancelled - reverting to original status:', item.status);
            setEditStatus(item.status);
            setIsPriorityOFIFlow(false);
            setPriorityOFIConfirmed(false);
          } else if (!open && priorityOFIConfirmed) {
            // If dialog closing after confirmation, maintain Priority OFI status
            console.log('🔧 Priority OFI dialog closed after confirmation - maintaining Priority OFI status');
          }
          setShowPriorityWarning(open);
          // Only reset confirmation flag when dialog opens (not when closing)
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