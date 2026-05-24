import { test, expect } from '@playwright/test';

test('register, create note, create and submit form', async ({ page }) => {
  const email = `user-${Date.now()}@test.com`;

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/notes/);
  await page.getByLabel('Title').fill('E2E note');
  await page.getByLabel('Body').fill('Hello from Playwright');
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByText('E2E note')).toBeVisible();

  await page.getByRole('link', { name: 'Forms' }).click();
  await page.getByRole('button', { name: 'Create default form' }).click();
  await page.getByRole('button', { name: 'Fill' }).first().click();
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Email', { exact: true }).fill('e2e@test.com');
  await page.getByLabel('Message').fill('Feedback');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Submitted successfully!')).toBeVisible();
});
