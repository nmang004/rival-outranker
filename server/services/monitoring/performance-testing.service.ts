import { performance } from 'perf_hooks';
import { MonitoringRepository } from '../../repositories/monitoring.repository';
import { MetricsCollectorService } from './metrics-collector.service';
// Mock AlertingService interface for now
interface AlertingService {
  sendAlert(alert: any): Promise<void>;
}

interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  type: 'load' | 'stress' | 'endurance' | 'spike' | 'regression';
  config: {
    duration: number; // seconds
    concurrency: number;
    rampUp: number; // seconds
    targets: string[];
    thresholds: {
      responseTime: number; // ms
      errorRate: number; // percentage
      throughput: number; // requests/second
    };
  };
  schedule?: {
    enabled: boolean;
    cron: string; // cron expression
    timezone: string;
  };
}

interface TestResult {
  testId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'passed' | 'failed' | 'warning';
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  endpoints: Array<{
    url: string;
    method: string;
    avgResponseTime: number;
    successRate: number;
    requestCount: number;
  }>;
  errors: Array<{
    type: string;
    message: string;
    count: number;
    percentage: number;
  }>;
  thresholdViolations: Array<{
    metric: string;
    expected: number;
    actual: number;
    severity: 'warning' | 'critical';
  }>;
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of total load
  requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    expectedStatus?: number;
  }>;
}

export class PerformanceTestingService {
  private repository: MonitoringRepository;
  private metricsCollector: MetricsCollectorService;
  private alertingService: AlertingService;
  private activeTests: Map<string, NodeJS.Timeout> = new Map();
  private testResults: Map<string, TestResult[]> = new Map();

  // Predefined test scenarios
  private readonly testScenarios: LoadTestScenario[] = [
    {
      name: 'Basic SEO Analysis',
      weight: 40,
      requests: [
        { method: 'POST', url: '/api/analysis', body: { url: 'https://example.com' }, expectedStatus: 200 },
        { method: 'GET', url: '/api/analysis/:id', expectedStatus: 200 }
      ]
    },
    {
      name: 'Rival Audit Flow',
      weight: 30,
      requests: [
        { method: 'POST', url: '/api/audit', body: { urls: ['https://example.com'] }, expectedStatus: 200 },
        { method: 'GET', url: '/api/audit/:id', expectedStatus: 200 },
        { method: 'GET', url: '/api/audit/:id/results', expectedStatus: 200 }
      ]
    },
    {
      name: 'User Authentication',
      weight: 20,
      requests: [
        { method: 'POST', url: '/api/auth/login', body: { username: 'test', password: 'test' }, expectedStatus: 200 },
        { method: 'GET', url: '/api/auth/profile', expectedStatus: 200 },
        { method: 'POST', url: '/api/auth/logout', expectedStatus: 200 }
      ]
    },
    {
      name: 'Monitoring & Health',
      weight: 10,
      requests: [
        { method: 'GET', url: '/api/health', expectedStatus: 200 },
        { method: 'GET', url: '/api/metrics/current', expectedStatus: 200 },
        { method: 'GET', url: '/api/business-intelligence/insights', expectedStatus: 200 }
      ]
    }
  ];

  // Predefined performance tests
  private readonly defaultTests: PerformanceTest[] = [
    {
      id: 'daily-load-test',
      name: 'Daily Load Test',
      description: 'Daily automated load test to ensure system can handle normal traffic',
      type: 'load',
      config: {
        duration: 300, // 5 minutes
        concurrency: 10,
        rampUp: 60,
        targets: ['http://localhost:3000'],
        thresholds: {
          responseTime: 2000, // 2 seconds
          errorRate: 5, // 5%
          throughput: 50 // 50 requests/second
        }
      },
      schedule: {
        enabled: true,
        cron: '0 2 * * *', // Daily at 2 AM
        timezone: 'UTC'
      }
    },
    {
      id: 'stress-test',
      name: 'Weekly Stress Test',
      description: 'Weekly stress test to identify breaking points',
      type: 'stress',
      config: {
        duration: 600, // 10 minutes
        concurrency: 50,
        rampUp: 120,
        targets: ['http://localhost:3000'],
        thresholds: {
          responseTime: 5000, // 5 seconds
          errorRate: 10, // 10%
          throughput: 20 // 20 requests/second
        }
      },
      schedule: {
        enabled: true,
        cron: '0 3 * * 0', // Weekly on Sunday at 3 AM
        timezone: 'UTC'
      }
    },
    {
      id: 'regression-test',
      name: 'Pre-deployment Regression Test',
      description: 'Quick performance regression test before deployments',
      type: 'regression',
      config: {
        duration: 120, // 2 minutes
        concurrency: 5,
        rampUp: 30,
        targets: ['http://localhost:3000'],
        thresholds: {
          responseTime: 1000, // 1 second
          errorRate: 2, // 2%
          throughput: 10 // 10 requests/second
        }
      },
      schedule: {
        enabled: false,
        cron: '',
        timezone: 'UTC'
      }
    }
  ];

