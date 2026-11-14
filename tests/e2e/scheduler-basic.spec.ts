import { expect, test } from '@playwright/test';

test('basic example starts with room to create events', async ({ page }) => {
  await page.goto('/tests/e2e/scheduler-basic.html');
  const grid = page.locator('revo-grid.scheduler-basic');
  await expect(grid.locator('.event-scheduler-resource-cell__name')).toHaveCount(8);
  await expect(grid.locator('.event-scheduler-event__button')).toHaveCount(3);
  const event = grid.locator('[data-event-scheduler-event-id="event-5"] .event-scheduler-event__button');
  const box = (await event.boundingBox())!;
  await page.mouse.move(box.x + box.width + 20, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 124, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(grid.locator('.event-scheduler-event__button')).toHaveCount(4);
});
