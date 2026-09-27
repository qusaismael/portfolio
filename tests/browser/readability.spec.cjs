const { test, expect } = require('@playwright/test');
const projects = require('../../src/_data/projects.json');
const experience = require('../../src/_data/experience.json');
const writing = require('../../src/_data/writing.json');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api.github.com/**', route => route.abort());
});

test('compact photo rows expose their complete short descriptions', async ({ page }) => {
  for (const width of [320, 390, 580]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const cards = page.locator('.life-discovery:has(.discovery-photo)');
    await expect(cards).toHaveCount(2);
    await expect(page.locator('#discover-travel-note')).toHaveText('Jordan, Istanbul and Egypt.');
    await expect(page.locator('#discover-photos-note')).toHaveText('Trips and graduation, from my camera roll.');
    for (const card of await cards.all()) {
      const value = await card.evaluate(el => {
        const image = el.querySelector('.discovery-photo');
        const p = el.querySelector('.discovery-copy p');
        return {
          rail: image.getBoundingClientRect().width,
          fit: getComputedStyle(image.querySelector('img')).objectFit,
          clamp: getComputedStyle(p).webkitLineClamp,
          clipped: p.scrollHeight > p.clientHeight + 1,
          height: el.getBoundingClientRect().height
        };
      });
      expect(value.rail).toBeCloseTo(88, 0);
      expect(value.fit).toBe('cover');
      expect(['none', '']).toContain(value.clamp);
      expect(value.clipped).toBe(false);
      expect(value.height).toBeLessThan(230);
    }
  }
});

test('metadata is readable without decorative badges', async ({ page }) => {
  await page.goto('/sites/');
  const values = await page.locator('.project-content').first().evaluate(el => {
    const meta = el.querySelector('.eyebrow');
    const tag = el.querySelector('.tags span');
    return {
      casing: getComputedStyle(meta).textTransform,
      tagBorder: getComputedStyle(tag).borderTopWidth,
      tagSize: parseFloat(getComputedStyle(tag).fontSize)
    };
  });
  expect(values.casing).toBe('none');
  expect(values.tagBorder).toBe('0px');
  expect(values.tagSize).toBeGreaterThanOrEqual(13);
});

test('every experience stays visible on narrow and wide screens', async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/portfolio/');
    const entries = page.locator('#experience .experience-entry');
    await expect(entries).toHaveCount(6);
    for (const entry of await entries.all()) await expect(entry).toBeVisible();
    await expect(page.locator('#experience [role="tablist"]')).toHaveCount(0);
  }
});

test('About print keeps the contact email and job narratives', async ({ page }) => {
  await page.goto('/portfolio/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#contact')).toBeVisible();
  await expect(page.locator('#contact .button-row a[href^="mailto:"]')).toBeVisible();
  for (const entry of await page.locator('#experience .experience-entry').all()) await expect(entry).toBeVisible();
});

test('all experience remains visible with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/portfolio/');
    for (const entry of await page.locator('#experience .experience-entry').all()) await expect(entry).toBeVisible();
    await expect(page.locator('#experience .experience-entry')).toHaveCount(experience.length);
  } finally { await context.close(); }
});

test('article section links work with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    const post = writing.find(p => p.slug.startsWith('tracing-a-kernel-panic-'));
    await page.goto(`http://127.0.0.1:4173/writing/${post.slug}/`);
    await expect(page.locator('.article-summary')).toHaveText(post.excerpt);
    const first = page.locator('.article-outline a').first();
    const href = await first.getAttribute('href');
    await first.click();
    expect(new URL(page.url()).hash).toBe(href);
    const top = await page.locator(href).evaluate(el => el.getBoundingClientRect().top);
    const headerBottom = await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().bottom);
    expect(top).toBeGreaterThanOrEqual(headerBottom);
  } finally { await context.close(); }
});
