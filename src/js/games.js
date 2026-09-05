/* Progressive enhancement: all favorites are readable without JavaScript. */
(() => {
 'use strict';
 const controls = document.querySelector('[data-game-filters]');
 const cards = [...document.querySelectorAll('[data-game-moods]')];
 const count = document.querySelector('[data-game-count]');
 if (!controls || !cards.length || !count) return;
 const choices = [...controls.querySelectorAll('input[name="game-mood"]')];
 const labels = {all: 'Everything', worlds: 'Get a little lost', challenge: 'One more try', company: 'Bring someone'};
 function filter(mood) {
  if (!Object.prototype.hasOwnProperty.call(labels, mood)) mood = 'all';
  let visible = 0;
  cards.forEach(card => {
   card.hidden = mood !== 'all' && !card.dataset.gameMoods.split(' ').includes(mood);
   if (!card.hidden) visible++;
  });
  choices.forEach(choice => { choice.checked = choice.value === mood; });
  count.textContent = mood === 'all' ? cards.length + ' games on the shelf.' : visible + ' of ' + cards.length + ' games · ' + labels[mood] + '.';
 }
 function revealLinkedGame() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
  const card = cards.find(card => card.id === id);
  if (card) {
   const wasHidden = card.hidden;
   filter('all');
   if (wasHidden) card.scrollIntoView({block: 'start', behavior: 'instant'});
  }
 }
 choices.forEach(choice => choice.addEventListener('change', () => {
  if (choice.checked) filter(choice.value);
 }));
 window.addEventListener('hashchange', revealLinkedGame);
 // Browsers may restore checked controls on history navigation.
 window.addEventListener('pageshow', () => {
  filter(choices.find(choice => choice.checked)?.value || 'all');
  revealLinkedGame();
 });
 controls.hidden = false;
 filter('all');
})();
