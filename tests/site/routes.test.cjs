const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cheerio = require('cheerio');
const { routes, legacy, fileFor } = require('../support/routes.cjs');
const site = require('../../src/_data/site.json');
const writing = require('../../src/_data/writing.json');
const projects = require('../../src/_data/projects.json');

test('all canonical routes have a title, main, description, canonical, and Atom autodiscovery', () => {
  assert.equal(new Set(routes).size, routes.length);
  for (const route of routes) {
    const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
    assert.equal($('main#main-content').length, 1, route);
    assert.equal($('h1').length, 1, route);
    assert.ok($('title').text().trim(), route);
    assert.ok($('meta[name="description"]').attr('content')?.trim(), route);
    assert.equal($('link[rel="canonical"]').attr('href'), site.url + route, route);
    assert.equal(
      $('link[rel="alternate"][type="application/atom+xml"]').attr('href'),
      site.url + '/feed.xml',
      route
    );
    assert.equal($('meta#theme-color-meta[name="theme-color"]').length, 1, route);
  }
});

test('sitemap uses canonical www origin and includes every canonical route', () => {
  const xml = fs.readFileSync('_site/sitemap.xml', 'utf8');
  assert.ok(!xml.includes('https://qusai.pro/'), 'sitemap must use canonical www origin');
  for (const route of routes) {
    assert.ok(xml.includes(`<loc>${site.url}${route}</loc>`), `sitemap missing ${route}`);
  }
});

test('Atom feed is valid XML covering every writing entry', () => {
  const xml = fs.readFileSync('_site/feed.xml', 'utf8');
  assert.match(xml, /xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.ok(xml.includes(`<link href="${site.url}/feed.xml" rel="self" type="application/atom+xml"/>`));
  for (const post of writing) {
    assert.ok(xml.includes(`<id>${site.url}/writing/${post.slug}/</id>`), `feed missing ${post.slug}`);
  }
});

test('articles emit BlogPosting JSON-LD and featured projects emit CreativeWork JSON-LD with per-project OG image', () => {
  for (const post of writing) {
    const $ = cheerio.load(fs.readFileSync(fileFor(`/writing/${post.slug}/`), 'utf8'));
    const scripts = $('script[type="application/ld+json"]').toArray().map(el => JSON.parse($(el).text()));
    const blogPosting = scripts.find(item => item['@type'] === 'BlogPosting');
    assert.ok(blogPosting, post.slug);
    assert.equal(blogPosting.headline, post.title, post.slug);
  }
  for (const project of projects.filter(p => p.featured)) {
    const $ = cheerio.load(fs.readFileSync(fileFor(`/projects/${project.slug}/`), 'utf8'));
    const expectedImage = site.url + (project.evidenceImage || project.image);
    assert.equal($('meta[property="og:image"]').attr('content'), expectedImage, project.slug);
    const scripts = $('script[type="application/ld+json"]').toArray().map(el => JSON.parse($(el).text()));
    const work = scripts.find(item => item['@type'] === 'CreativeWork');
    assert.ok(work, project.slug);
    assert.equal(work.name, project.name, project.slug);
  }
});

test('capture script waits for data-gallery-ready on /photos/', () => {
  const capture = fs.readFileSync('scripts/capture.cjs', 'utf8');
  assert.ok(capture.includes('data-gallery-ready="true"'));
  assert.ok(!capture.includes('data-feed-ready'));
});

test('legacy URLs point to preserved destinations', () => {
  for (const route of legacy) {
    const html = fs.readFileSync('_site' + route.from, 'utf8');
    assert.ok(html.includes(route.to), route.from);
  }
  assert.ok(fs.existsSync('_site/404.html'));
});
