import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

export default function SearchApiUsage() {
  const { data, isLoading, error } = useQuery<{
    queryCount: number;
    count?: number;
    limit?: number;
    remaining?: number;
  }>({
    queryKey: ['/api/search-query-count'],
    refetchOnWindowFocus: false,
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Calculate usage percentage
  const count = data?.count || data?.queryCount || 0;
  const limit = data?.limit || 1000; // Default limit if not provided
  const remaining = data?.remaining || (limit - count);
  const usagePercentage = Math.min(100, Math.round((count / limit) * 100));
  
  // Determine progress color based on usage
  const getProgressColor = () => {
    if (usagePercentage > 90) return 'bg-red-500 dark:bg-red-400';
    if (usagePercentage > 70) return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-green-500 dark:bg-green-400';
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading API Usage...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  if (error || !data) {
    return null; // Don't show anything if there's an error
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          Google Search API Usage
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">
                  This shows your current Google Search API query usage.
                  The API is used for competitor analysis and search data.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span>{count} / {limit} queries used</span>
            <span className={
              usagePercentage > 90 ? 'text-red-500 font-medium' : 
              usagePercentage > 70 ? 'text-amber-500' : 
              'text-green-500'
            }>
              {remaining} remaining
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-1.5 w-full ${getProgressColor()}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}