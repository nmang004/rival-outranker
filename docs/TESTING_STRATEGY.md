# Testing Strategy Documentation

## Overview

This document outlines the comprehensive testing strategy for Rival Outranker, covering all aspects of testing from unit tests to production monitoring. Our testing approach ensures high code quality, reliability, and performance across all environments.

## Testing Pyramid

```
    🔺 E2E Tests (Few, High Value)
   -------- Browser automation, user journeys
  🔳 Integration Tests (Some, API focused)
 ------------ API endpoints, database operations  
🔳🔳🔳 Unit Tests (Many, Fast feedback)
------------------ Functions, components, utilities
```

## Test Types and Coverage

### 1. Unit Tests
**Location**: `tests/unit/`
**Purpose**: Test individual functions, components, and utilities in isolation
**Coverage Target**: 80%+ for critical business logic

#### What We Test:
- Utility functions (formatters, validators, calculators)
- Pure business logic functions
- Data transformation functions
- Individual React components (when isolated)
- Service class methods

#### Technologies:
- **Vitest**: Test runner and assertion library
- **@testing-library/react**: React component testing
- **jsdom**: DOM simulation for browser APIs

#### Example Test Structure:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateSeoScore } from '@/lib/utils';

describe('SEO Score Calculation', () => {
  it('should calculate correct score for valid input', () => {
    const result = calculateSeoScore({
      keyword: 'test',
      title: 'Test Title',
      content: 'Test content with keyword test'
    });
    
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
```

#### Running Unit Tests:
```bash
npm run test:unit           # Run all unit tests
npm run test:unit -- --watch  # Watch mode
npm run test:coverage      # Generate coverage report
```

### 2. Integration Tests
**Location**: `tests/integration/`
**Purpose**: Test API endpoints, database operations, and service integrations
**Coverage Target**: All critical API endpoints and data flows

#### What We Test:
- REST API endpoints with real database
- Authentication and authorization flows
- Database operations and transactions
- External API integrations (with mocking)
- Service-to-service communication

#### Test Database Setup:
- Separate test database: `rival_outranker_test`
- Automatic seeding and cleanup
- Transaction rollback for test isolation

#### Example Integration Test:
```typescript
describe('Analysis API', () => {
  it('should create analysis with valid data', async () => {
    const response = await request(app)
      .post('/api/analysis')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'https://example.com' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.overallScore).toBeGreaterThan(0);
  });
});
```

#### Running Integration Tests:
```bash
npm run test:integration   # Run all integration tests
DATABASE_URL=postgresql://... npm run test:integration
```

### 3. End-to-End (E2E) Tests
**Location**: `tests/e2e/`
**Purpose**: Test complete user journeys and critical business workflows
**Coverage Target**: All critical user paths and edge cases

#### What We Test:
- Complete user registration and login flows
- SEO analysis workflows from input to results
- Data persistence across sessions
- Real-time updates and crawling system
- Mobile responsiveness and cross-browser compatibility
- Error handling and edge cases

#### Technologies:
- **Playwright**: Cross-browser automation
- **Multiple browsers**: Chromium, Firefox, WebKit
- **Mobile testing**: iPhone, Android viewports

#### Example E2E Test:
```typescript
test('complete SEO analysis workflow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="url-input"]', 'https://example.com');
  await page.click('[data-testid="analyze-button"]');
  
  await expect(page.locator('.analysis-results')).toBeVisible();
  await expect(page.locator('.seo-score')).toContainText(/\d+/);
});
```

#### Running E2E Tests:
```bash
npm run test:e2e           # All browsers
npm run test:e2e -- --project=chromium  # Single browser
npm run test:e2e -- --headed             # With browser UI
```

### 4. Load Testing
**Location**: `tests/load/`
**Purpose**: Validate system performance under realistic and peak loads
**Coverage Target**: All critical API endpoints and user scenarios

#### What We Test:
- API response times under load
- Concurrent user handling
- Database performance with multiple connections
- Memory and resource usage patterns
- Error rates under stress

#### Technologies:
- **k6**: Load testing framework
- **Scenarios**: Gradual ramp-up, steady state, spike testing

#### Load Test Scenarios:
```javascript
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Steady state
    { duration: '2m', target: 100 },  // Spike test
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% under 500ms
    http_req_failed: ['rate<0.05'],     // Less than 5% errors
  },
};
```

#### Running Load Tests:
```bash
npm run test:load          # Standard load test
k6 run tests/load/spike-test.js       # Spike testing
k6 run tests/load/stress-test.js      # Stress testing
```

## Test Data Management

### Test Database
- **Isolated Environment**: Separate test database prevents interference
- **Automatic Seeding**: Fresh test data for each test suite
- **Cleanup Strategy**: Automatic cleanup after test completion
- **Migration Sync**: Test database stays in sync with development

### Mock Data Strategy
- **External APIs**: Mock all external API calls in tests
- **Deterministic Data**: Consistent test data for predictable results
- **Edge Cases**: Include boundary conditions and error scenarios

### Test User Management
```typescript
// Test user creation
const testUsers = {
  admin: { email: 'admin@test.com', role: 'admin' },
  user: { email: 'user@test.com', role: 'user' },
  premium: { email: 'premium@test.com', role: 'premium' }
};
```

## Continuous Integration Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
jobs:
  test:
    - Unit tests on Node.js 18.x and 20.x
    - Integration tests with PostgreSQL
    - Type checking with TypeScript
    - Code coverage reporting

  e2e-tests:
    - Cross-browser testing
    - Mobile responsiveness
    - Performance validation

  security-scan:
    - Dependency vulnerability scanning
    - CodeQL security analysis
    - npm audit checks

  load-testing:
    - Performance benchmarking
    - Resource usage monitoring
    - Threshold validation
```

