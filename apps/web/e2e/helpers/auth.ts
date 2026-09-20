import { expect, type Page, test } from '@playwright/test';

export const e2eCredentials = {
  email: process.env.E2E_USER_EMAIL,
  password: process.env.E2E_USER_PASSWORD,
};

export function skipWithoutCredentials() {
  test.skip(!e2eCredentials.email || !e2eCredentials.password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD for Firebase authenticated E2E.');
}

export async function loginWithEmail(page: Page) {
  if (!e2eCredentials.email || !e2eCredentials.password) {
    throw new Error('Missing E2E credentials.');
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(e2eCredentials.email);
  await page.getByLabel('Password').fill(e2eCredentials.password);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Magnafic', { exact: false })).toBeVisible();
}
