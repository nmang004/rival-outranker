export const formatNumber = (num?: number): string => {
  if (num === undefined) return "N/A";
  
  if (num >= 1000000) {
    if (num < 10000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    return `${Math.round(num / 1000000)}M`;
  }
  
  if (num >= 10000) {
    return `${Math.round(num / 1000)}K`;
  }
  
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toString();
};

export const getRankingColor = (position?: number): string => {
  if (!position) return "";
  if (position <= 3) return "text-green-600 font-bold";
  if (position <= 10) return "text-emerald-500 font-semibold";
  if (position <= 20) return "text-amber-500";
  return "text-gray-600";
};

export const parseKeywordsAndCompetitors = (keywords: string, competitors?: string) => {
  const keywordList = keywords
    .split(/[\n,]/)
    .map(k => k.trim())
    .filter(k => k.length > 0);
    
  const competitorList = competitors ? 
    competitors
      .split(/[\n,]/)
      .map(c => c.trim())
      .filter(c => c.length > 0) : [];
      
  return { keywordList, competitorList };
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const calculateAveragePosition = (keywords: Array<{ position?: number }>): number => {
  const validPositions = keywords
    .map(k => k.position)
    .filter((pos): pos is number => typeof pos === 'number');
    
  if (validPositions.length === 0) return 0;
  
  const sum = validPositions.reduce((acc, pos) => acc + pos, 0);
  return Math.round((sum / validPositions.length) * 10) / 10;
};

export const exportToCSV = (data: {
  website: string;
  keywords: Array<{
    text: string;
    position?: number;
    url?: string;
    volume?: number;
    difficulty?: number;
    cpc?: string;
  }>;
}): void => {
  const csvContent = [
    ['Keyword', 'Position', 'URL', 'Search Volume', 'Difficulty', 'CPC'],
    ...data.keywords.map(k => [
      k.text,
      k.position?.toString() || 'N/A',
      k.url || 'N/A',
      k.volume?.toString() || 'N/A',
      k.difficulty?.toString() || 'N/A',
      k.cpc || 'N/A'
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${data.website}-keyword-rankings.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getCompetitorShortName = (url: string): string => {
  return url.replace(/^https?:\/\/(www\.)?/, '').split('.')[0];
};