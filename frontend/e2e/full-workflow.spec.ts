import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers';

test.describe('Full Rental Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('create booking page loads and shows wizard steps', async ({ page }) => {
    await page.goto('/default/bookings/new');
    await expect(page.locator('text=Select Customer')).toBeVisible();

    // Verify wizard step indicators are present
    const steps = page.locator('[class*="h-2 rounded-full"]');
    await expect(steps.first()).toBeVisible();

    // Select a customer — click first customer card
    const customerBtn = page.locator('button:has-text("Robert")').or(page.locator('[class*="border"]:has-text("Robert")')).first();
    if (await customerBtn.isVisible({ timeout: 3000 })) {
      await customerBtn.click();
    }

    // Should still be on the booking page
    await expect(page.locator('text=New Booking').first()).toBeVisible();
  });

  test('customer management flow', async ({ page }) => {
    await page.click('text=Customers');
    await page.waitForURL('/default/customers');
    // Customer appears in table — use first match in table context
    await expect(page.locator('table').locator('text=Robert Thompson').first()).toBeVisible();

    // Open add customer form
    await page.click('text=Add Customer');
    await page.waitForTimeout(500);

    // Fill form
    await page.fill('input[placeholder="First Name *"]', 'Test');
    await page.fill('input[placeholder="Last Name *"]', 'Customer');
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.fill('input[placeholder="Phone"]', '555-0100');

    // Save
    await page.click('button:has-text("Save Customer")');
    await page.waitForTimeout(1000);

    // Verify appeared in list (may have duplicates from previous runs)
    await expect(page.locator('text=Test Customer').first()).toBeVisible();
  });

  test('booking detail shows all sections', async ({ page }) => {
    await page.click('text=Bookings');
    await page.waitForURL('/default/bookings');

    // Click first booking
    await page.locator('text=BK-2026-0001').first().click();
    await page.waitForURL(/\/bookings\//);

    // Check sections exist
    await expect(page.locator('text=Details')).toBeVisible();
    await expect(page.locator('text=Financials')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('invoices list shows seed data', async ({ page }) => {
    await page.goto('/default/invoices');
    await page.waitForURL('/default/invoices');
    // Invoice rows should exist in the table
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=INV-2026').first()).toBeVisible({ timeout: 5000 });
  });

  test('invoice detail shows payment history', async ({ page }) => {
    await page.goto('/default/invoices');
    await page.waitForURL('/default/invoices');
    // Click first invoice link
    const firstLink = page.locator('a[href*="/invoices/"]').first();
    await firstLink.click();
    await page.waitForURL(/\/invoices\//);

    // Check financial summary
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Paid').first()).toBeVisible();
    await expect(page.locator('text=Due')).toBeVisible();
    await expect(page.getByText('Payment History').or(page.getByText('Payments'))).toBeVisible({ timeout: 5000 });
  });
});
