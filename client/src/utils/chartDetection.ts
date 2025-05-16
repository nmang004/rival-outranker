/**
 * Utility for detecting and analyzing charts and graphs in documents
 */

interface DetectedMetric {
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  changePercent?: string;
}

interface ChartAnalysis {
  chartCount: number;
  metrics: DetectedMetric[];
  hasAnalyticsData: boolean;
  hasSearchConsoleData: boolean;
  hasSEOData: boolean;
  timeframe: string;
}

/**
 * Parse text to identify potential metrics and chart data
 */
export function detectChartData(text: string): ChartAnalysis {
  // Default analysis object
  const analysis: ChartAnalysis = {
    chartCount: 0,
    metrics: [],
    hasAnalyticsData: false,
    hasSearchConsoleData: false,
    hasSEOData: false,
    timeframe: ''
  };
  
  // Look for common chart/graph indicators
  const chartIndicators = [
    'chart', 'graph', 'analytics', 'performance', 'metric', 'trend',
    'sessions', 'users', 'pageviews', 'impressions', 'clicks', 'ctr', 'position',
    'ranking', 'traffic', 'conversion'
  ];
  
  // Count chart mentions
  const chartMatches = chartIndicators.flatMap(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    return Array.from(text.matchAll(regex)).map(match => match[0]);
  });
  
  // Estimate number of charts
  analysis.chartCount = Math.min(
    10, // Cap at reasonable number
    new Set(chartMatches).size > 5 ? Math.floor(new Set(chartMatches).size / 3) : 0
  );
  
  // Check for Google Analytics data
  if (text.match(/google analytics|ga|analytics/i)) {
    analysis.hasAnalyticsData = true;
    
    // Look for common Analytics metrics
    const sessionMatch = text.match(/sessions?[:\s]+([0-9,]+)/i);
    if (sessionMatch && sessionMatch[1]) {
      analysis.metrics.push({
        name: 'Sessions',
        value: sessionMatch[1].replace(/,/g, ''),
        trend: detectTrendFromContext(text, 'session')
      });
    }
    
    const usersMatch = text.match(/users?[:\s]+([0-9,]+)/i);
    if (usersMatch && usersMatch[1]) {
      analysis.metrics.push({
        name: 'Users',
        value: usersMatch[1].replace(/,/g, ''),
        trend: detectTrendFromContext(text, 'user')
      });
    }
    
    const pageviewsMatch = text.match(/pageviews?[:\s]+([0-9,]+)/i);
    if (pageviewsMatch && pageviewsMatch[1]) {
      analysis.metrics.push({
        name: 'Pageviews',
        value: pageviewsMatch[1].replace(/,/g, ''),
        trend: detectTrendFromContext(text, 'pageview')
      });
    }
  }
  
  // Check for Google Search Console data
  if (text.match(/search console|gsc|search performance/i)) {
    analysis.hasSearchConsoleData = true;
    
    // Look for common Search Console metrics
    const impressionsMatch = text.match(/impressions?[:\s]+([0-9,]+)/i);
    if (impressionsMatch && impressionsMatch[1]) {
      analysis.metrics.push({
        name: 'Impressions',
        value: impressionsMatch[1].replace(/,/g, ''),
        trend: detectTrendFromContext(text, 'impression')
      });
    }
    
    const clicksMatch = text.match(/clicks?[:\s]+([0-9,]+)/i);
    if (clicksMatch && clicksMatch[1]) {
      analysis.metrics.push({
        name: 'Clicks',
        value: clicksMatch[1].replace(/,/g, ''),
        trend: detectTrendFromContext(text, 'click')
      });
    }
    
    const ctrMatch = text.match(/ctr[:\s]+([0-9,.]+)%/i);
    if (ctrMatch && ctrMatch[1]) {
      analysis.metrics.push({
        name: 'CTR',
        value: ctrMatch[1] + '%',
        trend: detectTrendFromContext(text, 'ctr')
      });
    }
    
    const positionMatch = text.match(/position[:\s]+([0-9,.]+)/i);
    if (positionMatch && positionMatch[1]) {
      analysis.metrics.push({
        name: 'Position',
        value: positionMatch[1],
        trend: detectTrendFromContext(text, 'position') === 'up' ? 'down' : 'up' // Lower position number is better
      });
    }
  }
  
  // Extract metrics from specific formats in the document
  extractPercentageChanges(text).forEach(metric => {
    if (!analysis.metrics.some(m => m.name === metric.name)) {
      analysis.metrics.push(metric);
    }
  });
  
  // Check if the document contains SEO data
  analysis.hasSEOData = text.match(/seo|search engine|keyword|ranking|serp/i) !== null;
  
  // Look for timeframe information
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // Look for date ranges in various formats
  const dateRangeMatches = text.match(/(\d{1,2}[\s-]+\w+[\s-]+\d{4})[\s-]+to[\s-]+(\d{1,2}[\s-]+\w+[\s-]+\d{4})/i) || 
                            text.match(/(\w+[\s-]+\d{1,2}[\s,-]+\d{4})[\s-]+to[\s-]+(\w+[\s-]+\d{1,2}[\s,-]+\d{4})/i);
                            
  if (dateRangeMatches && dateRangeMatches[1] && dateRangeMatches[2]) {
    analysis.timeframe = `${dateRangeMatches[1]} to ${dateRangeMatches[2]}`;
  } else {
    // Look for month sequences that might indicate the report timeframe
    const monthSequence = [];
    for (const month of [...monthNames, ...monthAbbr]) {
      if (text.toLowerCase().includes(month.toLowerCase())) {
        monthSequence.push(month);
      }
    }
    
    if (monthSequence.length > 0) {
      analysis.timeframe = monthSequence.length > 1 
        ? `${monthSequence[0]} to ${monthSequence[monthSequence.length - 1]}`
        : monthSequence[0];
    }
  }
  
  return analysis;
}

