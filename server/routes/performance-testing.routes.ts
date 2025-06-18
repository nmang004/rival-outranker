import { Router } from 'express';
import { PerformanceTestingService } from '../services/monitoring/performance-testing.service';

const router = Router();
const performanceTestingService = new PerformanceTestingService();

// Get all available performance tests
router.get('/tests', async (req, res) => {
  try {
    const tests = performanceTestingService.getAvailableTests();
    
    res.json({
      success: true,
      data: tests
    });
  } catch (error) {
    console.error('Failed to get available tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available tests'
    });
  }
});

// Run a specific performance test
router.post('/tests/:testId/run', async (req, res) => {
  try {
    const { testId } = req.params;
    
    const result = await performanceTestingService.runTest(testId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to run performance test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to run performance test';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get test results
router.get('/results', async (req, res) => {
  try {
    const { testId, limit } = req.query;
    
    let results;
    if (testId) {
      const limitNum = limit ? parseInt(limit as string) : 10;
      results = await performanceTestingService.getTestHistory(testId as string, limitNum);
    } else {
      results = await performanceTestingService.getTestResults();
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Failed to get test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test results'
    });
  }
});

// Get specific test result by ID
router.get('/results/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    
    const allResults = await performanceTestingService.getTestResults();
    const result = allResults.find(r => r.testId === resultId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Test result not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to get test result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test result'
    });
  }
});

// Create a custom performance test
router.post('/tests', async (req, res) => {
  try {
    const testConfig = req.body;
    
    // Validate required fields
    if (!testConfig.name || !testConfig.type || !testConfig.config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, config'
      });
    }
    
    const newTest = await performanceTestingService.createCustomTest(testConfig);
    
    res.status(201).json({
      success: true,
      data: newTest
    });
  } catch (error) {
    console.error('Failed to create custom test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create custom test'
    });
  }
});

// Stop a scheduled test
router.post('/tests/:testId/stop', async (req, res) => {
  try {
    const { testId } = req.params;
    
    performanceTestingService.stopScheduledTest(testId);
    
    res.json({
      success: true,
      message: `Scheduled test ${testId} stopped successfully`
    });
  } catch (error) {
    console.error('Failed to stop scheduled test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduled test'
    });
  }
});

// Stop all scheduled tests
router.post('/tests/stop-all', async (req, res) => {
  try {
    performanceTestingService.stopAllScheduledTests();
    
    res.json({
      success: true,
      message: 'All scheduled tests stopped successfully'
    });
  } catch (error) {
    console.error('Failed to stop all scheduled tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop all scheduled tests'
    });
  }
});

// Get performance test statistics
router.get('/statistics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);
    
    const allResults = await performanceTestingService.getTestResults();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);
    
    const recentResults = allResults.filter(r => r.startTime >= cutoffDate);
    
    const statistics = {
      totalTests: recentResults.length,
      passedTests: recentResults.filter(r => r.status === 'passed').length,
      failedTests: recentResults.filter(r => r.status === 'failed').length,
      warningTests: recentResults.filter(r => r.status === 'warning').length,
      avgResponseTime: recentResults.length > 0 
        ? recentResults.reduce((sum, r) => sum + r.metrics.avgResponseTime, 0) / recentResults.length
        : 0,
      avgThroughput: recentResults.length > 0
        ? recentResults.reduce((sum, r) => sum + r.metrics.throughput, 0) / recentResults.length
        : 0,
      avgErrorRate: recentResults.length > 0
        ? recentResults.reduce((sum, r) => sum + r.metrics.errorRate, 0) / recentResults.length
        : 0,
      testsByType: {
        load: recentResults.filter(r => r.testId.includes('load')).length,
        stress: recentResults.filter(r => r.testId.includes('stress')).length,
        regression: recentResults.filter(r => r.testId.includes('regression')).length
      },
      trends: {
        responseTime: calculateTrend(recentResults, 'avgResponseTime'),
        throughput: calculateTrend(recentResults, 'throughput'),
        errorRate: calculateTrend(recentResults, 'errorRate')
      }
    };
    
    res.json({
      success: true,
      data: statistics,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Failed to get performance test statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance test statistics'
    });
  }
});

// Helper function to calculate trends
function calculateTrend(results: any[], metric: string): string {
  if (results.length < 2) return 'stable';
  
  const sorted = results.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const recent = sorted.slice(-5); // Last 5 results
  const older = sorted.slice(0, 5); // First 5 results
  
  if (recent.length === 0 || older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, r) => sum + r.metrics[metric], 0) / recent.length;
  const olderAvg = older.reduce((sum, r) => sum + r.metrics[metric], 0) / older.length;
  
  const changePercent = olderAvg !== 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  
  if (Math.abs(changePercent) < 5) return 'stable';
  return changePercent > 0 ? 'increasing' : 'decreasing';
}

// Performance test health check
router.get('/health', async (req, res) => {
  try {
    const availableTests = performanceTestingService.getAvailableTests();
    const recentResults = await performanceTestingService.getTestResults();
    const lastResult = recentResults.length > 0 ? recentResults[0] : null;
    
    const health = {
      status: 'healthy',
      availableTests: availableTests.length,
      lastTestRun: lastResult?.startTime || null,
      lastTestStatus: lastResult?.status || 'unknown',
      scheduledTests: availableTests.filter(t => t.schedule?.enabled).length,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Performance testing health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// Run regression test (commonly used before deployments)
router.post('/regression', async (req, res) => {
  try {
    const result = await performanceTestingService.runTest('regression-test');
    
    // Return specific regression test result format
    res.json({
      success: true,
      data: {
        passed: result.status === 'passed',
        status: result.status,
        duration: result.duration,
        responseTime: result.metrics.avgResponseTime,
        errorRate: result.metrics.errorRate,
        throughput: result.metrics.throughput,
        violations: result.thresholdViolations,
        recommendation: result.status === 'passed' 
          ? 'Safe to deploy' 
          : 'Review performance issues before deployment'
      }
    });
  } catch (error) {
    console.error('Failed to run regression test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run regression test'
    });
  }
});

export default router;