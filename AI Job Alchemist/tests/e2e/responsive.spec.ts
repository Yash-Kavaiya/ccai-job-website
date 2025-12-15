import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test('should display mobile menu on small screens', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // Check mobile menu button is visible
    await expect(page.getByRole('button').filter({ has: page.locator('svg') }).first()).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/screenshots/mobile-homepage.png', fullPage: true });
    
    await context.close();
  });

  test('should display desktop navigation on large screens', async ({ browser }) => {
    // Create desktop context
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // Check desktop navigation is visible
    await expect(page.getByRole('link', { name: /Features/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Jobs/i })).toBeVisible();
    
    // Take desktop screenshot
    await page.screenshot({ path: 'test-results/screenshots/desktop-homepage.png', fullPage: true });
    
    await context.close();
  });

  test('should display tablet view correctly', async ({ browser }) => {
    // Create tablet context
    const context = await browser.newContext({
      ...devices['iPad Pro'],
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // Take tablet screenshot
    await page.screenshot({ path: 'test-results/screenshots/tablet-homepage.png', fullPage: true });
    
    await context.close();
  });

  test('should open mobile menu when clicking hamburger', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // Click hamburger menu
    const menuButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await menuButton.click();
    
    // Wait for menu to open
    await page.waitForTimeout(500);
    
    // Take screenshot of open mobile menu
    await page.screenshot({ path: 'test-results/screenshots/mobile-menu-open.png' });
    
    await context.close();
  });
});
