import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with correct title and branding', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/AIJobHub|AI Job/i);
    
    // Check logo/branding is visible
    await expect(page.getByText('AIJobHub')).toBeVisible();
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'test-results/screenshots/homepage.png', fullPage: true });
  });

  test('should display hero section with main heading', async ({ page }) => {
    // Check hero heading
    await expect(page.getByRole('heading', { name: /Land Your Dream/i })).toBeVisible();
    await expect(page.getByText(/AI Job Today/i)).toBeVisible();
    
    // Check hero description
    await expect(page.getByText(/The only platform specialized for AI careers/i)).toBeVisible();
  });

  test('should display navigation links', async ({ page }) => {
    // Check navigation items
    await expect(page.getByRole('link', { name: /Features/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Jobs/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /About/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Pricing/i })).toBeVisible();
  });

  test('should display Sign In and Get Started buttons', async ({ page }) => {
    // Check auth buttons
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
  });

  test('should display featured jobs section', async ({ page }) => {
    // Scroll to jobs section
    await page.locator('#jobs').scrollIntoViewIfNeeded();
    
    // Check featured jobs heading
    await expect(page.getByRole('heading', { name: /Featured AI Roles/i })).toBeVisible();
    
    // Check job cards are displayed
    await expect(page.getByText('Microsoft Copilot Engineer')).toBeVisible();
    await expect(page.getByText('Google CCAI Specialist')).toBeVisible();
    
    // Take screenshot of jobs section
    await page.screenshot({ path: 'test-results/screenshots/featured-jobs.png' });
  });

  test('should display features section', async ({ page }) => {
    // Scroll to features section
    await page.locator('#features').scrollIntoViewIfNeeded();
    
    // Check features heading
    await expect(page.getByRole('heading', { name: /Everything You Need to Land AI Jobs/i })).toBeVisible();
    
    // Check feature cards
    await expect(page.getByText('AI-Powered Job Matching')).toBeVisible();
    await expect(page.getByText('Resume ATS Optimization')).toBeVisible();
    await expect(page.getByText('Mock AI Interviews')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    
    // Check pricing heading
    await expect(page.getByRole('heading', { name: /Start Free, Scale as You Grow/i })).toBeVisible();
    
    // Check pricing tiers
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
    
    // Take screenshot of pricing section
    await page.screenshot({ path: 'test-results/screenshots/pricing-section.png' });
  });

  test('should display stats section', async ({ page }) => {
    // Check stats
    await expect(page.getByText('10,000+')).toBeVisible();
    await expect(page.getByText('AI Jobs Tracked')).toBeVisible();
    await expect(page.getByText('500+')).toBeVisible();
    await expect(page.getByText('Companies Monitored')).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Check footer content
    await expect(page.getByText('© 2024 AIJobHub. All rights reserved.')).toBeVisible();
  });
});
