import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, email: string, password = 'Admin123!') {
  await page.goto('/login');
  // Force English to avoid i18n selector mismatches
  await page.evaluate(() => localStorage.setItem('i18nextLng', 'en'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  await expect(page.locator('text=Good morning')).toBeVisible({ timeout: 10000 });
}

export async function loginAsOwner(page: Page) {
  await loginAs(page, 'owner@metrobus.com');
}

export async function loginAsStaff(page: Page) {
  await loginAs(page, 'driver1@metrobus.com');
}

export async function logout(page: Page) {
  await page.click('text=Sign out');
  await page.waitForURL('/login');
}
