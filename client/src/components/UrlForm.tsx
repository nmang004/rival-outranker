import { useState, FormEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, X, Globe, ExternalLink, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

interface UrlFormProps {
  onSubmit: (url: string, targetKeyword?: string) => void;
  isLoading?: boolean;
  initialUrl?: string;
  initialKeyword?: string;
}

export default function UrlForm({ onSubmit, isLoading = false, initialUrl = "", initialKeyword = "" }: UrlFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [targetKeyword, setTargetKeyword] = useState(initialKeyword);
  const [urls, setUrls] = useState<string[]>([]);
  const [multipleMode, setMultipleMode] = useState(false); // Default to single URL mode
  const [bulkText, setBulkText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  // Process the current URL if there's an initial URL provided
  useEffect(() => {
    if (initialUrl && initialUrl.trim() !== "") {
      setUrl(initialUrl);
    }
  }, [initialUrl]);
  
  // Helper function to normalize URLs
  const normalizeUrl = (url: string): string => {
    // Clean up URL string - remove extra spaces
    url = url.trim();

    // Handle double protocol issues (e.g., https://https://)
    url = url.replace(/^(https?:\/\/)+/i, '$1');
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    return url;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (multipleMode && urls.length > 0) {
      // Submit the first URL in the list
      let urlToSubmit = normalizeUrl(urls[0]);
      
      // Remove the first URL from the list
      setUrls(urls.slice(1));
      
      onSubmit(urlToSubmit, targetKeyword.trim() || undefined);
    } else {
      // Check if the input contains commas (multiple URLs)
      if (url.includes(',')) {
        // Split by comma and add to the URLs list
        const splitUrls = url.split(',').map(u => u.trim()).filter(u => u.length > 0);
        
        if (splitUrls.length > 0) {
          // Process and submit the first URL
          let urlToSubmit = normalizeUrl(splitUrls[0]);
          
          // Store the rest for later processing
          setUrls(prevUrls => [...prevUrls, ...splitUrls.slice(1)]);
          
          // Clear the input field
          setUrl('');
          
          onSubmit(urlToSubmit, targetKeyword.trim() || undefined);
          return;
        }
      }
      
      // Handle single URL case
      if (url.trim()) {
        const urlToSubmit = normalizeUrl(url);
        onSubmit(urlToSubmit, targetKeyword.trim() || undefined);
      }
    }
  };
  
  const handleAddUrl = () => {
    if (url.trim()) {
      // Check for comma-separated URLs
      if (url.includes(',')) {
        // Split by comma and add all to the URLs list
        const splitUrls = url.split(',')
          .map(u => u.trim())
          .filter(u => u.length > 0)
          .map(u => normalizeUrl(u)); // Normalize each URL
        
        setUrls(prevUrls => [...prevUrls, ...splitUrls]);
      } else {
        // Add single URL
        setUrls([...urls, normalizeUrl(url.trim())]);
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
    setBulkText(value);
    
    // First split by line breaks
    const lines = value.split('\n');
    
    // Process each line to handle potential comma-separated URLs within a line
    const processedUrls: string[] = [];
    
    lines.forEach(line => {
      if (line.includes(',')) {
        // If line contains commas, split by comma and add each URL
        const commaUrls = line.split(',')
          .map(u => u.trim())
          .filter(u => u.length > 0)
          .map(u => normalizeUrl(u)); // Normalize each URL
        
        processedUrls.push(...commaUrls);
      } else if (line.trim().length > 0) {
        // If it's a single URL per line, just add it
        processedUrls.push(normalizeUrl(line.trim()));
      }
    });
    
    setUrls(processedUrls);
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Check if it's a text file
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const content = event.target.result as string;
            handleBulkInput(content);
          }
        };
        reader.readAsText(file);
      }
    } else if (e.dataTransfer.getData('text')) {
      const text = e.dataTransfer.getData('text');
      handleBulkInput(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {!multipleMode ? (
            <motion.div 
              key="single-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="flex-grow">
                <label htmlFor="url" className="flex items-center text-sm font-medium text-foreground mb-2">
                  <Globe className="mr-2 h-4 w-4 text-primary" />
                  Enter a website URL to analyze
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ExternalLink className="h-5 w-5 text-primary/60" />
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
                    Enter a complete URL including https:// or http://
                  </p>
                  <motion.button 
                    type="button" 
                    className="text-xs text-primary font-medium hover:underline"
                    onClick={() => setMultipleMode(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Analyze multiple URLs
                  </motion.button>
                </div>
                
                {/* Target Keyword Field */}
                <div className="mt-4">
                  <label htmlFor="targetKeyword" className="flex items-center text-sm font-medium text-foreground mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" 
                      className="mr-2 h-4 w-4 text-primary" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Target Keyword (Optional)
                  </label>
                  <Input 
                    type="text"
                    id="targetKeyword"
                    className="py-2 focus:ring-primary focus:border-primary/70 border-primary/20 text-foreground bg-white shadow-sm"
                    placeholder="Enter primary keyword to focus on"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Adding a target keyword will pre-populate the keyword field in the analysis
                  </p>
                </div>
              </div>
              <div className="flex items-end">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button 
                    type="submit" 
                    className="px-8 py-3 h-[48px] bg-gradient-to-r from-primary to-primary/70 hover:shadow-md transition-all duration-300"
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
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="multiple-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="multipleUrls" className="flex items-center text-sm font-medium text-foreground">
                    <Globe className="mr-2 h-4 w-4 text-primary" />
                    Multi-URL Analysis
                  </label>
                  <motion.button 
                    type="button" 
                    className="text-xs text-primary font-medium hover:underline"
                    onClick={() => setMultipleMode(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Single URL mode
                  </motion.button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <div className="relative rounded-md shadow-sm flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ExternalLink className="h-5 w-5 text-primary/60" />
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      type="button" 
                      onClick={handleAddUrl}
                      className="px-4 py-3 h-[48px] bg-primary hover:bg-primary/90 transition-all duration-300 hover:shadow-md"
                      disabled={isLoading || !url.trim()}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
                
                <div 
                  className={`mb-3 border-2 border-dashed rounded-md transition-all ${
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                    <p className="text-sm font-medium mb-1">
                      Drag and drop a text file or paste URLs below
                    </p>
                    <p className="text-xs text-muted-foreground">
                      One URL per line or separate multiple URLs with commas
                    </p>
                  </div>
                  
                  <Textarea
                    placeholder="https://example.com&#10;https://example.org&#10;https://another-site.com,https://more-sites.com"
                    className="min-h-[120px] border-0 border-t rounded-none focus:ring-0 bg-muted/5"
                    value={bulkText}
                    onChange={(e) => handleBulkInput(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <Card className="p-3 mb-4 max-h-[240px] overflow-y-auto border-primary/10 shadow-sm">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-primary/70" />
                    URLs to analyze <span className="ml-1 text-primary font-semibold">({urls.length})</span>
                  </h4>
                  
                  <AnimatePresence>
                    {urls.length === 0 ? (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-muted-foreground italic text-center my-4"
                      >
                        No URLs added yet. Enter URLs above or drag a file to get started.
                      </motion.p>
                    ) : (
                      <motion.ul className="space-y-2">
                        {urls.map((u, index) => (
                          <motion.li 
                            key={index} 
                            className="flex items-center justify-between bg-white p-2 rounded-md text-sm border border-muted shadow-sm hover:shadow-md transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="truncate flex-grow flex items-center">
                              <ExternalLink className="h-3.5 w-3.5 mr-2 text-primary/70" />
                              {u}
                            </span>
                            <motion.button 
                              type="button" 
                              onClick={() => handleRemoveUrl(index)}
                              className="text-muted-foreground hover:text-destructive ml-2 p-1 rounded-full hover:bg-destructive/10 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button 
                    type="submit" 
                    className="px-8 py-3 h-[48px] bg-gradient-to-r from-primary to-primary/70 hover:shadow-md transition-all duration-300"
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
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </form>
  );
}
