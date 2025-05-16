/**
 * Service for extracting and analyzing chart data from PDFs
 */

interface ChartMetric {
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  changePercent?: string;
}

interface ExtractedChart {
  type: 'line' | 'bar' | 'pie' | 'table' | 'unknown';
  title?: string;
  metrics: ChartMetric[];
  timeframe?: string;
}

interface ChartExtractionResult {
  charts: ExtractedChart[];
  googleAnalyticsData: boolean;
  searchConsoleData: boolean;
  timeframe: string;
}

/**
 * Analyzes PDF text to identify and extract chart data
 * 
 * @param text The extracted text content from a PDF
 * @param fileName Optional filename for additional context
 */
export function extractChartsFromText(text: string, fileName?: string): ChartExtractionResult {
  const result: ChartExtractionResult = {
    charts: [],
    googleAnalyticsData: false,
    searchConsoleData: false,
    timeframe: ''
  };
  
  // Detect Google Analytics data
  if (text.includes('Google Analytics') || 
      text.includes('Analytics Performance') || 
      text.includes('Organic Performance')) {
    
    result.googleAnalyticsData = true;
    
    // Look for common analytics metrics sections
    const analyticsMetrics: ChartMetric[] = [];
    
    // Sessions
    const sessionMatch = text.match(/sessions?[:\s]+([0-9,]+)/i);
    if (sessionMatch && sessionMatch[1]) {
      analyticsMetrics.push({
        name: 'Sessions',
        value: sessionMatch[1],
        trend: detectTrendFromContext(text, 'session')
      });
    }
    
    // Users
    const usersMatch = text.match(/users?[:\s]+([0-9,]+)/i);
    if (usersMatch && usersMatch[1]) {
      analyticsMetrics.push({
        name: 'Users',
        value: usersMatch[1],
        trend: detectTrendFromContext(text, 'user')
      });
    }
    
    // Pageviews
    const pageviewsMatch = text.match(/pageviews?[:\s]+([0-9,]+)/i);
    if (pageviewsMatch && pageviewsMatch[1]) {
      analyticsMetrics.push({
        name: 'Pageviews',
        value: pageviewsMatch[1],
        trend: detectTrendFromContext(text, 'pageview')
      });
    }
    
    // Bounce Rate
    const bounceRateMatch = text.match(/bounce rate[:\s]+([0-9,.]+)%/i);
    if (bounceRateMatch && bounceRateMatch[1]) {
      analyticsMetrics.push({
        name: 'Bounce Rate',
        value: bounceRateMatch[1] + '%',
        trend: detectTrendFromContext(text, 'bounce rate') === 'up' ? 'down' : 'up' // Lower bounce rate is better
      });
    }
    
    // Average Session Duration
    const durationMatch = text.match(/(?:avg|average)(?:.)*?(?:session|engagement)[^:]*?(?:time|duration)[:\s]+([0-9:,.]+)/i);
    if (durationMatch && durationMatch[1]) {
      analyticsMetrics.push({
        name: 'Avg. Session Duration',
        value: durationMatch[1],
        trend: detectTrendFromContext(text, 'duration')
      });
    }
    
    // Add the Analytics chart if we found metrics
    if (analyticsMetrics.length > 0) {
      result.charts.push({
        type: 'line',
        title: 'Google Analytics Organic Performance',
        metrics: analyticsMetrics,
        timeframe: detectTimeframe(text)
      });
    }
  }
  
  // Detect Google Search Console data
  if (text.includes('Search Console') || 
      text.includes('GSC') || 
      (text.includes('impressions') && text.includes('clicks') && text.includes('position'))) {
    
    result.searchConsoleData = true;
    
    // Look for common search console metrics sections
    const searchConsoleMetrics: ChartMetric[] = [];
    
    // Impressions
    const impressionsMatch = text.match(/impressions?[:\s]+([0-9,]+)/i);
    if (impressionsMatch && impressionsMatch[1]) {
      searchConsoleMetrics.push({
        name: 'Impressions',
        value: impressionsMatch[1],
        trend: detectTrendFromContext(text, 'impression')
      });
    }
    
    // Clicks
    const clicksMatch = text.match(/clicks?[:\s]+([0-9,]+)/i);
    if (clicksMatch && clicksMatch[1]) {
      searchConsoleMetrics.push({
        name: 'Clicks',
        value: clicksMatch[1],
        trend: detectTrendFromContext(text, 'click')
      });
    }
    
    // CTR
    const ctrMatch = text.match(/ctr[:\s]+([0-9,.]+)%/i);
    if (ctrMatch && ctrMatch[1]) {
      searchConsoleMetrics.push({
        name: 'CTR',
        value: ctrMatch[1] + '%',
        trend: detectTrendFromContext(text, 'ctr')
      });
    }
    
    // Position
    const positionMatch = text.match(/position[:\s]+([0-9,.]+)/i);
    if (positionMatch && positionMatch[1]) {
      searchConsoleMetrics.push({
        name: 'Position',
        value: positionMatch[1],
        trend: detectTrendFromContext(text, 'position') === 'up' ? 'down' : 'up' // Lower position number is better
      });
    }
    
    // Add the Search Console chart if we found metrics
    if (searchConsoleMetrics.length > 0) {
      result.charts.push({
        type: 'line',
        title: 'Google Search Console Performance',
        metrics: searchConsoleMetrics,
        timeframe: detectTimeframe(text)
      });
    }
  }
  
  // Detect specific metric sections - often these will be charts in the PDF
  const metricSections = [
    'keywords?',
    'organic traffic',
    'page impressions',
    'conversions?',
    'revenue',
    'bounce rate',
    'engagement',
    'rankings?'
  ];
  
  metricSections.forEach(sectionName => {
    const regex = new RegExp(`(?:${sectionName})[^\\n]{0,50}(?:[0-9.,]+)`, 'gi');
    const matches = text.match(regex);
    
    if (matches && matches.length > 0) {
      // Extract values from this section - likely a chart in the PDF
      const valueMatches = matches.map(match => {
        const valueMatch = match.match(/([0-9.,]+)/);
        return {
          text: match,
          value: valueMatch ? valueMatch[1] : null
        };
      }).filter(m => m.value !== null);
      
      if (valueMatches.length > 0) {
        const metrics: ChartMetric[] = valueMatches.map(vm => ({
          name: sectionName.replace(/s\?$/, '').replace(/\?/, ''),
          value: vm.value || '',
          trend: detectTrendFromContext(vm.text, sectionName)
        }));
        
        result.charts.push({
          type: 'unknown',
          title: `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1).replace(/s\?$/, '').replace(/\?/, '')} Metrics`,
          metrics: metrics
        });
      }
    }
  });
  
  // Look for timeframe information in the document
  const timeframe = detectTimeframe(text);
  if (timeframe) {
    result.timeframe = timeframe;
  } else if (fileName) {
    // Try to extract date ranges from filename
    const dateMatch = fileName.match(/(\d{4}-\d{2}(?:-\d{2})?)[\s_-]+(\d{4}-\d{2}(?:-\d{2})?)/);
    if (dateMatch) {
      result.timeframe = `${dateMatch[1]} to ${dateMatch[2]}`;
    }
  }
  
  return result;
}

