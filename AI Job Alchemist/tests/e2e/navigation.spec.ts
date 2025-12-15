import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to features section when clicking Features link', async ({ page }) => {
    // Click Features link
    await page.getByRole('link', { name: /Features/i }).first().click();
    
    // Wait for scroll
    await page.waitForTimeout(500);
    
    // Check features section is in view
    await expect(page.locator('#features')).toBeInViewport();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/features-navigation.png' });
  });

  test('should navigate to jobs section when clicking Jobs link', async ({ page }) => {
    // Click Jobs link
    await page.getByRole('link', { name: /Jobs/i }).first().click();
    
    // Wait for scroll
    await page.waitForTimeout(500);
    
    // Check jobs section is in view
    await expect(page.locator('#jobs')).toBeInViewport();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/jobs-navigation.png' });
  });

  test('should navigate to about section when clicking About link', async ({ page }) => {
    // Click About link
    await page.getByRole('link', { name: /About/i }).first().click();
    
    // Wait for scroll
    await page.waitForTimeout(500);
    
    // Check about section is in view
    await expect(page.locator('#about')).toBeInViewport();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/about-navigation.png' });
  });

  test('should navigate to pricing section when clicking Pricing link', async ({ page }) => {
    // Click Pricing link
    await page.getByRole('link', { name: /Pricing/i }).first().click();
    
    // Wait for scroll
    await page.waitForTimeout(500);
    
    // Check pricing section is in view
    await expect(page.locator('#pricing')).toBeInViewport();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/pricing-navigation.png' });
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    // Navigate to invalid route
    await page.goto('/invalid-route-that-does-not-exist');
    
    // Check 404 page is displayed
    await expect(page).toHaveURL(/invalid-route/);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/404-page.png' });
  });
});