  constructor() {
    this.repository = new MonitoringRepository();
    this.metricsCollector = new MetricsCollectorService();
    this.alertingService = {
      sendAlert: async (alert: any) => {
        console.log('Alert:', alert.message);
      }
    };
    
    // Initialize scheduled tests
    this.initializeScheduledTests();
  }

  // Initialize and schedule automated tests
  private initializeScheduledTests(): void {
    console.log('Initializing automated performance tests...');
    
    this.defaultTests.forEach(test => {
      if (test.schedule?.enabled && test.schedule.cron) {
        this.scheduleTest(test);
      }
    });
  }

  // Schedule a performance test using cron expression
  private scheduleTest(test: PerformanceTest): void {
    // This is a simplified implementation
    // In production, you would use a proper cron library like node-cron
    console.log(`Scheduled test: ${test.name} (${test.schedule?.cron})`);
    
    // For demonstration, schedule daily tests to run every hour during development
    if (test.type === 'load') {
      const interval = setInterval(async () => {
        console.log(`Running scheduled test: ${test.name}`);
        await this.runPerformanceTest(test);
      }, 60 * 60 * 1000); // 1 hour
      
      this.activeTests.set(test.id, interval);
    }
  }

  // Run a performance test
  async runPerformanceTest(test: PerformanceTest): Promise<TestResult> {
    console.log(`Starting performance test: ${test.name}`);
    
    const startTime = new Date();
    const testId = `${test.id}-${Date.now()}`;
    
    try {
      // Initialize test metrics
      const testMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        responseTimes: [] as number[],
        endpointMetrics: new Map<string, {
          responseTimes: number[];
          successes: number;
          failures: number;
        }>(),
        errors: new Map<string, number>()
      };

      // Run test scenarios
      await this.executeLoadTest(test, testMetrics);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Calculate final metrics
      const result = this.calculateTestResults(testId, test, startTime, endTime, duration, testMetrics);

      // Store results
      if (!this.testResults.has(test.id)) {
        this.testResults.set(test.id, []);
      }
      this.testResults.get(test.id)!.push(result);

      // Check thresholds and alert if necessary
      await this.checkThresholdsAndAlert(test, result);

      console.log(`Performance test completed: ${test.name} - Status: ${result.status}`);
      return result;

    } catch (error) {
      console.error(`Performance test failed: ${test.name}`, error);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        testId,
        startTime,
        endTime,
        duration,
        status: 'failed',
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          avgResponseTime: 0,
          maxResponseTime: 0,
          minResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          throughput: 0,
          errorRate: 100
        },
        endpoints: [],
        errors: [{ type: 'test_execution_error', message: errorMessage, count: 1, percentage: 100 }],
        thresholdViolations: []
      };
    }
  }

  // Execute load test with multiple concurrent users
  private async executeLoadTest(
    test: PerformanceTest,
    testMetrics: any
  ): Promise<void> {
    const { duration, concurrency, rampUp } = test.config;
    const rampUpInterval = rampUp * 1000 / concurrency;
    
    const workers: Promise<void>[] = [];
    
    // Start workers with ramp-up
    for (let i = 0; i < concurrency; i++) {
      const delay = i * rampUpInterval;
      
      const worker = new Promise<void>((resolve) => {
        setTimeout(async () => {
          await this.runWorker(test, duration * 1000 - delay, testMetrics);
          resolve();
        }, delay);
      });
      
      workers.push(worker);
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
  }

  // Individual worker that runs requests for the duration
  private async runWorker(
    test: PerformanceTest,
    remainingTime: number,
    testMetrics: any
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < remainingTime) {
      // Select random scenario based on weight
      const scenario = this.selectScenario();
      
      for (const request of scenario.requests) {
        if (Date.now() - startTime >= remainingTime) break;
        
        await this.executeRequest(request, testMetrics);
        
        // Add small delay between requests (100-500ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
      }
    }
  }

  // Execute a single HTTP request and record metrics
  private async executeRequest(
    request: LoadTestScenario['requests'][0],
    testMetrics: any
  ): Promise<void> {
    const url = request.url.replace(':id', '12345'); // Replace path params with dummy values
    const fullUrl = `http://localhost:3000${url}`;
    const endpointKey = `${request.method} ${url}`;
    
    const startTime = performance.now();
    
    try {
      // In a real implementation, you would use fetch or axios
      // For now, simulate request execution
      const responseTime = Math.random() * 1000 + 200; // 200-1200ms
      const success = Math.random() > 0.05; // 95% success rate
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, responseTime));
      
      const endTime = performance.now();
      const actualResponseTime = endTime - startTime;
      
      // Record metrics
      testMetrics.totalRequests++;
      testMetrics.responseTimes.push(actualResponseTime);
      
      if (!testMetrics.endpointMetrics.has(endpointKey)) {
        testMetrics.endpointMetrics.set(endpointKey, {
          responseTimes: [],
          successes: 0,
          failures: 0
        });
      }
      
      const endpointMetric = testMetrics.endpointMetrics.get(endpointKey)!;
      endpointMetric.responseTimes.push(actualResponseTime);
      
      if (success) {
        testMetrics.successfulRequests++;
        endpointMetric.successes++;
      } else {
        testMetrics.failedRequests++;
        endpointMetric.failures++;
        
        const errorType = Math.random() > 0.5 ? 'timeout' : 'server_error';
        testMetrics.errors.set(errorType, (testMetrics.errors.get(errorType) || 0) + 1);
      }
      
    } catch (error) {
      testMetrics.totalRequests++;
      testMetrics.failedRequests++;
      testMetrics.errors.set('network_error', (testMetrics.errors.get('network_error') || 0) + 1);
    }
  }

  // Select a scenario based on weights
  private selectScenario(): LoadTestScenario {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const scenario of this.testScenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }
    
    return this.testScenarios[0]; // Fallback
  }

  // Calculate final test results from collected metrics
  private calculateTestResults(
    testId: string,
    test: PerformanceTest,
    startTime: Date,
    endTime: Date,
    duration: number,
    testMetrics: any
  ): TestResult {
    const responseTimes = testMetrics.responseTimes.sort((a: number, b: number) => a - b);
    const totalRequests = testMetrics.totalRequests;
    const successfulRequests = testMetrics.successfulRequests;
    const failedRequests = testMetrics.failedRequests;
    
    // Calculate percentiles
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const metrics = {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      p95ResponseTime: responseTimes.length > 0 ? responseTimes[p95Index] : 0,
      p99ResponseTime: responseTimes.length > 0 ? responseTimes[p99Index] : 0,
      throughput: totalRequests > 0 ? (totalRequests / (duration / 1000)) : 0,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0
    };

    // Calculate endpoint metrics
    const endpoints = Array.from(testMetrics.endpointMetrics.entries()).map(([endpoint, data]: [string, any]) => {
      const [method, url] = endpoint.split(' ', 2);
      const total = data.successes + data.failures;
      return {
        url,
        method,
        avgResponseTime: data.responseTimes.length > 0 ? 
          data.responseTimes.reduce((a: number, b: number) => a + b, 0) / data.responseTimes.length : 0,
        successRate: total > 0 ? (data.successes / total) * 100 : 0,
        requestCount: total
      };
    });

    // Calculate errors
    const errors = Array.from(testMetrics.errors.entries()).map(([type, count]: [string, number]) => ({
      type,
      message: this.getErrorMessage(type),
      count,
      percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
    }));

    // Check threshold violations
    const thresholdViolations = this.checkThresholds(test.config.thresholds, metrics);

    // Determine status
    let status: 'passed' | 'failed' | 'warning' = 'passed';
    if (thresholdViolations.some(v => v.severity === 'critical')) {
      status = 'failed';
    } else if (thresholdViolations.length > 0) {
      status = 'warning';
    }

    return {
      testId,
      startTime,
      endTime,
      duration,
      status,
      metrics,
      endpoints,
      errors,
      thresholdViolations
    };
  }

  // Check performance thresholds
  private checkThresholds(
    thresholds: PerformanceTest['config']['thresholds'],
    metrics: TestResult['metrics']
  ): TestResult['thresholdViolations'] {
    const violations: TestResult['thresholdViolations'] = [];

    if (metrics.avgResponseTime > thresholds.responseTime) {
      violations.push({
        metric: 'Average Response Time',
        expected: thresholds.responseTime,
        actual: metrics.avgResponseTime,
        severity: metrics.avgResponseTime > thresholds.responseTime * 2 ? 'critical' : 'warning'
      });
    }

    if (metrics.errorRate > thresholds.errorRate) {
      violations.push({
        metric: 'Error Rate',
        expected: thresholds.errorRate,
        actual: metrics.errorRate,
        severity: metrics.errorRate > thresholds.errorRate * 2 ? 'critical' : 'warning'
      });
    }

    if (metrics.throughput < thresholds.throughput) {
      violations.push({
        metric: 'Throughput',
        expected: thresholds.throughput,
        actual: metrics.throughput,
        severity: metrics.throughput < thresholds.throughput * 0.5 ? 'critical' : 'warning'
      });
    }

    return violations;
  }

  // Check thresholds and send alerts if necessary
  private async checkThresholdsAndAlert(test: PerformanceTest, result: TestResult): Promise<void> {
    if (result.status === 'failed') {
      await this.alertingService.sendAlert({
        type: 'error',
        severity: 'high',
        message: `Performance test failed: ${test.name}`,
        details: {
          testId: result.testId,
          violations: result.thresholdViolations,
          errorRate: result.metrics.errorRate,
          avgResponseTime: result.metrics.avgResponseTime
        }
      });
    } else if (result.status === 'warning') {
      await this.alertingService.sendAlert({
        type: 'warning',
        severity: 'medium',
        message: `Performance test warning: ${test.name}`,
        details: {
          testId: result.testId,
          violations: result.thresholdViolations
        }
      });
    }
  }

  private getErrorMessage(errorType: string): string {
    const messages: Record<string, string> = {
      'timeout': 'Request timeout',
      'server_error': 'Server error (5xx)',
      'network_error': 'Network connection error',
      'client_error': 'Client error (4xx)'
    };
    return messages[errorType] || 'Unknown error';
  }

  // Public API methods
  async getTestResults(testId?: string): Promise<TestResult[]> {
    if (testId) {
      return this.testResults.get(testId) || [];
    }
    
    // Return all results
    const allResults: TestResult[] = [];
    for (const results of this.testResults.values()) {
      allResults.push(...results);
    }
    return allResults.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getTestHistory(testId: string, limit: number = 10): Promise<TestResult[]> {
    const results = this.testResults.get(testId) || [];
    return results.slice(-limit).reverse();
  }

  async runTest(testId: string): Promise<TestResult> {
    const test = this.defaultTests.find(t => t.id === testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }
    return await this.runPerformanceTest(test);
  }

  getAvailableTests(): PerformanceTest[] {
    return [...this.defaultTests];
  }

  async createCustomTest(test: Omit<PerformanceTest, 'id'>): Promise<PerformanceTest> {
    const newTest: PerformanceTest = {
      ...test,
      id: `custom-${Date.now()}`
    };
    
    // In a real implementation, you would save this to a database
    console.log('Created custom test:', newTest.name);
    
    return newTest;
  }

  stopScheduledTest(testId: string): void {
    const timer = this.activeTests.get(testId);
    if (timer) {
      clearInterval(timer);
      this.activeTests.delete(testId);
      console.log(`Stopped scheduled test: ${testId}`);
    }
  }

  stopAllScheduledTests(): void {
    for (const [testId, timer] of this.activeTests) {
      clearInterval(timer);
      console.log(`Stopped scheduled test: ${testId}`);
    }
    this.activeTests.clear();
  }
}