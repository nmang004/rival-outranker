import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestExportPage() {
  const [url, setUrl] = useState("https://example.com");
  const { toast } = useToast();
  
  const handleExportToExcel = () => {
    try {
      toast({
        title: "Exporting audit data",
        description: "Your Excel file is being generated and will download shortly.",
        duration: 3000
      });
      
      window.open(`/api/rival-audit/1/export?url=${encodeURIComponent(url)}`, '_blank');
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the audit data. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Test Excel Export</h1>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Rival Audit Excel Export</CardTitle>
          <CardDescription>
            Test the Excel export functionality by entering a URL and clicking the export button.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">Website URL</label>
              <Input 
                id="url" 
                placeholder="https://example.com" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleExportToExcel} 
            className="w-full flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="h-5 w-5" />
            Export to Excel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}