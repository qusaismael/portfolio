/* Only verified merges into other people's projects. No invented fallback activity. */
(async () => {
 const root = document.getElementById('gh-merged-prs');
 if (!root) return;
 const status = document.getElementById('gh-pulse-updated');
 const key = 'qi_verified_merges_v4';
 const url = 'https://api.github.com/search/issues?q=is%3Apr+is%3Amerged+author%3Aqusaismael+-user%3Aqusaismael&sort=updated&order=desc&per_page=3';
 const dateFormat = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
 const valid = item => {
  const match = typeof item?.html_url === 'string' && item.html_url.match(/^https:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)\/([A-Za-z0-9_.-]+)\/pull\/([1-9]\d*)$/);
  return match && !['.', '..'].includes(match[2]) && match[1].toLowerCase() !== 'qusaismael' && typeof item.title === 'string' && item.title.trim() &&
   typeof item.pull_request?.merged_at === 'string' && Number.isFinite(Date.parse(item.pull_request.merged_at));
 };
 const node = (tag, text, cls) => {
  const element = document.createElement(tag);
  element.textContent = text;
  if (cls) element.className = cls;
  return element;
 };
 function repoIcon(owner, repo) {
  const icon = node('span', '', 'contribution-icon');
  // The adjacent repository name already identifies this decorative image.
  icon.setAttribute('aria-hidden', 'true');
  const words = repo.split(/[-_.]+/).filter(Boolean);
  const initials = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || owner).slice(0, 2);
  const fallback = node('span', initials.toUpperCase(), 'contribution-initials');
  const avatar = node('img', '', 'contribution-avatar');
  avatar.alt = '';
  avatar.width = 56; avatar.height = 56;
  avatar.loading = 'lazy'; avatar.decoding = 'async'; avatar.referrerPolicy = 'no-referrer';
  // Keep the image laid out while loading so native lazy loading can activate.
  avatar.addEventListener('load', () => {
   avatar.hidden = false;
   avatar.setAttribute('data-loaded', 'true');
   fallback.hidden = true;
  });
  avatar.addEventListener('error', () => {
   avatar.hidden = true;
   avatar.setAttribute('data-loaded', 'false');
   fallback.hidden = false;
  });
  // GitHub's repository-owner avatar, never the PR author's image or a feed-supplied URL.
  avatar.src = 'https://github.com/' + encodeURIComponent(owner) + '.png?size=112';
  icon.append(fallback, avatar);
  return icon;
 }
 function note(text) {
  if (!status) return;
  status.textContent = text;
  status.hidden = false;
 }
 function render(items) {
  const seen = new Set();
  const selected = items.filter(valid).filter(item => {
   if (seen.has(item.html_url)) return false;
   seen.add(item.html_url); return true;
  }).sort((a,b) => Date.parse(b.pull_request.merged_at)-Date.parse(a.pull_request.merged_at)).slice(0,3);
  const rows = selected.map(pr => {
   const parts = new URL(pr.html_url).pathname.split('/');
   const row = node('li', '', 'contribution-item');
   const repo = node('p', '', 'contribution-repo');
   repo.append(node('span', parts[1] + '/' + parts[2]), node('span', '#' + parts[4]));
   const title = node('h3', '');
   const link = node('a', pr.title.trim());
   link.href = pr.html_url; link.target = '_blank'; link.rel = 'noopener noreferrer';
   title.append(link);
   const meta = node('p', '', 'contribution-date');
   const date = node('time', dateFormat.format(new Date(pr.pull_request.merged_at)));
   date.dateTime = pr.pull_request.merged_at;
   meta.append(node('span', 'Merged'), date);
   row.append(repoIcon(parts[1], parts[2]), repo, title, meta);
   return row;
  });
  root.replaceChildren(...rows);
 }
 let cache, savedAt;
 try {
  const saved = JSON.parse(localStorage.getItem(key));
  const age = Date.now() - saved?.savedAt;
  if (Number.isFinite(saved?.savedAt) && age >= 0 && age < 7*86400000 && Array.isArray(saved.items)) {
   cache = saved.items.filter(valid);
   savedAt = saved.savedAt;
  }
 } catch (_) { /* Storage is optional. */ }
 root.setAttribute('aria-busy','true');
 if (cache?.length) {
  render(cache);
  note('Saved ' + dateFormat.format(new Date(savedAt)) + ' · checking GitHub for updates…');
 } else {
  note('Checking accepted contributions on GitHub…');
 }
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 8000);
 try {
  const response = await fetch(url, {signal:controller.signal, headers:{Accept:'application/vnd.github+json'}});
  if (!response.ok) throw new Error('GitHub unavailable');
  const body = await response.json();
  if (!Array.isArray(body.items)) throw new Error('Invalid response');
  const items = body.items.filter(valid);
  if (!items.length) throw new Error('No verified merges returned');
  render(items);
  const checkedAt = Date.now();
  note('Verified on GitHub · checked ' + dateFormat.format(new Date(checkedAt)));
  try { localStorage.setItem(key, JSON.stringify({savedAt:checkedAt,items})); } catch (_) {}
 } catch (_) {
  if (cache?.length) {
   note('Previously verified · saved ' + dateFormat.format(new Date(savedAt)) + ' · live refresh unavailable');
  } else {
   const empty = node('li', '', 'contribution-empty');
   empty.append(node('p', "GitHub couldn't load the latest merges right now."),
    node('span', 'You can still browse the full history through the link beside this list.'));
   root.replaceChildren(empty);
   note('Live feed unavailable. No substitute activity is shown.');
  }
 } finally {
  clearTimeout(timeout);
  root.setAttribute('aria-busy','false');
 }
})();
