import { test, expect } from '@playwright/test';

test.describe('Job Search Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search input in hero section', async ({ page }) => {
    // Check search input is visible
    const searchInput = page.getByPlaceholder(/Search jobs by title, company, or keywords/i);
    await expect(searchInput).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/search-input.png' });
  });

  test('should be able to type in search input', async ({ page }) => {
    // Find and fill search input
    const searchInput = page.getByPlaceholder(/Search jobs by title, company, or keywords/i);
    await searchInput.fill('AI Engineer');
    
    // Verify input value
    await expect(searchInput).toHaveValue('AI Engineer');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/search-filled.png' });
  });

  test('should have Search Jobs button', async ({ page }) => {
    // Check Search Jobs button is visible
    await expect(page.getByRole('button', { name: /Search Jobs/i })).toBeVisible();
  });

  test('should trigger search on Enter key', async ({ page }) => {
    // Fill search input
    const searchInput = page.getByPlaceholder(/Search jobs by title, company, or keywords/i);
    await searchInput.fill('Machine Learning');
    
    // Press Enter
    await searchInput.press('Enter');
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/search-results.png' });
  });

  test('should display View All AI Jobs button', async ({ page }) => {
    // Scroll to jobs section
    await page.locator('#jobs').scrollIntoViewIfNeeded();
    
    // Check View All button is visible
    await expect(page.getByRole('button', { name: /View All AI Jobs/i })).toBeVisible();
  });
});
