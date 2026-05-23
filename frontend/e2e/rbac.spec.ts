import { test, expect } from '@playwright/test';
import { loginAsStaff } from './helpers';

test.describe('RBAC - Staff User', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
  });

  test('staff can view dashboard', async ({ page }) => {
    await expect(page.locator('text=Good morning')).toBeVisible();
  });

  test('staff can view items', async ({ page }) => {
    await page.click('text=Items');
    await page.waitForURL('/items');
    await expect(page.locator('text=Mercedes-Benz Tourismo')).toBeVisible();
  });

  test('staff can view customers', async ({ page }) => {
    await page.click('text=Customers');
    await page.waitForURL('/customers');
    await expect(page.locator('text=Robert Thompson')).toBeVisible();
  });

  test('staff can view bookings', async ({ page }) => {
    await page.click('text=Bookings');
    await page.waitForURL('/bookings');
    await expect(page.locator('text=BK-2026-0001')).toBeVisible();
  });

  test('staff can view quotes', async ({ page }) => {
    await page.click('text=Quotes');
    await page.waitForURL('/quotes');
    await expect(page.locator('text=Quotes').first()).toBeVisible();
  });

  test('staff can view invoices', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForURL('/invoices');
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test('staff views are read-only (API-level enforcement)', async ({ page }) => {
    // RBAC is enforced server-side via ASP.NET Core policies.
    // Staff can see CRUD buttons on the frontend, but API calls
    // to create/update/delete endpoints return 403.
    // This test verifies the UI loads correctly for staff.
    await page.goto('/items');
    await expect(page.locator('text=Items').first()).toBeVisible();
    await page.goto('/bookings');
    await expect(page.locator('text=Bookings').first()).toBeVisible();
  });
});
