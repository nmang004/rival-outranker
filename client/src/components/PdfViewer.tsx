import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface PdfViewerProps {
  pdfUrl: string;
  height?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, height = '500px' }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">PDF Document</h3>
        <Button 
          size="sm"
          variant="outline"
          asChild
          className="h-8 gap-1"
        >
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Open in New Tab
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
      
      <div 
        className="w-full border rounded-md overflow-hidden bg-white"
        style={{ height }}
      >
        {/* Primary PDF display method */}
        <embed
          src={pdfUrl}
          type="application/pdf"
          width="100%"
          height="100%"
          className="w-full h-full"
        />
      </div>
      
      {/* Fallback for browsers that don't support <embed> */}
      <noscript>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Your browser doesn't support embedded PDFs</p>
          <p className="mt-1">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Click here to view the PDF directly
            </a>
          </p>
        </div>
      </noscript>
    </div>
  );
};

export default PdfViewer;