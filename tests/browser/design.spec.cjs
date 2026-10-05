const { test, expect } = require('@playwright/test');
const projects = require('../../src/_data/projects.json');

test('reading and metadata typography has explicit comfortable bounds', async ({ page }) => {
  await page.goto('/blog/');
  const sizes = await page.evaluate(() => ({
    body: parseFloat(getComputedStyle(document.body).fontSize),
    metadata: parseFloat(getComputedStyle(document.querySelector('.writing-entry time')).fontSize)
  }));
  expect(sizes.body).toBeGreaterThanOrEqual(16);
  expect(sizes.metadata).toBeGreaterThanOrEqual(13);
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

test('mobile Home photograph cards return to compact side-by-side previews', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const photos = page.locator('.life-discovery:has(.discovery-photo)');
    await expect(photos).toHaveCount(2);
    for (const card of await photos.all()) {
      const frame = await card.evaluate(el => {
        const photo = el.querySelector('.discovery-photo');
        const image = photo.querySelector('img');
        const description = el.querySelector('.discovery-copy p');
        const box = photo.getBoundingClientRect();
        const cardBox = el.getBoundingClientRect();
        return {
          display: getComputedStyle(el).display,
          columns: getComputedStyle(el).gridTemplateColumns,
          width: box.width,
          height: box.height,
          cardHeight: cardBox.height,
          fit: getComputedStyle(image).objectFit,
          captionVisible: getComputedStyle(photo.querySelector('span')).display !== 'none',
          clamp: getComputedStyle(description).webkitLineClamp,
          paragraphLines: description.getBoundingClientRect().height / parseFloat(getComputedStyle(description).lineHeight)
        };
      });
      expect(frame.display).toBe('grid');
      expect(parseFloat(frame.columns)).toBeCloseTo(88, 0);
      expect(frame.width).toBeCloseTo(88, 0);
      expect(frame.height).toBeGreaterThanOrEqual(88);
      expect(frame.cardHeight).toBeLessThan(230);
      expect(frame.fit).toBe('cover');
      expect(frame.captionVisible).toBe(false);
      expect(['none', '']).toContain(frame.clamp);
      expect(await card.locator('.discovery-copy p').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
});

test('mobile Games card matches the compact format of the photo cards', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const photoWidth = await page.locator('.discovery-photo').first().evaluate(el => el.getBoundingClientRect().width);
    const card = page.locator('.life-discovery-games');
    const state = await card.evaluate(el => {
      const media = el.querySelector('.discovery-game-preview');
      const description = el.querySelector('.discovery-copy p');
      const box = media.getBoundingClientRect();
      return {
        display: getComputedStyle(el).display,
        columns: getComputedStyle(el).gridTemplateColumns,
        mediaWidth: box.width,
        mediaHeight: box.height,
        cardHeight: el.getBoundingClientRect().height,
        titlesVisible: getComputedStyle(el.querySelector('.discovery-game-titles')).display !== 'none',
        clamp: getComputedStyle(description).webkitLineClamp,
        paragraphLines: description.getBoundingClientRect().height / parseFloat(getComputedStyle(description).lineHeight)
      };
    });
    expect(state.display).toBe('grid');
    expect(parseFloat(state.columns)).toBeCloseTo(88, 0);
    expect(state.mediaWidth).toBeCloseTo(photoWidth, 0);
    expect(state.mediaHeight).toBeGreaterThanOrEqual(88);
    expect(state.cardHeight).toBeLessThan(230);
    expect(state.titlesVisible).toBe(false);
    expect(state.clamp).toBe('1');
    expect(state.paragraphLines).toBeLessThan(1.1);
  }
});

test('live-site directory stays aligned and readable across breakpoints and themes', async ({ page }) => {
  for (const theme of ['dark', 'light']) for (const width of [1440, 1024, 701, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sites/');
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const rows = await page.locator('#live-sites .site-directory-list > li').evaluateAll(nodes => nodes.map(el => {
      const box = el.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom };
    }));
    expect(rows).toHaveLength(10);
    if (width > 700) {
      for (let index = 0; index < rows.length; index += 2) {
        expect(Math.abs(rows[index].top - rows[index + 1].top)).toBeLessThan(1);
      }
    } else {
      for (let index = 1; index < rows.length; index++) {
        expect(Math.abs(rows[index].top - rows[index - 1].bottom)).toBeLessThan(1);
      }
    }
    const links = await page.locator('#live-sites a.site-directory-entry').evaluateAll(nodes => nodes.map(el => {
      const box = el.getBoundingClientRect();
      return { height: box.height, left: box.left, right: box.right };
    }));
    expect(links).toHaveLength(9);
    expect(links.every(link => link.height >= 44 && link.left >= 0 && link.right <= width)).toBe(true);
    const labels = await page.locator('#live-sites .site-name, #live-sites .site-domain, #live-sites .site-state').evaluateAll(nodes => nodes.map(el => {
      const box = el.getBoundingClientRect();
      const row = el.closest('.site-directory-entry').getBoundingClientRect();
      return { text: el.textContent, clipped: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
        contained: box.left >= row.left - 1 && box.right <= row.right + 1 && box.top >= row.top - 1 && box.bottom <= row.bottom + 1 };
    }));
    expect(labels.every(label => !label.clipped && label.contained), JSON.stringify(labels)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  }
});

test('live-site links keep visible keyboard focus and skip the pending entry', async ({ page }) => {
  for (const theme of ['dark', 'light']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sites/');
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const links = page.locator('#live-sites a.site-directory-entry');
    await links.first().focus();
    for (let index = 0; index < await links.count(); index++) {
      await expect(links.nth(index)).toBeFocused();
      const focus = await links.nth(index).evaluate(el => {
        const style = getComputedStyle(el);
        return { visible: el.matches(':focus-visible'), width: parseFloat(style.outlineWidth), style: style.outlineStyle };
      });
      expect(focus.visible).toBe(true);
      expect(focus.width).toBeGreaterThanOrEqual(2);
      expect(focus.style).toBe('solid');
      if (index + 1 < await links.count()) await page.keyboard.press('Tab');
    }
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
