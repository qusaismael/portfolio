const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cheerio = require('cheerio');
const { fileFor } = require('../support/routes.cjs');
const load = route => cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
const norm = value => value.replace(/\s+/g, ' ').trim();

test('home introduces a person and shows the current role directly', () => {
  const $ = load('/');
  assert.equal($('.hero-intro').length, 1);
  assert.equal(norm($('.hero-intro').text()), "I'm a privacy and GRC engineer from Jordan. I build security tools, work with local AI, and usually have a Linux terminal open.");
  const job = require('../../src/_data/experience.json')[0];
  assert.equal(norm($('.hero-current').text()), `${job.role} at ${job.company}`);
  assert.equal($('.hero-current a').attr('href'), '/portfolio/#experience');
  assert.equal($('.hero-copy [data-note-toggle]').length, 2);
  assert.equal($('.hero-copy a[href="/portfolio/"]').length, 1);
  assert.equal($('.hero-copy a[href="/connect/"]').length, 1);
});

test('home removes redundant preambles and keeps the useful invitations', () => {
  const $ = load('/');
  assert.equal($('#blog .eyebrow').length, 0);
  assert.equal($('#projects .section-heading-row p').length, 0);
  assert.equal($('.contributions-personal-note').length, 1);
  assert.equal(norm($('.contributions-intro > p:not(.contributions-personal-note)').text()), "Changes I've sent to open-source projects I use.");
  assert.equal(norm($('#contact > p').text()), 'Email me about a project, a question, or a good Linux story.');
  assert.equal(norm($('.personal-moment figcaption').text()), 'One room. A lot of freshmen. One piece of advice.');
  assert.equal($('.footer-top p').length, 0);
});

test('small personal details survive the editorial cut', () => {
  const $ = load('/');
  assert.equal(norm($('.personal-moment figcaption').text()), 'One room. A lot of freshmen. One piece of advice.');
  assert.ok(norm($('.contributions-intro').text()).includes('A small fix still counts.'));
  assert.equal(norm($('#discover-photos-note').text()), 'Trips and graduation, from my camera roll.');
  assert.equal(norm($('#discover-travel-note').text()), 'Jordan, Istanbul and Egypt.');
  assert.equal(norm($('#discover-travel-title').text()), "Places I've been.");
});

test('project summaries match the reviewed copy without losing their caveats', () => {
  const expected = require('../fixtures/readability-project-copy.json');
  const projects = require('../../src/_data/projects.json');
  assert.deepEqual(Object.keys(expected).sort(), projects.map(p => p.slug).sort());
  for (const project of projects) {
    for (const [field, text] of Object.entries(expected[project.slug])) assert.equal(project[field], text, `${project.slug}.${field}`);
  }
});

test('project caveats appear on Home and Work cards', () => {
  const projects = require('../../src/_data/projects.json');
  for (const route of ['/', '/sites/']) {
    const $ = load(route);
    const cards = $('.project-card-enhanced').toArray();
    const expected = route === '/' ? projects.filter(p => p.featured) : projects;
    assert.equal(cards.length, expected.length);
    expected.forEach((project, index) => {
      assert.equal(norm($(cards[index]).find('.project-note').text()), project.cardNote || '');
    });
  }
});
