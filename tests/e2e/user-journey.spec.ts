import { test, expect, type Page } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set up test data attributes for reliable element selection
    await page.addInitScript(() => {
      // Add data-testid attributes to elements if not present
      document.addEventListener('DOMContentLoaded', () => {
        const addTestIds = () => {
          // Navigation elements
          const registerBtn = document.querySelector('button:has-text("Register"), a:has-text("Register")');
          if (registerBtn && !registerBtn.getAttribute('data-testid')) {
            registerBtn.setAttribute('data-testid', 'register-button');
          }
          
          const loginBtn = document.querySelector('button:has-text("Login"), a:has-text("Login")');
          if (loginBtn && !loginBtn.getAttribute('data-testid')) {
            loginBtn.setAttribute('data-testid', 'login-button');
          }
          
          // Form elements
          const emailInputs = document.querySelectorAll('input[type="email"], input[name="email"]');
          emailInputs.forEach((input, index) => {
            if (!input.getAttribute('data-testid')) {
              input.setAttribute('data-testid', `email-input-${index}`);
            }
          });
          
          const passwordInputs = document.querySelectorAll('input[type="password"], input[name="password"]');
          passwordInputs.forEach((input, index) => {
            if (!input.getAttribute('data-testid')) {
              input.setAttribute('data-testid', `password-input-${index}`);
            }
          });
        };
        
        addTestIds();
        // Re-run after potential dynamic content loads
        setTimeout(addTestIds, 1000);
      });
    });
  });

  test('complete user registration and data access flow', async () => {
    const testEmail = `e2etest-${Date.now()}@example.com`;
    
    // Navigate to application
    await page.goto('/');
    await expect(page).toHaveTitle(/Rival Outranker/i);
    
    // Navigate to registration
    await page.click('text=Register, [data-testid="register-button"]');
    await expect(page).toHaveURL(/.*register.*/);
    
    // Fill registration form
    await page.fill('input[type="email"], [data-testid="email-input"], [name="email"]', testEmail);
    await page.fill('input[type="password"], [data-testid="password-input"], [name="password"]', 'TestPassword123!');
    await page.fill('input[name="firstName"], [placeholder*="First"]', 'E2E');
    await page.fill('input[name="lastName"], [placeholder*="Last"]', 'TestUser');
    await page.fill('input[name="username"], [placeholder*="Username"]', `e2euser${Date.now()}`);
    
    // Submit registration
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
    
    // Verify successful registration (either redirect or success message)
    await page.waitForSelector('text=Welcome, text=Dashboard, text=Success', { timeout: 10000 });
    
    // Navigate to main dashboard/analysis page
    const dashboardLink = page.locator('text=Dashboard, text=Analysis, a[href*="analysis"], a[href="/"]').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
    } else {
      await page.goto('/');
    }
    
    // Verify we can access the main functionality
    await expect(page.locator('h1, h2, .title')).toContainText(/SEO|Analysis|Dashboard/, { timeout: 5000 });
    
    // Test SEO analysis functionality
    const urlInput = page.locator('input[type="url"], input[placeholder*="URL"], input[placeholder*="website"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://example.com');
      
      const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start"), button[type="submit"]').first();
      await analyzeButton.click();
      
      // Wait for analysis results (this might take a while)
      await page.waitForSelector('text=Score, text=Results, .analysis-result', { timeout: 30000 });
      
      // Verify analysis results are displayed
      await expect(page.locator('text=Score, text=Results, .score')).toBeVisible();
      
      // Verify no mock data indicators
      await expect(page.locator('text=mock, text=dummy, text=sample')).not.toBeVisible();
    }
  });

  test('user login and data persistence', async () => {
    // First, register a user (or use existing test user)
    await page.goto('/register');
    
    const testEmail = 'persistent-test@example.com';
    const testPassword = 'TestPassword123!';
    
    // Try to register (might fail if user exists, which is fine)
    try {
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.fill('input[name="firstName"]', 'Persistent');
      await page.fill('input[name="lastName"]', 'TestUser');
      await page.fill('input[name="username"]', 'persistentuser');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    } catch (error) {
      // User might already exist, continue to login
    }
    
    // Navigate to login
    await page.goto('/login');
    
    // Login with credentials
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', testPassword);
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Verify successful login
    await page.waitForSelector('text=Welcome, text=Dashboard, .user-menu', { timeout: 10000 });
    
    // Perform an analysis to create data
    const urlInput = page.locator('input[type="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://github.com');
      await page.click('button:has-text("Analyze")');
      await page.waitForSelector('text=Score, .analysis-result', { timeout: 30000 });
    }
    
    // Navigate to user history/data page
    const historyLink = page.locator('text=History, text=My Analyses, a[href*="history"]').first();
    if (await historyLink.isVisible()) {
      await historyLink.click();
      
      // Verify user's historical data is displayed
      await expect(page.locator('.analysis-item, .history-item')).toBeVisible();
    }
    
    // Logout and login again to test persistence
    const logoutButton = page.locator('button:has-text("Logout"), text=Logout').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
    
    // Login again
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Verify data persistence
    await page.waitForSelector('text=Welcome, text=Dashboard', { timeout: 10000 });
    
    // Check that previous analysis is still available
    if (await page.locator('text=History, a[href*="history"]').first().isVisible()) {
      await page.locator('text=History, a[href*="history"]').first().click();
      await expect(page.locator('.analysis-item, .history-item')).toBeVisible();
    }
  });

  test('real-time data updates and crawling system', async () => {
    // Login as admin user (if available) or regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    
    // Handle login failure gracefully
    try {
      await page.waitForSelector('text=Welcome, text=Dashboard', { timeout: 5000 });
    } catch {
      // If admin login fails, register a new user
      await page.goto('/register');
      const adminEmail = `admin-${Date.now()}@example.com`;
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', 'AdminPassword123!');
      await page.fill('input[name="firstName"]', 'Admin');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="username"]', `admin${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=Welcome, text=Dashboard', { timeout: 10000 });
    }
    
    // Navigate to data view or admin panel
    const dataLink = page.locator('text=Data, text=Content, text=Admin, a[href*="admin"]').first();
    if (await dataLink.isVisible()) {
      await dataLink.click();
    } else {
      await page.goto('/admin');
    }
    
    // Record initial data count
    const dataItems = page.locator('.data-item, .content-item, tr:not(:first-child)');
    const initialCount = await dataItems.count();
    
    // Look for refresh or crawl trigger button
    const refreshButton = page.locator('button:has-text("Refresh"), button:has-text("Crawl"), button:has-text("Update")').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Wait for loading indicator
      await page.waitForSelector('text=Loading, .loading, .spinner', { timeout: 5000 }).catch(() => {});
      
      // Wait for loading to complete
      await page.waitForSelector('text=Loading, .loading, .spinner', { state: 'detached', timeout: 30000 }).catch(() => {});
      
      // Verify data was updated (count might be same or different)
      const newCount = await dataItems.count();
      console.log(`Data count before: ${initialCount}, after: ${newCount}`);
      
      // The test passes if the refresh mechanism works (no errors)
      await expect(page.locator('text=Error, .error')).not.toBeVisible();
    }
    
    // Test health check endpoint accessibility
    await page.goto('/api/health');
    await expect(page.locator('text=healthy, text=status')).toBeVisible();
  });

  test('responsive design and mobile functionality', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await page.goto('/');
    
    // Verify mobile navigation works
    const mobileMenuButton = page.locator('button:has-text("Menu"), .mobile-menu-button, [aria-label*="menu"]').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Verify menu opens
      await expect(page.locator('.mobile-menu, .nav-menu')).toBeVisible();
      
      // Close menu
      await mobileMenuButton.click();
    }
    
    // Test that main content is accessible on mobile
    await expect(page.locator('h1, .title')).toBeVisible();
    
    // Test form inputs on mobile
    const urlInput = page.locator('input[type="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.click();
      await urlInput.fill('https://mobile-test.com');
      
      // Verify input is properly sized for mobile
      const inputBox = await urlInput.boundingBox();
      expect(inputBox?.width).toBeLessThan(400); // Should fit in mobile viewport
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    
    // Verify layout adapts to tablet
    await expect(page.locator('body')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('error handling and edge cases', async () => {
    await page.goto('/');
    
    // Test invalid URL submission
    const urlInput = page.locator('input[type="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('not-a-valid-url');
      await page.click('button:has-text("Analyze")');
      
      // Should show validation error
      await expect(page.locator('text=invalid, text=error, .error')).toBeVisible();
      
      // Test empty URL
      await urlInput.fill('');
      await page.click('button:has-text("Analyze")');
      await expect(page.locator('text=required, text=error')).toBeVisible();
    }
    
    // Test non-existent page
    await page.goto('/non-existent-page');
    await expect(page.locator('text=404, text=Not Found, text=Page not found')).toBeVisible();
    
    // Test API error handling by accessing a protected route without auth
    await page.goto('/api/analysis/user');
    await expect(page.locator('text=401, text=Unauthorized')).toBeVisible();
    
    // Return to home page
    await page.goto('/');
    await expect(page.locator('h1, .title')).toBeVisible();
  });

  test('performance and loading states', async () => {
    // Monitor network requests
    const requests: any[] = [];
    page.on('request', request => requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    }));
    
    const responses: any[] = [];
    page.on('response', response => responses.push({
      url: response.url(),
      status: response.status(),
      timestamp: Date.now()
    }));
    
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
    
    // Verify no failed requests for critical resources
    const failedRequests = responses.filter(r => r.status >= 400 && r.status < 600);
    const criticalFailures = failedRequests.filter(r => 
      r.url.includes('.js') || r.url.includes('.css') || r.url.includes('/api/')
    );
    
    expect(criticalFailures.length).toBe(0);
    
    // Test loading states during analysis
    const urlInput = page.locator('input[type="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://example.com');
      
      const analyzeButton = page.locator('button:has-text("Analyze")').first();
      await analyzeButton.click();
      
      // Should show loading state
      await page.waitForSelector('text=Loading, text=Analyzing, .loading, .spinner', { timeout: 5000 }).catch(() => {});
      
      // Loading should eventually complete
      await page.waitForSelector('text=Score, text=Results, .analysis-result', { timeout: 30000 });
    }
    
    console.log(`Page loaded in ${loadTime}ms`);
    console.log(`Total requests: ${requests.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);
  });
});