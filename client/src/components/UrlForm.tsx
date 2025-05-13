import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  initialUrl?: string;
}

export default function UrlForm({ onSubmit, isLoading = false, initialUrl = "" }: UrlFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [urls, setUrls] = useState<string[]>([]);
  const [multipleMode, setMultipleMode] = useState(false);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (multipleMode && urls.length > 0) {
      // Submit the first URL in the list
      let urlToSubmit = urls[0].trim();
      if (urlToSubmit && !urlToSubmit.startsWith('http://') && !urlToSubmit.startsWith('https://')) {
        urlToSubmit = 'https://' + urlToSubmit;
      }
      
      // Remove the first URL from the list
      setUrls(urls.slice(1));
      
      onSubmit(urlToSubmit);
    } else {
      // Check if the input contains commas (multiple URLs)
      if (url.includes(',')) {
        // Split by comma and add to the URLs list
        const splitUrls = url.split(',').map(u => u.trim()).filter(u => u.length > 0);
        
        if (splitUrls.length > 0) {
          // Process and submit the first URL
          let urlToSubmit = splitUrls[0];
          if (urlToSubmit && !urlToSubmit.startsWith('http://') && !urlToSubmit.startsWith('https://')) {
            urlToSubmit = 'https://' + urlToSubmit;
          }
          
          // Store the rest for later processing
          setUrls(prevUrls => [...prevUrls, ...splitUrls.slice(1)]);
          
          // Clear the input field
          setUrl('');
          
          onSubmit(urlToSubmit);
          return;
        }
      }
      
      // Handle single URL case
      let urlToSubmit = url.trim();
      if (urlToSubmit && !urlToSubmit.startsWith('http://') && !urlToSubmit.startsWith('https://')) {
        urlToSubmit = 'https://' + urlToSubmit;
      }
      
      onSubmit(urlToSubmit);
    }
  };
  
  const handleAddUrl = () => {
    if (url.trim()) {
      // Check for comma-separated URLs
      if (url.includes(',')) {
        // Split by comma and add all to the URLs list
        const splitUrls = url.split(',')
          .map(u => u.trim())
          .filter(u => u.length > 0);
        
        setUrls(prevUrls => [...prevUrls, ...splitUrls]);
      } else {
        // Add single URL
        setUrls([...urls, url.trim()]);
      }
      setUrl("");
    }
  };
  
  const handleRemoveUrl = (index: number) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    setUrls(newUrls);
  };
  
  const handleBulkInput = (value: string) => {
    // First split by line breaks
    const lines = value.split('\n');
    
    // Process each line to handle potential comma-separated URLs within a line
    const processedUrls: string[] = [];
    
    lines.forEach(line => {
      if (line.includes(',')) {
        // If line contains commas, split by comma and add each URL
        const commaUrls = line.split(',')
          .map(u => u.trim())
          .filter(u => u.length > 0);
        
        processedUrls.push(...commaUrls);
      } else if (line.trim().length > 0) {
        // If it's a single URL per line, just add it
        processedUrls.push(line.trim());
      }
    });
    
    setUrls(processedUrls);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      {!multipleMode ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
              Enter a website URL to analyze
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary/60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <Input 
                type="text"
                id="url"
                className="pl-10 py-6 focus:ring-primary focus:border-primary/70 border-primary/20 text-foreground bg-white shadow-sm"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-between mt-1.5 ml-1">
              <p className="text-xs text-muted-foreground">
                Enter a complete URL including https:// or http:// (or multiple URLs separated by commas)
              </p>
              <button 
                type="button" 
                className="text-xs text-primary font-medium hover:underline"
                onClick={() => setMultipleMode(true)}
              >
                Analyze multiple URLs
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <Button 
              type="submit" 
              className="px-8 py-3 h-[48px] sage-bg-gradient hover:opacity-90 transition-opacity"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Analyze SEO
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="multipleUrls" className="block text-sm font-medium text-foreground">
                Enter multiple URLs to analyze
              </label>
              <button 
                type="button" 
                className="text-xs text-primary font-medium hover:underline"
                onClick={() => setMultipleMode(false)}
              >
                Single URL mode
              </button>
            </div>
            
            <div className="flex gap-2 mb-3">
              <div className="relative rounded-md shadow-sm flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary/60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <Input 
                  type="text"
                  className="pl-10 py-6 focus:ring-primary focus:border-primary/70 border-primary/20 text-foreground bg-white shadow-sm"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleAddUrl}
                className="px-4 py-3 h-[48px] bg-primary hover:bg-primary/90 transition-colors"
                disabled={isLoading || !url.trim()}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-foreground mb-2">
                Or paste multiple URLs (one per line or comma-separated)
              </label>
              <Textarea
                placeholder="https://example.com&#10;https://example.org&#10;https://another-site.com,https://more-sites.com"
                className="min-h-[100px] focus:ring-primary focus:border-primary/70 border-primary/20"
                onChange={(e) => handleBulkInput(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                Enter one URL per line or separate multiple URLs with commas
              </p>
            </div>
            
            <div className="border border-muted rounded-md p-3 mb-4 max-h-[200px] overflow-y-auto bg-muted/10">
              <h4 className="text-sm font-medium mb-2">URLs to analyze ({urls.length})</h4>
              {urls.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No URLs added yet</p>
              ) : (
                <ul className="space-y-2">
                  {urls.map((u, index) => (
                    <li key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                      <span className="truncate flex-grow">{u}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveUrl(index)}
                        className="text-muted-foreground hover:text-destructive ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="px-8 py-3 h-[48px] sage-bg-gradient hover:opacity-90 transition-opacity"
              disabled={isLoading || (urls.length === 0 && !url.trim())}
            >
              {isLoading ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  {urls.length > 0 ? `Analyze ${urls.length + (url.trim() ? 1 : 0)} URLs` : 'Analyze SEO'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
