'use strict';

function isoDate(value) {
  if (!value) return '2026-01-01T00:00:00Z';
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00Z`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? '2026-01-01T00:00:00Z'
    : parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function topicSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function blogPostingLd(post, site, pageUrl, topic) {
  const published = isoDate(post && post.date);
  const canonical = `${site.url}${pageUrl}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: published,
    dateModified: published,
    url: canonical,
    mainEntityOfPage: canonical,
    author: {
      '@type': 'Person',
      name: site.name,
      url: site.url
    }
  };
  if (topic) schema.articleSection = topic;
  if (post.url) schema.sameAs = post.url;
  return jsonLd(schema);
}

function creativeWorkLd(project, site, pageUrl, ogImage) {
  const canonical = `${site.url}${pageUrl}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.name,
    description: project.description,
    url: canonical,
    author: {
      '@type': 'Person',
      name: site.name,
      url: site.url
    }
  };
  if (ogImage) schema.image = `${site.url}${ogImage}`;
  if (Array.isArray(project.tags) && project.tags.length) schema.keywords = project.tags;
  if (project.live) schema.sameAs = project.live;
  if (project.source) schema.isBasedOn = project.source;
  return jsonLd(schema);
}

module.exports = {
  isoDate,
  xmlEscape,
  topicSlug,
  jsonLd,
  blogPostingLd,
  creativeWorkLd
};
