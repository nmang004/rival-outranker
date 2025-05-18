import { MetaTagsAnalysis } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface MetaTagsTabProps {
  data: MetaTagsAnalysis;
}

export default function MetaTagsTab({ data }: MetaTagsTabProps) {
  const getTitleStatus = () => {
    if (!data.title) return { status: "missing", message: "Missing title tag" };
    
    const length = data.titleLength || 0;
    if (length < 30) return { status: "too-short", message: "Title is too short (< 30 chars)" };
    if (length > 60) return { status: "too-long", message: "Title is too long (> 60 chars)" };
    
    return { status: "good", message: "Title length is optimal" };
  };
  
  const getDescriptionStatus = () => {
    if (!data.description) return { status: "missing", message: "Missing meta description" };
    
    const length = data.descriptionLength || 0;
    if (length < 70) return { status: "too-short", message: "Description is too short (< 70 chars)" };
    // Meta descriptions can be up to 320 characters but recommended limit is 160
    if (length > 160) {
      // For descriptions between 160-320, show warning but don't mark as error
      return { 
        status: length > 320 ? "too-long" : "long-but-ok", 
        message: length > 320 ? "Description is too long (> 320 chars)" : "Description is long (may be truncated)"
      };
    }
    
    return { status: "good", message: "Description length is optimal" };
  };
  
  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();
  
  // Recommendations based on analysis
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (titleStatus.status !== "good") {
      if (titleStatus.status === "missing") {
        recommendations.push("Add a title tag that includes your primary keyword");
      } else if (titleStatus.status === "too-short") {
        recommendations.push("Expand your title to between 30-60 characters");
      } else if (titleStatus.status === "too-long") {
        recommendations.push("Shorten your title to less than 60 characters to avoid truncation in search results");
      }
    }
    
    if (!data.titleKeywordPosition || data.titleKeywordPosition > 5) {
      recommendations.push("Move your primary keyword closer to the beginning of your title");
    }
    
    if (descriptionStatus.status !== "good") {
      if (descriptionStatus.status === "missing") {
        recommendations.push("Add a meta description that includes your primary keyword");
      } else if (descriptionStatus.status === "too-short") {
        recommendations.push("Expand your meta description to between 70-160 characters");
      } else if (descriptionStatus.status === "too-long") {
        recommendations.push("Shorten your meta description to less than 160 characters to avoid truncation in search results");
      }
    }
    
    if (!data.descriptionHasKeyword) {
      recommendations.push("Include your primary keyword in the meta description");
    }
    
    if (!data.hasCanonical) {
      recommendations.push("Add a canonical tag to prevent duplicate content issues");
    }
    
    if (!data.hasRobots) {
      recommendations.push("Add a robots meta tag to control search engine crawling and indexing");
    }
    
    if (!data.hasOpenGraph) {
      recommendations.push("Add Open Graph tags to improve social media sharing appearance");
    }
    
    if (!data.hasTwitterCard) {
      recommendations.push("Add Twitter Card tags for better Twitter sharing appearance");
    }
    
    return recommendations;
  };
  
  const recommendations = generateRecommendations();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-900">Meta Tags Analysis</h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            data.overallScore.score >= 70 ? 'bg-blue-100 text-blue-800' : 
            data.overallScore.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            Score: {data.overallScore.score}/100
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Analysis of title, meta description, and other meta tags.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Title Tag Section */}
        <div className="bg-gray-50 rounded-lg p-4 col-span-1 sm:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Title Tag</h5>
              <div className="mt-1 text-xs text-gray-500">
                {data.titleLength || 0} characters
                {data.titleKeywordPosition && 
                  ` (keyword at position ${data.titleKeywordPosition})`}
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${
                titleStatus.status === "good"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : titleStatus.status === "missing"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}
            >
              {titleStatus.status === "good" ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : titleStatus.status === "missing" ? (
                <XCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {titleStatus.message}
            </Badge>
          </div>
          
          <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm">
            {data.title || "No title tag found"}
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0</span>
              <span>30</span>
              <span>60</span>
              <span>90</span>
            </div>
            <Progress 
              value={Math.min((data.titleLength || 0) / 0.9, 100)} 
              className="h-2"
              indicatorClassName={`${
                (data.titleLength || 0) < 30 || (data.titleLength || 0) > 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
            />
          </div>
        </div>
        
        {/* Meta Description Section */}
        <div className="bg-gray-50 rounded-lg p-4 col-span-1 sm:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Meta Description</h5>
              <div className="mt-1 text-xs text-gray-500">
                {data.descriptionLength || 0} characters
                {data.descriptionHasKeyword !== undefined && (
                  data.descriptionHasKeyword
                    ? " (includes keyword)"
                    : " (missing keyword)"
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${
                descriptionStatus.status === "good"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : descriptionStatus.status === "missing"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}
            >
              {descriptionStatus.status === "good" ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : descriptionStatus.status === "missing" ? (
                <XCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {descriptionStatus.message}
            </Badge>
          </div>
          
          <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm">
            {data.description || "No meta description found"}
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0</span>
              <span>70</span>
              <span>160</span>
              <span>320</span>
            </div>
            <Progress 
              value={Math.min((data.descriptionLength || 0) / 3.2, 100)} 
              className="h-2"
              indicatorClassName={`${
                (data.descriptionLength || 0) < 70 ? "bg-yellow-500" :
                (data.descriptionLength || 0) > 320 ? "bg-red-500" :
                (data.descriptionLength || 0) > 160 ? "bg-yellow-500" :
                "bg-green-500"
              }`}
            />
          </div>
        </div>
        
        {/* Other Meta Tags Section */}
        <div className="bg-gray-50 rounded-lg p-4 col-span-1 sm:col-span-2">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Other Meta Tags</h5>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetaTagItem 
              name="Canonical" 
              present={data.hasCanonical || false} 
              description="Prevents duplicate content issues"
            />
            <MetaTagItem 
              name="Robots" 
              present={data.hasRobots || false}
              description="Controls crawler behavior"
            />
            <MetaTagItem 
              name="Open Graph" 
              present={data.hasOpenGraph || false}
              description="Improves Facebook sharing"
            />
            <MetaTagItem 
              name="Twitter Card" 
              present={data.hasTwitterCard || false}
              description="Improves Twitter sharing"
            />
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
          {recommendations.length > 0 ? (
            recommendations.map((recommendation, index) => (
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
            ))
          ) : (
            <li className="flex items-start">
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Your meta tags are well-optimized! Continue monitoring for best practices.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

interface MetaTagItemProps {
  name: string;
  present: boolean;
  description: string;
}

function MetaTagItem({ name, present, description }: MetaTagItemProps) {
  return (
    <div className={`p-3 rounded border ${present ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center">
        {present ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="ml-2 text-sm font-medium text-gray-700">{name}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}
