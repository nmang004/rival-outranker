#!/usr/bin/env node

/**
 * Security Headers Testing Script
 * 
 * Tests that all required security headers are properly set
 * and validates their values against security best practices.
 */

import { spawn } from 'child_process';
import https from 'https';
import http from 'http';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`)
};

// Required security headers and their expected values/patterns
const securityHeaders = {
  'x-frame-options': {
    expected: 'DENY',
    description: 'Prevents clickjacking attacks'
  },
  'x-content-type-options': {
    expected: 'nosniff',
    description: 'Prevents MIME type sniffing'
  },
  'x-xss-protection': {
    expected: '1; mode=block',
    description: 'Enables XSS protection'
  },
  'strict-transport-security': {
    pattern: /max-age=\d+/,
    description: 'Enforces HTTPS connections'
  },
  'content-security-policy': {
    pattern: /default-src/,
    description: 'Controls resource loading'
  },
  'referrer-policy': {
    expected: 'strict-origin-when-cross-origin',
    description: 'Controls referrer information'
  },
  'permissions-policy': {
    pattern: /geolocation=\(\)/,
    description: 'Controls browser feature access'
  },
  'x-request-id': {
    pattern: /^[0-9a-f-]{36}$/,
    description: 'Request tracking identifier'
  }
};

// Rate limiting headers
const rateLimitHeaders = {
  'ratelimit-limit': {
    pattern: /^\d+$/,
    description: 'Rate limit maximum'
  },
  'ratelimit-remaining': {
    pattern: /^\d+$/,
    description: 'Rate limit remaining'
  },
  'ratelimit-reset': {
    pattern: /^\d+$/,
    description: 'Rate limit reset time'
  }
};

async function testHeaders(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https://') ? https : http;
    
    const request = protocol.get(url, (response) => {
      resolve({
        statusCode: response.statusCode,
        headers: response.headers
      });
    });
    
    request.on('error', (error) => {
      resolve({
        error: error.message
      });
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        error: 'Request timeout'
      });
    });
  });
}

function validateHeader(name, value, config) {
  if (!value) {
    return { valid: false, message: 'Header missing' };
  }
  
  if (config.expected && value.toLowerCase() !== config.expected.toLowerCase()) {
    return { 
      valid: false, 
      message: `Expected "${config.expected}", got "${value}"` 
    };
  }
  
  if (config.pattern && !config.pattern.test(value)) {
    return { 
      valid: false, 
      message: `Value "${value}" doesn't match expected pattern` 
    };
  }
  
  return { valid: true, message: `Valid: ${value}` };
}

async function testSecurityHeaders(urls) {
  log.title('🔒 Security Headers Testing');
  
  for (const url of urls) {
    log.info(`Testing: ${url}`);
    
    const result = await testHeaders(url);
    
    if (result.error) {
      log.error(`Failed to connect: ${result.error}`);
      continue;
    }
    
    if (result.statusCode >= 400) {
      log.warning(`HTTP ${result.statusCode} response`);
    }
    
    // Test security headers
    let passedTests = 0;
    let totalTests = 0;
    
    for (const [headerName, config] of Object.entries(securityHeaders)) {
      totalTests++;
      const headerValue = result.headers[headerName.toLowerCase()];
      const validation = validateHeader(headerName, headerValue, config);
      
      if (validation.valid) {
        log.success(`${headerName}: ${validation.message}`);
        passedTests++;
      } else {
        log.error(`${headerName}: ${validation.message} - ${config.description}`);
      }
    }
    
    // Test rate limiting headers (optional)
    log.info('Rate limiting headers (if present):');
    for (const [headerName, config] of Object.entries(rateLimitHeaders)) {
      const headerValue = result.headers[headerName.toLowerCase()];
      if (headerValue) {
        const validation = validateHeader(headerName, headerValue, config);
        if (validation.valid) {
          log.success(`${headerName}: ${validation.message}`);
        } else {
          log.warning(`${headerName}: ${validation.message}`);
        }
      }
    }
    
    // Summary
    const score = Math.round((passedTests / totalTests) * 100);
    if (score >= 90) {
      log.success(`Security score: ${score}% (${passedTests}/${totalTests} tests passed)`);
    } else if (score >= 70) {
      log.warning(`Security score: ${score}% (${passedTests}/${totalTests} tests passed)`);
    } else {
      log.error(`Security score: ${score}% (${passedTests}/${totalTests} tests passed)`);
    }
  }
}

