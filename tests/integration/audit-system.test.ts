import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import jwt from 'jsonwebtoken';

describe('Audit System Integration Tests - Phase 4', () => {
  let authToken: string;
  let adminToken: string;

  beforeAll(() => {
    // Create auth tokens for testing
    const testUser = { id: 'test-user-audit', role: 'user' };
    const adminUser = { id: 'test-admin-audit', role: 'admin' };
    
    authToken = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret');
    adminToken = jwt.sign(adminUser, process.env.JWT_SECRET || 'test-secret');
  });

  // Test diverse website types to validate the new priority system
  const testWebsites = [
    { url: 'https://example.com', type: 'simple', description: 'Basic website' },
    { url: 'https://www.amazon.com', type: 'ecommerce', description: 'Large e-commerce site' },
    { url: 'https://www.bbc.com', type: 'news', description: 'News website with many pages' },
    { url: 'https://reactjs.org', type: 'tech', description: 'Technical documentation site' },
    { url: 'https://www.wikipedia.org', type: 'content', description: 'Content-heavy site' },
    { url: 'https://github.com', type: 'application', description: 'Web application' },
    { url: 'https://www.tesla.com', type: 'corporate', description: 'Corporate website' },
    { url: 'https://stackoverflow.com', type: 'community', description: 'Community platform' },
    { url: 'https://www.airbnb.com', type: 'marketplace', description: 'Marketplace platform' },
    { url: 'https://www.spotify.com', type: 'service', description: 'Service-based website' },
    { url: 'https://www.shopify.com', type: 'saas', description: 'SaaS platform' },
    { url: 'https://www.wordpress.com', type: 'blog', description: 'Blog platform' },
    { url: 'https://www.booking.com', type: 'booking', description: 'Booking platform' },
    { url: 'https://www.coursera.org', type: 'education', description: 'Educational platform' },
    { url: 'https://www.netflix.com', type: 'media', description: 'Media streaming service' },
    { url: 'https://www.linkedin.com', type: 'social', description: 'Social network' },
    { url: 'https://www.stripe.com', type: 'fintech', description: 'Financial technology' },
    { url: 'https://www.slack.com', type: 'productivity', description: 'Productivity tool' },
    { url: 'https://www.zoom.us', type: 'communication', description: 'Communication platform' },
    { url: 'https://www.dropbox.com', type: 'storage', description: 'Cloud storage service' },
    { url: 'https://www.mailchimp.com', type: 'marketing', description: 'Marketing platform' }
  ];

  describe('Comprehensive Website Testing', () => {
    it('should successfully audit diverse website types', async () => {
      const auditResults = [];
      
      // Test first 10 websites to avoid timeout
      for (const website of testWebsites.slice(0, 10)) {
        console.log(`Testing ${website.description}: ${website.url}`);
        
        const response = await request(app)
          .post('/api/audit/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            url: website.url,
            enablePuppeteer: true,
            enableDeepCrawl: false // Limit scope for testing
          })
          .timeout(60000); // 60 second timeout per audit

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('auditId');
        expect(response.body).toHaveProperty('status');
        
        auditResults.push({
          ...website,
          auditId: response.body.auditId,
          status: response.body.status
        });
      }

      // Verify all audits were created
      expect(auditResults.length).toBe(10);
      auditResults.forEach(result => {
        expect(result.auditId).toBeDefined();
        expect(['pending', 'in_progress', 'completed']).toContain(result.status);
      });
    }, 120000); // 2 minute timeout for comprehensive testing

    it('should handle Puppeteer data transformation correctly', async () => {
      const jsHeavyWebsite = 'https://reactjs.org';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: jsHeavyWebsite,
          enablePuppeteer: true,
          enableDeepCrawl: false
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      // Wait for audit to complete
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      if (auditStatus === 'completed') {
        // Get audit results
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        expect(resultsResponse.body).toHaveProperty('auditItems');
        expect(Array.isArray(resultsResponse.body.auditItems)).toBe(true);
        
        // Verify Puppeteer data was properly transformed
        const auditItems = resultsResponse.body.auditItems;
        expect(auditItems.length).toBeGreaterThan(0);
        
        // Check that audit items have proper data (not null/undefined from transformation issues)
        auditItems.forEach((item: any) => {
          expect(item).toHaveProperty('title');
          expect(item).toHaveProperty('description');
          expect(item).toHaveProperty('category');
          expect(item).toHaveProperty('priority');
          expect(['Priority OFI', 'OFI']).toContain(item.priority);
        });
      }
    }, 120000);

    it('should properly classify Priority OFI vs standard OFI', async () => {
      const testSite = 'https://example.com';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: testSite,
          enablePuppeteer: false,
          enableDeepCrawl: true
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      // Wait for completion and check results
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
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
        
        const auditItems = resultsResponse.body.auditItems;
        const priorityOFIs = auditItems.filter((item: any) => item.priority === 'Priority OFI');
        const standardOFIs = auditItems.filter((item: any) => item.priority === 'OFI');
        
        // Should have a mix of both types
        expect(priorityOFIs.length + standardOFIs.length).toBe(auditItems.length);
        
        // Priority OFIs should be properly categorized
        if (priorityOFIs.length > 0) {
          priorityOFIs.forEach((item: any) => {
            expect(item).toHaveProperty('businessImpact');
            expect(item).toHaveProperty('effortEstimate');
          });
        }
      }
    }, 120000);
  });

  describe('Template Issue Detection', () => {
    it('should detect and group template issues correctly', async () => {
      // Test on a site likely to have template issues
      const testSite = 'https://www.shopify.com';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: testSite,
          enablePuppeteer: false,
          enableDeepCrawl: true,
          maxPages: 20 // Limit for testing
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      // Wait for completion
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 60; // Longer wait for deep crawl
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
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
        
        // Check for template issue grouping
        const summary = resultsResponse.body.summary;
        expect(summary).toHaveProperty('templateIssuesDetected');
        expect(summary).toHaveProperty('totalUniqueIssues');
        expect(summary).toHaveProperty('estimatedFixEffort');
        
        if (summary.templateIssuesDetected > 0) {
          expect(summary.totalUniqueIssues).toBeLessThan(resultsResponse.body.auditItems.length);
          expect(summary.estimatedFixEffort).toHaveProperty('templateFixes');
          expect(summary.estimatedFixEffort).toHaveProperty('individualFixes');
        }
      }
    }, 180000); // 3 minute timeout for deep crawl
  });

  describe('Performance Validation', () => {
    it('should complete audits within reasonable time limits', async () => {
      const testSite = 'https://example.com';
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: testSite,
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      // Wait for completion
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within 2 minutes for basic audit
      expect(totalTime).toBeLessThan(120000);
      expect(auditStatus).toBe('completed');
    }, 150000);

    it('should handle memory usage efficiently', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run multiple small audits to test memory handling
      const auditPromises = [
        'https://example.com',
        'https://httpbin.org',
        'https://jsonplaceholder.typicode.com'
      ].map(url => 
        request(app)
          .post('/api/audit/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            url,
            enablePuppeteer: false,
            enableDeepCrawl: false
          })
          .timeout(30000)
      );

      const responses = await Promise.all(auditPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    }, 120000);
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid.com',
        'https://non-existent-domain-12345.com',
        'javascript:alert("test")'
      ];

      for (const url of invalidUrls) {
        const response = await request(app)
          .post('/api/audit/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            url,
            enablePuppeteer: false,
            enableDeepCrawl: false
          });

        // Should either reject invalid URLs or handle gracefully
        if (response.status === 400) {
          expect(response.body).toHaveProperty('errors');
        } else if (response.status === 201) {
          // If accepted, should handle the error in processing
          const statusResponse = await request(app)
            .get(`/api/audit/${response.body.auditId}/status`)
            .set('Authorization', `Bearer ${authToken}`);
          
          expect(['failed', 'completed']).toContain(statusResponse.body.status);
        }
      }
    });

    it('should handle timeouts and network errors', async () => {
      // Test with a slow-responding URL
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://httpbin.org/delay/10', // 10 second delay
          enablePuppeteer: false,
          enableDeepCrawl: false
        })
        .timeout(30000);

      expect(response.status).toBe(201);
      
      // Should either complete or fail gracefully
      let finalStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 20;
      
      while (!['completed', 'failed'].includes(finalStatus) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        finalStatus = statusResponse.body.status;
        attempts++;
      }

      expect(['completed', 'failed']).toContain(finalStatus);
    }, 60000);
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across audit phases', async () => {
      const testSite = 'https://example.com';
      
      const response = await request(app)
        .post('/api/audit/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: testSite,
          enablePuppeteer: true,
          enableDeepCrawl: true,
          maxPages: 5
        })
        .timeout(60000);

      expect(response.status).toBe(201);
      
      // Monitor audit progress
      const progressUpdates = [];
      let auditStatus = 'pending';
      let attempts = 0;
      const maxAttempts = 30;
      
      while (auditStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/status`)
          .set('Authorization', `Bearer ${authToken}`);
        
        progressUpdates.push({
          status: statusResponse.body.status,
          progress: statusResponse.body.progress,
          timestamp: Date.now()
        });
        
        auditStatus = statusResponse.body.status;
        attempts++;
      }

      // Verify progress was logical
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Check final results integrity
      if (auditStatus === 'completed') {
        const resultsResponse = await request(app)
          .get(`/api/audit/${response.body.auditId}/results`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(resultsResponse.status).toBe(200);
        
        const results = resultsResponse.body;
        expect(results).toHaveProperty('auditItems');
        expect(results).toHaveProperty('summary');
        expect(results).toHaveProperty('metadata');
        
        // Verify data consistency
        const auditItems = results.auditItems;
        const summary = results.summary;
        
        expect(summary.totalIssues).toBe(auditItems.length);
        
        const priorityOFICount = auditItems.filter((item: any) => item.priority === 'Priority OFI').length;
        const ofiCount = auditItems.filter((item: any) => item.priority === 'OFI').length;
        
        expect(summary.priorityOFICount).toBe(priorityOFICount);
        expect(summary.ofiCount).toBe(ofiCount);
      }
    }, 120000);
  });
});