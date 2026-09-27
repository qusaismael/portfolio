const { test, expect } = require('@playwright/test');
const projects = require('../../src/_data/projects.json');
const experience = require('../../src/_data/experience.json');
const writing = require('../../src/_data/writing.json');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api.github.com/**', route => route.abort());
});
