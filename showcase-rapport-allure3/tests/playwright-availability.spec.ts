import { test, expect } from '@playwright/test';

test.describe('Playwright website beschikbaarheid', () => {
  test('Playwright site is bereikbaar en operationeel', async ({ page }) => {
    // Given: de gebruiker navigeert naar "https://playwright.dev"
    const response = await page.goto('https://playwright.dev');

    // Then: is de HTTP-statuscode 200
    expect(response?.status()).toBe(200);

    // When: de pagina volledig is geladen
    await page.waitForLoadState('networkidle');

    // Then: bevat de paginatitel "Playwright"
    const title = await page.title();
    expect(title).toContain('Playwright');

    // Then: is het hoofdmenu zichtbaar
    const navbar = page.locator('nav, [role="navigation"]');
    await expect(navbar).toBeVisible();
  });
});
