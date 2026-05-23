import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers';

test.describe('Items Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('items list shows seed data', async ({ page }) => {
    await page.click('text=Items');
    await page.waitForURL('/items');
    await expect(page.locator('text=Mercedes-Benz Tourismo')).toBeVisible();
    await expect(page.locator('text=Volvo 9700')).toBeVisible();
    await expect(page.locator('text=Setra S 511')).toBeVisible();
    await expect(page.locator('text=Yutong TC12')).toBeVisible();
    await expect(page.locator('text=Mercedes Sprinter')).toBeVisible();
  });

  test('category filter works', async ({ page }) => {
    await page.goto('/items');
    await page.selectOption('select', { label: 'Buses' });
    await expect(page.locator('text=Mercedes Sprinter')).not.toBeVisible();
    await expect(page.locator('text=Mercedes-Benz Tourismo')).toBeVisible();
  });

  test('search filters items', async ({ page }) => {
    await page.goto('/items');
    await page.fill('input[type="search"]', 'Volvo');
    await expect(page.locator('text=Volvo 9700')).toBeVisible();
    await expect(page.locator('text=Mercedes-Benz Tourismo')).not.toBeVisible();
  });

  test('add item button is visible', async ({ page }) => {
    await page.goto('/items');
    await expect(page.locator('text=Add Item')).toBeVisible();
  });

  test('navigates between pages via sidebar', async ({ page }) => {
    await page.click('text=Dashboard');
    await page.waitForURL('/');
    await expect(page.locator('text=Good morning')).toBeVisible();

    await page.click('text=Items');
    await page.waitForURL('/items');
    await expect(page.locator('text=Manage your rentable items')).toBeVisible();

    await page.click('text=Customers');
    await page.waitForURL('/customers');
    await expect(page.locator('text=Add Customer')).toBeVisible();
  });
});
