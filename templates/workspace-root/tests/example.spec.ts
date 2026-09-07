import { test, expect } from '@playwright/test';

test('renders response from api', async ({ page }) => {
  await page.goto('');

  await expect(page.locator('body')).toHaveText(/Response: Hello world/);
});