/**
 * Look for timeframe references in the text
 */
function detectTimeframe(text: string): string {
  // Look for date range patterns in the content
  const dateRangePatterns = [
    // Format: March 1, 2025 to March 31, 2025
    /([a-z]+)\s+(\d{1,2})(?:\s*,\s*|\s+)(\d{4})\s+(?:to|through|-)\s+([a-z]+)\s+(\d{1,2})(?:\s*,\s*|\s+)(\d{4})/i,
    
    // Format: 2025-03-01 to 2025-03-31
    /(\d{4})-(\d{2})-(\d{2})\s+(?:to|through|-)\s+(\d{4})-(\d{2})-(\d{2})/i,
    
    // Format: Mar 1 - Mar 31, 2025
    /([a-z]{3})\s+(\d{1,2})\s+(?:to|through|-)\s+([a-z]{3})\s+(\d{1,2})(?:\s*,\s*|\s+)(\d{4})/i,
    
    // Format: March 2025
    /([a-z]+)\s+(\d{4})/i
  ];
  
  for (const pattern of dateRangePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return '';
}

/**
 * Determine trend direction for a metric based on surrounding text
 */
function detectTrendFromContext(text: string, metricName: string): 'up' | 'down' | 'neutral' {
  // Look for percentage changes
  const percentageChange = text.match(/\+(\d+(?:\.\d+)?)%/);
  if (percentageChange) {
    return 'up';
  }
  
  const percentageDown = text.match(/\-(\d+(?:\.\d+)?)%/);
  if (percentageDown) {
    return 'down';
  }
  
  // Look for trend words
  const upTrendWords = ['increased', 'higher', 'growth', 'improvement', 'better', 'gained', 'up'];
  const downTrendWords = ['decreased', 'lower', 'decline', 'drop', 'fell', 'worse', 'down'];
  
  let upCount = 0;
  let downCount = 0;
  
  upTrendWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      upCount++;
    }
  });
  
  downTrendWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
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
 * Format extracted chart data for AI insight generation
 */
