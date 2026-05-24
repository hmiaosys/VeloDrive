import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers';

test.describe('Categories CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('can view categories page with seed data', async ({ page }) => {
    await page.goto('/default/categories');
    await expect(page.getByRole('heading', { name: 'Buses' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vans' })).toBeVisible();
  });

  test('new category form opens with examples panel', async ({ page }) => {
    await page.goto('/default/categories');
    await page.click('button:has-text("New Category")');
    await expect(page.getByText('Examples')).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: 'Create Category' })).toBeVisible();
    // Cancel
    await page.click('button:has-text("Cancel")');
  });

  test('edit button opens form for existing category', async ({ page }) => {
    await page.goto('/default/categories');
    await page.locator('button:has-text("Edit")').first().click();
    await page.waitForTimeout(500);
    // Form should show "Edit Category" or the slug should be visible
    await expect(page.locator('h3:has-text("Edit Category")')).toBeVisible({ timeout: 3000 });
  });
});
