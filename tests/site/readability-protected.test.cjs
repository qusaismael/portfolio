const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const frozen = require('../fixtures/readability-baseline.json');
const { routes, fileFor } = require('../support/routes.cjs');
const norm = s => s.replace(/\s+/g, ' ').trim();
const facts = project => {
  const { description, cardNote, ...rest } = project;
  return rest;
};
test('editorial work preserves facts quotations and existing destinations', () => {
  for (const [file, expected] of Object.entries(frozen.hashes)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.equal(actual, expected, file);
  }
  const current = JSON.parse(fs.readFileSync('src/_data/projects.json', 'utf8'));
  assert.deepEqual(current.map(facts), frozen.projects.map(facts));
  assert.deepEqual(Object.keys(frozen.pages).sort(), [...routes].sort());
  for (const [route, before] of Object.entries(frozen.pages)) {
    const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
    const hrefs = new Set($('main a[href]').toArray().map(el => $(el).attr('href')));
    for (const href of before.hrefs) assert.ok(hrefs.has(href), `${route}: lost ${href}`);
    const placeFacts = $('#globe-visited-chips .globe-chip').toArray().map(el =>
      Object.fromEntries(['id','city','country','flag','lat','lon','desc'].map(key => [key, $(el).attr(`data-${key}`)])));
    assert.deepEqual(placeFacts, before.placeFacts, `${route}: changed map identity or story`);
    const body = norm($('main').text());
    for (const text of before.protectedText) assert.ok(body.includes(text), `${route}: changed quotation/story`);
  }
});

test('education and testimonial attribution remain intact', () => {
  const $ = cheerio.load(fs.readFileSync(fileFor('/portfolio/'), 'utf8'));
  assert.deepEqual($('#education .education-list article').toArray().map(el => norm($(el).text())), [
    "The Hashemite UniversityBachelor's degree in Cyber Security · ExcellenceOct 2022 – Jun 2026",
    'Nahda Private SchoolScientific stream · توجيهي علمي · 91.65%2021 – 2022'
  ]);
  assert.deepEqual($('#certifications .education-list article').toArray().map(el => norm($(el).text())), [
    'Cybersecurity upskilling programCyber Shield Academy · 100 hours · Score: 92%Dec 2025'
  ]);
  assert.deepEqual($('#references .reference-card figcaption').toArray().map(el => norm($(el).text())), [
    'Abdallah AlashqarPenetration Tester · Threat Management at Zain Jordan',
    'Mahmoud SaeedCybersecurity Graduate · AI-Powered Security Automation'
  ]);
});

test('navigation, footer, and project actions retain distinct links', () => {
  const site = require('../../src/_data/site.json');
  for (const route of routes) {
    const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
    assert.deepEqual($('#main-nav a').toArray().map(el => $(el).attr('href')),
      ['/portfolio/', '/life/', '/photos/', '/blog/', '/sites/', '/connect/'], route);
    assert.deepEqual($('.site-footer a').toArray().map(el => $(el).attr('href')),
      ['/', `mailto:${site.email}`, '/photos/', site.github, '/connect/'], route);
  }
  const $ = cheerio.load(fs.readFileSync(fileFor('/sites/'), 'utf8'));
  for (const project of frozen.projects) {
    const card = $('.project-card-enhanced').filter((_, el) => norm($(el).find('h3').text()) === `${project.name} ↗`);
    assert.equal(card.length, 1, project.slug);
    const url = project.featured ? `/projects/${project.slug}/` : project.live;
    assert.equal(card.find(`h3 a[href="${url}"]`).length, 1, project.slug);
    assert.equal(card.find(`.project-preview[href="${url}"]`).length, 1, project.slug);
    if (project.featured) assert.equal(card.find(`.project-actions a[href="${url}"]`).length, 1, project.slug);
    if (project.live && project.featured) assert.equal(card.find(`.project-actions a[href="${project.live}"]`).length, 1, project.slug);
    if (project.source) assert.equal(card.find(`.project-actions a[href="${project.source}"]`).length, 1, project.slug);
  }
});
