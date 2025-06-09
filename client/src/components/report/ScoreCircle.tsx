interface ScoreCircleProps {
  score: number;
}

export default function ScoreCircle({ score }: ScoreCircleProps) {
  // Calculate the stroke color based on the score
  const getStrokeColor = (score: number) => {
    if (score >= 90) return "#10B981"; // green-500
    if (score >= 70) return "#3B82F6"; // blue-500
    if (score >= 50) return "#F59E0B"; // yellow-500
    return "#EF4444"; // red-500
  };

  const radius = 15.9155; // SVG circle radius
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(score / 100) * circumference}, ${circumference}`;
  const strokeColor = getStrokeColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-28 h-28" viewBox="0 0 36 36">
        {/* Background circle */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="3"
          strokeDasharray="100, 100"
        />
        {/* Foreground circle (score indicator) */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div>
          <div className="text-3xl font-bold text-gray-800">{score}</div>
          <div className="text-xs font-medium text-gray-500">out of 100</div>
        </div>
      </div>
    </div>
  );
}
