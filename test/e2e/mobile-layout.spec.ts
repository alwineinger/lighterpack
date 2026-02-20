import { test, expect } from '@playwright/test';

import { testRoot } from './utils';
import { registerUser } from './auth-utils';

async function registerAndOpenList(page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(testRoot);

  const now = Date.now();
  const username = `mobile${viewport.width}${now}`;
  const email = `mobile+${viewport.width}${now}@lighterpack.com`;
  const password = 'testtest';

  await registerUser(page, username, password, email);
}

async function getHorizontalOverflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
}

async function getMinTabTouchTarget(page) {
  return page.locator('.lpMobileTabButton').evaluateAll((nodes) => {
    if (!nodes.length) {
      return 0;
    }
    return Math.min(...nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return Math.min(rect.height, rect.width);
    }));
  });
}

test.describe('Mobile layout', () => {
  test('should be editable without horizontal overflow on iPhone 16 Pro portrait', async ({ page }) => {
    await registerAndOpenList(page, { width: 393, height: 852 });

    await page.getByPlaceholder('Name').first().fill('Tent');
    await page.getByPlaceholder('Description').first().fill('2P');
    await page.getByLabel('Item weight').first().fill('32');
    await page.getByLabel('Item quantity').first().fill('1');

    const overflow = await getHorizontalOverflow(page);
    expect(overflow).toBeLessThan(24);

    await expect(page.getByRole('heading', { name: /Totals/i })).toBeVisible();
    await expect(page.getByPlaceholder('List Name')).toHaveCSS('font-size', '24px');

    await page.getByText('Share', { exact: false }).first().click();
    await expect(page.getByLabel('Share your list')).toBeVisible();
    await expect(page.getByRole('link', { name: /Export to CSV/i })).toBeVisible();

    await page.getByText('Settings', { exact: false }).first().click();
    await page.getByLabel('Item images').check();
    await page.getByPlaceholder('Name').first().click();
    await page.getByRole('img').first().click();
    await expect(page.locator('#lpImageDialog img')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lpImageDialog img')).toBeHidden();

    const minTouchTarget = await getMinTabTouchTarget(page);
    expect(minTouchTarget).toBeGreaterThanOrEqual(36);
  });

  test('should remain editable and compact at 375px width', async ({ page }) => {
    await registerAndOpenList(page, { width: 375, height: 812 });

    await page.getByPlaceholder('Name').first().fill('Quilt');
    await page.getByLabel('Item weight').first().fill('20');

    await expect(page.getByText('Add new category')).toBeVisible();
    await expect(page.getByPlaceholder('Name').first()).toHaveCSS('font-size', '16px');

    await page.getByText('Share', { exact: false }).first().click();
    await expect(page.getByLabel('Share your list')).toBeVisible();

    await page.getByText('Help', { exact: false }).first().click();
    await expect(page.locator('#help h2')).toBeVisible();
    const helpOverflow = await page.evaluate(() => {
      const modal = document.getElementById('help');
      if (!modal) return 0;
      return modal.scrollWidth - modal.clientWidth;
    });
    expect(helpOverflow).toBeLessThanOrEqual(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('#help h2')).toBeHidden();

    const overflow = await getHorizontalOverflow(page);
    expect(overflow).toBeLessThan(24);
  });

  test('should support list/lists/gear tabs in compact landscape-like constraints', async ({ page }) => {
    await registerAndOpenList(page, { width: 852, height: 393 });

    await page.getByPlaceholder('List Name').fill('Shared State Pack');
    await page.getByPlaceholder('Name').first().fill('Nav item');

    await expect(page.getByRole('link', { name: 'Lists' })).toBeVisible();
    await page.getByRole('link', { name: 'Lists' }).click();
    await expect(page.getByRole('heading', { name: 'Lists' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();

    await page.getByRole('link', { name: 'Gear' }).click();
    await expect(page.getByRole('heading', { name: 'Gear' })).toBeVisible();
    const minTouchTarget = await getMinTabTouchTarget(page);
    expect(minTouchTarget).toBeGreaterThanOrEqual(36);
    await page.mouse.wheel(0, 500);
    await expect(page.getByRole('link', { name: 'List' })).toBeVisible();

    await page.getByRole('link', { name: 'List' }).click();
    await expect(page.getByPlaceholder('List Name')).toHaveValue('Shared State Pack');
    await expect(page.getByPlaceholder('Name').first()).toHaveValue('Nav item');

    const overflow = await getHorizontalOverflow(page);
    expect(overflow).toBeLessThan(24);
  });
});
