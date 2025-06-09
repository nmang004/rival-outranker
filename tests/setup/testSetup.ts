import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { db } from '@server/db';
import { users, analyses, crawledContent, crawlJobs } from '@shared/schema';
import { sql } from 'drizzle-orm';

// Test environment setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
  
  // Ensure test database is clean
  await cleanupTestData();
  console.log('Test environment initialized');
});

beforeEach(async () => {
  // Seed fresh test data for each test
  await seedTestData();
});

afterEach(async () => {
  // Clean up test data after each test
  await cleanupTestData();
});

afterAll(async () => {
  // Final cleanup
  await cleanupTestData();
  console.log('Test environment cleaned up');
});

// Test data management functions
export async function seedTestData() {
  try {
    // Create test users
    await db.insert(users).values([
      {
        id: 'test-user-1',
        username: 'testuser1',
        email: 'test1@example.com',
        password: '$2b$12$hashedpassword1', // Pre-hashed for consistency
        firstName: 'Test',
        lastName: 'User One',
        role: 'user'
      },
      {
        id: 'test-admin-1',
        username: 'testadmin',
        email: 'admin@example.com',
        password: '$2b$12$hashedpasswordadmin',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin'
      }
    ]).onConflictDoNothing();

    // Create test analyses
    await db.insert(analyses).values([
      {
        url: 'https://example.com',
        userId: 'test-user-1',
        overallScore: 85,
        results: {
          keywordAnalysis: { score: 80 },
          metaTagsAnalysis: { score: 90 },
          contentAnalysis: { score: 85 }
        }
      },
      {
        url: 'https://test-site.com',
        userId: 'test-user-1',
        overallScore: 75,
        results: {
          keywordAnalysis: { score: 70 },
          metaTagsAnalysis: { score: 80 },
          contentAnalysis: { score: 75 }
        }
      }
    ]).onConflictDoNothing();

    // Create test crawled content
    await db.insert(crawledContent).values([
      {
        id: 'test-content-1',
        type: 'news',
        source: 'test-news-source',
        url: 'https://example-news.com/article1',
        title: 'Test News Article 1',
        content: 'This is test news content for testing purposes.',
        metadata: {
          author: 'Test Author',
          publishedAt: '2025-01-01T00:00:00Z',
          category: 'technology'
        },
        qualityScore: 85,
        wordCount: 500,
        readingTime: 3
      },
      {
        id: 'test-content-2',
        type: 'seo',
        source: 'test-seo-source',
        url: 'https://example-seo.com',
        title: 'Test SEO Page',
        content: 'This is test SEO content for testing purposes.',
        metadata: {
          h1Tags: ['Main Heading'],
          h2Tags: ['Secondary Heading'],
          metaDescription: 'Test meta description'
        },
        qualityScore: 90,
        wordCount: 800,
        readingTime: 4
      }
    ]).onConflictDoNothing();

    // Create test crawl jobs
    await db.insert(crawlJobs).values([
      {
        id: 'test-job-1',
        name: 'Test News Crawl',
        type: 'news',
        schedule: '0 */2 * * *',
        isActive: true,
        config: {
          sources: ['test-news-source'],
          maxPages: 10
        },
        successCount: 5,
        errorCount: 1
      }
    ]).onConflictDoNothing();

  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

export async function cleanupTestData() {
  try {
    // Clean up in reverse dependency order
    await db.delete(analyses);
    await db.delete(crawledContent);
    await db.delete(crawlJobs);
    await db.delete(users);
    
    // Reset sequences if needed
    await db.execute(sql`ALTER SEQUENCE analyses_id_seq RESTART WITH 1`);
  } catch (error) {
    console.error('Error cleaning test data:', error);
  }
}

// Mock external services for testing
export const mockServices = {
  openAI: {
    createCompletion: vi.fn().mockResolvedValue({
      choices: [{ text: 'Mocked AI response' }]
    })
  },
  
  dataForSEO: {
    searchResults: vi.fn().mockResolvedValue({
    data: [
      { url: 'https://competitor1.com', title: 'Competitor 1' },
      { url: 'https://competitor2.com', title: 'Competitor 2' }
    ]
  })
  },
  
  email: {
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }
};

// Test utilities
export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-new',
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'TestPassword123!',
    firstName: 'New',
    lastName: 'User',
    role: 'user',
    ...overrides
  };
}

export function createTestAnalysis(overrides = {}) {
  return {
    url: 'https://new-test.com',
    userId: 'test-user-1',
    overallScore: 80,
    results: {
      keywordAnalysis: { score: 75 },
      metaTagsAnalysis: { score: 85 },
      contentAnalysis: { score: 80 }
    },
    ...overrides
  };
}

// Global test environment variables
declare global {
  var testDb: typeof db;
  var mockServices: typeof mockServices;
}

globalThis.testDb = db;
globalThis.mockServices = mockServices;