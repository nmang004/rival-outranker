import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 50 },  // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    // 95% of requests should be below 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate should be below 5%
    http_req_failed: ['rate<0.05'],
    // Average response time should be below 200ms
    'http_req_duration{expected_response:true}': ['avg<200'],
    // 99% of requests should be below 1s
    'http_req_duration{expected_response:true}': ['p(99)<1000'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
];

const testUrls = [
  'https://example.com',
  'https://google.com',
  'https://github.com',
  'https://stackoverflow.com',
  'https://developer.mozilla.org',
];

let authTokens = [];

export function setup() {
  console.log('Setting up load test...');
  
  // Register test users and get auth tokens
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    
    // Try to register user (might already exist)
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
      username: `loadtest${i + 1}`,
      email: user.email,
      password: user.password,
      firstName: 'Load',
      lastName: `Test ${i + 1}`
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Login to get token
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      username: `loadtest${i + 1}`,
      password: user.password
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (loginResponse.status === 200) {
      const body = JSON.parse(loginResponse.body);
      authTokens.push(body.token);
    }
  }
  
  console.log(`Setup complete. ${authTokens.length} auth tokens acquired.`);
  return { authTokens };
}

export default function(data) {
  const token = data.authTokens[Math.floor(Math.random() * data.authTokens.length)];
  
  // Test different endpoints with different weights
  const scenarios = [
    { weight: 30, fn: testHealthCheck },
    { weight: 25, fn: () => testAnalysisCreation(token) },
    { weight: 20, fn: () => testUserData(token) },
    { weight: 15, fn: () => testCrawlingStatus(token) },
    { weight: 10, fn: () => testDataQuery(token) },
  ];
  
  // Select scenario based on weight
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      scenario.fn();
      break;
    }
  }
  
  // Think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/api/health`, {
    tags: { test_type: 'health_check' },
  });
  
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check responds quickly': (r) => r.timings.duration < 100,
    'health check has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.overall && body.overall.status;
      } catch {
        return false;
      }
    },
  });
}

function testAnalysisCreation(token) {
  const url = testUrls[Math.floor(Math.random() * testUrls.length)];
  
  const response = http.post(`${BASE_URL}/api/analysis`, JSON.stringify({
    url: url,
    includeCompetitorAnalysis: Math.random() > 0.7 // 30% chance
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: { test_type: 'analysis_creation' },
  });
  
  check(response, {
    'analysis creation status is 201': (r) => r.status === 201,
    'analysis has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id && body.overallScore !== undefined;
      } catch {
        return false;
      }
    },
    'analysis responds in reasonable time': (r) => r.timings.duration < 5000,
  });
}

function testUserData(token) {
  const response = http.get(`${BASE_URL}/api/analysis/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    tags: { test_type: 'user_data' },
  });
  
  check(response, {
    'user data status is 200': (r) => r.status === 200,
    'user data is array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
    'user data responds quickly': (r) => r.timings.duration < 500,
  });
}

function testCrawlingStatus(token) {
  const response = http.get(`${BASE_URL}/api/crawl/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    tags: { test_type: 'crawling_status' },
  });
  
  check(response, {
    'crawling status is 200': (r) => r.status === 200,
    'crawling status has valid data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('isRunning') && body.hasOwnProperty('lastCrawl');
      } catch {
        return false;
      }
    },
  });
}

function testDataQuery(token) {
  const response = http.get(`${BASE_URL}/api/crawl/content?page=1&limit=10&type=news`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    tags: { test_type: 'data_query' },
  });
  
  check(response, {
    'data query status is 200': (r) => r.status === 200,
    'data query has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.pagination;
      } catch {
        return false;
      }
    },
  });
}

// Stress test specific endpoints
export function stressTest() {
  const response = http.get(`${BASE_URL}/api/health`);
  
  check(response, {
    'stress test status is 200': (r) => r.status === 200,
  });
}

// Spike test for sudden traffic
export function spikeTest() {
  const response = http.get(`${BASE_URL}/api/health`);
  
  check(response, {
    'spike test status is 200': (r) => r.status === 200,
    'spike test responds in time': (r) => r.timings.duration < 1000,
  });
}

export function teardown(data) {
  console.log('Load test completed');
  
  // Optional: Clean up test data
  for (const token of data.authTokens) {
    // Could delete test analyses, etc.
  }
}