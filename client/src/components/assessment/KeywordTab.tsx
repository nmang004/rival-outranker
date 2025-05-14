import { useState } from "react";
import { KeywordAnalysis } from "@shared/schema";
import KeywordChart from "@/components/report/KeywordChart";
import { CheckCircle, XCircle, Edit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface KeywordTabProps {
  data?: KeywordAnalysis;
  analysisId?: number;
  url?: string;
}

export default function KeywordTab({ data, analysisId, url }: KeywordTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Return placeholder if data is undefined
  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <p className="text-gray-500">Keyword analysis data not available.</p>
        </div>
      </div>
    );
  }

  const primaryKeyword = data.primaryKeyword || "N/A";
  
  const handleEditClick = () => {
    setNewKeyword(primaryKeyword);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleUpdateKeyword = async () => {
    if (!analysisId || !url || !newKeyword.trim()) {
      toast({
        title: "Error",
        description: "Missing required information to update the keyword.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/analysis/${analysisId}/update-keyword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          url: url
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update primary keyword");
      }
      
      // Invalidate the analysis query to refresh data
      queryClient.invalidateQueries(["/api/analysis"]);
      
      toast({
        title: "Success",
        description: "Primary keyword updated and analysis refreshed.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating keyword:", error);
      toast({
        title: "Error",
        description: "Failed to update the primary keyword. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const keywordElements = [
    { 
      name: "Title Tag", 
      present: data.titlePresent ?? false, 
      analysis: data.titlePresent ? 
        "Primary keyword is present in the title." : 
        "Primary keyword is missing from the title.",
      term: primaryKeyword
    },
    { 
      name: "Meta Description", 
      present: data.descriptionPresent ?? false, 
      analysis: data.descriptionPresent ? 
        "Keyword appears in the meta description." : 
        "Keyword is missing from the meta description.",
      term: primaryKeyword
    },
    { 
      name: "H1 Heading", 
      present: data.h1Present ?? false, 
      analysis: data.h1Present ? 
        "H1 contains the primary keyword." : 
        "H1 does not contain the primary keyword.",
      term: primaryKeyword
    },
    { 
      name: "H2-H6 Headings", 
      present: data.headingsPresent ?? false, 
      analysis: data.headingsPresent ? 
        "Found in subheadings." : 
        "Not found in subheadings.",
      term: primaryKeyword
    },
    { 
      name: "First 100 Words", 
      present: data.contentPresent ?? false, 
      analysis: data.contentPresent ? 
        "Keyword appears in the introduction." : 
        "Keyword missing from the introduction.",
      term: primaryKeyword
    },
    { 
      name: "URL", 
      present: data.urlPresent ?? false, 
      analysis: data.urlPresent ? 
        "URL contains the target keyword." : 
        "URL does not contain the target keyword.",
      term: primaryKeyword
    },
    { 
      name: "Image Alt Text", 
      present: data.altTextPresent ?? false, 
      analysis: data.altTextPresent ? 
        "Images use the keyword in alt text." : 
        "Images don't use the keyword in alt text.",
      term: primaryKeyword
    }
  ];

  // Generate recommendations based on missing keyword placements
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (data?.titlePresent === false) {
      recommendations.push("Place the primary keyword at the beginning of your title tag.");
    }
    
    if (data?.h1Present === false) {
      recommendations.push("Include the primary keyword in your H1 heading.");
    }
    
    if (data?.altTextPresent === false) {
      recommendations.push("Add alt text to images that includes variations of your target keywords.");
    }
    
    const density = data?.density ?? 0;
    if (density < 0.5) {
      recommendations.push("Increase keyword density slightly, but maintain natural language flow.");
    } else if (density > 3) {
      recommendations.push("Reduce keyword density to avoid keyword stuffing.");
    }
    
    if (data?.headingsPresent === false) {
      recommendations.push("Use keywords in your H2 and H3 subheadings.");
    }
    
    if (data?.contentPresent === false) {
      recommendations.push("Include your primary keyword in the first 100 words of your content.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Your keyword optimization is good. Continue monitoring and maintaining your keyword strategy.");
    }
    
    return recommendations;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-900">Keyword Optimization</h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            (data?.overallScore?.score ?? 0) >= 70 ? 'bg-blue-100 text-blue-800' : 
            (data?.overallScore?.score ?? 0) >= 50 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            Score: {data?.overallScore?.score ?? 0}/100
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Analysis of keyword usage and placement throughout the page.</p>
      </div>
      
      {/* Keyword Findings */}
      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {/* Primary Keyword Section */}
        <div className="sm:col-span-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Detected Primary Keyword</h5>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {data?.primaryKeyword || "No primary keyword detected"}
              </span>
            </div>
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Related Keywords</h5>
              <div className="flex flex-wrap gap-2">
                {data?.relatedKeywords && data.relatedKeywords.length > 0 ? (
                  data.relatedKeywords.map((keyword, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No related keywords detected</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Keyword Placement Analysis */}
        <div className="sm:col-span-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Keyword Placement Analysis</h5>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Element
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword Present
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analysis
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term Analyzed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keywordElements.map((element, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {element.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="flex items-center">
                        {element.present ? (
                          <CheckCircle className="h-4 w-4 text-success-500 mr-1.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-danger-500 mr-1.5" />
                        )}
                        {element.present ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {element.analysis}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded">
                        {element.term}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Keyword Density Chart */}
        <div className="sm:col-span-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Keyword Density</h5>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">Primary Keyword Density</div>
                <div className="text-lg font-medium text-gray-900">
                  {(data?.density ?? 0).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Recommended: 1-3%
                </span>
              </div>
            </div>
            <div className="chart-container h-36">
              <KeywordChart 
                keywords={data?.relatedKeywords && data.relatedKeywords.length > 0 ? 
                  [data.primaryKeyword || 'Primary Keyword', ...data.relatedKeywords.slice(0, 5)] : 
                  [data?.primaryKeyword || 'Primary Keyword', "No related keywords"]
                }
                densities={[
                  data?.density || 0,
                  ...(data?.relatedKeywords && data.relatedKeywords.length > 0 ? 
                    // Generate simulated density values for related keywords that decrease gradually
                    data.relatedKeywords.slice(0, 5).map((_, idx) => 
                      Math.max(0.2, (data?.density || 1) * (0.7 - (idx * 0.1))).toFixed(1)
                    ) : 
                    [0.5])
                ].map(d => typeof d === 'string' ? parseFloat(d) : d)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-8 bg-primary-50 rounded-lg p-4 border border-primary-100">
        <h5 className="font-medium text-primary-800 flex items-center text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary-500 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Recommendations
        </h5>
        <ul className="mt-2 text-sm text-gray-600 space-y-2">
          {generateRecommendations().map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary-500 mt-0.5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
