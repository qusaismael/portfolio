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
    await expect(page.locator('#discover-travel-note')).toHaveText('Jordan, Istanbul and the Red Sea.');
    await expect(page.locator('#discover-photos-note')).toHaveText('Trips, graduation and everyday photos.');
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
