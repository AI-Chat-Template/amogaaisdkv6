import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('Capture Sign-In Page', async ({ page }) => {
  // Go to correct route
  await page.goto('http://localhost:3000/login');

  // Wait for the Welcome heading
  await page.getByRole('heading', { name: 'Welcome' }).waitFor();

  // Wait for Sign In button using visible text
  await page.getByRole('button', { name: 'Sign In' }).waitFor();

  // Take Percy snapshot
  await percySnapshot(page, 'Sign-In Page');
});