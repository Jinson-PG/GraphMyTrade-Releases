/* GraphMyTrade v6 — progressive enhancement only. Essential page content works without JS. */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const header = $('.site-header');
  const progress = $('#reading-progress');
  const menuToggle = $('#menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileMenu.hidden = !open;
  };
  menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (event) => {if (menuToggle && mobileMenu && !mobileMenu.hidden && !header.contains(event.target)) setMenu(false);});

  let scheduled = false;
  const updateScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if(progress) progress.style.transform = `scaleX(${Math.max(0, Math.min(1, maxScroll > 0 ? window.scrollY/maxScroll : 0))})`;
    header?.classList.toggle('scrolled', window.scrollY > 8);
    scheduled = false;
  };
  window.addEventListener('scroll', () => {if (!scheduled){scheduled = true;requestAnimationFrame(updateScroll);}}, {passive:true});
  updateScroll();

  if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {entry.target.classList.add('is-visible');obs.unobserve(entry.target);}
      });
    }, {rootMargin: '0px 0px -40px 0px',threshold:0.08});
    $$('.reveal').forEach(el => {el.classList.add('can-reveal');revealObserver.observe(el);});
  }

  const visual = $('#hero-visual');
  const device = $('#preview-device');
  let motionFrame = 0;
  if(visual && device && !prefersReducedMotion.matches && window.matchMedia('(pointer:fine)').matches) {
    visual.addEventListener('pointermove', (event) => {
      const rect = visual.getBoundingClientRect();
      const x = ((event.clientX - rect.left)/rect.width - .5);
      const y = ((event.clientY - rect.top)/rect.height - .5);
      cancelAnimationFrame(motionFrame);
      motionFrame = requestAnimationFrame(() => device.style.transform = `translate3d(${(x*7).toFixed(1)}px, ${(y*7).toFixed(1)}px, 0) rotateY(${(x*1.6).toFixed(2)}deg)`);
    });
    visual.addEventListener('pointerleave', () => {cancelAnimationFrame(motionFrame);device.style.transform='';});
  }

  const modal = $('#preview-modal');
  const openPreview = () => {
    if (!modal) return;
    if (typeof modal.showModal === 'function') modal.showModal();
    else window.open('/assets/graphmytrade-app-preview.webp', '_blank', 'noopener,noreferrer');
  };
  $('#preview-open')?.addEventListener('click', openPreview);
  $('#preview-open-bottom')?.addEventListener('click', openPreview);
  modal?.addEventListener('click', (e) => {if (e.target === modal) modal.close();});

  const config = window.GRAPHMYTRADE_SITE || {};
  const label = $('#price-label');
  if (label && typeof config.priceLabel === 'string' && config.priceLabel.trim()) label.textContent = config.priceLabel;
  const year = $('#year');
  if(year) year.textContent = String(new Date().getFullYear());
})();