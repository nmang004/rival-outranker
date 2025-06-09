import { UserEngagementAnalysis, EatAnalysis } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";

interface UXTabProps {
  userEngagementData: UserEngagementAnalysis;
  eatData: EatAnalysis;
}

export default function UXTab({ 
  userEngagementData, 
  eatData 
}: UXTabProps) {
  // Generate recommendations based on UX analysis
  const generateEngagementRecommendations = () => {
    const recommendations = [];
    
    if ((userEngagementData.potentialBounceRate || 0) > 70) {
      recommendations.push("High potential bounce rate detected. Improve your page's initial engagement by enhancing the introduction, adding compelling visuals, and ensuring fast load times.");
    }
    
    if ((userEngagementData.estimatedReadTime || 0) < 1) {
      recommendations.push("Content is very short, which may indicate insufficient depth. Consider expanding your content with more valuable information.");
    } else if ((userEngagementData.estimatedReadTime || 0) > 10) {
      recommendations.push("Content is quite lengthy. Consider breaking it up with subheadings, bullet points, and visuals to improve readability.");
    }
    
    return recommendations;
  };

  const generateEatRecommendations = () => {
    const recommendations = [];
    
    if (!(eatData.hasAuthorInfo || false)) {
      recommendations.push("Add clear author information to establish expertise and authority, which is important for E-E-A-T.");
    }
    
    if (!(eatData.hasExternalCitations || false)) {
      recommendations.push("Include citations to authoritative external sources to improve trustworthiness and credibility.");
    }
    
    if (!(eatData.hasCredentials || false)) {
      recommendations.push("Display relevant credentials, certifications, or expertise information to enhance authority.");
    }
    
    return recommendations;
  };

  const engagementRecommendations = generateEngagementRecommendations();
  const eatRecommendations = generateEatRecommendations();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-900">User Experience</h4>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            Math.round((userEngagementData.overallScore.score + eatData.overallScore.score) / 2) >= 70 
              ? 'bg-blue-100 text-blue-800' 
              : Math.round((userEngagementData.overallScore.score + eatData.overallScore.score) / 2) >= 50 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
          }`}>
            Average Score: {Math.round((userEngagementData.overallScore.score + eatData.overallScore.score) / 2)}/100
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Analysis of user engagement signals and E-E-A-T factors.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* User Engagement Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">User Engagement Signals</h5>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              userEngagementData.overallScore.score >= 70 ? 'bg-blue-100 text-blue-800' : 
              userEngagementData.overallScore.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              Score: {userEngagementData.overallScore.score}/100
            </span>
          </div>
          
          <div className="space-y-5">
            {/* Potential Bounce Rate */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Potential Bounce Rate</span>
                <span className={`font-medium ${
                  (userEngagementData.potentialBounceRate || 0) < 50 ? "text-success-500" : 
                  (userEngagementData.potentialBounceRate || 0) < 70 ? "text-warning-500" : 
                  "text-danger-500"
                }`}>
                  {userEngagementData.potentialBounceRate !== undefined ? `${userEngagementData.potentialBounceRate}%` : 'N/A'}
                </span>
              </div>
              {userEngagementData.potentialBounceRate !== undefined && (
                <>
                  <Progress 
                    value={userEngagementData.potentialBounceRate} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0% (Great)</span>
                    <span>50%</span>
                    <span>100% (Poor)</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Estimated Read Time */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Estimated Read Time</span>
                <span className="font-medium text-gray-700">
                  {userEngagementData.estimatedReadTime !== undefined ? `${userEngagementData.estimatedReadTime} min` : 'N/A'}
                </span>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600">
                {userEngagementData.estimatedReadTime !== undefined ? (
                  userEngagementData.estimatedReadTime < 1 ? (
                    "Your content is very brief, which may not provide enough value to readers."
                  ) : userEngagementData.estimatedReadTime < 3 ? (
                    "Short content that can be quickly consumed, good for specific topics."
                  ) : userEngagementData.estimatedReadTime < 7 ? (
                    "Good content length that provides value without being overwhelming."
                  ) : (
                    "In-depth content that may require significant time investment from readers."
                  )
                ) : (
                  "Unable to estimate read time."
                )}
              </div>
            </div>
            
            {/* Engagement Tips */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-700">
              <h6 className="font-medium mb-2">Engagement Enhancement Tips:</h6>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use engaging introductions that hook readers</li>
                <li>Break content into scannable sections</li>
                <li>Include interactive elements like videos or quizzes</li>
                <li>End with clear calls to action</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* E-E-A-T Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">E-E-A-T Factors</h5>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              eatData.overallScore.score >= 70 ? 'bg-blue-100 text-blue-800' : 
              eatData.overallScore.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              Score: {eatData.overallScore.score}/100
            </span>
          </div>
          
          <div className="bg-white p-4 rounded border border-gray-200 mb-4">
            <h6 className="text-sm font-medium text-gray-700 mb-3">Experience, Expertise, Authoritativeness, Trustworthiness</h6>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Author Information</span>
                {eatData.hasAuthorInfo ? (
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
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">External Citations</span>
                {eatData.hasExternalCitations ? (
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
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Credentials/Expertise</span>
                {eatData.hasCredentials ? (
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
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm text-amber-700">
            <h6 className="font-medium mb-2">Why E-E-A-T Matters:</h6>
            <p className="mb-2">Google's Search Quality Evaluator Guidelines emphasize E-E-A-T factors, especially for YMYL (Your Money Your Life) topics that could impact users' health, financial stability, or safety.</p>
            <p>Content demonstrating experience, expertise, authoritativeness, and trustworthiness tends to rank higher, particularly after core algorithm updates.</p>
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
        
        {engagementRecommendations.length > 0 && (
          <div className="mt-2">
            <h6 className="text-xs font-medium text-gray-700 mb-1">User Engagement Improvements</h6>
            <ul className="text-sm text-gray-600 space-y-2">
              {engagementRecommendations.map((recommendation, index) => (
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
        )}
        
        {eatRecommendations.length > 0 && (
          <div className="mt-3">
            <h6 className="text-xs font-medium text-gray-700 mb-1">E-E-A-T Enhancements</h6>
            <ul className="text-sm text-gray-600 space-y-2">
              {eatRecommendations.map((recommendation, index) => (
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
        )}
        
        {engagementRecommendations.length === 0 && eatRecommendations.length === 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <p className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-success-500 mr-2"
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
              Your user experience factors look excellent! Continue maintaining these best practices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
