/* Progressive scroll-spy for long-form article outlines. */
(() => {
  'use strict';
  const nav = document.querySelector('.article-outline');
  if (!nav) return;

  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const pairs = links.map(link => {
    const id = link.getAttribute('href').slice(1);
    const heading = id ? document.getElementById(id) : null;
    return heading ? { link, heading } : null;
  }).filter(Boolean);
  if (!pairs.length) return;

  let activeId = null;
  function setActive(id) {
    if (!id || id === activeId) return;
    activeId = id;
    pairs.forEach(({ link, heading }) => {
      if (heading.id === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function syncByPosition() {
    const threshold = 136;
    let current = pairs[0].heading.id;
    for (const { heading } of pairs) {
      if (heading.getBoundingClientRect().top <= threshold) current = heading.id;
      else break;
    }
    setActive(current);
  }

  if ('IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      const firstVisible = pairs.find(({ heading }) => visible.has(heading.id));
      if (firstVisible) setActive(firstVisible.heading.id);
      else syncByPosition();
    }, { rootMargin: '-96px 0px -65% 0px', threshold: 0 });
    pairs.forEach(({ heading }) => observer.observe(heading));
  }

  links.forEach(link => {
    link.addEventListener('click', () => setActive(link.getAttribute('href').slice(1)));
  });

  addEventListener('scroll', syncByPosition, { passive: true });
  syncByPosition();
})();
