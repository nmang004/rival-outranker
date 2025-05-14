import { ContentAnalysis, InternalLinksAnalysis, ImageAnalysis } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";

interface ContentTabProps {
  contentData: ContentAnalysis;
  internalLinksData: InternalLinksAnalysis;
  imageData: ImageAnalysis;
}

export default function ContentTab({ 
  contentData, 
  internalLinksData, 
  imageData 
}: ContentTabProps) {
  // Helper function to get readability level text
  const getReadabilityLevel = (score: number) => {
    if (score >= 80) return { text: "Very Easy", color: "text-success-500" };
    if (score >= 70) return { text: "Easy", color: "text-success-500" };
    if (score >= 60) return { text: "Standard", color: "text-primary-500" };
    if (score >= 50) return { text: "Fairly Difficult", color: "text-warning-500" };
    return { text: "Difficult", color: "text-danger-500" };
  };

  const readability = getReadabilityLevel(contentData.readabilityScore);

  // Generate recommendations based on content analysis
  const generateContentRecommendations = () => {
    const recommendations = [];
    
    // Word count recommendations
    if (contentData.wordCount < 300) {
      recommendations.push("Increase content length to at least 300 words for better topic coverage.");
    } else if (contentData.wordCount < 600) {
      recommendations.push("Consider expanding content to 600+ words for more comprehensive coverage.");
    }
    
    // Heading structure recommendations - safely check if headingStructure exists
    if (contentData.headingStructure) {
      if (contentData.headingStructure.h1Count === 0) {
        recommendations.push("Add an H1 heading to clearly define your page's main topic.");
      } else if (contentData.headingStructure.h1Count > 1) {
        recommendations.push("Use only one H1 heading per page. Multiple H1s can confuse search engines about your page's main topic.");
      }
      
      if (contentData.headingStructure.h2Count === 0) {
        recommendations.push("Add H2 subheadings to organize your content and make it more scannable.");
      }
    } else {
      // If no heading structure data
      recommendations.push("Add proper headings (H1, H2, H3) to organize your content and improve SEO.");
    }
    
    if (contentData.readabilityScore < 60) {
      recommendations.push("Simplify your content for better readability. Use shorter sentences and simpler words.");
    }
    
    // Only check hasMultimedia if it exists
    if (contentData.hasMultimedia === false) {
      recommendations.push("Add images, videos, or infographics to enhance engagement and visual appeal.");
    }
    
    return recommendations;
  };

  // Generate recommendations based on internal links analysis
  const generateLinkRecommendations = () => {
    const recommendations = [];
    
    if (internalLinksData.count < 2) {
      recommendations.push("Add more internal links to help users and search engines discover related content.");
    }
    
    if (!internalLinksData.hasProperAnchors) {
      recommendations.push("Use descriptive anchor text for internal links instead of generic text like 'click here'.");
    }
    
    if (internalLinksData.brokenLinksCount > 0) {
      recommendations.push(`Fix ${internalLinksData.brokenLinksCount} broken internal link(s) to improve user experience and SEO.`);
    }
    
    return recommendations;
  };

  // Generate recommendations based on image analysis
  const generateImageRecommendations = () => {
    const recommendations = [];
    
    // Check if property exists before using it
    if (imageData.withoutAltCount && imageData.withoutAltCount > 0) {
      recommendations.push(`Add alt text to ${imageData.withoutAltCount} image(s) for better accessibility and SEO.`);
    } else if (imageData.count && imageData.altCount !== undefined && (imageData.count - imageData.altCount) > 0) {
      recommendations.push(`Add alt text to ${imageData.count - imageData.altCount} image(s) for better accessibility and SEO.`);
    }
    
    // Check if property exists before using it
    if (imageData.unoptimizedCount && imageData.unoptimizedCount > 0) {
      recommendations.push(`Optimize ${imageData.unoptimizedCount} image(s) to improve page load speed.`);
    } else if (imageData.sizeOptimized === false && imageData.count > 0) {
      recommendations.push(`Optimize your images to improve page load speed.`);
    }
    
    return recommendations;
  };

  const contentRecommendations = generateContentRecommendations();
  const linkRecommendations = generateLinkRecommendations();
  const imageRecommendations = generateImageRecommendations();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-900">Content Analysis</h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            contentData.overallScore.score >= 70 ? 'bg-blue-100 text-blue-800' : 
            contentData.overallScore.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            Score: {contentData.overallScore.score}/100
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Analysis of content quality, structure, and internal linking.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Content Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Content Overview</h5>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Word Count</span>
                <span className="font-medium text-gray-700">{contentData.wordCount} words</span>
              </div>
              <Progress 
                value={Math.min(contentData.wordCount / 15, 100)} 
                className="h-2 bg-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>300</span>
                <span>600</span>
                <span>1500</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Readability Score</span>
                <span className={`font-medium ${readability.color}`}>
                  {contentData.readabilityScore} - {readability.text}
                </span>
              </div>
              <Progress 
                value={contentData.readabilityScore} 
                className="h-2 bg-blue-500"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Multimedia Content</span>
                <span className="font-medium text-gray-700">
                  {contentData.hasMultimedia ? (
                    <span className="text-success-500 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </span>
                  ) : (
                    <span className="text-danger-500 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Missing
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Heading Structure */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Heading Structure</h5>
          
          {contentData.headingStructure ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">H1 Headings</span>
                <span className={`font-medium ${
                  contentData.headingStructure.h1Count === 1 ? "text-success-500" : 
                  contentData.headingStructure.h1Count === 0 ? "text-danger-500" : "text-warning-500"
                }`}>
                  {contentData.headingStructure.h1Count}
                  {contentData.headingStructure.h1Count === 1 ? " (Optimal)" : 
                   contentData.headingStructure.h1Count === 0 ? " (Missing)" : " (Too many)"}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">H2 Headings</span>
                <span className="font-medium text-gray-700">{contentData.headingStructure.h2Count}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">H3 Headings</span>
                <span className="font-medium text-gray-700">{contentData.headingStructure.h3Count}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">H4-H6 Headings</span>
                <span className="font-medium text-gray-700">
                  {contentData.headingStructure.h4Count + 
                   contentData.headingStructure.h5Count + 
                   contentData.headingStructure.h6Count}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-sm text-gray-500">
              Heading structure data unavailable
            </div>
          )}
          
          <div className="pt-2 mt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paragraph Count</span>
              <span className="font-medium text-gray-700">{contentData.paragraphCount}</span>
            </div>
          </div>
        </div>
        
        {/* Internal Links Analysis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">Internal Links</h5>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              internalLinksData.overallScore.score >= 70 ? 'bg-blue-100 text-blue-800' : 
              internalLinksData.overallScore.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              Score: {internalLinksData.overallScore.score}/100
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Internal Links</span>
              <span className="font-medium text-gray-700">{internalLinksData.count}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unique Links</span>
              <span className="font-medium text-gray-700">{internalLinksData.uniqueCount}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Proper Anchor Text</span>
              <span className="font-medium">
                {internalLinksData.hasProperAnchors ? (
                  <span className="text-success-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Yes
                  </span>
                ) : (
                  <span className="text-danger-500 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    No
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Broken Links</span>
              <span className={`font-medium ${
                internalLinksData.brokenLinksCount === 0 ? "text-success-500" : "text-danger-500"
              }`}>
                {internalLinksData.brokenLinksCount}
              </span>
            </div>
          </div>
        </div>
        
        {/* Image Analysis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">Images</h5>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              imageData.overallScore.score >= 70 ? 'bg-blue-100 text-blue-800' : 
              imageData.overallScore.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              Score: {imageData.overallScore.score}/100
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Images</span>
              <span className="font-medium text-gray-700">{imageData.count}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">With Alt Text</span>
              <span className="font-medium text-success-500">
                {imageData.withAltCount !== undefined ? imageData.withAltCount : 
                (imageData.altCount !== undefined ? imageData.altCount : 0)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Without Alt Text</span>
              <span className={`font-medium ${
                (imageData.withoutAltCount === 0 || 
                 (imageData.count && imageData.altCount !== undefined && 
                  imageData.count - imageData.altCount === 0)) 
                  ? "text-success-500" : "text-danger-500"
              }`}>
                {imageData.withoutAltCount !== undefined ? imageData.withoutAltCount : 
                 (imageData.count && imageData.altCount !== undefined ? 
                  imageData.count - imageData.altCount : 0)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Image Optimization</span>
              <span className="font-medium">
                {imageData.optimizedCount !== undefined ? 
                  `${imageData.optimizedCount} optimized` : 
                  (imageData.sizeOptimized ? 
                    <span className="text-success-500">Optimized</span> : 
                    <span className="text-danger-500">Not Optimized</span>
                  )
                }
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-8 bg-primary-50 rounded-lg p-4 border border-primary-100">
        <h5 className="font-medium text-primary-800 text-sm mb-2">Recommendations</h5>
        
        {contentRecommendations.length > 0 && (
          <div className="mt-2">
            <h6 className="text-xs font-medium text-gray-700 mb-1">Content Improvements</h6>
            <ul className="text-sm text-gray-600 space-y-2">
              {contentRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {linkRecommendations.length > 0 && (
          <div className="mt-3">
            <h6 className="text-xs font-medium text-gray-700 mb-1">Link Improvements</h6>
            <ul className="text-sm text-gray-600 space-y-2">
              {linkRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {imageRecommendations.length > 0 && (
          <div className="mt-3">
            <h6 className="text-xs font-medium text-gray-700 mb-1">Image Improvements</h6>
            <ul className="text-sm text-gray-600 space-y-2">
              {imageRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {contentRecommendations.length === 0 && 
         linkRecommendations.length === 0 && 
         imageRecommendations.length === 0 && (
          <div className="py-2">
            <p className="text-sm text-success-600 flex items-center">
              Your content structure and organization look great! Continue maintaining these best practices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}