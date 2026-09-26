const projects = require('../../src/_data/projects.json');
const writing = require('../../src/_data/writing.json');
const legacy = require('../../src/_data/legacy.json');

const routes = [
  '/', '/sites/', '/portfolio/', '/blog/', '/life/', '/games/', '/photos/', '/connect/', '/resume/',
  ...projects.filter(project => project.featured).map(project => `/projects/${project.slug}/`),
  ...writing.map(post => `/writing/${post.slug}/`)
];

module.exports = { routes, legacy, fileFor: route => `_site${route}index.html` };
