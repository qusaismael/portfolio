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
