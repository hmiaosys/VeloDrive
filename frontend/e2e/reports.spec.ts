import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('shows fleet utilization with items', async ({ page }) => {
    await page.goto('/default/reports');
    await expect(page.getByText('Fleet Utilization')).toBeVisible();
    await expect(page.getByText('Booking Pipeline')).toBeVisible();
    await expect(page.getByText('Quote Conversion')).toBeVisible();
    await expect(page.getByText('Customer Value')).toBeVisible();
  });

  test('can switch period to 12 months', async ({ page }) => {
    await page.goto('/default/reports');
    await page.click('text=12M');
    await page.waitForTimeout(500);
    await expect(page.locator('text=12M').first()).toBeVisible();
  });

  test('shows top customers list', async ({ page }) => {
    await page.goto('/default/reports');
    await expect(page.getByText('Top Customers by Bookings').or(page.getByText('Top Customers'))).toBeVisible({ timeout: 5000 });
  });

  test('shows new vs returning breakdown', async ({ page }) => {
    await page.goto('/default/reports');
    await expect(page.getByText('Returning')).toBeVisible();
    await expect(page.getByText('Once')).toBeVisible();
  });
});
