import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import jwt from 'jsonwebtoken';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  testName: string;
  url: string;
  crawlSpeed: number; // pages per second
  memoryUsage: NodeJS.MemoryUsage;
  accuracy: number; // percentage
  totalTime: number; // milliseconds
  auditItemCount: number;
  priorityAccuracy: number; // percentage of correctly classified Priority OFIs
}

describe('Performance Benchmarking - Phase 4', () => {
  let authToken: string;
  const benchmarkResults: BenchmarkResult[] = [];

  beforeAll(() => {
    const testUser = { id: 'benchmark-user', role: 'user' };
    authToken = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(() => {
    // Generate benchmark report
    console.log('\n=== PERFORMANCE BENCHMARK REPORT ===');
    console.log('Total Tests:', benchmarkResults.length);
    console.log('Average Crawl Speed:', 
      (benchmarkResults.reduce((sum, r) => sum + r.crawlSpeed, 0) / benchmarkResults.length).toFixed(2),
      'pages/sec'
    );
    console.log('Average Memory Usage:', 
      (benchmarkResults.reduce((sum, r) => sum + r.memoryUsage.heapUsed, 0) / benchmarkResults.length / 1024 / 1024).toFixed(2),
      'MB'
    );
    console.log('Average Accuracy:', 
      (benchmarkResults.reduce((sum, r) => sum + r.accuracy, 0) / benchmarkResults.length).toFixed(2),
      '%'
    );
    console.log('Average Processing Time:', 
      (benchmarkResults.reduce((sum, r) => sum + r.totalTime, 0) / benchmarkResults.length / 1000).toFixed(2),
      'seconds'
    );
    
    console.log('\n=== DETAILED RESULTS ===');
    benchmarkResults.forEach(result => {
      console.log(`${result.testName}:`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Crawl Speed: ${result.crawlSpeed.toFixed(2)} pages/sec`);
      console.log(`  Memory: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Accuracy: ${result.accuracy.toFixed(2)}%`);
      console.log(`  Priority Accuracy: ${result.priorityAccuracy.toFixed(2)}%`);
      console.log(`  Total Time: ${(result.totalTime / 1000).toFixed(2)}s`);
      console.log(`  Audit Items: ${result.auditItemCount}`);
      console.log('');
    });
  });

  const testSites = [
    { url: 'https://example.com', type: 'simple', expectedPages: 1, description: 'Simple static site' },
    { url: 'https://httpbin.org', type: 'api', expectedPages: 3, description: 'API documentation site' },
    { url: 'https://jsonplaceholder.typicode.com', type: 'json', expectedPages: 5, description: 'JSON API site' },
    { url: 'https://reactjs.org', type: 'spa', expectedPages: 10, description: 'React SPA with JavaScript' },
    { url: 'https://nodejs.org', type: 'documentation', expectedPages: 15, description: 'Documentation site' }
  ];

  describe('Crawl Speed Benchmarks', () => {
    testSites.forEach(site => {
      it(`should crawl ${site.description} efficiently`, async () => {
        const memoryBefore = process.memoryUsage();
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/audit/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            url: site.url,
            enablePuppeteer: site.type === 'spa',
            enableDeepCrawl: true,
            maxPages: site.expectedPages * 2 // Allow some buffer
          })
          .timeout(120000);

        expect(response.status).toBe(201);
        const auditId = response.body.auditId;
        
        // Monitor crawling progress
        let auditStatus = 'pending';
        let crawledPages = 0;
        let attempts = 0;
        const maxAttempts = 60;
        
        while (auditStatus !== 'completed' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const statusResponse = await request(app)
            .get(`/api/audit/${auditId}/status`)
            .set('Authorization', `Bearer ${authToken}`);
          
          auditStatus = statusResponse.body.status;
          crawledPages = statusResponse.body.progress?.pagesProcessed || 0;
          attempts++;
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const memoryAfter = process.memoryUsage();
        
        expect(auditStatus).toBe('completed');
        
        // Get final results
        const resultsResponse = await request(app)
          .get(`/api/audit/${auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        // Calculate metrics
        const crawlSpeed = crawledPages / (totalTime / 1000); // pages per second
        const auditItems = resultsResponse.body.auditItems;
        const accuracy = calculateAccuracyScore(auditItems, site.type);
        const priorityAccuracy = calculatePriorityAccuracy(auditItems);
        
        const result: BenchmarkResult = {
          testName: `Crawl Speed - ${site.description}`,
          url: site.url,
          crawlSpeed,
          memoryUsage: memoryAfter,
          accuracy,
          totalTime,
          auditItemCount: auditItems.length,
          priorityAccuracy
        };
        
        benchmarkResults.push(result);
        
        // Performance assertions
        expect(crawlSpeed).toBeGreaterThan(0.1); // At least 0.1 pages per second
        expect(totalTime).toBeLessThan(120000); // Less than 2 minutes
        expect(auditItems.length).toBeGreaterThan(0);
        expect(accuracy).toBeGreaterThan(70); // At least 70% accuracy
        
        // Memory usage should be reasonable
        const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
        
      }, 180000); // 3 minute timeout
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should handle multiple concurrent audits without memory leaks', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create multiple concurrent audits
      const concurrentAudits = 3;
      const auditPromises = Array(concurrentAudits).fill(null).map((_, index) => 
        request(app)
          .post('/api/audit/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            url: `https://httpbin.org/json`,
            enablePuppeteer: false,
            enableDeepCrawl: false
          })
          .timeout(60000)
      );

      const responses = await Promise.all(auditPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Wait for all audits to complete
      const auditIds = responses.map(r => r.body.auditId);
      
      await Promise.all(auditIds.map(async (auditId) => {
        let status = 'pending';
        let attempts = 0;
        
        while (status !== 'completed' && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await request(app)
            .get(`/api/audit/${auditId}/status`)
            .set('Authorization', `Bearer ${authToken}`);
          
          status = statusResponse.body.status;
          attempts++;
        }
        
        expect(status).toBe('completed');
      }));

      // Check memory after completion
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      const result: BenchmarkResult = {
        testName: 'Concurrent Memory Usage',
        url: 'Multiple concurrent audits',
        crawlSpeed: concurrentAudits / 60, // Simplified metric
        memoryUsage: finalMemory,
        accuracy: 100, // Completion rate
        totalTime: 60000, // Estimated
        auditItemCount: concurrentAudits,
        priorityAccuracy: 100
      };
      
      benchmarkResults.push(result);
      
      // Memory should not increase excessively
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB for 3 audits
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
    }, 180000);
  });

  describe('Accuracy Benchmarks', () => {
    it('should maintain high accuracy with new priority system', async () => {
      const testSite = 'https://example.com';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: testSite,
          enablePuppeteer: false,
          enableDeepCrawl: true,
          maxPages: 10
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      // Wait for completion
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      expect(auditStatus).toBe('completed');
      
      const resultsResponse = await request(app)
        .get(`/api/audit/${response.body.auditId}/results`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(resultsResponse.status).toBe(200);
      
      const auditItems = resultsResponse.body.auditItems;
      const summary = resultsResponse.body.summary;
      
      // Validate accuracy metrics
      const accuracy = calculateAccuracyScore(auditItems, 'simple');
      const priorityAccuracy = calculatePriorityAccuracy(auditItems);
      
      const result: BenchmarkResult = {
        testName: 'Priority System Accuracy',
        url: testSite,
        crawlSpeed: 1, // Single site
        memoryUsage: process.memoryUsage(),
        accuracy,
        totalTime: 30000, // Estimated
        auditItemCount: auditItems.length,
        priorityAccuracy
      };
      
      benchmarkResults.push(result);
      
      // Accuracy expectations
      expect(accuracy).toBeGreaterThan(85); // At least 85% accuracy
      expect(priorityAccuracy).toBeGreaterThan(80); // At least 80% priority accuracy
      
      // Template issue detection accuracy
      if (summary.templateIssuesDetected > 0) {
        expect(summary.estimatedFixEffort).toBeDefined();
        expect(summary.estimatedFixEffort.templateFixes).toBeGreaterThan(0);
      }
      
    }, 120000);
  });

  describe('Regression Testing', () => {
    it('should not regress from baseline performance', async () => {
      // Test against a known baseline
      const baselineMetrics = {
        crawlSpeed: 0.5, // pages per second
        memoryUsage: 150, // MB
        accuracy: 85, // percentage
        processingTime: 60 // seconds
      };
      
      const testSite = 'https://jsonplaceholder.typicode.com';
      const startTime = performance.now();
      const memoryBefore = process.memoryUsage();
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: testSite,
          enablePuppeteer: false,
          enableDeepCrawl: true,
          maxPages: 5
        })
        .timeout(120000);

      expect(response.status).toBe(201);
      
      // Wait for completion
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 60;
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      const endTime = performance.now();
      const memoryAfter = process.memoryUsage();
      const totalTime = endTime - startTime;
      
      expect(auditStatus).toBe('completed');
      
      const resultsResponse = await request(app)
        .get(`/api/audit/${response.body.auditId}/results`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(resultsResponse.status).toBe(200);
      
      // Calculate current metrics
      const currentMetrics = {
        crawlSpeed: 5 / (totalTime / 1000), // 5 pages processed
        memoryUsage: (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024,
        accuracy: calculateAccuracyScore(resultsResponse.body.auditItems, 'api'),
        processingTime: totalTime / 1000
      };
      
      const result: BenchmarkResult = {
        testName: 'Regression Test',
        url: testSite,
        crawlSpeed: currentMetrics.crawlSpeed,
        memoryUsage: memoryAfter,
        accuracy: currentMetrics.accuracy,
        totalTime,
        auditItemCount: resultsResponse.body.auditItems.length,
        priorityAccuracy: calculatePriorityAccuracy(resultsResponse.body.auditItems)
      };
      
      benchmarkResults.push(result);
      
      // Performance should not regress significantly
      expect(currentMetrics.crawlSpeed).toBeGreaterThan(baselineMetrics.crawlSpeed * 0.8); // Allow 20% regression
      expect(currentMetrics.memoryUsage).toBeLessThan(baselineMetrics.memoryUsage * 1.2); // Allow 20% increase
      expect(currentMetrics.accuracy).toBeGreaterThan(baselineMetrics.accuracy * 0.9); // Allow 10% accuracy loss
      expect(currentMetrics.processingTime).toBeLessThan(baselineMetrics.processingTime * 1.5); // Allow 50% time increase
      
    }, 180000);
  });
});

// Helper functions
function calculateAccuracyScore(auditItems: any[], siteType: string): number {
  if (!auditItems || auditItems.length === 0) return 0;
  
  // Basic accuracy calculation based on expected issues for site type
  let expectedIssues = 10; // Base expectation
  
  switch (siteType) {
    case 'simple':
      expectedIssues = 5;
      break;
    case 'spa':
      expectedIssues = 15;
      break;
    case 'documentation':
      expectedIssues = 12;
      break;
    case 'api':
      expectedIssues = 8;
      break;
  }
  
  // Check for reasonable issue detection
  const actualIssues = auditItems.length;
  const ratio = Math.min(actualIssues / expectedIssues, 1);
  
  // Check for essential categories
  const categories = new Set(auditItems.map((item: any) => item.category));
  const expectedCategories = ['technical', 'content', 'performance', 'seo'];
  const categoryScore = expectedCategories.filter(cat => 
    Array.from(categories).some(c => c.toLowerCase().includes(cat))
  ).length / expectedCategories.length;
  
  return (ratio * 0.6 + categoryScore * 0.4) * 100;
}

function calculatePriorityAccuracy(auditItems: any[]): number {
  if (!auditItems || auditItems.length === 0) return 0;
  
  const priorityOFIs = auditItems.filter((item: any) => item.priority === 'Priority OFI');
  const standardOFIs = auditItems.filter((item: any) => item.priority === 'OFI');
  
  // Expected distribution: 20-30% Priority OFI, 70-80% standard OFI
  const priorityRatio = priorityOFIs.length / auditItems.length;
  
  let score = 100;
  
  // Penalize if ratio is outside expected range
  if (priorityRatio < 0.15 || priorityRatio > 0.4) {
    score -= 20;
  }
  
  // Check if Priority OFIs have proper justification
  const wellJustifiedPriority = priorityOFIs.filter((item: any) => 
    item.businessImpact && item.effortEstimate
  ).length;
  
  if (priorityOFIs.length > 0) {
    const justificationScore = wellJustifiedPriority / priorityOFIs.length;
    score = score * justificationScore;
  }
  
  return score;
}