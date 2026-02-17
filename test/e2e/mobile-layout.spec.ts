import { test, expect } from '@playwright/test';

import { testRoot } from './utils';
import { registerUser } from './auth-utils';

test.describe('Mobile layout', () => {
  test('should be editable without horizontal overflow on iPhone-sized viewport', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(testRoot);

    const now = Date.now();
    const username = `mobile${now}`;
    const email = `mobile+${now}@lighterpack.com`;
    const password = 'testtest';

    await registerUser(page, username, password, email);

    await page.getByPlaceholder('Name').first().fill('Tent');
    await page.getByPlaceholder('Description').first().fill('2P');
    await page.getByLabel('Item weight').first().fill('32');
    await page.getByLabel('Item quantity').first().fill('1');

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });

    expect(overflow).toBeLessThan(24);
  });
});
