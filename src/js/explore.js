(() => {
  'use strict';
  const root = document.querySelector('[data-explorer]');
  if (!root) return;
  const form = root.querySelector('#explore-form');
  const query = form.elements.namedItem('q');
  const type = form.elements.namedItem('type');
  const status = root.querySelector('#explore-status');
  const random = root.querySelector('#explore-random');
  const entries = [...root.querySelectorAll('[data-entry]')];
  const kinds = new Set(['all', 'writing', 'projects']);
  const normalize = value => String(value).normalize('NFKC').toLowerCase();
  let visible = entries;

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

  function restore() {
    const params = new URL(location.href).searchParams;
    query.value = (params.get('q') || '').slice(0, 100);
    type.value = kinds.has(params.get('type')) ? params.get('type') : 'all';
    render();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    query.value = query.value.trim().slice(0, 100);
    const url = new URL(location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('type');
    if (query.value) url.searchParams.set('q', query.value);
    if (type.value !== 'all') url.searchParams.set('type', type.value);
    if (url.href !== location.href) history.pushState(null, '', url);
    render();
  });

  random.addEventListener('click', () => {
    if (!visible.length) return;
    const item = visible[Math.floor(Math.random() * visible.length)];
    location.assign(item.querySelector('h2 a').href);
  });

  addEventListener('popstate', restore);
  restore();
  form.hidden = false;
})();
