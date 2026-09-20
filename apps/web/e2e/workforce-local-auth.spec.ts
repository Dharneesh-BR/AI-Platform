import { expect, test } from '@playwright/test';

test('local workforce chat sends without a Firebase session exchange', async ({ page }) => {
  test.skip(process.env.E2E_LOCAL_AUTH_TEST !== 'true', 'Requires the existing local-auth development server.');
  let sessionRequests = 0;
  let sentMessage: unknown;
  let localHeaderPresent = false;
  const conversation = { id: 'test-chat', title: 'Marketing chat', messages: [] };
  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/auth/session')) sessionRequests += 1;
    if (path.endsWith('/agents')) data = [{ slug: 'marketing', name: 'Marketing', department: 'Marketing', enabled: true, capabilities: [] }];
    if (path.endsWith('/projects')) data = [{ id: 'test-project', name: 'Test project' }];
    if (path.endsWith('/conversations')) data = request.method() === 'POST' ? conversation : [conversation];
    if (path.endsWith('/messages')) {
      sentMessage = request.postDataJSON();
      localHeaderPresent = Boolean(request.headers()['x-magnafic-auth-bypass']);
      data = { ...conversation, mode: 'sync' };
    }
    await route.fulfill({ json: data });
  });
  await page.goto('/workforce/marketing');
  await expect(page.getByRole('heading', { name: 'Marketing chat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New chat', exact: true })).toBeEnabled();
  await page.locator('textarea').fill('Test marketing request');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Answered by Marketing.')).toBeVisible();
  expect(sentMessage).toEqual({ content: 'Test marketing request', agentSlug: 'marketing' });
  expect(localHeaderPresent).toBe(true);
  expect(sessionRequests).toBe(0);
});
