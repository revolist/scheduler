import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const feature = JSON.parse(
  readFileSync(new URL('../../feature.json', import.meta.url), 'utf8'),
) as { title: string };

test(`${feature.title} mounts without browser errors`, async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.locator('revo-grid').first()).toBeVisible({ timeout: 15_000 });
  const screenshot = await page.locator('body').screenshot({ animations: 'disabled' });
  expect(screenshot.byteLength).toBeGreaterThan(10_000);
  expect(errors).toEqual([]);
});
