import { test, expect } from '@playwright/test';
import { loginAsOwner, loginAsStaff, logout } from './helpers';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=VeloDrive').first()).toBeVisible();
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('can login as owner and see dashboard', async ({ page }) => {
    await loginAsOwner(page);
    await expect(page.locator('text=Good morning')).toBeVisible();
  });

  test('can login as staff and see dashboard', async ({ page }) => {
    await loginAsStaff(page);
    await expect(page.locator('text=Good morning')).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('can logout', async ({ page }) => {
    await loginAsOwner(page);
    await logout(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Create an account');
    await page.waitForURL('/register');
    await expect(page.locator('input').first()).toBeVisible();
  });
});
