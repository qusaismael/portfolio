(() => {
  'use strict';
  const root = document.querySelector('[data-explorer]');
  if (!root) return;
  const form = root.querySelector('#explore-form');
  const query = form.elements.namedItem('q');
  const type = form.elements.namedItem('type');
  const status = root.querySelector('#explore-status');
  const random = root.querySelector('#explore-random');
  const clearLink = form.querySelector('[data-explore-clear]');
  const entries = [...root.querySelectorAll('[data-entry]')];
  const kinds = new Set(['all', 'writing', 'projects', 'tools']);
  const normalize = value => String(value).normalize('NFKC').toLowerCase();
  let visible = entries;
  let debounceTimer;

  function render() {
    const words = normalize(query.value.trim()).split(/\s+/).filter(Boolean);
    visible = entries.filter(item => {
      const match = (type.value === 'all' || item.dataset.kind === type.value) &&
        words.every(word => normalize(item.dataset.search).includes(word));
      item.hidden = !match;
      return match;
    });
    status.textContent = visible.length
      ? `${visible.length} ${visible.length === 1 ? 'result' : 'results'}.`
      : 'No matches. Try fewer words or choose All content.';
    random.disabled = visible.length === 0;
  }

  function syncUrl(mode) {
    const trimmed = query.value.trim().slice(0, 100);
    const url = new URL(location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('type');
    if (trimmed) url.searchParams.set('q', trimmed);
    if (type.value !== 'all') url.searchParams.set('type', type.value);
    if (url.href !== location.href) {
      if (mode === 'push') history.pushState(null, '', url);
      else history.replaceState(null, '', url);
    }
  }

  function restore() {
    const params = new URL(location.href).searchParams;
    query.value = (params.get('q') || '').slice(0, 100);
    type.value = kinds.has(params.get('type')) ? params.get('type') : 'all';
    render();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearTimeout(debounceTimer);
    query.value = query.value.trim().slice(0, 100);
    syncUrl('push');
    render();
  });

  query.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      syncUrl('replace');
      render();
    }, 100);
  });

  type.addEventListener('change', () => {
    clearTimeout(debounceTimer);
    syncUrl('replace');
    render();
  });

  clearLink?.addEventListener('click', event => {
    event.preventDefault();
    clearTimeout(debounceTimer);
    query.value = '';
    type.value = 'all';
    syncUrl('replace');
    render();
    query.focus();
  });

  random.addEventListener('click', () => {
    if (!visible.length) return;
    const item = visible[Math.floor(Math.random() * visible.length)];
    const link = item.querySelector('h2 a');
    if (link) location.assign(link.href);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    if (document.querySelector('dialog[open]')) return;
    if (event.target.closest('input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])')) return;
    event.preventDefault();
    query.focus();
    query.select();
  });

  addEventListener('popstate', restore);
  restore();
  form.hidden = false;
})();
