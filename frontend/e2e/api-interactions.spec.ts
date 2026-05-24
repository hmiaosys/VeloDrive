import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsStaff } from './helpers';

test.describe('API Interactions', () => {
  test('items page shows seed data via API', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/default/items');
    await expect(page.getByText('Mercedes-Benz Tourismo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Mercedes Sprinter')).toBeVisible();
  });

  test('bookings list shows seed bookings', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/default/bookings');
    await expect(page.locator('text=BK-2026-0001')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=BK-2026-0002')).toBeVisible();
    await expect(page.locator('text=BK-2026-0003')).toBeVisible();
  });

  test('quotes list shows seed quote with status', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/default/quotes');
    await expect(page.locator('text=QUO-2026-0001')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Lisa Brenner')).toBeVisible();
  });

  test('invoices list shows seed invoices', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/default/invoices');
    await expect(page.locator('text=INV-2026-0001')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=INV-2026-0002')).toBeVisible();
  });

  test('dashboard stat cards navigate to pages', async ({ page }) => {
    await loginAsOwner(page);
    await page.locator('text=Available Today').click();
    await page.waitForURL('/default/items');
    await expect(page).toHaveURL('/default/items');
  });

  test('reports page loads all sections', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/default/reports');
    await expect(page.getByText('Fleet Utilization')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Booking Pipeline')).toBeVisible();
    await expect(page.getByText('Quote Conversion')).toBeVisible();
    await expect(page.getByText('Customer Value')).toBeVisible();
  });

  test('settings page shows tenant info', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/default/settings');
    await expect(page.locator('h2:has-text("Business Profile")')).toBeVisible({ timeout: 5000 });
  });

  test('add-ons page loads', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/default/addons');
    await expect(page.getByText('Professional Driver')).toBeVisible({ timeout: 5000 });
  });
});
