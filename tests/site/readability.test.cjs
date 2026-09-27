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

test('case study status comes before the full project story', () => {
  const projects = require('../../src/_data/projects.json').filter(p => p.featured);
  for (const project of projects) {
    const $ = load(`/projects/${project.slug}/`);
    assert.equal($('.page-heading .project-status').length, 1);
    assert.equal(norm($('.page-heading .project-status p').text()), project.status);
    assert.equal($('.project-story .project-status').length, 0);
    for (const field of ['problem', 'built', 'learned']) assert.ok(norm($('.project-story').text()).includes(project[field]));
  }
});

test('every job story is visible without tabs on About; Home links to the longer version', () => {
  const jobs = require('../../src/_data/experience.json');
  for (const route of ['/portfolio/']) {
    const $ = load(route);
    assert.equal($('#experience .experience-entry').length, jobs.length);
    assert.equal($('#experience [role=tablist], #experience [role=tabpanel]').length, 0);
    const entries = $('#experience .experience-entry').toArray();
    jobs.forEach((job, index) => {
      const entry = $(entries[index]);
      assert.equal(norm(entry.find('h3').first().text()), job.role);
      for (const text of [job.company, job.dates, job.summary, ...job.bullets]) assert.ok(norm(entry.text()).includes(text));
      assert.equal(entry.attr('hidden'), undefined);
      assert.equal(entry.attr('id'), `panel-${job.id}`);
      assert.equal(entry.find('h3').attr('id'), `tab-${job.id}`);
      if (job.id === 'zain') assert.deepEqual([entry.find('img').attr('width'), entry.find('img').attr('height')], ['655', '376']);
      if (job.id === 'freelance-devops') assert.deepEqual([entry.find('img').attr('width'), entry.find('img').attr('height')], ['2584', '980']);
    });
  }
  const home = load('/');
  assert.ok(norm(home('#experience h2').text()).includes(`${jobs[0].role} at ${jobs[0].company}`));
  assert.ok(home('#experience a[href="/portfolio/#experience"]').length);
});

test('About keeps the personal story but drops generic throat-clearing', () => {
  const $ = load('/portfolio/');
  assert.equal($('.about-heading .eyebrow').length, 0);
  assert.match(norm($('#about > p').first().text()), /privacy and GRC.*security tools.*AI models locally/);
  assert.match(norm($('#about').text()), /My dad is a computer engineer/);
  assert.match(norm($('#about').text()), /I'm based in Jordan/);
  assert.equal($('#projects .section-heading-row p').length, 0);
  assert.equal($('#references .eyebrow').length, 0);
  assert.equal($('#references blockquote').length, 2);
});

const interiorCopy = [
  ['/sites/', 'Security projects, local AI and small web tools.', "Things I've built."],
  ['/blog/', 'Security, software, and the occasional detour. Writing helps me figure out what I actually think.', 'Notes & rabbit holes.'],
  ['/life/', "Places I've been, games I love and the tools I use.", 'A little more life.'],
  ['/photos/', 'Trips and graduation photos from @qusai.pro.', 'The camera roll.'],
  ['/connect/', 'Email is the easiest way to reach me.', 'Say hi.']
];
for (const [route, lede, title] of interiorCopy) {
  test(`plain introduction ${route}`, () => {
    const $ = load(route);
    assert.equal(norm($('h1').text()), title);
    assert.equal(norm($('.page-heading .page-lede').text()), lede);
    assert.equal($('.page-heading .eyebrow').length, 0);
  });
}

test('game notes stay even after the duplicated slogan goes', () => {
  const $ = load('/games/');
  assert.equal($('.games-margin-note').length, 0);
  for (const game of require('../../src/_data/games.json')) assert.ok(norm($('main').text()).includes(game.title));
});
