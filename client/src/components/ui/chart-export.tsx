import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/ui/use-toast';

interface ChartExportProps {
  chartRef: React.RefObject<HTMLDivElement>;
  filename?: string;
  title?: string;
  size?: 'sm' | 'lg' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

export function ChartExport({ 
  chartRef, 
  filename = 'chart', 
  title = 'Export Chart',
  size = 'default',
  variant = 'outline'
}: ChartExportProps) {
  const { toast } = useToast();

  const exportToPNG = async () => {
    if (!chartRef.current) {
      toast({
        title: "Export Error",
        description: "Chart not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create canvas from the chart element
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: chartRef.current.offsetWidth,
        height: chartRef.current.offsetHeight,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Export Successful",
            description: `${title} exported as PNG successfully!`,
          });
        } else {
          throw new Error('Failed to create image blob');
        }
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('Chart export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the chart. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={exportToPNG}
      size={size}
      variant={variant}
      className="gap-2"
      title={title}
    >
      <Download className="h-4 w-4" />
      Export PNG
    </Button>
  );
}