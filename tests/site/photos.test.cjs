const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const { fileFor } = require('../support/routes.cjs');

const html = () => fs.readFileSync(fileFor('/photos/'), 'utf8');
test('photos are a static local archive with responsive, dimensioned, described images', () => {
  const $ = cheerio.load(html());
  const images = $('#photo-gallery .gallery-card img');
  assert.ok(images.length >= 1, 'at least one local photo must render without JavaScript');
  images.each((_, image) => {
    const img = $(image);
    assert.ok(Number(img.attr('width')) > 0, 'image width');
    assert.ok(Number(img.attr('height')) > 0, 'image height');
    assert.ok(img.attr('alt')?.trim(), 'nonempty image description');
    assert.notEqual(img.attr('alt'), img.closest('.gallery-card').find('.card-title').text().trim(), 'alt must not repeat caption');
    assert.equal(img.attr('loading'), 'lazy');
    assert.equal(img.attr('decoding'), 'async');
    const sources = [img.attr('src'), img.closest('a').attr('href'), ...img.attr('srcset').split(',').map(entry => entry.trim().split(/\s+/)[0])];
    for (const source of sources) {
      assert.match(source, /^\/pics\/photos\/[A-Za-z0-9_-]+\.webp$/, 'photo source is local');
      assert.ok(fs.existsSync(path.join('_site', source)), `missing image: ${source}`);
    }
  });
});
test('shipped photo HTML and script have no upstream image/feed dependencies', () => {
  for (const text of [html(), fs.readFileSync('_site/gallery.js', 'utf8')]) {
    assert.doesNotMatch(text, /behold|cdninstagram/i);
  }
  assert.doesNotMatch(fs.readFileSync('_site/gallery.js', 'utf8'), /\bfetch\s*\(/);
});
test('archive metadata preserves valid original links and every local asset', () => {
  const photos = JSON.parse(fs.readFileSync('src/_data/photos.json', 'utf8'));
  for (const post of photos) {
    assert.match(post.permalink, /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?[^\s]*)?$/);
    for (const child of post.children) for (const asset of [child.src, child.fullSrc]) {
      assert.ok(fs.existsSync(path.join('_site', asset)), asset);
    }
  }
});
test('About displays the Zain photo only once while retaining its experience link', () => {
  const $ = cheerio.load(fs.readFileSync(fileFor('/portfolio/'), 'utf8'));
  assert.equal($('main img[src="/pics/qusaiatzain.webp"]').length, 1);
  assert.equal($('.memory-strip figure').length, 2, 'keep the balanced pair of memories');
  assert.equal($('#panel-zain a[data-view-photo][href="/pics/qusaiatzain.webp"]').length, 1);
  assert.equal($('#panel-zain a[data-view-photo]').text(), 'A little of what the internship looked like.');
});

test('mobile back-to-top control leaves the row action lane unobstructed', () => {
  const css = fs.readFileSync('_site/css/style.css', 'utf8');
  assert.match(css, /@media\(max-width:767px\)\{\.progress-wrap\{position:static/);
});
