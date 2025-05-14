import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SeoAnalysisResult } from '@shared/schema';
import { exportToPDF, PDFExportOptions } from '@/lib/pdfExport';
import { FileDown, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportPdfButtonProps {
  analysisResult: SeoAnalysisResult;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ExportPdfButton({
  analysisResult,
  className = '',
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ExportPdfButtonProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    includeLogo: true,
    includeScore: true,
    includeKeywordAnalysis: true,
    includeContentAnalysis: true,
    includeTechnicalAnalysis: true,
    includeCompetitors: true,
    includeActionPlan: true,
    customTitle: '',
    companyName: '',
    showPriority: true,
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Export to PDF
      await exportToPDF(analysisResult, exportOptions);
      
      setIsDialogOpen(false);
      toast({
        title: 'PDF Exported',
        description: 'Your SEO analysis has been downloaded as a PDF.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant={variant} 
                size={size}
                className={className}
              >
                <FileText className="w-4 h-4 mr-2" />
                {showLabel && 'Export PDF'}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export SEO analysis as PDF</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export SEO Analysis as PDF</DialogTitle>
          <DialogDescription>
            Customize your PDF export with the options below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customTitle">Custom Title (Optional)</Label>
              <Input
                id="customTitle"
                placeholder="SEO Analysis Report"
                value={exportOptions.customTitle}
                onChange={(e) => setExportOptions({ ...exportOptions, customTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                placeholder="Your Company"
                value={exportOptions.companyName}
                onChange={(e) => setExportOptions({ ...exportOptions, companyName: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeLogo"
                checked={exportOptions.includeLogo}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  includeLogo: checked as boolean 
                })}
              />
              <Label htmlFor="includeLogo">Include Logo</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeScore"
                checked={exportOptions.includeScore}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  includeScore: checked as boolean 
                })}
              />
              <Label htmlFor="includeScore">Overall Score</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeKeywordAnalysis"
                checked={exportOptions.includeKeywordAnalysis}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  includeKeywordAnalysis: checked as boolean 
                })}
              />
              <Label htmlFor="includeKeywordAnalysis">Keyword Analysis</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeContentAnalysis"
                checked={exportOptions.includeContentAnalysis}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  includeContentAnalysis: checked as boolean 
                })}
              />
              <Label htmlFor="includeContentAnalysis">Content Analysis</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeTechnicalAnalysis"
                checked={exportOptions.includeTechnicalAnalysis}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  includeTechnicalAnalysis: checked as boolean 
                })}
              />
              <Label htmlFor="includeTechnicalAnalysis">Technical Analysis</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCompetitors"
                checked={exportOptions.includeCompetitors}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  includeCompetitors: checked as boolean 
                })}
              />
              <Label htmlFor="includeCompetitors">Competitor Analysis</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeActionPlan"
                checked={exportOptions.includeActionPlan}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  includeActionPlan: checked as boolean 
                })}
              />
              <Label htmlFor="includeActionPlan">Action Plan</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPriority"
                checked={exportOptions.showPriority}
                onCheckedChange={(checked) => setExportOptions({ 
                  ...exportOptions, 
                  showPriority: checked as boolean 
                })}
              />
              <Label htmlFor="showPriority">Show Priority Levels</Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export PDF'}
            <FileDown className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}