#!/usr/bin/env node
// Explicit maintenance command: the site never contacts the feed at runtime.
const fs = require('node:fs/promises');
const path = require('node:path');
const https = require('node:https');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const metadata = path.join(root, 'src/_data/photos.json');
const instagram = /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?[^\s]*)?$/;
function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    if (u.protocol !== 'https:') return reject(new Error('HTTPS required'));
    const options = { headers: { 'User-Agent': 'portfolio-photo-sync/1.0' } };
    if (u.hostname === 'behold.pictures' && process.env.BEHOLD_RESOLVE) {
      options.lookup = (hostname, opts, cb) => {
        const address = process.env.BEHOLD_RESOLVE;
        if (!require('node:net').isIPv4(address)) return cb(new Error('BEHOLD_RESOLVE must be IPv4'));
        cb(null, opts.all ? [{ address, family: 4 }] : address, 4);
      };
    }
    const req = https.get(u, options, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && redirects < 4 && res.headers.location) {
        res.resume(); return resolve(get(new URL(res.headers.location, u).href, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > 30e6) req.destroy(new Error('Image too large')); else chunks.push(chunk); });
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.setTimeout(12000, () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
  });
}
function candidates(item) {
  if (!item) return [];
  return [...new Set(['large', 'full', 'medium', 'small'].map(s => item.sizes?.[s]?.mediaUrl)
    .concat(item.mediaType === 'VIDEO' ? [item.thumbnailUrl] : [item.mediaUrl, item.thumbnailUrl]).filter(Boolean))];
}
async function main() {
  let old = [];
  try { old = JSON.parse(await fs.readFile(metadata, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  // Abort before touching any files if feed fetching/parsing fails.
  const feed = JSON.parse((await get('https://feeds.behold.so/ejGxzOQacoDxD3xiP62S')).toString());
  const posts = Array.isArray(feed) ? feed : feed.posts;
  if (!Array.isArray(posts) || !posts.length) throw new Error('Empty or invalid feed; existing archive untouched');
  const out = []; const missing = [];
  await fs.mkdir(path.join(root, 'src/pics/photos'), { recursive: true });
  for (const post of posts) {
    const id = String(post.id);
    if (!/^[A-Za-z0-9_-]+$/.test(id)) { console.warn('Skipping unsafe ID'); continue; }
    const previous = old.find(p => p.id === id);
    const sources = post.children?.length ? post.children : [post];
    const children = [];
    // Limit concurrent downloads; keep stable feed order.
    for (let start = 0; start < sources.length; start += 4) {
      const batch = await Promise.all(sources.slice(start, start + 4).map(async (item, offset) => {
        const index = start + offset;
        const key = id + '-' + index;
        const urls = candidates(item).concat(index === 0 ? candidates(post) : []);
        for (const url of [...new Set(urls)]) {
          try {
            const bytes = await get(url);
            const full = await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
            const card = await sharp(full.data).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
            const base = '/pics/photos/' + key;
            await fs.writeFile(path.join(root, 'src' + base + '.webp'), full.data);
            await fs.writeFile(path.join(root, 'src' + base + '-600.webp'), card.data);
            return { id: key, src: base + '-600.webp', fullSrc: base + '.webp', width: full.info.width, height: full.info.height, cardWidth: card.info.width, cardHeight: card.info.height, alt: previous?.children?.find(c => c.id === key)?.alt || 'Camera-roll moment ' + (index + 1) + ' · ' + String(post.timestamp || '').slice(0, 10), isVideo: item.mediaType === 'VIDEO' };
          } catch (e) { console.warn(key + ': ' + new URL(url).hostname + ' — ' + e.message); }
        }
        return previous?.children?.find(c => c.id === key) || null;
      }));
      children.push(...batch.filter(Boolean));
    }
    if (!children.length) {
      missing.push(id + ' (' + (post.caption || '') + ')');
      if (previous) out.push(previous);
      continue;
    }
    out.push({ id, date: String(post.timestamp || '').slice(0, 10), caption: post.prunedCaption || post.caption || '', permalink: instagram.test(post.permalink || '') ? post.permalink : 'https://instagram.com/qusai.pro', ...children[0], id, children });
  }
  // Retain older good posts, even if the upstream feed drops or fails them.
  for (const post of old) if (!out.some(p => p.id === post.id)) out.push(post);
  if (!out.length) throw new Error('No usable images; existing archive untouched');
  await fs.writeFile(metadata + '.tmp', JSON.stringify(out, null, 2) + '\n');
  await fs.rename(metadata + '.tmp', metadata);
  console.log(JSON.stringify({ posts: out.length, images: out.reduce((n, p) => n + p.children.length, 0), missing }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
