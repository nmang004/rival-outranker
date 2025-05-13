interface KeywordChartProps {
  keywords: string[];
  densities?: number[];  // Array of keyword densities (percentages)
}

export default function KeywordChart({ keywords, densities }: KeywordChartProps) {
  // Generate more accurate heights for the bars based on densities if provided
  const getHeight = (index: number) => {
    if (densities && densities[index] !== undefined) {
      // Scale the density to a reasonable bar height (max 6)
      // 3% density (which is quite high) would be full height
      const normalizedHeight = Math.min(6, Math.max(1, Math.round((densities[index] / 3) * 6)));
      return normalizedHeight;
    } else {
      // Fallback to deterministic pattern if densities not provided
      const heights = [5, 4, 3, 2, 1.5, 1];
      return heights[index % heights.length];
    }
  };
  
  // Generate color variations based on height/density
  const getColor = (height: number) => {
    // More intense color for taller bars
    if (height >= 5) return "bg-primary-500";
    if (height >= 4) return "bg-primary-400";
    if (height >= 3) return "bg-primary-300";
    if (height >= 2) return "bg-primary-200";
    return "bg-primary-100";
  };

  return (
    <div className="h-full w-full">
      <div className="h-full w-full bg-gray-100 rounded flex items-end justify-between px-1">
        {keywords.map((keyword, index) => {
          const height = getHeight(index);
          return (
            <div 
              key={index} 
              className={`w-1/${keywords.length} h-${height}/6 ${getColor(index)} mx-1 rounded-t flex-grow`}
              style={{ height: `${(height / 6) * 100}%` }}
              title={`${keyword}: ${(height / 6) * 100}%`}
            />
          );
        })}
      </div>
      <div className="mt-2 grid text-xs text-gray-500 text-center" style={{ gridTemplateColumns: `repeat(${keywords.length}, 1fr)` }}>
        {keywords.map((keyword, index) => (
          <div key={index} className="truncate px-1" title={keyword}>
            {keyword.length > 10 ? `${keyword.substring(0, 8)}...` : keyword}
          </div>
        ))}
      </div>
    </div>
  );
}
