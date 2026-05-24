import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('shows operational stat cards', async ({ page }) => {
    await expect(page.getByText('On Rent Now')).toBeVisible();
    await expect(page.getByText('Available Today')).toBeVisible();
    await expect(page.getByText('Pending Quotes')).toBeVisible();
    await expect(page.getByText('Active This Week')).toBeVisible();
  });

  test('shows today schedule section', async ({ page }) => {
    await expect(page.getByText('Today\'s Schedule').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows needs attention section', async ({ page }) => {
    await expect(page.getByText('Needs Attention')).toBeVisible();
    await expect(page.getByText('Unpaid Invoices')).toBeVisible();
    await expect(page.getByText('Draft Bookings')).toBeVisible();
    await expect(page.getByText('Quotes Expiring Soon')).toBeVisible();
  });

  test('stat cards are clickable links', async ({ page }) => {
    await page.click('text=On Rent Now');
    await page.waitForURL('/default/bookings');
    await expect(page).toHaveURL('/default/bookings');
  });
});
