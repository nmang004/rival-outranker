import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import jwt from 'jsonwebtoken';

describe('Regression Testing - Phase 4', () => {
  let authToken: string;

  beforeAll(() => {
    const testUser = { id: 'regression-user', role: 'user' };
    authToken = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret');
  });

  describe('Core Audit Functionality', () => {
    it('should maintain backward compatibility for basic audit creation', async () => {
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com',
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(30000);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('auditId');
      expect(response.body).toHaveProperty('status');
      
      // Wait for completion
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      expect(['completed', 'failed']).toContain(auditStatus);
      
      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        expect(resultsResponse.body).toHaveProperty('auditItems');
        expect(resultsResponse.body).toHaveProperty('summary');
        expect(Array.isArray(resultsResponse.body.auditItems)).toBe(true);
      }
    }, 60000);

    it('should maintain existing API endpoints functionality', async () => {
      // Test health endpoint
      const healthResponse = await request(app)
        .get('/api/health');

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toHaveProperty('overall');
      expect(healthResponse.body).toHaveProperty('checks');

      // Test analysis endpoint still works
      const analysisResponse = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com',
          includeCompetitorAnalysis: false
        })
        .timeout(30000);

      expect(analysisResponse.status).toBe(201);
      expect(analysisResponse.body).toHaveProperty('id');
      expect(analysisResponse.body).toHaveProperty('url');
    }, 60000);

    it('should preserve data format compatibility', async () => {
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://httpbin.org/json',
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(30000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 20;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        // Verify expected data structure is maintained
        const results = resultsResponse.body;
        expect(results).toHaveProperty('auditItems');
        expect(results).toHaveProperty('summary');
        expect(results).toHaveProperty('metadata');
        
        // Verify audit items have required fields
        const auditItems = results.auditItems;
        if (auditItems.length > 0) {
          auditItems.forEach((item: any) => {
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('category');
            expect(item).toHaveProperty('priority');
            expect(['Priority OFI', 'OFI']).toContain(item.priority);
          });
        }
        
        // Verify summary has expected structure
        const summary = results.summary;
        expect(summary).toHaveProperty('totalIssues');
        expect(summary).toHaveProperty('priorityOFICount');
        expect(summary).toHaveProperty('ofiCount');
        expect(summary.totalIssues).toBe(auditItems.length);
      }
    }, 60000);
  });

  describe('Priority System Regression', () => {
    it('should not classify all issues as Priority OFI', async () => {
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://jsonplaceholder.typicode.com',
          enablePuppeteer: false,
          enableDeepCrawl: true,
          maxPages: 10
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 40;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        const auditItems = resultsResponse.body.auditItems;
        const priorityOFIs = auditItems.filter((item: any) => item.priority === 'Priority OFI');
        const standardOFIs = auditItems.filter((item: any) => item.priority === 'OFI');
        
        // Should have both types of issues
        expect(auditItems.length).toBeGreaterThan(0);
        
        if (auditItems.length > 5) {
          // For sites with many issues, priority ratio should be reasonable
          const priorityRatio = priorityOFIs.length / auditItems.length;
          expect(priorityRatio).toBeLessThan(0.6); // Less than 60% should be Priority OFI
          expect(priorityRatio).toBeGreaterThan(0.05); // More than 5% should be Priority OFI
        }
        
        // All items should have valid priorities
        expect(priorityOFIs.length + standardOFIs.length).toBe(auditItems.length);
      }
    }, 90000);

    it('should handle template issue detection without breaking existing functionality', async () => {
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://httpbin.org',
          enablePuppeteer: false,
          enableDeepCrawl: true,
          maxPages: 5
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        // Should have new template detection fields but maintain compatibility
        const summary = resultsResponse.body.summary;
        expect(summary).toHaveProperty('totalIssues');
        expect(summary).toHaveProperty('templateIssuesDetected');
        expect(summary).toHaveProperty('estimatedFixEffort');
        
        // Template detection should not break basic functionality
        expect(typeof summary.templateIssuesDetected).toBe('number');
        expect(summary.templateIssuesDetected).toBeGreaterThanOrEqual(0);
      }
    }, 90000);
  });

  describe('Performance Regression', () => {
    it('should complete basic audits within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com',
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      const totalTime = Date.now() - startTime;
      
      // Should complete within 90 seconds for basic site
      expect(totalTime).toBeLessThan(90000);
      expect(['completed', 'failed']).toContain(auditStatus);
    }, 120000);

    it('should not consume excessive memory', async () => {
      const initialMemory = process.memoryUsage();
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://httpbin.org/json',
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(30000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 20;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for single audit)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 60000);
  });
});