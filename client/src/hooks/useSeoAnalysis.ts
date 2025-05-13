import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SeoAnalysisResult } from "@shared/schema";

export const useSeoAnalysis = (url?: string) => {
  // Start a new analysis
  const startAnalysis = useMutation({
    mutationFn: async (targetUrl: string) => {
      const response = await apiRequest('POST', '/api/analyze', { url: targetUrl });
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      // Invalidate the analysis query to trigger a refetch
      if (url) {
        queryClient.invalidateQueries({ queryKey: [`/api/analysis?url=${encodeURIComponent(url)}`] });
      }
    }
  });

  // Get analysis result
  const analysisResult = useQuery<SeoAnalysisResult>({
    queryKey: url ? [`/api/analysis?url=${encodeURIComponent(url)}`] : [],
    enabled: !!url, // Only run the query if we have a URL
    refetchInterval: (data) => {
      // Poll every second until we get data or an error
      return data ? false : 1000;
    },
  });

  // Get analysis history
  const analysisHistory = useQuery<SeoAnalysisResult[]>({
    queryKey: ['/api/analyses'],
    enabled: false, // Manually enable this when needed
  });

  // Reanalyze a URL
  const reanalyze = async (targetUrl: string) => {
    await startAnalysis.mutateAsync(targetUrl);
    return queryClient.invalidateQueries({ queryKey: [`/api/analysis?url=${encodeURIComponent(targetUrl)}`] });
  };

  return {
    startAnalysis,
    analysisResult,
    analysisHistory,
    reanalyze,
  };
};

export default useSeoAnalysis;
