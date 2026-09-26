const { test, expect } = require('@playwright/test');

test('reading and metadata typography has explicit comfortable bounds', async ({ page }) => {
  await page.goto('/blog/');
  const sizes = await page.evaluate(() => ({
    body: parseFloat(getComputedStyle(document.body).fontSize),
    eyebrow: parseFloat(getComputedStyle(document.querySelector('.eyebrow')).fontSize)
  }));
  expect(sizes.body).toBeGreaterThanOrEqual(16);
  expect(sizes.eyebrow).toBeGreaterThanOrEqual(13);
  await page.goto('/writing/tracing-a-kernel-panic-what-actually-happens-when-you-hit-sleep-6e1e2bffa4bd/');
  const prose = await page.locator('.article-body').evaluate(el => ({
    width: el.getBoundingClientRect().width,
    font: parseFloat(getComputedStyle(el).fontSize),
    line: parseFloat(getComputedStyle(el).lineHeight)
  }));
  expect(prose.font).toBeGreaterThanOrEqual(18);
  expect(prose.width).toBeLessThanOrEqual(720);
  expect(prose.line / prose.font).toBeGreaterThanOrEqual(1.7);
});

test('mobile header keeps identity, location and controls within 108 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const header = await page.locator('.site-header').boundingBox();
  expect(header.height).toBeLessThanOrEqual(108);
  await expect(page.locator('.header-location-label')).toBeVisible();
  await expect(page.locator('#mobile-menu-toggle')).toBeVisible();
  await expect(page.locator('#theme-toggle')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('small navigation links expose a non-overlapping 44px hit area', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const links = page.locator('.site-header .brand,.site-footer .brand,.footer-links>a');
  for (const link of await links.all()) {
    if (!await link.isVisible()) continue;
    await link.scrollIntoViewIfNeeded();
    const result = await link.evaluate(el => {
      const box = el.getBoundingClientRect();
      const hit = getComputedStyle(el, '::after');
      const width = Math.max(box.width, parseFloat(hit.width) || 0);
      const height = Math.max(box.height, parseFloat(hit.height) || 0);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      return {
        width, height,
        leftWorks: el.contains(document.elementFromPoint(x - 21, y)),
        rightWorks: el.contains(document.elementFromPoint(x + 21, y))
      };
    });
    expect(result.width).toBeGreaterThanOrEqual(44);
    expect(result.height).toBeGreaterThanOrEqual(44);
    expect(result.leftWorks && result.rightWorks).toBe(true);
  }
});

test('hero portrait keeps its scale while the introduction gains a readable measure', async ({ page }) => {
  await page.goto('/');
  const portrait = await page.locator('.hero-aside .portrait-button').boundingBox();
  expect(portrait.width).toBe(218);
  const paragraphs = await page.locator('.hero-intro').evaluateAll(items => items.map(el => el.getBoundingClientRect().width));
  expect(Math.max(...paragraphs)).toBeLessThanOrEqual(610);
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.locator('.hero-aside .portrait-button').boundingBox()).width).toBe(120);
});

test('mobile life previews show every authored sentence and uncropped personal photos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const boxes = await page.locator('.discovery-copy p').evaluateAll(nodes => nodes.map(el => ({
    clipped: el.scrollHeight > el.clientHeight + 1,
    clamp: getComputedStyle(el).webkitLineClamp
  })));
  expect(boxes.every(box => !box.clipped && (!box.clamp || box.clamp === 'none'))).toBe(true);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const frames = await page.locator('.discovery-photo').evaluateAll(nodes => nodes.map(el => {
      const box = el.getBoundingClientRect();
      return { width: box.width, card: el.parentElement.clientWidth, ratio: box.width / box.height,
        fit: getComputedStyle(el.querySelector('img')).objectFit };
    }));
    expect(frames.every(frame => Math.abs(frame.width - frame.card) <= 1)).toBe(true);
    expect(frames.every(frame => Math.abs(frame.ratio - 1) < 0.02 && frame.fit === 'contain')).toBe(true);
    await expect(page.locator('.discovery-photo>span').first()).toBeVisible();
    await expect(page.locator('.discovery-game-titles')).toBeVisible();
  }
});
