import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/property-booking.html');
  await expect(page.getByRole('button', { name: 'New booking', exact: true })).toBeEnabled();
});

test('PB-01 rejects unsupported early years before estimate, save or range acceptance', async ({ page }) => {
  await page.getByRole('button', { name: 'New booking', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New booking', exact: true });
  await dialog.getByLabel('Guest name', { exact: true }).fill('QA early year');
  await dialog.getByLabel('Check-in', { exact: true }).fill('0099-12-31');
  await dialog.getByLabel('Check-out', { exact: true }).fill('0100-01-01');
  await expect(dialog.locator('.property-booking-form__estimate')).toContainText('0100');
  await dialog.getByRole('button', { name: 'Save booking', exact: true }).click();
  await expect(dialog.getByRole('alert').last()).toContainText('0100');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByLabel('View from', { exact: true }).fill('0099-12-25');
  await expect(page.locator('.property-booking-demo__message')).toContainText('0100');
});

test('PB-02 ordinary overlap provides booking and dates', async ({ page }) => {
  await page.getByRole('button', { name: 'New booking', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New booking', exact: true });
  await dialog.getByLabel('Guest name', { exact: true }).fill('QA conflict');
  await dialog.getByRole('combobox', { name: 'Property', exact: true }).click();
  await page.getByRole('option', { name: 'Birch Cottage', exact: true }).click();
  await dialog.getByLabel('Check-in', { exact: true }).fill('2026-10-19');
  await dialog.getByLabel('Check-out', { exact: true }).fill('2026-10-21');
  await dialog.getByRole('button', { name: 'Save booking', exact: true }).click();
  await expect(dialog.locator('.property-booking-form__error')).toContainText('Jamie Wilson');
  await expect(dialog.locator('.property-booking-form__error')).toContainText('2026-10-24');
});

test('PB-03 empty scope has no rates and restores rates on clearing filters', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Property type', exact: true }).click();
  await page.getByRole('option', { name: 'Cabin', exact: true }).click();
  await page.getByRole('combobox', { name: 'Minimum sleeps', exact: true }).click();
  await page.getByRole('option', { name: '8+ guests', exact: true }).click();
  await expect(page.getByText('No properties match these filters.', { exact: true })).toBeVisible();
  await expect(page.locator('.property-booking-rate')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New booking', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Minimum sleeps', exact: true }).click();
  await page.getByRole('option', { name: 'Any', exact: true }).click();
  await expect(page.locator('.property-booking-rate').first()).toContainText('€145');
});

test('PB-02 maintenance rejection identifies the unavailable interval', async ({ page }) => {
  await page.getByRole('button', { name: 'New booking', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New booking', exact: true });
  await dialog.getByLabel('Guest name', { exact: true }).fill('QA maintenance');
  await dialog.getByRole('combobox', { name: 'Property', exact: true }).click();
  await page.getByRole('option', { name: 'Garden Retreat', exact: true }).click();
  await dialog.getByLabel('Check-in', { exact: true }).fill('2026-10-23');
  await dialog.getByLabel('Check-out', { exact: true }).fill('2026-10-25');
  await dialog.getByRole('button', { name: 'Save booking', exact: true }).click();
  await expect(dialog.locator('.property-booking-form__error')).toContainText('Maintenance (2026-10-23 → 2026-10-25)');
});
