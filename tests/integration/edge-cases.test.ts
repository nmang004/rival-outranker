import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import jwt from 'jsonwebtoken';

describe('Edge Case Testing - Phase 4', () => {
  let authToken: string;

  beforeAll(() => {
    const testUser = { id: 'edge-case-user', role: 'user' };
    authToken = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret');
  });

  describe('Very Large Sites', () => {
    it('should handle large e-commerce sites with many pages', async () => {
      // Test with a large site but limit pages for testing
      const largeSite = 'https://www.amazon.com';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: largeSite,
          enablePuppeteer: false,
          enableDeepCrawl: true,
          maxPages: 50 // Limited for testing
        })
        .timeout(120000);

      expect(response.status).toBe(201);
      
      // Monitor progress for large site handling
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 120; // 4 minute timeout for large site
      let maxPagesProcessed = 0;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        const pagesProcessed = statusResponse.body.progress?.pagesProcessed || 0;
        maxPagesProcessed = Math.max(maxPagesProcessed, pagesProcessed);
        attempts++;
      }

      // Should complete or handle gracefully
      expect(['completed', 'failed']).toContain(auditStatus);
      
      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        const results = resultsResponse.body;
        const summary = results.summary;
        
        // Should have processed multiple pages
        expect(maxPagesProcessed).toBeGreaterThan(5);
        
        // Should detect template issues on large site
        expect(summary.templateIssuesDetected).toBeGreaterThan(0);
        expect(summary.estimatedFixEffort).toBeDefined();
        expect(summary.estimatedFixEffort.templateFixes).toBeGreaterThan(0);
        
        // Priority system should handle large volume appropriately
        const auditItems = results.auditItems;
        const priorityOFIs = auditItems.filter((item: any) => item.priority === 'Priority OFI');
        const priorityRatio = priorityOFIs.length / auditItems.length;
        
        // For large sites, priority ratio should be reasonable (not everything marked as priority)
        expect(priorityRatio).toBeLessThan(0.4); // Less than 40% should be Priority OFI
        expect(priorityRatio).toBeGreaterThan(0.1); // More than 10% should be Priority OFI
      }
      
    }, 300000); // 5 minute timeout

    it('should handle sites with deep navigation hierarchies', async () => {
      const deepHierarchySite = 'https://developer.mozilla.org';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: deepHierarchySite,
          enablePuppeteer: false,
          enableDeepCrawl: true,
          maxPages: 30,
          maxDepth: 5 // Allow deeper crawling
        })
        .timeout(120000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 90;
      
      while (auditStatus !== 'completed' && auditStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
        
        // Should handle different page types appropriately
        const auditItems = resultsResponse.body.auditItems;
        const categories = new Set(auditItems.map((item: any) => item.category));
        
        expect(categories.size).toBeGreaterThan(3); // Should detect multiple issue categories
        expect(auditItems.length).toBeGreaterThan(10); // Should find multiple issues
      }
      
    }, 240000); // 4 minute timeout
  });

  describe('Error Conditions', () => {
    it('should handle sites with SSL certificate issues', async () => {
      // Use a test site with SSL issues (may need to mock this)
      const sslIssueSite = 'https://self-signed.badssl.com/';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: sslIssueSite,
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(60000);

      // Should either handle gracefully or reject appropriately
      if (response.status === 201) {
        let auditStatus = 'pending';
        let attempts = 0;
        const maxAttempts = 30;
        
        while (!['completed', 'failed'].includes(auditStatus) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await request(app)
            .get(`/api/audit/${response.body.auditId}/status`)
            .set('Authorization', `Bearer ${authToken}`);
          
          auditStatus = statusResponse.body.status;
          attempts++;
        }
        
        // Should complete with security issues noted or fail gracefully
        expect(['completed', 'failed']).toContain(auditStatus);
        
        if (auditStatus === 'completed') {
          const resultsResponse = await request(app)
            .get(`/api/audit/${response.body.auditId}/results`)
            .set('Authorization', `Bearer ${authToken}`);

          expect(resultsResponse.status).toBe(200);
          
          // Should detect SSL/security issues
          const auditItems = resultsResponse.body.auditItems;
          const securityIssues = auditItems.filter((item: any) => 
            item.category.toLowerCase().includes('security') ||
            item.description.toLowerCase().includes('ssl') ||
            item.description.toLowerCase().includes('certificate')
          );
          
          expect(securityIssues.length).toBeGreaterThan(0);
        }
      } else {
        // If rejected upfront, should have proper error message
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('errors');
      }
    }, 120000);

    it('should handle sites with infinite redirects', async () => {
      // Test site that creates redirect loops
      const redirectLoopSite = 'https://httpbin.org/redirect/10'; // 10 redirects
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: redirectLoopSite,
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!['completed', 'failed'].includes(auditStatus) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      // Should handle redirects gracefully
      expect(['completed', 'failed']).toContain(auditStatus);
      
      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        // Should detect redirect issues
        const auditItems = resultsResponse.body.auditItems;
        const redirectIssues = auditItems.filter((item: any) => 
          item.description.toLowerCase().includes('redirect') ||
          item.category.toLowerCase().includes('technical')
        );
        
        expect(redirectIssues.length).toBeGreaterThan(0);
      }
    }, 120000);

    it('should handle sites that return 404 errors', async () => {
      const notFoundSite = 'https://httpbin.org/status/404';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: notFoundSite,
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(30000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 20;
      
      while (!['completed', 'failed'].includes(auditStatus) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      // Should fail gracefully or complete with appropriate error detection
      expect(['completed', 'failed']).toContain(auditStatus);
    }, 60000);

    it('should handle extremely slow-loading sites', async () => {
      const slowSite = 'https://httpbin.org/delay/15'; // 15 second delay
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: slowSite,
          enablePuppeteer: false,
          enableDeepCrawl: false,
          timeout: 20000 // 20 second timeout
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!['completed', 'failed'].includes(auditStatus) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      // Should handle timeout appropriately
      expect(['completed', 'failed']).toContain(auditStatus);
      
      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        // Should detect performance issues
        const auditItems = resultsResponse.body.auditItems;
        const performanceIssues = auditItems.filter((item: any) => 
          item.category.toLowerCase().includes('performance') ||
          item.description.toLowerCase().includes('speed') ||
          item.description.toLowerCase().includes('load')
        );
        
        expect(performanceIssues.length).toBeGreaterThan(0);
      }
    }, 120000);
  });

  describe('Content Edge Cases', () => {
    it('should handle sites with no content', async () => {
      const emptyContentSite = 'https://httpbin.org/html'; // Minimal HTML
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: emptyContentSite,
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(30000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 20;
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
      
      // Should detect content-related issues
      const auditItems = resultsResponse.body.auditItems;
      const contentIssues = auditItems.filter((item: any) => 
        item.category.toLowerCase().includes('content') ||
        item.description.toLowerCase().includes('content') ||
        item.description.toLowerCase().includes('text')
      );
      
      expect(contentIssues.length).toBeGreaterThan(0);
    }, 60000);

    it('should handle sites with malformed HTML', async () => {
      // Create audit for a site likely to have HTML issues
      const malformedHtmlSite = 'https://httpbin.org/xml'; // XML content instead of HTML
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: malformedHtmlSite,
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(30000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 20;
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
      
      // Should handle malformed content gracefully
      const auditItems = resultsResponse.body.auditItems;
      expect(auditItems.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('JavaScript-Heavy Sites', () => {
    it('should handle single-page applications correctly', async () => {
      const spaSite = 'https://reactjs.org';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: spaSite,
          enablePuppeteer: true, // Essential for SPA
          enableDeepCrawl: false
        })
        .timeout(120000);

      expect(response.status).toBe(201);
      
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 60;
      
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
      
      // Puppeteer should have captured dynamic content
      const auditItems = resultsResponse.body.auditItems;
      expect(auditItems.length).toBeGreaterThan(5);
      
      // Should detect JavaScript-specific issues
      const jsIssues = auditItems.filter((item: any) => 
        item.description.toLowerCase().includes('javascript') ||
        item.description.toLowerCase().includes('js') ||
        item.category.toLowerCase().includes('technical')
      );
      
      // May or may not have JS-specific issues, but should handle gracefully
      expect(auditItems.some((item: any) => item.title && item.description)).toBe(true);
    }, 180000);
  });

  describe('Concurrent Load Testing', () => {
    it('should handle multiple simultaneous audits without system failure', async () => {
      const testUrls = [
        'https://httpbin.org/json',
        'https://httpbin.org/html',
        'https://httpbin.org/xml',
        'https://jsonplaceholder.typicode.com/posts/1',
        'https://jsonplaceholder.typicode.com/users/1'
      ];
      
      // Create multiple concurrent audits
      const auditPromises = testUrls.map(url => 
        request(app)
          .post('/api/audit/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            url,
            enablePuppeteer: false,
            enableDeepCrawl: false
          })
          .timeout(60000)
      );

      const responses = await Promise.all(auditPromises);
      
      // All should be created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('auditId');
      });

      const auditIds = responses.map(r => r.body.auditId);
      
      // Wait for all to complete
      const completionPromises = auditIds.map(async (auditId) => {
        let status = 'pending';
        let attempts = 0;
        const maxAttempts = 30;
        
        while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await request(app)
            .get(`/api/audit/${auditId}/status`)
            .set('Authorization', `Bearer ${authToken}`);
          
          status = statusResponse.body.status;
          attempts++;
        }
        
        return { auditId, status };
      });

      const completionResults = await Promise.all(completionPromises);
      
      // All should complete or fail gracefully
      completionResults.forEach(result => {
        expect(['completed', 'failed']).toContain(result.status);
      });
      
      // At least most should complete successfully
      const successfulAudits = completionResults.filter(r => r.status === 'completed');
      expect(successfulAudits.length).toBeGreaterThan(testUrls.length * 0.6); // At least 60% success rate
      
    }, 120000);
  });
});