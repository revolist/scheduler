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

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('revo-grid').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('tablist', { name: 'Scheduler workspace' })).toBeVisible();
  await expect(page.getByRole('gridcell').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Calendar', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Scheduler view' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Calendar preset' })).toBeVisible();
  await expect(page.getByRole('tablist', { name: 'Scheduler workspace' })).toHaveClass('rv-segmented-switch');
  await expect(page.getByRole('group', { name: 'Scheduler view' })).toHaveClass('rv-segmented-switch');
  const tableControl = page.getByRole('tab', { name: 'Table', exact: true });
  await tableControl.click();
  await expect(tableControl).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('revo-grid.event-scheduler-shift-week-table, revo-grid.event-scheduler-shift-week-table__grid')).toBeVisible();
  const screenshot = await page.locator('body').screenshot({ animations: 'disabled' });
  expect(screenshot.byteLength).toBeGreaterThan(10_000);
  expect(errors).toEqual([]);
});