export function generateChartInsights(extraction: ChartExtractionResult): string {
  if (extraction.charts.length === 0 && !extraction.googleAnalyticsData && !extraction.searchConsoleData) {
    return '';
  }
  
  let insights = '## Data Visualization Analysis\n\n';
  
  if (extraction.timeframe) {
    insights += `This analysis covers the period: ${extraction.timeframe}\n\n`;
  }
  
  // Google Analytics insights
  if (extraction.googleAnalyticsData) {
    insights += '### Google Analytics Performance\n';
    
    const analyticsChart = extraction.charts.find(c => c.title?.includes('Analytics'));
    if (analyticsChart && analyticsChart.metrics.length > 0) {
      insights += 'Key metrics detected:\n';
      
      analyticsChart.metrics.forEach(metric => {
        const trendIcon = metric.trend === 'up' ? '↑' : (metric.trend === 'down' ? '↓' : '→');
        insights += `- **${metric.name}**: ${metric.value} ${trendIcon}\n`;
      });
    } else {
      insights += 'The document contains Google Analytics data visualizations showing website traffic and user behavior metrics.\n';
    }
    
    insights += '\n';
  }
  
  // Search Console insights
  if (extraction.searchConsoleData) {
    insights += '### Search Console Performance\n';
    
    const searchChart = extraction.charts.find(c => c.title?.includes('Search Console'));
    if (searchChart && searchChart.metrics.length > 0) {
      insights += 'Key metrics detected:\n';
      
      searchChart.metrics.forEach(metric => {
        const trendIcon = metric.trend === 'up' ? '↑' : (metric.trend === 'down' ? '↓' : '→');
        insights += `- **${metric.name}**: ${metric.value} ${trendIcon}\n`;
      });
    } else {
      insights += 'The document contains Search Console data visualizations showing search visibility and performance metrics.\n';
    }
    
    insights += '\n';
  }
  
  // Other charts
  const otherCharts = extraction.charts.filter(c => 
    !c.title?.includes('Analytics') && !c.title?.includes('Search Console')
  );
  
  if (otherCharts.length > 0) {
    insights += '### Additional Performance Visualizations\n';
    insights += `The document contains ${otherCharts.length} additional data visualizations:\n\n`;
    
    otherCharts.forEach(chart => {
      if (chart.title) {
        insights += `#### ${chart.title}\n`;
        
        if (chart.metrics.length > 0) {
          chart.metrics.forEach(metric => {
            const trendIcon = metric.trend === 'up' ? '↑' : (metric.trend === 'down' ? '↓' : '→');
            insights += `- ${metric.name}: ${metric.value} ${trendIcon}\n`;
          });
        }
        
        insights += '\n';
      }
    });
  }
  
  // Client presentation advice
  insights += '### Visualization Communication Guide\n';
  insights += 'When discussing these data visualizations with clients:\n\n';
  insights += '- Focus on overall trends rather than individual data points\n';
  insights += '- Highlight the relationship between different metrics (e.g., how higher rankings lead to more traffic)\n';
  insights += '- Provide industry context to help clients understand how their metrics compare to expectations\n';
  insights += '- Connect the performance data to business objectives and outcomes\n';
  
  return insights;
}

export default {
  extractChartsFromText,
  generateChartInsights
};