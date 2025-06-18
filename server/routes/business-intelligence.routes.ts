import { Router } from 'express';
import { BusinessIntelligenceService } from '../services/monitoring/business-intelligence.service';
import { MetricsCollectorService } from '../services/monitoring/metrics-collector.service';
import { MonitoringRepository } from '../repositories/monitoring.repository';

const router = Router();
const biService = new BusinessIntelligenceService();
const metricsCollector = new MetricsCollectorService();
const monitoringRepo = new MonitoringRepository();

// Get comprehensive business insights
router.get('/insights', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const insights = await biService.getBusinessInsights({ start, end });
    
    res.json({
      success: true,
      data: insights,
      timeRange: { start, end }
    });
  } catch (error) {
    console.error('Failed to get business insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve business insights'
    });
  }
});

// Get trend analysis for specific metrics
router.get('/trends', async (req, res) => {
  try {
    const { metrics, startDate, endDate } = req.query;
    
    if (!metrics) {
      return res.status(400).json({
        success: false,
        error: 'Metrics parameter is required'
      });
    }

    const metricsList = Array.isArray(metrics) ? metrics : [metrics];
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trends = await biService.getTrendAnalysis(metricsList as string[], { start, end });
    
    res.json({
      success: true,
      data: trends,
      timeRange: { start, end }
    });
  } catch (error) {
    console.error('Failed to get trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trend analysis'
    });
  }
});

// Get user segmentation data
router.get('/segments', async (req, res) => {
  try {
    const segments = await biService.getUserSegments();
    
    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    console.error('Failed to get user segments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user segments'
    });
  }
});

// Generate business intelligence report
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const report = await biService.generateBusinessReport(
      { start, end },
      format as 'json' | 'excel'
    );
    
    if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="business-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.xlsx"`);
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Failed to generate business report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate business report'
    });
  }
});

// Get historical business metrics
router.get('/metrics/history', async (req, res) => {
  try {
    const { startDate, endDate, type = 'business' } = req.query;
    
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const metrics = await metricsCollector.getMetricsHistory(start, end, type as 'system' | 'business');
    
    res.json({
      success: true,
      data: metrics,
      timeRange: { start, end }
    });
  } catch (error) {
    console.error('Failed to get metrics history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics history'
    });
  }
});

// Get aggregated system metrics
router.get('/metrics/system/aggregated', async (req, res) => {
  try {
    const { startDate, endDate, interval = 'hour' } = req.query;
    
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 24 * 60 * 60 * 1000);

    const aggregatedMetrics = await monitoringRepo.getSystemMetricsAggregated(
      start, 
      end, 
      interval as 'hour' | 'day'
    );
    
    res.json({
      success: true,
      data: aggregatedMetrics,
      timeRange: { start, end },
      interval
    });
  } catch (error) {
    console.error('Failed to get aggregated system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve aggregated system metrics'
    });
  }
});

// Get alert statistics
router.get('/alerts/statistics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await monitoringRepo.getAlertStatistics(Number(days));
    
    res.json({
      success: true,
      data: stats,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Failed to get alert statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alert statistics'
    });
  }
});

// Get performance thresholds
router.get('/thresholds', async (req, res) => {
  try {
    const thresholds = await monitoringRepo.getPerformanceThresholds();
    
    res.json({
      success: true,
      data: thresholds
    });
  } catch (error) {
    console.error('Failed to get performance thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance thresholds'
    });
  }
});

// Update performance threshold
router.put('/thresholds/:metricName', async (req, res) => {
  try {
    const { metricName } = req.params;
    const threshold = req.body;
    
    const updatedThreshold = await monitoringRepo.upsertPerformanceThreshold(metricName, threshold);
    
    res.json({
      success: true,
      data: updatedThreshold
    });
  } catch (error) {
    console.error('Failed to update performance threshold:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update performance threshold'
    });
  }
});

// Get monitoring configuration
router.get('/config', async (req, res) => {
  try {
    const config = await monitoringRepo.getMonitoringConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Failed to get monitoring configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve monitoring configuration'
    });
  }
});

// Update monitoring configuration
router.put('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, category, description } = req.body;
    
    const updatedConfig = await monitoringRepo.setConfigValue(key, value, type, category, description);
    
    res.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    console.error('Failed to update monitoring configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update monitoring configuration'
    });
  }
});

// Get current collector metrics
router.get('/collector/current', async (req, res) => {
  try {
    const currentMetrics = await metricsCollector.getCurrentMetrics();
    
    res.json({
      success: true,
      data: currentMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get current collector metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve current metrics'
    });
  }
});

// Get collector configuration
router.get('/collector/config', async (req, res) => {
  try {
    const config = metricsCollector.getConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Failed to get collector configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve collector configuration'
    });
  }
});

// Update collector configuration
router.put('/collector/config', async (req, res) => {
  try {
    const newConfig = req.body;
    
    metricsCollector.updateConfig(newConfig);
    const updatedConfig = metricsCollector.getConfig();
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Collector configuration updated successfully'
    });
  } catch (error) {
    console.error('Failed to update collector configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update collector configuration'
    });
  }
});

// Health check for business intelligence system
router.get('/health', async (req, res) => {
  try {
    const dbHealth = await monitoringRepo.healthCheck();
    const collectorConfig = metricsCollector.getConfig();
    
    res.json({
      success: true,
      data: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        collector: {
          running: collectorConfig.enabledMetrics.system || collectorConfig.enabledMetrics.business,
          config: collectorConfig
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Business intelligence health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;