const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api.github.com/**', route => route.abort());
});

test('writing hairline topic filter updates entries, URL, and stays readable with JS off', async ({ page, browser }) => {
  await page.goto('/blog/');
  const filters = page.locator('[data-writing-filters]');
  await expect(filters).toBeVisible();
  const total = await page.locator('.writing-entry').count();
  await expect(page.locator('[data-writing-count]')).toContainText(`Showing all ${total}`);

  await filters.locator('label', { hasText: 'AI' }).click();
  await expect(page).toHaveURL(/topic=ai/);
  const visibleAi = await page.locator('.writing-entry:not([hidden])').count();
  expect(visibleAi).toBeGreaterThan(0);
  expect(visibleAi).toBeLessThan(total);
  await expect(page.locator('[data-writing-count]')).toContainText('in AI');

  const noJs = await browser.newContext({ javaScriptEnabled: false });
  try {
    const p = await noJs.newPage();
    await p.goto('http://127.0.0.1:4173/blog/');
    await expect(p.locator('.writing-entry')).toHaveCount(total);
    await expect(p.locator('[data-writing-filters]')).toBeHidden();
  } finally {
    await noJs.close();
  }
});

test('explore filters live as you type, supports / shortcut, and indexes web tools', async ({ page }) => {
  await page.goto('/explore/');
  const input = page.locator('#explore-form input[name="q"]');
  const type = page.locator('#explore-form select[name="type"]');
  await page.keyboard.press('/');
  await expect(input).toBeFocused();
  await input.fill('textify');
  await expect(page.locator('[data-entry]:not([hidden])')).toHaveCount(1);
  await expect(page.locator('[data-entry]:not([hidden]) h2 a')).toHaveAttribute('href', 'https://textify.qusai.pro/');
  await expect(page.locator('[data-entry]:not([hidden]) h2 a')).toHaveAttribute('target', '_blank');

  await page.locator('[data-explore-clear]').click();
  await expect(input).toHaveValue('');
  await type.selectOption('tools');
  expect(await page.locator('[data-entry]:not([hidden])').count()).toBeGreaterThanOrEqual(7);
});

test('theme toggle dynamically updates theme-color meta tag', async ({ page }) => {
  await page.goto('/');
  const meta = page.locator('#theme-color-meta');
  await expect(meta).toHaveAttribute('content', '#1A0F0A');
  await page.locator('#theme-toggle').click();
  await expect(meta).toHaveAttribute('content', '#faf7f1');
  await page.locator('#theme-toggle').click();
  await expect(meta).toHaveAttribute('content', '#1A0F0A');
});

test('life country wall restores bespoke per-country typefaces and Riyadh footnote', async ({ page }) => {
  await page.goto('/life/');
  const jordanFont = await page.locator('.country-name[data-country-id="jordan"]')
    .evaluate(el => getComputedStyle(el).fontFamily);
  const egyptFont = await page.locator('.country-name[data-country-id="egypt"]')
    .evaluate(el => getComputedStyle(el).fontFamily);
  const usaFont = await page.locator('.country-name[data-country-id="usa"]')
    .evaluate(el => getComputedStyle(el).fontFamily);
  expect(jordanFont).toContain('Reem Kufi');
  expect(egyptFont).toContain('Cinzel');
  expect(usaFont).toContain('Big Shoulders Display');
  await expect(page.locator('.someday-footnote')).toContainText('Riyadh');
  await expect(page.locator('.someday-wall')).toContainText('San Francisco');
  await expect(page.locator('.globe-bucket-trigger')).toHaveCount(8);
});

test('resume includes LinkedIn, selected projects, and open-source highlights in screen and print', async ({ page }) => {
  await page.goto('/resume/');
  await expect(page.locator('.resume-contact a[href*="linkedin.com"]')).toBeVisible();
  await expect(page.locator('.resume-project-entry')).toHaveCount(4);
  await expect(page.locator('.resume-oss > li')).toHaveCount(2);
  await expect(page.locator('.resume-oss')).toContainText('fix(server): remux fragmented mp4');
  await expect(page.locator('.resume-oss')).toContainText('Add "LocalLLM" Repo link');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.resume-projects')).toBeVisible();
  await expect(page.locator('.resume-oss')).toBeVisible();
  await expect(page.locator('.print-hide').first()).toBeHidden();
});

test('desktop lead project card forms asymmetric full-width spread above three-up row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const widths = await page.locator('.selected-work-grid > .project-card-enhanced')
    .evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().width));
  expect(widths).toHaveLength(4);
  expect(widths[0]).toBeGreaterThan(widths[1] * 2);
});
