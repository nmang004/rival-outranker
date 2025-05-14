import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Search, ArrowLeft, Plus, Save, Lightbulb, ArrowUpRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function KeywordSuggestionsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [baseKeyword, setBaseKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<number[]>([]);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/api/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const generateSuggestions = async () => {
    if (!baseKeyword.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a base keyword to generate suggestions.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/keywords/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ baseKeyword: baseKeyword.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate keyword suggestions");
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate keyword suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveKeyword = async (suggestionId: number) => {
    try {
      setSavingIds(prev => [...prev, suggestionId]);
      const response = await fetch(`/api/keywords/suggestions/${suggestionId}/save`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to save keyword suggestion");
      }

      // Update the local state to mark the suggestion as saved
      setSuggestions(
        suggestions.map(suggestion => 
          suggestion.id === suggestionId 
            ? { ...suggestion, saved: true } 
            : suggestion
        )
      );

      toast({
        title: "Keyword Saved",
        description: "Keyword suggestion has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save keyword suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingIds(prev => prev.filter(id => id !== suggestionId));
    }
  };

  const addToTracking = async (suggestion: any) => {
    try {
      setSavingIds(prev => [...prev, suggestion.id]);
      
      // Format URL properly for the API
      let targetUrl = window.location.origin;
      if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
      }
      
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: suggestion.suggestedKeyword,
          targetUrl: targetUrl,
          notes: `Generated from base keyword: "${suggestion.baseKeyword}"`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add keyword for tracking");
      }

      // Update the local state to mark the suggestion as saved
      setSuggestions(
        suggestions.map(item => 
          item.id === suggestion.id 
            ? { ...item, saved: true } 
            : item
        )
      );

      // Invalidate keywords query to refresh the keywords list
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });

      toast({
        title: "Keyword Added",
        description: `The keyword "${suggestion.suggestedKeyword}" has been added to tracking.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add keyword for tracking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingIds(prev => prev.filter(id => id !== suggestion.id));
    }
  };

  if (authLoading) {
    return <div className="container py-8">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return null; // Redirect will happen via the useEffect
  }

  return (
    <div className="container py-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate("/keywords")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Keywords
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Keyword Suggestions</CardTitle>
          <CardDescription>
            Discover new keyword opportunities related to your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <div className="flex-1">
              <Input 
                placeholder="Enter a seed keyword..." 
                value={baseKeyword}
                onChange={(e) => setBaseKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    generateSuggestions();
                  }
                }}
              />
            </div>
            <Button 
              onClick={generateSuggestions}
              disabled={loading || !baseKeyword.trim()}
            >
              {loading ? (
                <Search className="h-4 w-4 mr-2 animate-pulse" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? "Generating..." : "Generate Ideas"}
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <Lightbulb className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800">
                      These keyword suggestions are based on "{baseKeyword}". 
                      Click "Add to Tracking" to start monitoring a keyword's ranking position.
                    </p>
                  </div>
                </div>
              </div>
              
              <Table>
                <TableCaption>Keyword suggestions based on "{baseKeyword}"</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell className="font-medium">
                        {suggestion.suggestedKeyword}
                      </TableCell>
                      <TableCell>
                        <SourceBadge source={suggestion.source} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToTracking(suggestion)}
                          disabled={suggestion.saved || savingIds.includes(suggestion.id)}
                          className="mr-2"
                        >
                          {savingIds.includes(suggestion.id) ? (
                            <Plus className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-1" />
                          )}
                          Add to Tracking
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Lightbulb className="h-8 w-8 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Get Keyword Ideas</h3>
              <p className="text-gray-500 mb-4">
                Enter a base keyword in the field above to discover new keyword opportunities for your website.
              </p>
              <div className="flex justify-center">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Try keywords related to your business or industry</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  let color = "bg-blue-100 text-blue-800";
  let label = source;
  
  switch (source.toLowerCase()) {
    case 'related':
      color = "bg-green-100 text-green-800";
      label = "Related Search";
      break;
    case 'title':
      color = "bg-purple-100 text-purple-800";
      label = "Page Title";
      break;
    case 'snippet':
      color = "bg-blue-100 text-blue-800";
      label = "Content Snippet";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
  }
  
  return (
    <Badge variant="outline" className={`${color}`}>
      {label}
    </Badge>
  );
}