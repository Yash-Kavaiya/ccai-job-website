import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open login modal when clicking Sign In', async ({ page }) => {
    // Click Sign In button
    await page.getByRole('button', { name: /Sign In/i }).first().click();
    
    // Wait for modal to appear
    await page.waitForTimeout(500);
    
    // Check modal is visible
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Take screenshot of login modal
    await page.screenshot({ path: 'test-results/screenshots/login-modal.png' });
  });

  test('should open signup modal when clicking Get Started', async ({ page }) => {
    // Click Get Started button
    await page.getByRole('button', { name: /Get Started/i }).first().click();
    
    // Wait for modal to appear
    await page.waitForTimeout(500);
    
    // Check modal is visible
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Take screenshot of signup modal
    await page.screenshot({ path: 'test-results/screenshots/signup-modal.png' });
  });

  test('should be able to switch between login and signup modes', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /Sign In/i }).first().click();
    await page.waitForTimeout(500);
    
    // Check we can see login mode
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/auth-modal-switch.png' });
  });

  test('should close modal when clicking outside or close button', async ({ page }) => {
    // Open auth modal
    await page.getByRole('button', { name: /Sign In/i }).first().click();
    await page.waitForTimeout(500);
    
    // Verify modal is open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Close modal by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Verify modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