### Test Execution Order
1. **Type Checking**: Ensure TypeScript compilation
2. **Unit Tests**: Fast feedback on individual components
3. **Integration Tests**: Validate API and database operations
4. **Build Verification**: Ensure production build succeeds
5. **E2E Tests**: Complete user journey validation
6. **Load Testing**: Performance and scalability validation
7. **Security Scanning**: Vulnerability and compliance checks

## Performance Testing

### Key Metrics
- **Response Time**: 95th percentile under 500ms
- **Throughput**: Handle 100+ concurrent users
- **Error Rate**: Less than 5% under normal load
- **Resource Usage**: Memory usage under 90%

### Performance Thresholds
```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.05'],
  memory_usage: ['value<90'],
  cpu_usage: ['value<80']
}
```

### Monitoring Integration
- Real-time performance metrics
- Automated alerting on threshold breaches
- Historical performance tracking
- Regression detection

## Test Environment Configuration

### Development
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/rival_outranker_dev
LOG_LEVEL=debug
```

### Testing
```bash
NODE_ENV=test  
DATABASE_URL=postgresql://localhost:5432/rival_outranker_test
LOG_LEVEL=error
MOCK_EXTERNAL_APIS=true
```

### Staging
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db/rival_outranker
LOG_LEVEL=info
ENABLE_MONITORING=true
```

### Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-db/rival_outranker
LOG_LEVEL=warn
ENABLE_MONITORING=true
ENABLE_ALERTING=true
```

## Quality Gates

### Code Coverage
- **Minimum Coverage**: 80% for critical paths
- **Coverage Types**: Lines, branches, functions, statements
- **Exclusions**: Configuration files, type definitions, tests

### Performance Gates
- **Build Time**: Under 2 minutes
- **Test Execution**: Unit tests under 30 seconds
- **E2E Tests**: Complete suite under 15 minutes
- **Load Tests**: Meet performance thresholds

### Security Gates
- **Vulnerability Scanning**: No high-severity vulnerabilities
- **Dependency Audit**: All dependencies up to date
- **Code Analysis**: No security anti-patterns

## Test Debugging and Troubleshooting

### Common Issues and Solutions

#### Test Database Connection
```bash
# Check database status
npm run db:push
psql -U postgres -d rival_outranker_test -c "SELECT 1;"
```

#### Flaky Tests
- Use `waitFor` for async operations
- Implement proper cleanup in `afterEach`
- Avoid hard-coded timeouts
- Use deterministic test data

#### Performance Test Failures
```bash
# Check system resources
htop
free -m
iostat

