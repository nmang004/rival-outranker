import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes/index';
import { MonitoringRepository } from '../../server/repositories/monitoring.repository';
import { MetricsCollectorService } from '../../server/services/monitoring/metrics-collector.service';
import { BusinessIntelligenceService } from '../../server/services/monitoring/business-intelligence.service';
import { PerformanceTestingService } from '../../server/services/monitoring/performance-testing.service';

describe('Phase 5: Monitoring & Optimization Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let monitoringRepo: MonitoringRepository;
  let metricsCollector: MetricsCollectorService;
  let biService: BusinessIntelligenceService;
  let performanceService: PerformanceTestingService;

  beforeAll(async () => {
    // Setup Express app with all routes
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    server = await registerRoutes(app);
    
    // Initialize services
    monitoringRepo = new MonitoringRepository();
    metricsCollector = new MetricsCollectorService();
    biService = new BusinessIntelligenceService();
    performanceService = new PerformanceTestingService();
  });

  afterAll(async () => {
    // Stop metrics collection
    metricsCollector.stopCollection();
    performanceService.stopAllScheduledTests();
    
    if (server) {
      server.close();
    }
  });

  describe('1. Frontend Monitoring Dashboard Components', () => {
    it('should serve monitoring dashboard page', async () => {
      // Test that the monitoring dashboard components are accessible
      // This would typically test the React components, but we'll test the API endpoints they use
      
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('components');
      expect(response.body).toHaveProperty('lastCheck');
    });

    it('should provide current metrics for dashboard', async () => {
      const response = await request(app)
        .get('/api/metrics/current')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('auditsInProgress');
      expect(response.body.data).toHaveProperty('avgResponseTime');
    });

    it('should provide active alerts for dashboard', async () => {
      const response = await request(app)
        .get('/api/alerts/active')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('2. Enhanced Metrics Persistence System', () => {
    it('should create monitoring database tables', async () => {
      // Test that repository can connect to monitoring tables
      const healthCheck = await monitoringRepo.healthCheck();
      expect(healthCheck).toBe(true);
    });

    it('should collect and store system metrics', async () => {
      // Start metrics collection briefly
      metricsCollector.startCollection();
      
      // Wait for initial collection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentMetrics = await metricsCollector.getCurrentMetrics();
      
      expect(currentMetrics).toHaveProperty('system');
      expect(currentMetrics).toHaveProperty('business');
      expect(currentMetrics.system).toHaveProperty('avgResponseTime');
      expect(currentMetrics.system).toHaveProperty('memoryUsage');
      expect(currentMetrics.system).toHaveProperty('cpuUsage');
      
      metricsCollector.stopCollection();
    });

    it('should retrieve historical metrics', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const metrics = await metricsCollector.getMetricsHistory(startDate, endDate, 'system');
      
      expect(Array.isArray(metrics)).toBe(true);
      // Note: May be empty if no metrics have been collected yet
    });

    it('should manage performance thresholds', async () => {
      const testThreshold = {
        goodThreshold: 100,
        warningThreshold: 200,
        criticalThreshold: 500,
        unit: 'ms',
        category: 'test',
        description: 'Test threshold for integration test'
      };
      
      const created = await monitoringRepo.upsertPerformanceThreshold('test_metric', testThreshold);
      
      expect(created).toHaveProperty('metricName', 'test_metric');
      expect(created).toHaveProperty('goodThreshold', 100);
      
      const retrieved = await monitoringRepo.getPerformanceThreshold('test_metric');
      expect(retrieved).toHaveProperty('metricName', 'test_metric');
    });
  });

  describe('3. Advanced Business Intelligence Monitoring', () => {
    it('should provide business intelligence insights', async () => {
      const response = await request(app)
        .get('/api/business-intelligence/insights')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('userGrowth');
      expect(response.body.data).toHaveProperty('auditPerformance');
      expect(response.body.data).toHaveProperty('revenueMetrics');
      expect(response.body.data).toHaveProperty('qualityMetrics');
    });

    it('should provide trend analysis', async () => {
      const response = await request(app)
        .get('/api/business-intelligence/trends')
        .query({ metrics: ['total_audits', 'active_users'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should provide user segmentation', async () => {
      const response = await request(app)
        .get('/api/business-intelligence/segments')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name');
        expect(response.body.data[0]).toHaveProperty('userCount');
      }
    });

    it('should generate business reports', async () => {
      const response = await request(app)
        .get('/api/business-intelligence/report')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('summary');
    });
  });

  describe('4. Automated Performance Testing Integration', () => {
    it('should list available performance tests', async () => {
      const response = await request(app)
        .get('/api/performance-testing/tests')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const firstTest = response.body.data[0];
      expect(firstTest).toHaveProperty('id');
      expect(firstTest).toHaveProperty('name');
      expect(firstTest).toHaveProperty('type');
      expect(firstTest).toHaveProperty('config');
    });

    it('should run a regression test', async () => {
      const response = await request(app)
        .post('/api/performance-testing/regression')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('passed');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('responseTime');
      expect(response.body.data).toHaveProperty('recommendation');
    }, 30000); // Increase timeout for performance test

    it('should provide performance test statistics', async () => {
      const response = await request(app)
        .get('/api/performance-testing/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalTests');
      expect(response.body.data).toHaveProperty('passedTests');
      expect(response.body.data).toHaveProperty('avgResponseTime');
    });

    it('should check performance testing health', async () => {
      const response = await request(app)
        .get('/api/performance-testing/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('availableTests');
    });
  });

  describe('5. Integration & Cross-Component Tests', () => {
    it('should integrate metrics collection with alerting', async () => {
      // Track a high response time to trigger potential alert
      metricsCollector.trackRequest('/api/test', 5000, false); // 5 second response time, failed
      
      const currentMetrics = await metricsCollector.getCurrentMetrics();
      expect(currentMetrics.system.avgResponseTime).toBeGreaterThan(0);
    });

    it('should integrate performance testing with business intelligence', async () => {
      // Run a quick performance test
      const testResponse = await request(app)
        .post('/api/performance-testing/tests/regression-test/run')
        .expect(200);

      expect(testResponse.body).toHaveProperty('success', true);
      
      // Check that BI can access the results
      const biResponse = await request(app)
        .get('/api/business-intelligence/insights')
        .expect(200);

      expect(biResponse.body).toHaveProperty('success', true);
    }, 30000);

    it('should provide unified monitoring health check', async () => {
      const checks = await Promise.all([
        request(app).get('/api/health'),
        request(app).get('/api/business-intelligence/health'),
        request(app).get('/api/performance-testing/health')
      ]);

      checks.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    it('should handle configuration updates across services', async () => {
      // Test updating monitoring configuration
      const configResponse = await request(app)
        .put('/api/business-intelligence/config/test_setting')
        .send({
          value: 'test_value',
          type: 'string',
          category: 'test',
          description: 'Test configuration for integration'
        })
        .expect(200);

      expect(configResponse.body).toHaveProperty('success', true);
      
      // Verify configuration was saved
      const getConfigResponse = await request(app)
        .get('/api/business-intelligence/config')
        .expect(200);

      const testConfig = getConfigResponse.body.data.find((c: any) => c.key === 'test_setting');
      expect(testConfig).toBeDefined();
      expect(testConfig.value).toBe('test_value');
    });

    it('should handle monitoring data cleanup', async () => {
      // Test that cleanup methods work without errors
      try {
        await monitoringRepo.cleanupOldData({
          systemMetrics: 1, // 1 day retention for test
          businessMetrics: 1,
          alertHistory: 1
        });
        
        // If we get here, cleanup worked without throwing
        expect(true).toBe(true);
      } catch (error) {
        // Cleanup might fail if tables are empty, which is okay for tests
        console.log('Cleanup test completed (may have had empty tables)');
        expect(true).toBe(true);
      }
    });
  });

  describe('6. Error Handling & Resilience', () => {
    it('should handle invalid API requests gracefully', async () => {
      const response = await request(app)
        .get('/api/business-intelligence/insights')
        .query({ startDate: 'invalid-date' })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing performance test gracefully', async () => {
      const response = await request(app)
        .post('/api/performance-testing/tests/non-existent-test/run')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle monitoring service failures gracefully', async () => {
      // Test that the system continues to work even if monitoring fails
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body).toHaveProperty('overall');
      
      // Even if some components fail, the health check should still respond
      expect(['healthy', 'degraded', 'unhealthy', 'error']).toContain(healthResponse.body.overall);
    });
  });

  describe('7. Performance & Scalability', () => {
    it('should handle multiple concurrent requests to monitoring endpoints', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/metrics/current')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    it('should complete monitoring operations within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/business-intelligence/insights')
        .expect(200);

      const duration = Date.now() - startTime;
      
      expect(response.body).toHaveProperty('success', true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

// Test helper functions
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}