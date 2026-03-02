import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.setTimeout(120000); // Increase test timeout to 2 minutes

test('Login → Role-Menu → Product2 → Capture', async ({ page }) => {

  // 1️⃣ Open login
  await page.goto('/signin');

  // 2️⃣ Login
  await page.getByLabel('Email').fill('Ramesh312@gmail.com');
  await page.getByLabel('Password').fill('Ramesh@312');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // 3️⃣ Wait for chat page
  await page.waitForURL('**/chatwithwoodata');

  // 4️⃣ Navigate to role-menu
  await page.goto('/role-menu', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('ul.grid', { timeout: 15000 });

  // 5️⃣ Navigate to product2
  await page.goto('/product2', { 
    waitUntil: 'load',
    timeout: 60000 
  });
  
  // Wait for the products to load - wait for the product grid container
  // The page shows a spinner (animate-spin) while loading, then shows div.space-y-4 with products
  await page.waitForSelector('div.space-y-4', { timeout: 30000 });

  // Confirm URL
  await expect(page).toHaveURL(/product2/);

  // 6️⃣ Capture snapshot
  await percySnapshot(page, 'Product2 Page');
});