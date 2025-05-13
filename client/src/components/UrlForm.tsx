import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  initialUrl?: string;
}

export default function UrlForm({ onSubmit, isLoading = false, initialUrl = "" }: UrlFormProps) {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Add protocol if missing
    let urlToSubmit = url.trim();
    if (urlToSubmit && !urlToSubmit.startsWith('http://') && !urlToSubmit.startsWith('https://')) {
      urlToSubmit = 'https://' + urlToSubmit;
    }
    
    onSubmit(urlToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
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
          <p className="text-xs text-muted-foreground mt-1.5 ml-1">
            Enter a complete URL including https:// or http://
          </p>
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
    </form>
  );
}
