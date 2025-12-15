import { test, expect } from '@playwright/test';

test.describe('Job Cards Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Scroll to jobs section
    await page.locator('#jobs').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  test('should display job cards with correct information', async ({ page }) => {
    // Check Microsoft job card
    const microsoftCard = page.locator('text=Microsoft Copilot Engineer').first();
    await expect(microsoftCard).toBeVisible();
    
    // Check Google job card
    const googleCard = page.locator('text=Google CCAI Specialist').first();
    await expect(googleCard).toBeVisible();
    
    // Check Amazon job card
    const amazonCard = page.locator('text=Amazon Lex Developer').first();
    await expect(amazonCard).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/job-cards.png' });
  });

  test('should display job card details', async ({ page }) => {
    // Check job details are visible
    await expect(page.getByText('Seattle, WA').first()).toBeVisible();
    await expect(page.getByText(/\$150K - \$200K/i).first()).toBeVisible();
    await expect(page.getByText('2 days ago').first()).toBeVisible();
  });

  test('should display match percentage badges', async ({ page }) => {
    // Check match badges
    await expect(page.getByText('95% Match').first()).toBeVisible();
    await expect(page.getByText('92% Match').first()).toBeVisible();
  });

  test('should display skill tags on job cards', async ({ page }) => {
    // Check skill tags
    await expect(page.getByText('AI').first()).toBeVisible();
    await expect(page.getByText('Copilot').first()).toBeVisible();
    await expect(page.getByText('TypeScript').first()).toBeVisible();
  });

  test('should have View Details button on job cards', async ({ page }) => {
    // Check View Details buttons
    const viewDetailsButtons = page.getByRole('button', { name: /View Details/i });
    await expect(viewDetailsButtons.first()).toBeVisible();
  });

  test('should be clickable job cards', async ({ page }) => {
    // Find a job card and click it
    const jobCard = page.locator('text=Microsoft Copilot Engineer').first();
    await jobCard.click();
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/job-card-clicked.png' });
  });
});
