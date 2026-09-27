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

test('Life stories stay visible when the map script fails', async ({ page }) => {
  await page.route('**/js/globe.js*', route => route.abort());
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/life/');
  const places = require('../../src/_data/visitedPlaces.json');
  for (const place of places) await expect(page.locator(`#place-story-${place.id} p`)).toHaveText(place.note);
  await expect(page.locator('.visited-stories')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  const story = page.locator('.fact-card').first();
  await story.hover();
  const style = await story.evaluate(el => ({ transform: getComputedStyle(el).transform, blur: getComputedStyle(el).backdropFilter }));
  expect(style.transform).toBe('none');
  expect(style.blur).toBe('none');
});

test('photo captions are visible without hover in both themes', async ({ page }) => {
  const caption = 'A test caption with enough words to occupy several lines at phone width. The full sentence stays readable without hovering over a photo or opening a separate control.';
  await page.route('https://feeds.behold.so/**', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([{ id: 'readability-fixture', mediaType: 'IMAGE', caption,
      mediaUrl: '/pics/instagram-egypt.jpg', permalink: 'https://www.instagram.com/p/TEST/' }])
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['dark', 'light']) {
    await page.goto('/photos/');
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const card = page.locator('.gallery-card').first();
    await expect(card.locator('.card-title')).toHaveText(caption);
    const state = await card.evaluate(el => {
      const p = el.querySelector('.card-caption');
      const title = p.querySelector('.card-title');
      const media = el.querySelector('.gallery-card-media');
      return {
        below: p.getBoundingClientRect().top >= media.getBoundingClientRect().bottom,
        opacity: getComputedStyle(p).opacity,
        font: parseFloat(getComputedStyle(title).fontSize),
        clipped: title.scrollHeight > title.clientHeight + 1,
        clamp: getComputedStyle(title).webkitLineClamp
      };
    });
    expect(state.below).toBe(true);
    expect(state.opacity).toBe('1');
    expect(state.font).toBeGreaterThanOrEqual(14);
    expect(state.clipped).toBe(false);
    expect(['none', '']).toContain(state.clamp);
    await card.click();
    await expect(page.locator('#modal-caption')).toHaveText(caption);
    await page.keyboard.press('Escape');
  }
});

test('gallery failure explains the next action without a made-up cause', async ({ page }) => {
  await page.route('https://feeds.behold.so/**', route => route.abort());
  await page.goto('/photos/');
  await expect(page.locator('.under-construction-card p')).toHaveText('The gallery could not load. You can still view the photos on Instagram.');
  await expect(page.locator('.construction-actions a[href="https://instagram.com/qusai.pro"]')).toBeVisible();
});

const essentialText = [
  ['/', '.hero-intro,.hero-current,.discovery-copy p,.project-note'],
  ['/sites/', '.project-content > p:not(.eyebrow)'],
  ['/portfolio/', '.experience-entry>p,.experience-entry-meta'],
  ['/life/', '.visited-stories p,.fact-body']
];
for (const [route, selector] of essentialText) {
  test(`essential text is never clipped on ${route}`, async ({ page }) => {
    for (const width of [320, 390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      for (const theme of ['dark', 'light']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
        const nodes = page.locator(selector);
        expect(await nodes.count()).toBeGreaterThan(0);
        for (const node of await nodes.all()) {
          await expect(node).toBeVisible();
          const state = await node.evaluate(el => {
            const css = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              clamp: css.webkitLineClamp,
              hiddenOverflow: ['hidden', 'clip'].includes(css.overflowY),
              tallerThanBox: el.scrollHeight > el.clientHeight + 1,
              left: rect.left, right: rect.right, width: innerWidth
            };
          });
          expect(['none', '']).toContain(state.clamp);
          expect(state.hiddenOverflow && state.tallerThanBox).toBe(false);
          expect(state.left).toBeGreaterThanOrEqual(-1);
          expect(state.right).toBeLessThanOrEqual(state.width + 1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      }
    }
  });
}
