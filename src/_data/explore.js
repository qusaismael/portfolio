const { load } = require('cheerio');
const projects = require('./projects.json');
const writing = require('./writing.json');

const plain = html => load(String(html || '')).text().replace(/\s+/g, ' ').trim();
const entry = (kind, title, href, summary, extra, external = false) => ({
  kind, title, href, summary, external,
  search: [title, summary, plain(extra)].join(' ').toLowerCase()
});

module.exports = [
  ...projects.filter(p => p.featured).map(p => entry(
    'projects', p.name, `/projects/${p.slug}/`, p.description,
    [p.type, ...(p.tags || []), p.problem, p.built, p.learned, p.status].filter(Boolean).join(' ')
  )),
  ...projects.filter(p => !p.featured && p.live).map(p => entry(
    'tools', p.name, p.live, p.description,
    [p.type, ...(p.tags || []), p.live].filter(Boolean).join(' '),
    true
  )),
  ...writing.map(p => entry('writing', p.title, `/writing/${p.slug}/`, p.excerpt, p.body))
];
