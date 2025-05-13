import { SeoScore } from "@shared/schema";
import ScoreCircle from "@/components/report/ScoreCircle";

interface OverallScoreProps {
  score?: SeoScore;
}

export default function OverallScore({ score }: OverallScoreProps) {
  // Default value if score is undefined
  const scoreValue = score?.score ?? 0;
  
  let statusText = "";
  let statusColor = "";
  
  if (scoreValue >= 90) {
    statusText = "Excellent";
    statusColor = "text-success-600";
  } else if (scoreValue >= 70) {
    statusText = "Good";
    statusColor = "text-primary-600";
  } else if (scoreValue >= 50) {
    statusText = "Needs Improvement";
    statusColor = "text-warning-600";
  } else {
    statusText = "Poor";
    statusColor = "text-danger-600";
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-sm font-medium text-gray-500 mb-1">Overall SEO Score</div>
      <div className="flex justify-center">
        <ScoreCircle score={scoreValue} />
      </div>
      <div className={`mt-2 text-sm font-medium ${statusColor}`}>{statusText}</div>
    </div>
  );
}
