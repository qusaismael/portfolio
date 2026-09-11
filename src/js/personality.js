/* Small, local interactions recovered from Qusai's original portfolio. */
(() => {
 'use strict';
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const notes=[...document.querySelectorAll('[data-note-toggle]')];
 function closeNotes(except) {
  notes.forEach(button=>{
   if(button===except)return;
   document.getElementById(button.dataset.noteToggle).hidden=true;
   button.setAttribute('aria-expanded','false');
  });
 }
 notes.forEach(button=>button.addEventListener('click',()=>{
  const note=document.getElementById(button.dataset.noteToggle);
  const open=note.hidden;
  closeNotes(button);
  note.hidden=!open;
  button.setAttribute('aria-expanded',String(open));
 }));
 document.addEventListener('click',event=>{if(!event.target.closest('[data-note-toggle],.personal-note'))closeNotes();});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape') {
   const open=notes.find(button=>button.getAttribute('aria-expanded')==='true');
   if(open){closeNotes();open.focus();}
  }
 });

 const memory=document.getElementById('memory-dialog');
 document.querySelectorAll('[data-view-photo]').forEach(link=>{
  link.addEventListener('click',event=>{
   if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!memory?.showModal)return;
   const url=new URL(link.href,location.origin);
   if(url.origin!==location.origin||!url.pathname.startsWith('/pics/'))return;
   event.preventDefault();
   const image=memory.querySelector('img');
   image.src=link.href;
   image.alt=link.querySelector('img')?.alt || '';
   document.getElementById('memory-caption').textContent=link.dataset.photoCaption || image.alt;
   memory.showModal();
  });
 });
 memory?.addEventListener('click',event=>{if(event.target===memory)memory.close();});
 memory?.addEventListener('close',()=>memory.querySelector('img').removeAttribute('src'));

 // The "i build / secure / govern systems" line — a calm, continuous loop.
 const word=document.querySelector('[data-word-rotator]');
 if(word&&!motion.matches) {
  const words=['build','secure','govern'];
  let index=0;
  setInterval(()=>{
   if(motion.matches){word.textContent=words[0];word.classList.remove('is-swapping');return;}
   if(document.hidden)return;
   word.classList.add('is-swapping');
   setTimeout(()=>{index=(index+1)%words.length;word.textContent=words[index];word.classList.remove('is-swapping');},320);
  },2200);
 }

 const walkFrames=[
  ' /\\_/\\\n( o.o )\n > ^ < ',
  ' /\\_/\\\n( o.o )\n < ^ > ',
  ' /\\_/\\\n( ^.^ )\n > ^ < '
 ];
 const sitFrames=[' /\\_/\\\n( -.- )\n  z z z',' /\\_/\\\n( -.^ )\n  ~ ~ ~'];
 const pokedFrame=' /\\_/\\\n( O.O )\n  !!! ';
 document.querySelectorAll('[data-cat-habitat]').forEach(habitat=>{
  const track=habitat.querySelector('[data-cat-track]');
  const cat=habitat.querySelector('[data-cat]');
  const frame=habitat.querySelector('[data-cat-frame]');
  const speech=habitat.querySelector('[data-cat-speech]');
  const pause=habitat.querySelector('[data-cat-pause]');
  const status=habitat.querySelector('[data-cat-status]');
  let paused=false;
  try{paused=localStorage.getItem('qi_cat_paused')==='true';}catch(_){}
  let visible=true,timer=null,x=0,direction=1,step=0,sleepFor=0,pokedUntil=0,hovered=false,focused=false;
  let tickTime=performance.now(),reaction=0,clearSpeech;
  const maxX=()=>Math.max(0,track.clientWidth-cat.offsetWidth-24);
  function paint(text,hop=0){
   frame.textContent=text;
   cat.style.setProperty('--cat-x',Math.round(x)+'px');
   cat.style.setProperty('--cat-y',hop+'px');
  }
  function stop(){clearTimeout(timer);timer=null;}
  function tick(){
   timer=null;
   if(paused||motion.matches||document.hidden||!visible)return;
   const now=performance.now(),dt=Math.min((now-tickTime)/1000,.15);
   tickTime=now;
   step+=dt;
   if(now<pokedUntil){
    cat.dataset.state='startled';
    paint(pokedFrame,-Math.sin((pokedUntil-now)/1500*Math.PI)*5);
   }else if(hovered||focused){
    cat.dataset.state='curious';
    paint(walkFrames[2]);
   }else if(sleepFor>0){
    cat.dataset.state='sleeping';
    sleepFor-=dt;
    paint(sitFrames[Math.floor(step*1.5)%7===6?1:0]);
   }else{
    cat.dataset.state='walking';
    const bound=maxX()*.8;
    x=Math.max(0,Math.min(bound,x+direction*34*dt));
    paint(walkFrames[Math.floor(step*5)%walkFrames.length],Math.sin(step*10)*1.5);
    if((direction>0&&x>=bound)||(direction<0&&x<=0)){
     direction*=-1;
     sleepFor=6;
    }
   }
   timer=setTimeout(tick,100);
  }
  function start(){
   stop();
   tickTime=performance.now();
   if(paused||motion.matches){
    cat.dataset.state=motion.matches?'reduced-motion':'paused';
    paint(sitFrames[0]);
    return;
   }
   if(visible&&!document.hidden)tick();
  }
  function sync(){
   pause.disabled=motion.matches;
   pause.textContent=motion.matches?'Cat is resting':paused?'Resume cat':'Pause cat';
   pause.setAttribute('aria-pressed',String(paused||motion.matches));
   pause.title=motion.matches?'Animation is off because you prefer reduced motion':'Pause or resume the wandering cat';
   start();
  }
  pause.addEventListener('click',()=>{
   paused=!paused;
   try{localStorage.setItem('qi_cat_paused',String(paused));}catch(_){}
   sync();
  });
  cat.addEventListener('pointerenter',()=>{hovered=true;});
  cat.addEventListener('pointerleave',()=>{hovered=false;});
  cat.addEventListener('focus',()=>{focused=cat.matches(':focus-visible');});
  cat.addEventListener('blur',()=>{focused=false;});
  cat.addEventListener('click',()=>{
   const lines=['mrrp.','meow.','okay, okay.','purr.'];
   const line=lines[reaction++%lines.length];
   speech.textContent=line;
   status.textContent='The cat says '+line;
   pokedUntil=performance.now()+1500;
   paint(pokedFrame);
   clearTimeout(clearSpeech);
   clearSpeech=setTimeout(()=>{speech.textContent='';if(paused||motion.matches)paint(sitFrames[0]);},1800);
  });
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible)start();else stop();
  }).observe(habitat);
  if('ResizeObserver' in window)new ResizeObserver(()=>{
   x=Math.min(x,maxX()*.8);
   paint(frame.textContent);
  }).observe(track);
  document.addEventListener('visibilitychange',start);
  motion.addEventListener('change',sync);
  sync();
 });
})();
