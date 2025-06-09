import type { RankTrackerData, Keyword, Competitor, KeywordSuggestion, CompetitorRanking } from '../types/rankTracker.types';

export const generateTrendData = (keyword: string): number[] => {
  const seed = keyword.charCodeAt(0) + (keyword.length * 3);
  const currentPosition = Math.floor(seed % 30) + 1;
  const trend: number[] = [];
  
  for (let i = 0; i < 7; i++) {
    const variance = Math.floor(Math.sin(seed + i) * 5);
    const pos = Math.max(1, currentPosition + variance);
    trend.push(pos);
  }
  
  return trend;
};

export const generateKeywordSuggestions = (baseKeywords: string[]): KeywordSuggestion[] => {
  if (!baseKeywords.length) return [];
  
  const suggestions: KeywordSuggestion[] = [];
  const modifiers = ['best', 'top', 'cheap', 'affordable', 'premium', 'professional', 'local', 'online'];
  const suffixes = ['service', 'tool', 'software', 'solution', 'provider', 'company', 'platform'];
  
  baseKeywords.forEach((keyword, index) => {
    const words = keyword.split(' ');
    
    // Base word variations
    if (words.length === 1) {
      suggestions.push({
        id: suggestions.length + 1,
        text: `${keyword}s`,
        volume: Math.floor(Math.random() * 5000) + 200,
        difficulty: Math.floor(Math.random() * 70) + 20,
        cpc: `$${(Math.random() * 3 + 0.5).toFixed(2)}`,
        relevance: 90
      });
    }
    
    // Add modifiers
    const modifier = modifiers[index % modifiers.length];
    suggestions.push({
      id: suggestions.length + 1,
      text: `${modifier} ${keyword}`,
      volume: Math.floor(Math.random() * 3000) + 100,
      difficulty: Math.floor(Math.random() * 70) + 20,
      cpc: `$${(Math.random() * 3 + 0.5).toFixed(2)}`,
      relevance: 85
    });
    
    // Add suffix
    const suffix = suffixes[(index + 3) % suffixes.length];
    suggestions.push({
      id: suggestions.length + 1,
      text: `${keyword} ${suffix}`,
      volume: Math.floor(Math.random() * 2000) + 100,
      difficulty: Math.floor(Math.random() * 60) + 30,
      cpc: `$${(Math.random() * 4 + 1).toFixed(2)}`,
      relevance: 75
    });
  });
  
  return suggestions.slice(0, 10);
};

export const generateMockKeyword = (text: string, index: number, competitors: string[]): Keyword => {
  const wordCount = text.split(' ').length;
  
  // More realistic position based on keyword characteristics
  const baseDifficulty = 20 + (text.length > 15 ? 10 : 30);
  const positionBase = wordCount > 2 ? 10 : 25;
  const position = Math.max(1, Math.floor(positionBase * (0.7 + (Math.random() * 0.6))));
  
  // Generate realistic search volume
  const baseVolume = wordCount === 1 ? 
    Math.floor(Math.random() * 60000) + 5000 :
    wordCount === 2 ? 
      Math.floor(Math.random() * 20000) + 1000 :
      Math.floor(Math.random() * 5000) + 100;
      
  const difficulty = Math.min(95, Math.max(5, Math.floor(baseDifficulty * (0.7 + (Math.random() * 0.6)))));
  const baseCpc = 1.5 + (3 / Math.max(1, wordCount));
  const cpc = `$${(baseCpc + (Math.random() * 2)).toFixed(2)}`;
  
  // Generate competitor rankings
  const competitorRankings: CompetitorRanking[] = competitors.map(competitorUrl => {
    const competitorPosition = Math.floor((Math.random() * 40) + (difficulty * 0.2));
    const urlPath = text.toLowerCase().replace(/\s+/g, "-");
    const url = competitorUrl.startsWith('http') ? 
      `${competitorUrl}/${urlPath}` : 
      `https://${competitorUrl}/${urlPath}`;
      
    return {
      competitorUrl,
      position: competitorPosition,
      url,
    };
  });
  
  // Generate main site URL
  const urlPath = text.toLowerCase().replace(/\s+/g, '-');
  
  return {
    id: index + 1,
    text,
    position,
    url: `https://example.com/${urlPath}`,
    volume: baseVolume,
    difficulty,
    cpc,
    trend: generateTrendData(text),
    competitorRankings,
  };
};

export const generateDemoData = (
  website: string,
  keywords: string[],
  competitors: string[] = ['competitor1.com', 'competitor2.com']
): RankTrackerData => {
  const enhancedKeywords = keywords.map((text, index) => 
    generateMockKeyword(text, index, competitors)
  );
  
  // Calculate competitor average positions
  const enhancedCompetitors: Competitor[] = competitors.map(url => {
    const rankings = enhancedKeywords.flatMap(k => 
      k.competitorRankings?.filter(cr => cr.competitorUrl === url)
        .map(cr => cr.position) || []
    );
    
    const avgPosition = rankings.length ? 
      Math.round(rankings.reduce((sum, pos) => sum + pos, 0) / rankings.length) : 
      undefined;
      
    return { url, avgPosition };
  });
  
  // Generate keyword suggestions
  const keywordSuggestions = generateKeywordSuggestions(keywords);
  
  // Calculate overall average position
  const avgPosition = enhancedKeywords.length ? 
    Math.round(enhancedKeywords.reduce((acc, k) => acc + (k.position || 0), 0) / enhancedKeywords.length) : 
    0;
  
  return {
    id: `demo-${Date.now()}`,
    status: 'completed',
    website,
    keywords: enhancedKeywords,
    competitors: enhancedCompetitors,
    avgPosition,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    keywordSuggestions
  };
};

// Preset demo data for quick testing
export const getPresetDemoData = (): RankTrackerData => {
  return generateDemoData(
    'example.com',
    ['seo best practices', 'keyword research tool', 'technical seo guide', 'local seo strategies', 'content optimization'],
    ['competitor1.com', 'competitor2.com']
  );
};