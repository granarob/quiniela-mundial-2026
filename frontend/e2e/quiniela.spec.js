import { test, expect } from '@playwright/test';

test('has title and landing page content', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Check title
  await expect(page).toHaveTitle(/Quiniela Mundial 2026/);

  // Check some text on the landing page
  await expect(page.locator('h1').first()).toContainText('El Mundial a tu alcance');
});
