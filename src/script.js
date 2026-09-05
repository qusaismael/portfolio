/* Shared interactions. Every page remains readable without JavaScript. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = $('#mobile-menu-toggle');
  const nav = $('#main-nav');
  function closeMenu() {
    menu?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('active');
    if (menu) menu.querySelector('.menu-label').textContent = 'Menu';
  }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('active', open);
    menu.querySelector('.menu-label').textContent = open ? 'Close' : 'Menu';
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => {
    if (!e.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);

  const theme = $('#theme-toggle');
  function labelTheme() {
    const dark = document.documentElement.dataset.theme !== 'light';
    theme?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    theme?.setAttribute('aria-pressed', String(!dark));
  }
  theme?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (_) { /* Storage is optional. */ }
    labelTheme();
  });
  labelTheme();

  const clock = $('#header-time');
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Amman', hour: '2-digit', minute: '2-digit', hour12: false
  });
  function updateClock() {
    if (!clock) return;
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = formatter.format(now);
    clock.hidden = false;
    const zone = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Amman', timeZoneName: 'longOffset'}).formatToParts(now).find(part => part.type === 'timeZoneName')?.value;
    const label = $('#header-timezone');
    if (label && zone) label.textContent = zone.replace('GMT', 'GMT ');
  }
  updateClock();
  if (clock) setInterval(updateClock, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClock(); });
  const header = $('#site-header');
  if (header && 'ResizeObserver' in window) new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-offset', Math.ceil(header.getBoundingClientRect().height) + 'px');
  }).observe(header);

  let toastTimer;
  function announce(message) {
    const toast = $('#copy-status');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('is-visible'); toast.textContent = ''; }, 4500);
  }
  $$('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy;
      const label = button.textContent;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(value);
        button.textContent = 'Copied!';
        announce(button.dataset.copyLabel ? button.dataset.copyLabel + ' copied.' : 'Copied to clipboard.');
        setTimeout(() => { button.textContent = label; }, 2500);
      } catch (_) {
        announce('Copy is unavailable here. Select the text above to copy it manually.');
      }
    });
  });

  const portrait = $('#profile-dialog');
  $$('[data-profile-photo]').forEach(button => button.addEventListener('click', () => portrait?.showModal()));
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
  portrait?.addEventListener('click', e => { if (e.target === portrait) portrait.close(); });

  $$('.exp-tabs-container').forEach(root => {
    const tabs = [...root.querySelectorAll('[role=tab]')];
    const panels = [...root.querySelectorAll('[role=tabpanel]')];
    const mobile = matchMedia('(max-width: 767px)');
    const setOrientation = () => root.querySelector('[role=tablist]')?.setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical');
    mobile.addEventListener('change', setOrientation);
    setOrientation();
    function activate(tab, focus = false) {
      tabs.forEach(t => {
        const active = t === tab;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', e => {
        let next = index;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else return;
        e.preventDefault();
        activate(tabs[next], true);
      });
    });
    if (tabs.length) activate(tabs[0]);
  });
  $$('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));

  const top = $('#back-to-top');
  function updateTop() { if (top) top.hidden = window.scrollY < 700; }
  addEventListener('scroll', updateTop, { passive: true });
  top?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: motion.matches ? 'instant' : 'smooth' });
    $('.brand')?.focus({ preventScroll: true });
  });
  updateTop();
  let catIndex = 0;
  const catLines = ['meow.', 'Yes, the cat is part of the team.', 'Currently reviewing your code. Silently.', 'One more click. For science.'];
  $('#cat-button')?.addEventListener('click', () => { $('#cat-message').textContent = catLines[catIndex++ % catLines.length]; });

})();
