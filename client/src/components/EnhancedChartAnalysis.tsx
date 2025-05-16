import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, ChevronRight, BarChart, LineChart, PieChart, Table, FileBarChart } from 'lucide-react';

interface ChartMetric {
  name: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  changePercent?: string;
}

interface Props {
  pdfText: string;
  fileName: string;
}

const EnhancedChartAnalysis: React.FC<Props> = ({ pdfText, fileName }) => {
  // State for detected metrics
  const [analyticsMetrics, setAnalyticsMetrics] = React.useState<ChartMetric[]>([]);
  const [searchConsoleMetrics, setSearchConsoleMetrics] = React.useState<ChartMetric[]>([]);
  const [otherMetrics, setOtherMetrics] = React.useState<ChartMetric[]>([]);
  const [timeframe, setTimeframe] = React.useState<string>('');
  
  // Extract data on component mount
  React.useEffect(() => {
    if (pdfText) {
      analyzePdfContent(pdfText, fileName);
    }
  }, [pdfText, fileName]);
  
  const analyzePdfContent = (text: string, fileName: string) => {
    // Find analytics metrics
    const analytics: ChartMetric[] = [];
    
    // Sessions
    const sessionMatches = text.match(/sessions?[:\s]+([0-9,]+)/i) || 
                           text.match(/sessions?.*?([0-9,]+)/i);
    if (sessionMatches && sessionMatches[1]) {
      analytics.push({
        name: 'Sessions',
        value: sessionMatches[1].trim(),
        trend: detectTrend(text, 'session')
      });
    }
    
    // Users
    const userMatches = text.match(/users?[:\s]+([0-9,]+)/i) ||
                        text.match(/total users?.*?([0-9,]+)/i);
    if (userMatches && userMatches[1]) {
      analytics.push({
        name: 'Users',
        value: userMatches[1].trim(),
        trend: detectTrend(text, 'user')
      });
    }
    
    // Event count
    const eventMatches = text.match(/events?.*?count.*?([0-9,]+)/i) ||
                        text.match(/event count.*?([0-9,]+)/i);
    if (eventMatches && eventMatches[1]) {
      analytics.push({
        name: 'Event Count',
        value: eventMatches[1].trim(),
        trend: detectTrend(text, 'event')
      });
    }
    
    // Key events
    const keyEventMatches = text.match(/key events.*?([0-9,]+)/i);
    if (keyEventMatches && keyEventMatches[1]) {
      analytics.push({
        name: 'Key Events',
        value: keyEventMatches[1].trim(),
        trend: detectTrend(text, 'key event')
      });
    }
    
    // Avg engagement
    const engagementMatches = text.match(/engagement.*?time.*?(\d{2}:\d{2}:\d{2})/i);
    if (engagementMatches && engagementMatches[1]) {
      analytics.push({
        name: 'Avg. Engagement Time',
        value: engagementMatches[1].trim(),
        trend: detectTrend(text, 'engagement')
      });
    }
    
    setAnalyticsMetrics(analytics);
    
    // Find search console metrics
    const searchConsole: ChartMetric[] = [];
    
    // Clicks
    const clickMatches = text.match(/clicks?[:\s]+([0-9,]+)/i);
    if (clickMatches && clickMatches[1]) {
      searchConsole.push({
        name: 'Clicks',
        value: clickMatches[1].trim(),
        trend: detectTrend(text, 'click')
      });
    }
    
    // Impressions
    const impressionMatches = text.match(/impressions?[:\s]+([0-9,]+)/i);
    if (impressionMatches && impressionMatches[1]) {
      searchConsole.push({
        name: 'Impressions',
        value: impressionMatches[1].trim(),
        trend: detectTrend(text, 'impression')
      });
    }
    
    // CTR
    const ctrMatches = text.match(/ctr[:\s]+([0-9,.]+)%/i);
    if (ctrMatches && ctrMatches[1]) {
      searchConsole.push({
        name: 'CTR',
        value: ctrMatches[1].trim() + '%',
        trend: detectTrend(text, 'ctr')
      });
    }
    
    // Position
    const positionMatches = text.match(/position[:\s]+([0-9,.]+)/i);
    if (positionMatches && positionMatches[1]) {
      searchConsole.push({
        name: 'Position',
        value: positionMatches[1].trim(),
        trend: detectTrend(text, 'position', true) // Lower is better
      });
    }
    
    setSearchConsoleMetrics(searchConsole);
    
    // Find other numeric values in the text that might be metrics
    const numericValues = extractNumericPatterns(text);
    setOtherMetrics(numericValues);
    
    // Find timeframe references
    const timeframeMatches = text.match(/(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*[-,]\s*\d{4})?)\s+(?:to|-)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*[-,]\s*\d{4})?)/i);
    
    if (timeframeMatches && timeframeMatches[0]) {
      setTimeframe(timeframeMatches[0]);
    } else {
      // Try to extract from filename
      const dateMatch = fileName.match(/(\d{4}-\d{2}(?:-\d{2})?)[\s_-]+(\d{4}-\d{2}(?:-\d{2})?)/);
      if (dateMatch) {
        setTimeframe(`${dateMatch[1]} to ${dateMatch[2]}`);
      }
    }
  };
  
  // Helper to detect trend direction
  const detectTrend = (text: string, keyword: string, inversed = false): 'up' | 'down' | 'neutral' => {
    // Look for percentage indicators near the keyword
    const context = findContext(text, keyword, 100);
    
    if (!context) return 'neutral';
    
    // Check for explicit trend indicators
    if (context.match(/\+\s*\d+(\.\d+)?%/) || 
        context.match(/increased|higher|growth|improvement|better|up|gained/i)) {
      return inversed ? 'down' : 'up';
    }
    
    if (context.match(/\-\s*\d+(\.\d+)?%/) || 
        context.match(/decreased|lower|decline|drop|fell|down|worse/i)) {
      return inversed ? 'up' : 'down';
    }
    
    return 'neutral';
  };
  
  // Helper to find text context around a keyword
  const findContext = (text: string, keyword: string, radius: number): string | null => {
    const pattern = new RegExp(`[^.!?]*(?:${keyword})[^.!?]*`, 'i');
    const match = text.match(pattern);
    
    if (match && match[0]) {
      return match[0];
    }
    
    return null;
  };
  
  // Helper to extract patterns that look like metrics
  const extractNumericPatterns = (text: string): ChartMetric[] => {
    const patterns = [
      { name: 'Conversion Rate', regex: /conversion rate[:\s]+([0-9,.]+)%/i },
      { name: 'Bounce Rate', regex: /bounce rate[:\s]+([0-9,.]+)%/i },
      { name: 'Organic Traffic', regex: /organic traffic[:\s]+([0-9,]+)/i },
      { name: 'Page Views', regex: /page ?views[:\s]+([0-9,]+)/i },
      { name: 'Rankings', regex: /rankings?[:\s]+([0-9,]+)/i },
      { name: 'Keywords', regex: /keywords?[:\s]+([0-9,]+)/i },
    ];
    
    const metrics: ChartMetric[] = [];
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match && match[1]) {
        metrics.push({
          name: pattern.name,
          value: match[1].trim(),
          trend: detectTrend(text, pattern.name)
        });
      }
    }
    
    return metrics;
  };
  
  // Helper function to render trend indicator
  const renderTrendIndicator = (trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') {
      return <ChevronUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down') {
      return <ChevronDown className="h-4 w-4 text-red-500" />;
    } else {
      return <ChevronRight className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Find out if we have detected any analytics data
  const hasAnalyticsData = pdfText.toLowerCase().includes('google analytics') || 
                            pdfText.toLowerCase().includes('analytics') ||
                            analyticsMetrics.length > 0;
                            
  const hasSearchConsoleData = pdfText.toLowerCase().includes('search console') || 
                              (pdfText.toLowerCase().includes('impression') && pdfText.toLowerCase().includes('click')) ||
                              searchConsoleMetrics.length > 0;
  
  // Check for chart indicators in the PDF text
  const hasCharts = pdfText.toLowerCase().includes('chart') || 
                    pdfText.toLowerCase().includes('graph') ||
                    hasAnalyticsData || hasSearchConsoleData;
  
  if (!hasCharts && analyticsMetrics.length === 0 && searchConsoleMetrics.length === 0 && otherMetrics.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Visual Chart Analysis</h2>
      
      {timeframe && (
        <p className="text-sm text-gray-600 mb-4">
          Report period: <Badge variant="secondary" className="ml-1">{timeframe}</Badge>
        </p>
      )}
      
      {/* Analytics Metrics Section */}
      {hasAnalyticsData && (
        <Card className="p-4">
          <div className="flex items-center mb-3">
            <LineChart className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium">Google Analytics Performance</h3>
          </div>
          
          {analyticsMetrics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {analyticsMetrics.map((metric, index) => (
                <div key={index} className="border rounded-md p-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    {renderTrendIndicator(metric.trend)}
                  </div>
                  <p className="text-lg font-bold mt-1">{metric.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">Analytics data detected but specific metrics could not be extracted.</p>
          )}
        </Card>
      )}
      
      {/* Search Console Metrics Section */}
      {hasSearchConsoleData && (
        <Card className="p-4">
          <div className="flex items-center mb-3">
            <FileBarChart className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium">Search Performance</h3>
          </div>
          
          {searchConsoleMetrics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {searchConsoleMetrics.map((metric, index) => (
                <div key={index} className="border rounded-md p-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    {renderTrendIndicator(metric.trend)}
                  </div>
                  <p className="text-lg font-bold mt-1">{metric.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">Search performance data detected but specific metrics could not be extracted.</p>
          )}
        </Card>
      )}
      
      {/* Other Metrics Section */}
      {otherMetrics.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center mb-3">
            <BarChart className="h-5 w-5 text-amber-600 mr-2" />
            <h3 className="text-lg font-medium">Additional Metrics</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {otherMetrics.map((metric, index) => (
              <div key={index} className="border rounded-md p-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  {renderTrendIndicator(metric.trend)}
                </div>
                <p className="text-lg font-bold mt-1">{metric.value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Chart Analysis Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Chart Analysis Tips</h3>
        <ul className="space-y-2 text-sm text-blue-900">
          <li className="flex items-start">
            <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
            <span>Focus on overall trends rather than individual data points when discussing with clients</span>
          </li>
          <li className="flex items-start">
            <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
            <span>Highlight the relationship between different metrics (e.g., how higher rankings lead to more traffic)</span>
          </li>
          <li className="flex items-start">
            <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
            <span>Connect the performance data to client business objectives (conversions, leads, sales)</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default EnhancedChartAnalysis;