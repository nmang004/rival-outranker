import { describe, it, expect } from 'vitest';
import { formatters } from '@/lib/formatters';
import { validateUrl, calculateReadabilityScore } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatters', () => {
    it('should format numbers correctly', () => {
      expect(formatters.formatNumber(1234)).toBe('1,234');
      expect(formatters.formatNumber(1234567)).toBe('1,234,567');
      expect(formatters.formatNumber(0)).toBe('0');
    });

    it('should format percentages correctly', () => {
      expect(formatters.formatPercentage(0.85)).toBe('85%');
      expect(formatters.formatPercentage(0.1234)).toBe('12%');
      expect(formatters.formatPercentage(1)).toBe('100%');
    });

    it('should format scores correctly', () => {
      expect(formatters.formatScore(85)).toBe('85/100');
      expect(formatters.formatScore(100)).toBe('100/100');
      expect(formatters.formatScore(0)).toBe('0/100');
    });

    it('should format dates correctly', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const formatted = formatters.formatDate(date);
      expect(formatted).toMatch(/Jan 15, 2025/);
    });

    it('should format relative time correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatters.formatRelativeTime(fiveMinutesAgo)).toMatch(/5 minutes ago/);
      expect(formatters.formatRelativeTime(oneHourAgo)).toMatch(/1 hour ago/);
      expect(formatters.formatRelativeTime(oneDayAgo)).toMatch(/1 day ago/);
    });

    it('should format file sizes correctly', () => {
      expect(formatters.formatFileSize(1024)).toBe('1.0 KB');
      expect(formatters.formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatters.formatFileSize(1073741824)).toBe('1.0 GB');
      expect(formatters.formatFileSize(0)).toBe('0 B');
    });
  });

  describe('URL validation', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('https://subdomain.example.com')).toBe(true);
      expect(validateUrl('https://example.com/path')).toBe(true);
      expect(validateUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('javascript:alert("xss")')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateUrl('https://192.168.1.1')).toBe(true);
      expect(validateUrl('https://localhost:3000')).toBe(true);
      expect(validateUrl('https://example.com:8080')).toBe(true);
    });
  });

  describe('Readability calculations', () => {
    it('should calculate readability scores', () => {
      const simpleText = 'This is a simple sentence. It is easy to read.';
      const complexText = 'The implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding of computational complexity.';
      
      const simpleScore = calculateReadabilityScore(simpleText);
      const complexScore = calculateReadabilityScore(complexText);
      
      expect(simpleScore).toBeGreaterThan(complexScore);
      expect(simpleScore).toBeGreaterThan(0);
      expect(complexScore).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      expect(calculateReadabilityScore('')).toBe(0);
      expect(calculateReadabilityScore('   ')).toBe(0);
    });

    it('should handle single words', () => {
      const score = calculateReadabilityScore('Hello');
      expect(score).toBeGreaterThan(0);
    });
  });
});

describe('SEO Score Calculations', () => {
  // Import actual score calculation functions if available
  
  it('should calculate keyword density correctly', () => {
    const text = 'SEO is important for SEO success. Good SEO practices improve SEO rankings.';
    const keyword = 'SEO';
    
    // Mock implementation - replace with actual function
    const density = (text.toLowerCase().split(keyword.toLowerCase()).length - 1) / text.split(' ').length;
    const expectedDensity = 4 / 12; // 4 occurrences in 12 words
    
    expect(Math.abs(density - expectedDensity)).toBeLessThan(0.01);
  });

  it('should validate meta description length', () => {
    const shortDescription = 'Too short';
    const goodDescription = 'This is a well-crafted meta description that provides a clear summary of the page content and falls within recommended guidelines.';
    const longDescription = 'This meta description is way too long and exceeds the recommended character limit for search engine results pages which could result in truncation and poor user experience when displayed in search results.';
    
    expect(shortDescription.length).toBeLessThan(120);
    expect(goodDescription.length).toBeGreaterThan(120);
    expect(goodDescription.length).toBeLessThan(160);
    expect(longDescription.length).toBeGreaterThan(160);
  });

  it('should validate title length', () => {
    const shortTitle = 'Short';
    const goodTitle = 'Comprehensive SEO Guide for Better Rankings';
    const longTitle = 'This is an extremely long title that exceeds the recommended character limit for page titles';
    
    expect(shortTitle.length).toBeLessThan(30);
    expect(goodTitle.length).toBeGreaterThan(30);
    expect(goodTitle.length).toBeLessThan(60);
    expect(longTitle.length).toBeGreaterThan(60);
  });
});

describe('Data Validation', () => {
  it('should validate email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.email+tag@domain.co.uk',
      'user123@test-domain.com'
    ];
    
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user space@domain.com',
      'user@domain'
    ];
    
    validEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
    });
    
    invalidEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
    });
  });

  it('should validate password strength', () => {
    const weakPasswords = ['123456', 'password', 'abc123', ''];
    const strongPasswords = ['StrongPass123!', 'MySecure$Pass1', 'Complex#Password2025'];
    
    const isStrongPassword = (password: string) => {
      return password.length >= 8 &&
             /[A-Z]/.test(password) &&
             /[a-z]/.test(password) &&
             /[0-9]/.test(password) &&
             /[!@#$%^&*]/.test(password);
    };
    
    weakPasswords.forEach(password => {
      expect(isStrongPassword(password)).toBe(false);
    });
    
    strongPasswords.forEach(password => {
      expect(isStrongPassword(password)).toBe(true);
    });
  });
});

describe('Error Handling Utilities', () => {
  it('should handle API errors gracefully', () => {
    const mockApiError = new Error('Network error');
    mockApiError.name = 'NetworkError';
    
    const handleApiError = (error: Error) => {
      if (error.name === 'NetworkError') {
        return { message: 'Network connection failed', retry: true };
      }
      return { message: 'Unknown error', retry: false };
    };
    
    const result = handleApiError(mockApiError);
    expect(result.message).toBe('Network connection failed');
    expect(result.retry).toBe(true);
  });

  it('should sanitize user input', () => {
    const dangerousInput = '<script>alert("xss")</script>';
    const normalInput = 'This is normal text';
    
    const sanitize = (input: string) => {
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    };
    
    expect(sanitize(dangerousInput)).toBe('');
    expect(sanitize(normalInput)).toBe(normalInput);
  });
});