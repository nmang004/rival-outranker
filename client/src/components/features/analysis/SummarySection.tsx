interface SummarySectionProps {
  strengths?: string[];
  weaknesses?: string[];
}

export default function SummarySection({ 
  strengths = [], 
  weaknesses = []
}: SummarySectionProps) {
  // Generate a summary message based on strengths and weaknesses
  const getSummaryMessage = () => {
    const strengthCount = strengths?.length || 0;
    const weaknessCount = weaknesses?.length || 0;
    
    // Check if there's a data retrieval error
    if (weaknessCount === 1 && weaknesses && weaknesses[0] && 
        (weaknesses[0].includes("Failed to retrieve") || weaknesses[0].includes("could not be completed"))) {
      return "We encountered an issue retrieving or analyzing the page content. This may happen due to access restrictions, invalid URLs, or connectivity issues. Please try again or analyze a different URL.";
    }
    
    if (strengthCount > weaknessCount) {
      return "Your page has several positive aspects but there are still some areas that need improvement. Addressing these issues could further enhance your rankings.";
    } else if (weaknessCount > strengthCount) {
      return "Your page has several areas that need improvement. Addressing these issues could significantly improve your rankings for targeted keywords.";
    } else if (strengthCount === 0 && weaknessCount === 0) {
      return "No specific strengths or issues were detected. This may be due to limited access to analyze the page content fully.";
    } else {
      return "Your page has an equal number of strengths and weaknesses. Focus on the recommended improvements to enhance your SEO performance.";
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Summary</h3>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400"
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
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              {getSummaryMessage()}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Strengths</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-success-500 mt-0.5 mr-2"
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
                <span>{strength}</span>
              </li>
            ))}
            {strengths.length === 0 && (
              <li className="italic text-gray-400">No strengths detected</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Areas to Improve</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${index < 2 ? 'text-danger-500' : 'text-warning-500'} mt-0.5 mr-2`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{weakness}</span>
              </li>
            ))}
            {weaknesses.length === 0 && (
              <li className="italic text-gray-400">No areas to improve detected</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
