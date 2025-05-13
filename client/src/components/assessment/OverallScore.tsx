import { SeoScore } from "@shared/schema";
import ScoreCircle from "@/components/report/ScoreCircle";

interface OverallScoreProps {
  score: SeoScore;
}

export default function OverallScore({ score }: OverallScoreProps) {
  let statusText = "";
  let statusColor = "";
  
  if (score.score >= 90) {
    statusText = "Excellent";
    statusColor = "text-success-600";
  } else if (score.score >= 70) {
    statusText = "Good";
    statusColor = "text-primary-600";
  } else if (score.score >= 50) {
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
        <ScoreCircle score={score.score} />
      </div>
      <div className={`mt-2 text-sm font-medium ${statusColor}`}>{statusText}</div>
    </div>
  );
}
