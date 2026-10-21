/* GraphMyTrade Motion v6 — progressive enhancements for the unchanged v5 website. */
(() => {
  'use strict';
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover:hover) and (pointer:fine) and (min-width:791px)');
  const showcase=document.querySelector('.v5-showcase');
  const stage=showcase?.querySelector('.v4-product');
  // A little pointer-based depth, limited to ±1.2 degrees; never alters touch layouts.
  if (showcase && stage && fine.matches && !mq.matches) {
    let raf=0;
    showcase.addEventListener('pointermove', e => {
      const rect=showcase.getBoundingClientRect();
      const x=((e.clientX-rect.left)/rect.width-.5)*2;
      const y=((e.clientY-rect.top)/rect.height-.5)*2;
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        stage.style.setProperty('--gmt6-tilt-x',`${Math.max(-1.2,Math.min(1.2,x*1.2)).toFixed(2)}deg`);
        stage.style.setProperty('--gmt6-tilt-y',`${Math.max(-.8,Math.min(.8,-y*.8)).toFixed(2)}deg`);
      });
    },{passive:true});
    showcase.addEventListener('pointerleave',()=>{stage.style.removeProperty('--gmt6-tilt-x');stage.style.removeProperty('--gmt6-tilt-y')});
  }
  if(fine.matches && !mq.matches){
    document.querySelectorAll('.v4-feature').forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect();
        card.style.setProperty('--gmt6-x',`${(e.clientX-r.left).toFixed(0)}px`);
        card.style.setProperty('--gmt6-y',`${(e.clientY-r.top).toFixed(0)}px`);
      },{passive:true});
    });
  }
  // Real scroll-linked 3D: one passive, rAF-coalesced listener for the product
  // and FOUR decorative card graphics. No JS animation loop while idle.
  if (showcase && stage && fine.matches && !mq.matches) {
    const hero=document.querySelector('.v5-hero');
    const cards=[...document.querySelectorAll('.v4-feature')].map(card=>({
      root:card, art:card.querySelector('.v4-api-diagram,.v4-visual-chart,.v4-candle-wrap,.v4-journal-ui')
    })).filter(item=>item.art);
    let pending=false;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const tick=()=>{
      pending=false;
      // zero at page top reproduces original v5 frame geometry exactly.
      const distance=Math.max(500,Math.min(940,innerHeight*.95));
      const t=clamp(scrollY/distance,0,1);
      stage.style.setProperty('--gmt6-scroll-ry',`${(3.8*t).toFixed(2)}deg`);
      stage.style.setProperty('--gmt6-scroll-rx',`${(-2.4*t).toFixed(2)}deg`);
      stage.style.setProperty('--gmt6-scroll-y',`${(-12*t).toFixed(2)}px`);
      stage.style.setProperty('--gmt6-scroll-z',`${(28*t).toFixed(2)}px`);
      showcase.style.setProperty('--gmt6-float-top',`${(-18*t).toFixed(2)}px`);
      showcase.style.setProperty('--gmt6-float-bottom',`${(13*t).toFixed(2)}px`);
      // Animate artistic illustrations as their sections enter the viewport.
      for (const {root,art} of cards) {
        const r=root.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight+100) continue;
        const q=clamp((r.top+r.height*.5-innerHeight*.5)/(innerHeight*.70),-1,1);
        art.style.setProperty('--gmt6-card-rx',`${(-2.7*q).toFixed(2)}deg`);
        art.style.setProperty('--gmt6-card-ry',`${(1.9*q).toFixed(2)}deg`);
        art.style.setProperty('--gmt6-card-y',`${(-5*q).toFixed(2)}px`);
      }
    };
    const queue=()=>{if(!pending){pending=true;requestAnimationFrame(tick)}};
    addEventListener('scroll',queue,{passive:true});
    addEventListener('resize',queue,{passive:true});
    queue();
    // Browser settings can change live. Remove transforms on reduced motion.
    mq.addEventListener?.('change',e=>{
      if(!e.matches) {queue();return;}
      ['--gmt6-scroll-ry','--gmt6-scroll-rx','--gmt6-scroll-y','--gmt6-scroll-z'].forEach(k=>stage.style.removeProperty(k));
      showcase.style.removeProperty('--gmt6-float-top');
      showcase.style.removeProperty('--gmt6-float-bottom');
      cards.forEach(({art})=>['--gmt6-card-rx','--gmt6-card-ry','--gmt6-card-y'].forEach(k=>art.style.removeProperty(k)));
    });
  }
  // Page progress unobtrusive and updated only on scroll/resize.
  const line=document.querySelector('.gmt6-progress');
  if(line){
    let ticking=false;
    const update=()=>{
      const available=document.documentElement.scrollHeight-innerHeight;
      const p=available>0?Math.min(1,Math.max(0,scrollY/available)):0;
      line.style.setProperty('--gmt6-progress',String(p));ticking=false;
    };
    const request=()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}};
    addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});update();
  }
  // Full screenshot viewer works with keyboard; browser link is fallback without JS.
  const trigger=document.querySelector('.gmt6-view-image');
  const dialog=document.querySelector('.gmt6-lightbox');
  if(trigger && dialog && typeof dialog.showModal==='function'){
    trigger.addEventListener('click',e=>{e.preventDefault();dialog.showModal()});
    dialog.querySelector('[data-gmt6-close]')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    dialog.addEventListener('close',()=>trigger.focus({preventScroll:true}));
  }
})();