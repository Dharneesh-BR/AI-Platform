import { expect, test } from '@playwright/test';
import { loginWithEmail, skipWithoutCredentials } from './helpers/auth';

test.describe('authentication', () => {
  test('redirects unauthenticated dashboard access to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /checking your magnafic ai session/i })).toBeVisible();
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await expect(page.getByRole('heading', { name: /welcome back to magnafic ai/i })).toBeVisible();
  });

  test('signs in with Firebase email/password and loads dashboard', async ({ page }) => {
    skipWithoutCredentials();

    await loginWithEmail(page);
    await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
  });
});
