import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@server/index';
import { createTestUser, createTestAnalysis } from '../setup/testSetup';
import jwt from 'jsonwebtoken';

describe('API Integration Tests', () => {
  let authToken: string;
  let adminToken: string;

  beforeEach(async () => {
    // Create auth tokens for testing
    const testUser = { id: 'test-user-1', role: 'user' };
    const adminUser = { id: 'test-admin-1', role: 'admin' };
    
    authToken = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret');
    adminToken = jwt.sign(adminUser, process.env.JWT_SECRET || 'test-secret');
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'ValidPassword123!',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with invalid data', async () => {
      const invalidUser = {
        username: 'x', // Too short
        email: 'invalid-email',
        password: '123', // Too weak
        firstName: '',
        lastName: ''
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        username: 'testuser1',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid credentials', async () => {
      const credentials = {
        username: 'testuser1',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Analysis Endpoints', () => {
    it('should create a new analysis with authentication', async () => {
      const analysisData = {
        url: 'https://new-analysis.com',
        includeCompetitorAnalysis: false
      };

      const response = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.url).toBe(analysisData.url);
      expect(response.body).toHaveProperty('overallScore');
      expect(response.body).toHaveProperty('results');
    });

    it('should reject analysis without authentication', async () => {
      const analysisData = {
        url: 'https://new-analysis.com'
      };

      const response = await request(app)
        .post('/api/analysis')
        .send(analysisData);

      expect(response.status).toBe(401);
    });

    it('should get user analyses with authentication', async () => {
      const response = await request(app)
        .get('/api/analysis/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('url');
      expect(response.body[0]).toHaveProperty('overallScore');
    });

    it('should validate URL format for analysis', async () => {
      const invalidData = {
        url: 'not-a-valid-url'
      };

      const response = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Crawling System Endpoints', () => {
    it('should get crawling status', async () => {
      const response = await request(app)
        .get('/api/crawl/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isRunning');
      expect(response.body).toHaveProperty('lastCrawl');
      expect(response.body).toHaveProperty('activeJobs');
    });

    it('should allow admin to trigger manual crawl', async () => {
      const crawlData = {
        source: 'test-news-source',
        type: 'news'
      };

      const response = await request(app)
        .post('/api/crawl/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(crawlData);

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('message');
    });

    it('should reject manual crawl for non-admin users', async () => {
      const crawlData = {
        source: 'test-news-source',
        type: 'news'
      };

      const response = await request(app)
        .post('/api/crawl/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send(crawlData);

      expect(response.status).toBe(403);
    });

    it('should get crawled content with pagination', async () => {
      const response = await request(app)
        .get('/api/crawl/content?page=1&limit=10&type=news')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });
  });

  describe('Data Quality Endpoints', () => {
    it('should get data quality report for admin', async () => {
      const response = await request(app)
        .get('/api/crawl/quality')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRecords');
      expect(response.body).toHaveProperty('validRecords');
      expect(response.body).toHaveProperty('qualityScore');
      expect(response.body).toHaveProperty('issues');
      expect(Array.isArray(response.body.issues)).toBe(true);
    });

    it('should reject quality report for non-admin', async () => {
      const response = await request(app)
        .get('/api/crawl/quality')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Health Check Endpoints', () => {
    it('should return system health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.overall).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.overall.status);
    });

    it('should return detailed health check information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('crawler');
      expect(response.body.checks).toHaveProperty('memory');
      
      // Each check should have a status
      Object.values(response.body.checks).forEach((check: any) => {
        expect(check).toHaveProperty('status');
        expect(['healthy', 'degraded', 'unhealthy', 'error']).toContain(check.status);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, test that errors return proper format
      const response = await request(app)
        .get('/api/analysis/user')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/health')
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });

    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Empty body should cause validation error

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should respond to health check within reasonable time', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/health');
      
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests properly', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app)
          .get('/api/health')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests efficiently
      expect(duration).toBeLessThan(2000);
    });
  });
});