async function testRateLimiting(url) {
  log.title('🚦 Rate Limiting Testing');
  
  log.info('Testing rate limiting with rapid requests...');
  
  const requests = Array.from({ length: 10 }, (_, i) => 
    testHeaders(`${url}/api/test-endpoint?req=${i}`)
  );
  
  try {
    const results = await Promise.all(requests);
    const rateLimitedRequests = results.filter(r => r.statusCode === 429);
    
    if (rateLimitedRequests.length > 0) {
      log.success(`Rate limiting active: ${rateLimitedRequests.length}/10 requests blocked`);
    } else {
      log.warning('Rate limiting not triggered - may need more aggressive testing');
    }
  } catch (error) {
    log.error(`Rate limiting test failed: ${error.message}`);
  }
}

async function testAuthenticationEndpoints(url) {
  log.title('🔐 Authentication Security Testing');
  
  const authEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/admin/users'
  ];
  
  for (const endpoint of authEndpoints) {
    const result = await testHeaders(`${url}${endpoint}`);
    
    if (result.statusCode === 401 || result.statusCode === 403) {
      log.success(`${endpoint}: Properly protected (${result.statusCode})`);
    } else if (result.statusCode === 404) {
      log.info(`${endpoint}: Not found (may not exist)`);
    } else {
      log.warning(`${endpoint}: Unexpected response (${result.statusCode})`);
    }
  }
}

async function testCSRFProtection(url) {
  log.title('🛡️ CSRF Protection Testing');
  
  // Test POST request without CSRF token
  const result = await new Promise((resolve) => {
    const data = JSON.stringify({ test: 'data' });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const protocol = url.startsWith('https://') ? https : http;
    const request = protocol.request(`${url}/api/test-csrf`, options, (response) => {
      resolve({
        statusCode: response.statusCode,
        headers: response.headers
      });
    });
    
    request.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    request.write(data);
    request.end();
  });
  
  if (result.statusCode === 403) {
    log.success('CSRF protection active: POST request blocked without token');
  } else if (result.statusCode === 404) {
    log.info('CSRF test endpoint not found');
  } else {
    log.warning(`CSRF protection test returned: ${result.statusCode}`);
  }
}

function printUsage() {
  console.log(`
${colors.bold}Security Headers Testing Script${colors.reset}

Usage: node test-security-headers.js [URL]

Examples:
  node test-security-headers.js http://localhost:5000
  node test-security-headers.js https://api.rivaloutranker.com

Tests performed:
  • Security headers validation
  • Rate limiting functionality
  • Authentication endpoint protection
  • CSRF protection
  • Overall security score

${colors.cyan}Required security headers:${colors.reset}
  • X-Frame-Options
  • X-Content-Type-Options
  • X-XSS-Protection
  • Strict-Transport-Security
  • Content-Security-Policy
  • Referrer-Policy
  • Permissions-Policy
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }
  
  const urls = args.length > 0 ? args : ['http://localhost:5000'];
  
  console.log(`${colors.bold}🔒 Rival Outranker Security Testing${colors.reset}\n`);
  
  try {
    // Test security headers
    await testSecurityHeaders(urls);
    
    // Additional security tests for each URL
    for (const url of urls) {
      await testRateLimiting(url);
      await testAuthenticationEndpoints(url);
      await testCSRFProtection(url);
    }
    
    log.title('🎯 Security Testing Complete');
    log.info('Review any failed tests and implement missing security measures.');
    
  } catch (error) {
    log.error(`Security testing failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testSecurityHeaders, testRateLimiting, testAuthenticationEndpoints };