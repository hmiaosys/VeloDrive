import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers';

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('can view employees list with seed data', async ({ page }) => {
    await page.goto('/default/settings/team');
    // Sarah Johnson appears in both sidebar and the table
    await expect(page.locator('td:has-text("Sarah")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('td:has-text("Michael")').first()).toBeVisible();
    await expect(page.locator('td:has-text("James")').first()).toBeVisible();
    await expect(page.locator('td:has-text("Maria")').first()).toBeVisible();
  });

  test('can invite a new employee', async ({ page }) => {
    await page.goto('/default/settings/team');
    await page.click('button:has-text("Invite Member")');
    await page.waitForTimeout(300);

    await page.fill('input[placeholder="First Name"]', 'Test');
    await page.fill('input[placeholder="Last Name"]', 'Employee');
    await page.fill('input[placeholder="Email"]', 'test2@metrobus.com');

    await page.click('button:has-text("Send Invite")');
    await page.waitForTimeout(1500);

    // Should appear in list or show success toast
    await expect(page.locator('td:has-text("Test")').first()).toBeVisible({ timeout: 5000 });
  });

  test('employees page shows positions', async ({ page }) => {
    await page.goto('/default/settings/team');
    await expect(page.locator('td').filter({ hasText: 'Owner' }).first()).toBeVisible({ timeout: 5000 });
  });
});
