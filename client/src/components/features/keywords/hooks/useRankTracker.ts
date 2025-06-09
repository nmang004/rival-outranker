import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/ui/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { RankTrackerConfig, RankTrackerData, RankTrackerFormData } from '../types/rankTracker.types';
import { parseKeywordsAndCompetitors } from '../utils/rankTrackerUtils';
import { generateDemoData } from '../utils/mockDataGenerator';

export const useRankTracker = (config: RankTrackerConfig) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<RankTrackerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const submitAnalysis = async (formData: RankTrackerFormData) => {
    if (!formData.website) {
      setError("Please enter your website URL");
      toast({
        variant: "destructive",
        title: "Missing website",
        description: "Please enter your website URL",
      });
      return;
    }

    if (!formData.keywords) {
      setError("Please enter at least one keyword to track");
      toast({
        variant: "destructive",
        title: "Missing keywords",
        description: "Please enter at least one keyword to track",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { keywordList, competitorList } = parseKeywordsAndCompetitors(
        formData.keywords, 
        formData.competitors
      );
      
      if (config.demoMode) {
        // Generate demo data
        const demoData = generateDemoData(formData.website, keywordList, competitorList);
        
        // Add delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        toast({
          title: "Analysis started!",
          description: `Tracking rankings for ${formData.website} with ${keywordList.length} keywords`,
        });
        
        // Navigate to results with variant parameter
        const resultsPath = config.variant === 'simple' 
          ? `/simple-rival-rank-tracker-results/${demoData.id}`
          : `/rank-tracker-results/${demoData.id}`;
          
        navigate(resultsPath);
        return;
      }

      // Real API call
      const response = await apiRequest("/api/rival-rank-tracker", {
        method: "POST",
        data: {
          keywords: keywordList,
          website: formData.website,
          competitors: competitorList
        }
      });

      if (response.data?.id) {
        toast({
          title: "Analysis started!",
          description: "Your keyword tracking analysis is being processed.",
        });
        
        // Navigate to results
        const resultsPath = config.variant === 'simple'
          ? `/simple-rival-rank-tracker-results/${response.data.id}`
          : `/rank-tracker-results/${response.data.id}`;
          
        navigate(resultsPath);
      } else {
        throw new Error("Failed to create analysis");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error starting your analysis. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setData(null);
    setError(null);
  };

  return {
    submitAnalysis,
    isSubmitting,
    data,
    error,
    setData,
    setError,
    resetForm
  };
};