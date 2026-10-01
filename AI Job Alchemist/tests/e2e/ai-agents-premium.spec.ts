import { test, expect } from '@playwright/test';

test.describe('AI Agents premium teaser', () => {
  test('unauthenticated users cannot access premium page', async ({ page }) => {
    await page.goto('/ai-agents');
    await expect(page).toHaveURL(/\/login/);
  });
});
