const { test, expect } = require('@playwright/test');
const projects = require('../../src/_data/projects.json');

test('reading and metadata typography has explicit comfortable bounds', async ({ page }) => {
  await page.goto('/blog/');
  const sizes = await page.evaluate(() => ({
    body: parseFloat(getComputedStyle(document.body).fontSize),
    eyebrow: parseFloat(getComputedStyle(document.querySelector('.eyebrow')).fontSize)
  }));
  expect(sizes.body).toBeGreaterThanOrEqual(16);
  expect(sizes.eyebrow).toBeGreaterThanOrEqual(13);
  await page.goto('/sites/');
  const cardMetaSize = await page.locator('.project-content .eyebrow').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(cardMetaSize).toBeGreaterThanOrEqual(13);
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

test('mobile header keeps identity, location and controls visible at narrow widths', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const header = await page.locator('.site-header').boundingBox();
    expect(header.height).toBeLessThanOrEqual(width === 390 ? 108 : 120);
    const label = page.locator('.header-location-label');
    await expect(label).toBeVisible();
    const bounds = await label.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(await label.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('#mobile-menu-toggle')).toBeVisible();
    await expect(page.locator('#theme-toggle')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
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

test('footer brand has a real 44px desktop hit area', async ({ page }) => {
  await page.goto('/');
  const brand = page.locator('.site-footer .brand');
  await expect(brand).toBeVisible();
  await brand.scrollIntoViewIfNeeded();
  const hit = await brand.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const centerY = rect.y + rect.height / 2;
    const centerX = rect.x + rect.width / 2;
    return [-21, 21].every(offset => el.contains(document.elementFromPoint(centerX + offset, centerY)));
  });
  expect(hit).toBe(true);
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

test('all work previews are open entries with complete, loaded evidence', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sites/');
    const images = page.locator('.project-preview > img');
    await expect(images).toHaveCount(9);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    const styles = await images.evaluateAll(nodes => nodes.map(img => ({
      fit: getComputedStyle(img).objectFit,
      ratio: img.parentElement.getBoundingClientRect().width / img.parentElement.getBoundingClientRect().height
    })));
    expect(styles.every(style => style.fit === 'contain' && Math.abs(style.ratio - 16 / 9) < 0.03)).toBe(true);
    const surfaces = await page.locator('.project-card-enhanced').evaluateAll(nodes => nodes.map(card => ({
      background: getComputedStyle(card).backgroundColor,
      shadow: getComputedStyle(card).boxShadow
    })));
    expect(surfaces.every(surface => surface.background === 'rgba(0, 0, 0, 0)' && surface.shadow === 'none')).toBe(true);
    if (width === 1440) {
      await page.locator('.project-card-enhanced').first().hover();
      expect(await page.locator('.project-card-enhanced').first().evaluate(el => getComputedStyle(el).transform)).toBe('none');
    }
    await page.goto('/');
    const photos = page.locator('.selected-work-grid .project-preview.has-personal-photo > img');
    await expect(photos).toHaveCount(2);
    for (let index = 0; index < 2; index++) {
      const photo = photos.nth(index);
      await photo.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await expect.poll(() => photo.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
      expect(await photo.evaluate(el => getComputedStyle(el).objectFit)).toBe('contain');
    }
  }
});

test('work links retain their distinct story, tool and source destinations', async ({ page }) => {
  await page.goto('/sites/');
  const destinations = await page.locator('.project-card-enhanced').evaluateAll(cards => cards.map(card => ({
    preview: card.querySelector('.project-preview').getAttribute('href'),
    title: card.querySelector('h3 a').getAttribute('href'),
    actions: [...card.querySelectorAll('.project-actions a')].map(a => a.getAttribute('href'))
  })));
  expect(destinations).toEqual(projects.map(project => {
    const story = project.featured ? `/projects/${project.slug}/` : project.live;
    return {
      preview: story, title: story,
      actions: [
        ...(project.featured ? [story] : []),
        ...(project.live ? [project.live] : []),
        ...(project.source ? [project.source] : [])
      ]
    };
  }));
  await page.locator('.project-card-enhanced h3 a').first().click();
  await expect(page).toHaveURL(/\/projects\/tamperlog\/$/);
});

test('featured personal photos keep their full frames at 320 and 390', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const previews = page.locator('.selected-work-grid .project-preview.has-personal-photo');
    await expect(previews).toHaveCount(2);
    for (let index = 0; index < 2; index++) {
      const preview = previews.nth(index);
      await preview.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await expect.poll(() => preview.locator('img').evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
      const frame = await preview.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { ratio: rect.width / rect.height, fit: getComputedStyle(el.querySelector('img')).objectFit };
      });
      expect(frame.fit).toBe('contain');
      expect(frame.ratio).toBeCloseTo(16 / 9, 1);
    }
  }
});

test('project evidence can be enlarged and writing rows have deliberate leading', async ({ page }) => {
  await page.goto('/projects/localllm/');
  const link = page.locator('.project-evidence a[data-view-photo]');
  await expect(link).toHaveAttribute('href', '/pics/locallm.webp');
  await link.click();
  const dialog = page.locator('#memory-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveJSProperty('open', true);
  expect(await dialog.evaluate(el => el.matches(':modal'))).toBe(true);
  await expect(dialog.locator('img')).toHaveAttribute('src', /\/pics\/locallm\.webp$/);
  await expect(dialog.locator('img')).toHaveAttribute('alt', projects.find(project => project.slug === 'localllm').evidenceAlt);
  await expect(page.locator('#memory-caption')).toHaveText(projects.find(project => project.slug === 'localllm').evidenceAlt);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(link).toBeFocused();
  await page.goto('/');
  const title = await page.locator('.recent-blog-item h3').first().evaluate(el => ({
    font: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight),
    margin: getComputedStyle(el).marginBottom
  }));
  expect(title.line / title.font).toBeGreaterThanOrEqual(1.4);
  expect(title.margin).toBe('0px');
});
