import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, Share2, BookmarkPlus, Repeat2 } from "lucide-react";

interface NextStepsProps {
  url: string;
}

export default function NextSteps({ url }: NextStepsProps) {
  const { toast } = useToast();
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  
  const handleDownloadReport = () => {
    toast({
      title: "Download Initiated",
      description: "The full report download feature will be available in the next update.",
    });
  };
  
  const handleShareReport = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "The analysis URL has been copied to your clipboard.",
    });
  };
  
  const handleAddToFavorites = () => {
    toast({
      title: "Added to Favorites",
      description: "This analysis has been added to your favorites for easy access.",
    });
  };
  
  const handleScheduleClick = () => {
    setIsSchedulingOpen(true);
  };
  
  const handleScheduleConfirm = () => {
    setIsSchedulingOpen(false);
    toast({
      title: "Re-Analysis Scheduled",
      description: "We'll analyze this URL again in 2 weeks and notify you with the results.",
    });
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Next Steps</h3>
          <Button onClick={handleScheduleClick}>
            <Repeat2 className="h-4 w-4 mr-2" />
            Schedule Re-Analysis
          </Button>
        </div>
        <p className="text-gray-600 mb-4">After implementing the recommended changes, we suggest:</p>
        <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
          <li>Schedule a follow-up analysis in 2-4 weeks to track improvements</li>
          <li>Monitor search rankings for your target keywords using Search Console</li>
          <li>Analyze user behavior metrics to ensure the changes positively impact user experience</li>
          <li>Consider expanding your content strategy based on the keyword opportunities identified</li>
        </ol>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownloadReport}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download Full Report
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleShareReport}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Share Report
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAddToFavorites}
            >
              <BookmarkPlus className="h-4 w-4 mr-1.5" />
              Add to Favorites
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scheduling Dialog */}
      <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Re-Analysis</DialogTitle>
            <DialogDescription>
              We'll analyze this URL again and notify you with the results.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">URL to re-analyze:</p>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 overflow-hidden overflow-ellipsis">
                {url}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Select frequency:</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-primary-500 bg-primary-50 rounded-md p-3 flex flex-col items-center cursor-pointer">
                  <span className="text-xs text-gray-500">Every</span>
                  <span className="font-semibold text-primary-700">2 Weeks</span>
                </div>
                <div className="border border-gray-200 rounded-md p-3 flex flex-col items-center cursor-pointer hover:border-gray-300">
                  <span className="text-xs text-gray-500">Every</span>
                  <span className="font-semibold text-gray-700">Month</span>
                </div>
                <div className="border border-gray-200 rounded-md p-3 flex flex-col items-center cursor-pointer hover:border-gray-300">
                  <span className="text-xs text-gray-500">Every</span>
                  <span className="font-semibold text-gray-700">Quarter</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSchedulingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleConfirm}>
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
