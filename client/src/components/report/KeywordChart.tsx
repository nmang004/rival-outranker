interface KeywordChartProps {
  keywords: string[];
}

export default function KeywordChart({ keywords }: KeywordChartProps) {
  // Generate random but consistent heights for the bars
  const getHeight = (index: number) => {
    // Use a deterministic algorithm based on index to create a visually interesting pattern
    const heights = [6, 5, 4, 3, 2, 1];
    return heights[index % heights.length];
  };
  
  // Generate color variations based on index
  const getColor = (index: number) => {
    const colors = [
      "bg-primary-200",
      "bg-primary-300",
      "bg-primary-400",
      "bg-primary-500",
      "bg-primary-400",
      "bg-primary-300"
    ];
    return colors[index % colors.length];
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
