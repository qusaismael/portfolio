const { test, expect } = require('@playwright/test');

for (const route of ['/', '/blog/', '/sites/']) {
  test(`mobile back-to-top stays outside the row action lane on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const button = page.locator('#back-to-top');
    expect(await button.evaluate(el => getComputedStyle(el).position)).toBe('static');
    for (const fraction of [0.25, 0.5, 0.75, 1]) {
      await page.evaluate(f => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction);
      const overlaps = await button.evaluate(el => {
        const a = el.getBoundingClientRect();
        return [...document.querySelectorAll('main a')].filter(link => {
          const b = link.getBoundingClientRect();
          return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        }).length;
      });
      expect(overlaps).toBe(0);
    }
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('.site-header .brand')).toBeFocused();
  });
}

test('About keeps one Zain thumbnail and an accessible experience-photo link', async ({ page }) => {
  await page.goto('/portfolio/');
  await expect(page.locator('main img[src="/pics/qusaiatzain.webp"]')).toHaveCount(1);
  const link = page.locator('#panel-zain a[data-view-photo]');
  await link.click();
  const dialog = page.locator('#memory-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('alt', 'Qusai presenting during his internship at Zain Jordan');
  await expect.poll(() => dialog.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(link).toBeFocused();
});

test('local photo modal supports keyboard traversal and a complete focus loop', async ({ page }) => {
  await page.goto('/photos/');
  const cards = page.locator('.gallery-card');
  const opener = cards.first();
  await opener.focus();
  await page.keyboard.press('Enter');
  const modal = page.locator('#photo-modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('#photo-modal-close')).toBeFocused();
  const first = await modal.locator('#modal-image').getAttribute('src');
  await page.keyboard.press('ArrowRight');
  await expect(modal.locator('#modal-image')).not.toHaveAttribute('src', first);
  await page.keyboard.press('ArrowLeft');
  await expect(modal.locator('#modal-image')).toHaveAttribute('src', first);
  await page.keyboard.press('Shift+Tab');
  await expect(modal.locator('#modal-original')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(modal.locator('#photo-modal-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(opener).toBeFocused();
});
