/* Cinematic scroll, but content remains readable and indexable without JS. */
(() => {
  'use strict';
  const journey=document.querySelector('[data-gmt7-journey]');
  if(!journey)return;
  const stage=journey.querySelector('.gmt7-sticky-stage');
  const screen=journey.querySelector('[data-gmt7-screen]');
  const chapters=[...journey.querySelectorAll('[data-gmt7-step]')];
  const number=stage?.querySelector('[data-gmt7-count]');
  const media=window.matchMedia('(min-width:791px) and (prefers-reduced-motion:no-preference)');
  let active=0,pending=false,paused=false;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function activate(n){
    if(n===active && stage?.dataset.step===String(n))return;
    active=n;
    stage.dataset.step=String(n);
    if(number)number.textContent=String(n+1).padStart(2,'0');
    for(const [i,node] of chapters.entries()){
      node.dataset.active=String(i===n);
    }
  }
  function tick(){
    pending=false;
    if(!stage||!screen)return;
    if(!media.matches){
      screen.style.removeProperty('--gmt7-rx');screen.style.removeProperty('--gmt7-ry');screen.style.removeProperty('--gmt7-z');screen.style.removeProperty('--gmt7-x');screen.style.removeProperty('--gmt7-y');screen.style.removeProperty('--gmt7-scale');
      activate(0);return;
    }
    const viewMid=window.innerHeight*.55;
    const nearest=chapters.map(node=>{
      const r=node.getBoundingClientRect();
      return Math.abs((r.top+r.bottom)/2-viewMid);
    });
    const idx=nearest.indexOf(Math.min(...nearest));
    activate(idx);
    const r=journey.getBoundingClientRect();
    if(r.bottom<0 || r.top>innerHeight)return;
    const first=chapters[0].getBoundingClientRect();
    const last=chapters[chapters.length-1].getBoundingClientRect();
    const denominator=(last.top+last.height*.5)-(first.top+first.height*.5);
    const progress=clamp((viewMid-(first.top+first.height*.5))/(denominator||1),0,1);
    // Three intentional film-like camera beats; physically moving depth, not tiny 1-degree tilt.
    const beats=[{rx:9,ry:-19,z:-90,x:-18,y:22,scale:.84},
                 {rx:-3,ry:4,z:64,x:0,y:-8,scale:.98},
                 {rx:6,ry:18,z:4,x:12,y:6,scale:.92}];
    const q=clamp(progress*2,0,2),left=Math.min(1,Math.floor(q)),frac=q-left;
    const ease=t=>t*t*(3-2*t);
    const t=ease(frac),a=beats[left],b=beats[Math.min(2,left+1)];
    const mix=k=>a[k]+(b[k]-a[k])*t;
    screen.style.setProperty('--gmt7-rx',mix('rx').toFixed(2)+'deg');
    screen.style.setProperty('--gmt7-ry',mix('ry').toFixed(2)+'deg');
    screen.style.setProperty('--gmt7-z',mix('z').toFixed(1)+'px');
    screen.style.setProperty('--gmt7-x',mix('x').toFixed(1)+'px');
    screen.style.setProperty('--gmt7-y',mix('y').toFixed(1)+'px');
    screen.style.setProperty('--gmt7-scale',mix('scale').toFixed(3));
  }
  function queue(){if(paused || pending)return;pending=true;requestAnimationFrame(tick)}
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue,{passive:true});
  media.addEventListener?.('change',queue);
  document.addEventListener('visibilitychange',()=>{paused=document.hidden;if(!paused)queue()});
  activate(0);queue();
})();