# Analyze test results
k6 run --out json=results.json tests/load/api-load.test.js
```

### Debug Commands
```bash
# Run single test with debug info
npm run test:unit -- --reporter=verbose --run specific-test.test.ts

# E2E test with browser UI
npm run test:e2e -- --headed --debug

# Integration test with detailed logs
DEBUG=* npm run test:integration
```

## Test Maintenance

### Regular Tasks
- **Weekly**: Update test dependencies
- **Monthly**: Review and update test data
- **Quarterly**: Performance baseline updates
- **Release**: Full test suite validation

### Test Data Refresh
```bash
# Update test fixtures
npm run test:fixtures:update

# Regenerate mock data
npm run test:mocks:generate

# Validate test data integrity
npm run test:data:validate
```

### Monitoring Test Health
- **Test Execution Time**: Track trends over time
- **Flaky Test Detection**: Identify and fix unstable tests
- **Coverage Trends**: Monitor coverage changes
- **Performance Regression**: Detect performance degradation

## Best Practices

### Writing Effective Tests
1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Test names should explain the scenario
3. **Single Responsibility**: One test per behavior
4. **Independent Tests**: No test dependencies
5. **Fast Execution**: Optimize for quick feedback

### Test Organization
```
tests/
├── unit/
│   ├── utils/
│   ├── services/
│   └── components/
├── integration/
│   ├── api/
│   ├── database/
│   └── services/
├── e2e/
│   ├── user-journeys/
│   ├── smoke/
│   └── regression/
└── load/
    ├── api-load.test.js
    ├── spike-test.js
    └── stress-test.js
```

### Code Review Checklist
- [ ] Tests cover new functionality
- [ ] Tests follow naming conventions
- [ ] No hardcoded values or timeouts
- [ ] Proper cleanup and teardown
- [ ] Performance considerations addressed
- [ ] Documentation updated

## Metrics and Reporting

### Test Metrics Dashboard
- **Test Execution Trends**: Pass/fail rates over time
- **Coverage Reports**: Line and branch coverage
- **Performance Metrics**: Response times and throughput
- **Security Scan Results**: Vulnerability reports

### Automated Reporting
- **Daily**: Test execution summary
- **Weekly**: Coverage and performance trends
- **Monthly**: Comprehensive quality report
- **Release**: Full validation report

## Future Enhancements

### Planned Improvements
- **Visual Regression Testing**: Automated UI consistency checks
- **Chaos Engineering**: Fault injection testing
- **Contract Testing**: API contract validation
- **Mutation Testing**: Test quality assessment
- **A/B Testing Framework**: Feature flag testing

### Technology Roadmap
- **Test Containers**: Improved isolation for integration tests
- **Cloud Testing**: Distributed test execution
- **AI-Powered Testing**: Intelligent test generation
- **Real User Monitoring**: Production user behavior analysis

---

## Quick Reference

### Essential Commands
```bash
# Run all tests
npm test

# Run specific test type
npm run test:unit
npm run test:integration  
npm run test:e2e

# Coverage and reporting
npm run test:coverage
npm run test:watch

# Performance testing
npm run test:load
npm run monitor:health

# CI/CD validation
npm run test:build
npm run security:test
```

### Environment Setup
```bash
# Initial setup
npm install
npm run db:push

# Test database setup
createdb rival_outranker_test
npm run db:push
```

This comprehensive testing strategy ensures high-quality, reliable, and performant software delivery while maintaining rapid development velocity.