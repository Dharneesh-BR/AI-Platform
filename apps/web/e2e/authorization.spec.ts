import { expect, test } from '@playwright/test';
import { loginWithEmail, skipWithoutCredentials } from './helpers/auth';

test.describe('protected application shell', () => {
  test('hides protected workspace from logged-out users', async ({ page }) => {
    await page.goto('/workforce');
    await expect(page).toHaveURL(/\/login\?next=%2Fworkforce/);
    await expect(page.getByText('Guest user')).toHaveCount(0);
  });

  test('authenticated users can open the AI Workforce entry point', async ({ page }) => {
    skipWithoutCredentials();

    await loginWithEmail(page);
    await page.getByRole('link', { name: 'AI Workforce' }).click();
    await expect(page).toHaveURL(/\/workforce/);
  });
});
