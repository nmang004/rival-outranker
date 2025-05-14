import { SeoScore } from "@shared/schema";
import ScoreCircle from "@/components/report/ScoreCircle";
import { PerformanceIndicator } from "@/components/ui/performance-indicator";
import { scoreToCategory } from "@/lib/colorUtils";

interface OverallScoreProps {
  score?: SeoScore;
}

export default function OverallScore({ score }: OverallScoreProps) {
  // Default value if score is undefined
  const scoreValue = score?.score ?? 0;
  
  // Get the performance category based on the score
  const category = score?.category || scoreToCategory(scoreValue);

  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-sm font-medium text-gray-500 mb-1">Overall SEO Score</div>
      <div className="flex justify-center">
        <ScoreCircle score={scoreValue} />
      </div>
      <div className="mt-3 flex justify-center">
        <PerformanceIndicator 
          category={category} 
          score={scoreValue}
          showText={true}
          showIcon={true}
          size="md"
          variant="pill"
          tooltipText={`This website's SEO score is ${scoreValue}/100 which is considered ${category}.`}
        />
      </div>
    </div>
  );
}
