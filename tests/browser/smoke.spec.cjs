const { test, expect } = require('@playwright/test');

test('built homepage is served as HTML', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^text\/html/);
  await expect(page.locator('h1')).toContainText('Qusai');
});
