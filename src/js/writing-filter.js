/* Progressive topic filter for /blog/. All articles remain visible without JavaScript. */
(() => {
  'use strict';
  const group = document.querySelector('[data-writing-filters]');
  const count = document.querySelector('[data-writing-count]');
  const entries = [...document.querySelectorAll('#medium-posts .writing-entry')];
  if (!group || !entries.length) return;

  const radios = [...group.querySelectorAll('input[name="writing-topic"]')];
  const valid = new Set(radios.map(input => input.value));
  const labels = Object.fromEntries(radios.map(input => [input.value, input.nextElementSibling?.textContent.trim() || input.value]));

  function apply(topic, syncUrl) {
    const selected = valid.has(topic) ? topic : 'all';
    radios.forEach(input => { input.checked = input.value === selected; });
    let shown = 0;
    entries.forEach(entry => {
      const match = selected === 'all' || entry.dataset.topic === selected;
      entry.hidden = !match;
      if (match) shown += 1;
    });
    if (count) {
      count.hidden = false;
      const noun = shown === 1 ? 'article' : 'articles';
      count.textContent = selected === 'all'
        ? `Showing all ${shown} ${noun}.`
        : `Showing ${shown} ${noun} in ${labels[selected]}.`;
    }
    if (syncUrl) {
      const url = new URL(location.href);
      if (selected === 'all') url.searchParams.delete('topic');
      else url.searchParams.set('topic', selected);
      if (url.href !== location.href) history.replaceState(null, '', url);
    }
  }

  function restore() {
    const param = new URL(location.href).searchParams.get('topic') || 'all';
    apply(param, false);
  }

  radios.forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) apply(input.value, true);
    });
  });

  addEventListener('popstate', restore);
  addEventListener('pageshow', restore);
  group.hidden = false;
  restore();
})();
