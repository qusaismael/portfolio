/* A bounded, browser-only shortcut shell. No eval, network calls, or system access. */
(() => {
 'use strict';
 const dialog = document.getElementById('command-dialog');
 if (!dialog || typeof dialog.showModal !== 'function') return;
 const input = document.getElementById('terminal-input');
 const form = document.getElementById('terminal-form');
 const output = document.getElementById('terminal-output');
 const openers = [...document.querySelectorAll('[data-terminal-open]')];
 const routes = {
  home: '/', work: '/sites/', projects: '/#projects', sites: '/sites/',
  portfolio: '/portfolio/', writing: '/blog/', blog: '/blog/', life: '/life/',
  games: '/games/', photos: '/photos/', contact: '/connect/', resume: '/resume/',
  recommendations: '/life/#tech-stack', recs: '/life/#tech-stack'
 };
 const commands = [...Object.keys(routes), 'help', 'ls', 'cd', 'about', 'whoami', 'skills', 'stack',
  'pgp', 'gpg', 'github', 'email', 'time', 'theme', 'quasi', 'iq', 'cat', 'pwd', 'clear', 'exit'];
 const completions = [...commands, ...Object.keys(routes).map(name => 'cd ' + name), 'theme dark', 'theme light'];
 let history = [], cursor = 0, draft = '', lastFocused = null, overflowBefore = '';

 function show() {
  if (dialog.open || document.querySelector('dialog[open]')) return;
  lastFocused = document.activeElement;
  overflowBefore = document.body.style.overflow;
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  input.focus();
 }
 function close() { dialog.close(); }
 dialog.addEventListener('close', () => {
  document.body.style.overflow = overflowBefore;
  if (lastFocused?.isConnected) lastFocused.focus({preventScroll: true});
 });
 dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
 openers.forEach(button => {
  button.hidden = false;
  button.addEventListener('click', show);
 });
 document.addEventListener('keydown', event => {
  if (event.key !== '\x60' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  if (event.target.closest('input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])')) return;
  if (!dialog.open && document.querySelector('dialog[open]')) return;
  event.preventDefault();
  if (dialog.open) close(); else show();
 });

 function append(command, message, links = [], error = false) {
  const entry = document.createElement('div');
  entry.className = 'terminal-entry' + (error ? ' terminal-error' : '');
  if (command) {
   const prompt = document.createElement('div');
   prompt.className = 'terminal-command';
   prompt.textContent = '$ ' + command;
   entry.append(prompt);
  }
  const response = document.createElement('div');
  response.className = 'terminal-response';
  response.textContent = message;
  links.forEach(([label, href]) => {
   const link = document.createElement('a');
   link.textContent = label + ' →';
   link.href = href;
   response.append(link);
  });
  entry.append(response);
  output.append(entry);
  while (output.children.length > 60) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
 }
 function execute(raw) {
  const entered = String(raw || '').trim().slice(0,200);
  if (!entered) return;
  if (history[history.length-1] !== entered) history.push(entered);
  history = history.slice(-50);
  cursor = history.length;
  draft = '';
  const normalized = entered.toLowerCase().replace(/\s+/g, ' ');
  const [command, ...args] = normalized.split(' ');
  let message = '', links = [], error = false;
  if (Object.prototype.hasOwnProperty.call(routes, normalized)) {
   window.location.assign(routes[normalized]); return;
  }
  switch (command) {
   case 'help':
    message = 'Look around: ls · home · work · projects · portfolio · writing · life · games · photos · contact · resume\n' +
     'Get to know me: whoami · skills · quasi · iq · cat\n' +
     'Useful things: time · email · github · pgp · theme [light|dark]\n' +
     'Shell-ish things: cd <page> · pwd · clear · exit\n\n' +
     '↑ ↓ recall commands. Tab completes a name. Esc gets you out.\nThis is a website shortcut shell, not a system terminal.';
    break;
   case 'ls':
    message = 'A few places to go:\n';
    links = Object.entries(routes).filter(([name]) => !['sites','blog','recommendations','recs'].includes(name));
    break;
   case 'cd': {
    const target = args.join(' ').replace(/^\.?\//, '').replace(/\/$/, '');
    if (Object.prototype.hasOwnProperty.call(routes, target)) { window.location.assign(routes[target]); return; }
    if (['','~','..'].includes(target)) { window.location.assign('/'); return; }
    message = 'No page called "' + args.join(' ') + '". Try ls or cd photos.'; error = true;
    break;
   }
   case 'about':
   case 'whoami':
    message = dialog.dataset.name + '\n' + dialog.dataset.role + ' · Jordan\n\n' +
     'Part security, part software, quasi everything in between.\nI like figuring out how things work. And being in rooms where people think differently.';
    break;
   case 'skills':
   case 'stack':
    message = 'Security & privacy: GRC, ISO 27001, SIEM, threat intelligence\nCode: Python, JavaScript, Bash, SQL\nSystems: Linux, Docker, VPS, CI/CD\nAI: local models, Ollama, applied AI';
    break;
   case 'pgp':
   case 'gpg': message = 'GPG fingerprint:\n' + dialog.dataset.fingerprint; break;
   case 'email': message = dialog.dataset.email + '\n'; links = [['Write to me', 'mailto:' + dialog.dataset.email]]; break;
   case 'github': message = 'Things I have built, and things I am still figuring out.\n'; links = [['My GitHub', dialog.dataset.github]]; break;
   case 'time': {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Amman', hour:'2-digit', minute:'2-digit', hour12:false, timeZoneName:'longOffset'}).formatToParts(new Date());
    const value = type => parts.find(part => part.type === type)?.value || '';
    message = 'Based in Jordan\n' + value('hour') + ':' + value('minute') + ' · ' + value('timeZoneName').replace('GMT','GMT ');
    break;
   }
   case 'theme': {
    if (args.length > 1 || (args[0] && !['light','dark'].includes(args[0]))) { message = 'Try theme, theme light, or theme dark.'; error = true; break; }
    const theme = document.getElementById('theme-toggle');
    if (!args[0] || document.documentElement.dataset.theme !== args[0]) theme?.click();
    message = 'Theme: ' + document.documentElement.dataset.theme + '.';
    break;
   }
   case 'quasi': message = 'Qusai (القصي): “The Far Away.”\nQuasi: “seemingly.”\nSame neighborhood of letters. Completely different jobs.'; break;
   case 'iq': message = 'QI. Not IQ.\nUnless it stands for Intelligent Qusai.\n...which is a very convenient interpretation.'; break;
   case 'cat': message = ' /\\_/\\\n( o.o )\n > ^ <\n\nmrrp. The cat also has terminal access. Apparently.'; break;
   case 'pwd': message = 'qusai.pro' + window.location.pathname; break;
   case 'clear': output.textContent = ''; append('', 'A clean slate. Type help if you need it.'); return;
   case 'exit': close(); return;
   default:
    message = command === 'sudo' || command === 'rm' ? 'Nice try. This cat has no root privileges.' :
     'I don’t know "' + entered + '". Try help.';
    error = true;
  }
  append(entered, message, links, error);
 }
 form.addEventListener('submit', event => {
  event.preventDefault();
  const raw = input.value;
  input.value = '';
  execute(raw);
  if (dialog.open) input.focus();
 });
 document.querySelectorAll('[data-terminal-command]').forEach(button => button.addEventListener('click', () => {
  input.value = '';
  execute(button.dataset.terminalCommand);
  if (dialog.open) input.focus();
 }));
 input.addEventListener('keydown', event => {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
   if (!history.length) return;
   event.preventDefault();
   if (cursor === history.length) draft = input.value;
   cursor = Math.max(0, Math.min(history.length, cursor + (event.key === 'ArrowUp' ? -1 : 1)));
   input.value = cursor === history.length ? draft : history[cursor];
   input.setSelectionRange(input.value.length, input.value.length);
  } else if (event.key === 'Tab' && !event.shiftKey) {
   const prefix = input.value.trim().toLowerCase();
   if (!prefix) return;
   const matches = completions.filter(command => command.startsWith(prefix));
   if (!matches.length || (matches.length === 1 && matches[0] === prefix)) return;
   event.preventDefault();
   if (matches.length === 1) input.value = matches[0];
   else append('', 'Matches: ' + matches.join(' · '));
  }
 });
})();
