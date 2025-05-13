import { PageSpeedAnalysis, MobileAnalysis, KeywordAnalysis } from "@shared/schema";

interface KeyMetricsProps {
  pageSpeed: PageSpeedAnalysis;
  mobileFriendliness: MobileAnalysis;
  keywordOptimization: KeywordAnalysis;
}

export default function KeyMetrics({ 
  pageSpeed, 
  mobileFriendliness, 
  keywordOptimization 
}: KeyMetricsProps) {
  return (
    <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Page Speed Metric */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-success-50 rounded-md p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-success-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-500">Page Speed</div>
            <div className="flex items-center">
              <div className="text-xl font-semibold text-gray-800">{pageSpeed.score}</div>
              <StatusLabel score={pageSpeed.score} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Friendliness Metric */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary-50 rounded-md p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-500">Mobile Friendliness</div>
            <div className="flex items-center">
              <div className="text-xl font-semibold text-gray-800">
                {mobileFriendliness.isMobileFriendly ? mobileFriendliness.overallScore.score : 0}
              </div>
              <StatusLabel score={mobileFriendliness.overallScore.score} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Keyword Optimization Metric */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-warning-50 rounded-md p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-warning-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-500">Keyword Optimization</div>
            <div className="flex items-center">
              <div className="text-xl font-semibold text-gray-800">{keywordOptimization.overallScore.score}</div>
              <StatusLabel score={keywordOptimization.overallScore.score} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusLabelProps {
  score: number;
}

function StatusLabel({ score }: StatusLabelProps) {
  if (score >= 90) {
    return <div className="ml-1 text-xs text-success-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 inline mr-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Excellent
    </div>;
  } else if (score >= 70) {
    return <div className="ml-1 text-xs text-success-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 inline mr-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Fast
    </div>;
  } else if (score >= 50) {
    return <div className="ml-1 text-xs text-warning-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 inline mr-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      Needs Work
    </div>;
  } else {
    return <div className="ml-1 text-xs text-danger-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 inline mr-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      Poor
    </div>;
  }
}
