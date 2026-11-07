import { expect, test, type Page } from '@playwright/test';

// Source fixture covers the shared model through the real TypeScript component.
// Angular production smoke coverage uses the separately built application entry.
test.skip(process.env.SCHEDULER_E2E_FRAMEWORK === 'angular', 'Property Booking source fixture uses the TypeScript host.');

async function mount(page: Page) {
  await page.goto('/tests/e2e/property-booking.html');
  await expect(page.getByRole('button', { name: 'New booking', exact: true })).toBeEnabled();
  await expect(page.locator('.property-booking-resource')).toHaveCount(8);
}

async function filterProperties(page: Page, value: string) {
  const button = page.getByRole('button', { name: 'Filter properties', exact: true });
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  const dialog = page.locator('.filter-panel-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('#add-filter').selectOption('contains');
  await dialog.getByRole('textbox', { name: 'Enter value...' }).fill(value);
  await dialog.getByRole('button', { name: 'ok', exact: true }).click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
}

async function selectType(page: Page, type: string) {
  await page.getByRole('combobox', { name: 'Property type', exact: true }).click();
  await page.getByRole('option', { name: type, exact: true }).click();
}

test('native filters and toolbar scope agree with selection, totals and Reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page);
  await filterProperties(page, 'a');
  await expect(page.locator('.property-booking-resource')).toHaveCount(6);
  await page.getByRole('checkbox', { name: 'Select all properties', exact: true }).check();
  await expect(page.locator('[data-selected]')).toHaveText('6');
  await expect(page.locator('[aria-label="Booked properties, 2026-10-19: 2"]')).toHaveText('2');
  await selectType(page, 'Villa');
  await expect(page.locator('.property-booking-resource')).toHaveCount(2);
  await expect(page.locator('[data-selected]')).toHaveText('2');
  await page.getByRole('button', { name: 'New booking', exact: true }).click();
  await page.getByRole('combobox', { name: 'Property', exact: true }).click();
  await expect(page.getByRole('option')).toHaveCount(2);
  await expect(page.getByRole('option', { name: 'Sunset Villa', exact: true })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Garden Retreat', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await selectType(page, 'All properties');
  await expect(page.locator('.property-booking-resource')).toHaveCount(6);
  await expect(page.locator('[data-selected]')).toHaveText('6');
  await page.getByRole('button', { name: 'Filter properties', exact: true }).click();
  await page.locator('.filter-panel-dialog').getByRole('button', { name: 'reset', exact: true }).click();
  await expect(page.locator('.property-booking-resource')).toHaveCount(8);
  await page.getByRole('checkbox', { name: 'Select all properties', exact: true }).check();
  await expect(page.locator('[data-selected]')).toHaveText('8');
  for (const checkbox of await page.getByRole('checkbox', { name: /^Include .* in totals$/ }).all()) {
    await expect(checkbox).toBeChecked();
  }
  await page.screenshot({ path: 'test-results/property-booking-filter-reset.png' });
  expect(errors).toEqual([]);
});

test('empty native filter scope disables creation and reconnect cleans up listeners', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page);
  await filterProperties(page, 'No matching property');
  await expect(page.locator('.property-booking-resource')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New booking', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Unmount booking demo', exact: true }).click();
  await expect(page.locator('revo-grid')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mount booking demo', exact: true }).click();
  await expect(page.locator('.property-booking-resource')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'New booking', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Filter properties', exact: true }).click();
  await expect(page.locator('.filter-panel-dialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test('navigation rejects dates beyond the supported calendar bounds', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page);
  await page.getByRole('textbox', { name: 'View from', exact: true }).fill('9999-12-15');
  await page.getByRole('textbox', { name: 'View to', exact: true }).fill('9999-12-28');
  await expect(page.getByRole('status')).toContainText('View range updated');
  await page.getByRole('button', { name: 'Next week', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'View from', exact: true })).toHaveValue('9999-12-15');
  await expect(page.getByRole('textbox', { name: 'View to', exact: true })).toHaveValue('9999-12-28');
  await expect(page.getByRole('status')).toContainText('Choose an ordered date range');
  await page.getByRole('textbox', { name: 'View from', exact: true }).fill('0001-01-01');
  await page.getByRole('textbox', { name: 'View to', exact: true }).fill('0001-01-14');
  await expect(page.getByRole('status')).toContainText('View range updated');
  await page.getByRole('button', { name: 'Previous week', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'View from', exact: true })).toHaveValue('0001-01-01');
  await expect(page.getByRole('textbox', { name: 'View to', exact: true })).toHaveValue('0001-01-14');
  await expect(page.getByRole('status')).toContainText('Choose an ordered date range');
  expect(errors).toEqual([]);
});
