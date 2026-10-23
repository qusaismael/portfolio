const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api.github.com/**', route => route.abort());
});

test('opening the mobile menu focuses its links and Escape restores the toggle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('#mobile-menu-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const links = page.locator('#main-nav a');
  for (let index = 0; index < await links.count(); index++) {
    await expect(links.nth(index)).toBeFocused();
    if (index + 1 < await links.count()) await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-note-toggle="name-note"]')).toBeFocused();
});

test('one failed gallery image has a useful fallback without hiding healthy photos', async ({ page }) => {
  await page.route('https://feeds.behold.so/**', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'synthetic-broken', mediaType: 'IMAGE', caption: 'Synthetic unavailable photo.', mediaUrl: '/pics/test-unavailable.webp' },
      { id: 'synthetic-healthy', mediaType: 'IMAGE', caption: 'Synthetic healthy photo.', mediaUrl: '/pics/instagram-egypt.jpg' }
    ])
  }));
  await page.route('**/pics/test-unavailable.webp', route => route.abort());
  await page.goto('/photos/');
  const cards = page.locator('.gallery-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.first().locator('.gallery-image-fallback')).toBeVisible();
  await expect(cards.first().locator('img')).toBeHidden();
  await expect(cards.first()).toHaveAccessibleName(/Synthetic unavailable photo.*Photo unavailable/);
  await expect(cards.first().locator('.card-title')).toHaveText('Synthetic unavailable photo.');
  await expect.poll(() => cards.nth(1).locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(cards.nth(1).locator('.gallery-image-fallback')).toBeHidden();
  await expect(cards.nth(1).locator('img')).toBeVisible();
});

test('photo viewer retries a failed image and restores keyboard focus after recovery', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.route('https://feeds.behold.so/**', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'synthetic-retry', mediaType: 'IMAGE', caption: 'Synthetic recovery photo.',
        mediaUrl: '/pics/test-recover.jpg', permalink: 'https://www.instagram.com/p/SYNTHETIC/' }
    ])
  }));
  let requests = 0;
  await page.route('**/pics/test-recover.jpg', route => {
    requests++;
    return requests <= 2 ? route.abort() : route.fulfill({
      contentType: 'image/jpeg', path: 'src/pics/instagram-egypt.jpg'
    });
  });
  await page.goto('/photos/');
  const card = page.locator('.gallery-card').first();
  await expect(card.locator('.gallery-image-fallback')).toBeVisible();
  await card.click();
  const modal = page.locator('#photo-modal');
  const retry = modal.getByRole('button', { name: 'Try again', exact: true });
  await expect(modal.locator('#modal-image-status')).toContainText('could not load');
  await expect(modal.locator('#modal-image')).toBeHidden();
  await expect(retry).toBeVisible();
  await expect(modal.getByRole('link', { name: 'View original on Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/p/SYNTHETIC/');
  await modal.locator('#photo-modal-next').focus();
  await page.keyboard.press('Tab');
  await expect(retry).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => modal.locator('#modal-image').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(modal.locator('#modal-image')).toBeVisible();
  await expect(retry).toBeHidden();
  await expect(modal.locator('#modal-image-status')).toBeHidden();
  await expect(modal.locator('#photo-modal-close')).toBeFocused();
  expect(requests).toBe(3);
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(card).toBeFocused();
});

test('narrow phone hero actions form a full-width stack in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const row = page.locator('.hero-copy > .button-row');
    const bounds = await row.boundingBox();
    const buttons = row.locator('.button');
    const first = await buttons.first().boundingBox();
    const second = await buttons.nth(1).boundingBox();
    expect(first.width).toBeCloseTo(bounds.width, 0);
    expect(second.width).toBeCloseTo(bounds.width, 0);
    expect(first.height).toBeGreaterThanOrEqual(44);
    expect(second.height).toBeGreaterThanOrEqual(44);
    expect(second.y - first.y - first.height).toBeGreaterThanOrEqual(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
});

test('the deferred full-size portrait still opens and closes on every portrait page', async ({ page }) => {
  for (const route of ['/', '/portfolio/', '/connect/']) {
    await page.goto(route);
    const opener = page.locator('[data-profile-photo]').first();
    await opener.click();
    const dialog = page.locator('#profile-dialog');
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  }
});

test('photo navigation clears the previous error before showing a healthy image', async ({ page }) => {
  await page.route('https://feeds.behold.so/**', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'synthetic-error-navigation', mediaType: 'IMAGE', caption: 'Synthetic unavailable photo.', mediaUrl: '/pics/test-unavailable.webp' },
      { id: 'synthetic-good-navigation', mediaType: 'IMAGE', caption: 'Synthetic healthy photo.', mediaUrl: '/pics/instagram-egypt.jpg' }
    ])
  }));
  await page.route('**/pics/test-unavailable.webp', route => route.abort());
  await page.goto('/photos/');
  await page.locator('.gallery-card').first().click();
  const modal = page.locator('#photo-modal');
  const retry = modal.getByRole('button', { name: 'Try again', exact: true });
  await expect(retry).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(modal.locator('#modal-caption')).toHaveText('Synthetic healthy photo.');
  await expect.poll(() => modal.locator('#modal-image').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(modal.locator('#modal-image')).toBeVisible();
  await expect(retry).toBeHidden();
  await expect(modal.locator('#modal-image-status')).toBeHidden();
  await page.keyboard.press('ArrowLeft');
  await expect(retry).toBeVisible();
  await expect(modal.locator('#modal-caption')).toHaveText('Synthetic unavailable photo.');
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(modal.locator('#modal-image')).not.toHaveAttribute('src');
});