/**
 * Attempt to extract percentage changes from text
 */
function extractPercentageChanges(text: string): DetectedMetric[] {
  const metrics: DetectedMetric[] = [];
  
  // Match patterns like "+15%" or "increased by 23%" or "dropped 12%"
  const percentageMatches = Array.from(
    text.matchAll(/([a-z\s]+)(?:increased|decreased|grew|dropped|changed)(?:\sby\s|\s)([+-]?\d+(?:\.\d+)?)%/gi)
  );
  
  percentageMatches.forEach(match => {
    const metricName = match[1].trim();
    const changeValue = parseFloat(match[2]);
    
    if (metricName && !isNaN(changeValue)) {
      metrics.push({
        name: metricName.charAt(0).toUpperCase() + metricName.slice(1),
        value: 'N/A', // Actual value not specified
        trend: changeValue > 0 ? 'up' : (changeValue < 0 ? 'down' : 'neutral'),
        changePercent: (changeValue > 0 ? '+' : '') + changeValue + '%'
      });
    }
  });
  
  return metrics;
}

/**
 * Determine trend direction for a metric based on surrounding text
 */
function detectTrendFromContext(text: string, metricName: string): 'up' | 'down' | 'neutral' {
  // Create a window of text around mentions of the metric
  const metricRegex = new RegExp(`\\b${metricName}\\w*\\b`, 'gi');
  const matches = Array.from(text.matchAll(metricRegex));
  
  let upCount = 0;
  let downCount = 0;
  
  matches.forEach(match => {
    const start = Math.max(0, match.index! - 50);
    const end = Math.min(text.length, match.index! + 50);
    const context = text.substring(start, end).toLowerCase();
    
    // Look for positive trend indicators
    if (context.match(/\b(up|higher|increase|grow|improvement|better|rise)\b/)) {
      upCount++;
    }
    
    // Look for negative trend indicators
    if (context.match(/\b(down|lower|decrease|drop|decline|worse|fall)\b/)) {
      downCount++;
    }
  });
  
  if (upCount > downCount) {
    return 'up';
  } else if (downCount > upCount) {
    return 'down';
  } else {
    return 'neutral';
  }
}

/**
 * Generate summary insights about charts and metrics
 */
export function generateChartInsights(analysis: ChartAnalysis): string {
  let insights = '';
  
  if (analysis.chartCount > 0) {
    insights += `## Visual Data Analysis\n`;
    insights += `The document contains approximately ${analysis.chartCount} charts or data visualizations.\n\n`;
    
    if (analysis.hasAnalyticsData) {
      insights += `### Google Analytics Performance\n`;
      const analyticsMetrics = analysis.metrics.filter(m => 
        ['Sessions', 'Users', 'Pageviews', 'Bounce Rate', 'Avg. Time'].some(term => m.name.includes(term))
      );
      
      if (analyticsMetrics.length > 0) {
        insights += `Key metrics identified:\n`;
        analyticsMetrics.forEach(metric => {
          const trendIcon = metric.trend === 'up' ? '↑' : (metric.trend === 'down' ? '↓' : '→');
          insights += `- ${metric.name}: ${metric.value} ${trendIcon} ${metric.changePercent || ''}\n`;
        });
      } else {
        insights += `Contains traffic and user behavior metrics from Google Analytics.\n`;
      }
      insights += '\n';
    }
    
    if (analysis.hasSearchConsoleData) {
      insights += `### Search Engine Visibility\n`;
      const searchMetrics = analysis.metrics.filter(m => 
        ['Impressions', 'Clicks', 'CTR', 'Position'].some(term => m.name.includes(term))
      );
      
      if (searchMetrics.length > 0) {
        insights += `Key metrics identified:\n`;
        searchMetrics.forEach(metric => {
          const trendIcon = metric.trend === 'up' ? '↑' : (metric.trend === 'down' ? '↓' : '→');
          insights += `- ${metric.name}: ${metric.value} ${trendIcon} ${metric.changePercent || ''}\n`;
        });
      } else {
        insights += `Contains search performance data from Google Search Console or similar tools.\n`;
      }
      insights += '\n';
    }
    
    if (analysis.timeframe) {
      insights += `The visualizations represent data from the period: ${analysis.timeframe}.\n\n`;
    }
    
    // General advice for presenting visual data
    insights += `### Communication Guidelines\n`;
    insights += `When discussing these visualizations with clients:\n`;
    insights += `- Highlight the most significant trends rather than focusing on all data points\n`;
    insights += `- Provide context for changes, especially any notable increases or decreases\n`;
    insights += `- Connect the visual data to specific business outcomes or goals\n`;
  }
  
  return insights;
}

export default {
  detectChartData,
  generateChartInsights
};