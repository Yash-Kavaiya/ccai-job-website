import { test, expect } from '@playwright/test';

async function clearAuth(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

test.describe('Role-specific auth paths', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('candidate login page has no role selector and links to recruiter', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Candidate', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Welcome to AIJobHub')).toBeVisible();
    await expect(page.getByText('I am a')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Recruiter sign in/i })).toHaveAttribute('href', '/recruiter/login');
    await expect(page.getByRole('link', { name: /^Sign up$/i })).toHaveAttribute('href', '/signup');
  });

  test('candidate signup page is role-fixed', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByText('Candidate', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('I am a')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Create employer account/i })).toHaveAttribute(
      'href',
      '/recruiter/signup'
    );
  });

  test('recruiter login page is employer-scoped', async ({ page }) => {
    await page.goto('/recruiter/login');
    await expect(page.getByText('Employer', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Recruiter Portal')).toBeVisible();
    await expect(page.getByRole('link', { name: /Candidate sign in/i })).toHaveAttribute('href', '/login');
  });

  test('recruiter signup page is employer-scoped', async ({ page }) => {
    await page.goto('/recruiter/signup');
    await expect(page.getByText('Employer', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Candidate sign up/i })).toHaveAttribute('href', '/signup');
  });

  test('protected candidate route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/candidate/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected recruiter route redirects unauthenticated users to recruiter login', async ({ page }) => {
    await page.goto('/recruiter/dashboard');
    await expect(page).toHaveURL(/\/recruiter\/login/);
  });

  test('ai-agents redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/ai-agents');
    await expect(page).toHaveURL(/\/login/);
  });
});
