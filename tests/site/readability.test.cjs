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
