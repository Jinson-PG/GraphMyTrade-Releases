(() => {
  const config = window.GRAPHMYTRADE_SITE || {};
  const menuBtn=document.querySelector('.nav-toggle');const mobileMenu=document.getElementById('mobile-menu');
  if(menuBtn && mobileMenu){menuBtn.addEventListener('click',()=>{const open=menuBtn.getAttribute('aria-expanded')!=='true';menuBtn.setAttribute('aria-expanded',String(open));mobileMenu.hidden=!open;menuBtn.textContent=open?'×':'☰';document.body.classList.toggle('menu-open',open)});mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.hidden=true;menuBtn.setAttribute('aria-expanded','false');menuBtn.textContent='☰';document.body.classList.remove('menu-open')}));}
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
  const dialog=document.getElementById('action-dialog'), dTitle=document.getElementById('dialog-title'), dDesc=document.getElementById('dialog-description');
  const openDialog=(t,p)=>{if(dialog&&typeof dialog.showModal==='function'){dTitle.textContent=t;dDesc.textContent=p;dialog.showModal();}else alert(t+'\n\n'+p)};
  document.getElementById('dialog-okay')?.addEventListener('click',()=>dialog?.close());
  const validHttps=v=>typeof v==='string' && /^https:\/\//i.test(v);
  document.querySelectorAll('[data-download]').forEach(a=>a.addEventListener('click',e=>{
    if(!validHttps(config.downloadUrl)){e.preventDefault();openDialog('Windows installer not linked yet','The website is ready, but an approved public installer URL must be added before downloading is available. Please check back after the official release.');return;}
    e.preventDefault();location.assign(config.downloadUrl);
  }));
  document.querySelectorAll('[data-checkout]').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();if(validHttps(config.checkoutUrl))location.assign(config.checkoutUrl);else openDialog('Checkout opening soon','The official price and secure payment link are not published yet. Purchases will be available after launch configuration.');
  }));
  document.querySelectorAll('[data-review-submit]').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();if(validHttps(config.reviewFormUrl))location.assign(config.reviewFormUrl);else openDialog('Customer reviews','Customer feedback will be collected and published here after verification. A public review form will be linked when available.');
  }));
  document.querySelectorAll('[data-support]').forEach(a=>a.addEventListener('click',e=>{if(!config.supportEmail){e.preventDefault();openDialog('Support contact coming soon','A verified support email will be published before the software is offered for purchase.');}else{e.preventDefault();location.assign('mailto:'+config.supportEmail)}}));
  document.querySelectorAll('[data-price-label]').forEach(el=>el.textContent=config.priceLabel||'Pricing to be announced');
  document.querySelectorAll('[data-version]').forEach(el=>el.textContent=config.releaseVersion||'Version to be confirmed');
  const reviewArea=document.getElementById('verified-reviews');const ratingArea=document.getElementById('rating-summary');
  if(reviewArea){fetch('/reviews.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(payload=>{
    const reviews=(Array.isArray(payload?.verified)?payload.verified:[]).filter(r=>r && typeof r.quote==='string' && typeof r.name==='string' && Number.isInteger(r.rating) && r.rating>=1 && r.rating<=5).slice(0,9);
    if(!reviews.length)return;
    reviewArea.replaceChildren();reviews.forEach(r=>{const article=document.createElement('article');article.className='review-card';const stars=document.createElement('div');stars.className='stars';stars.setAttribute('aria-label',r.rating+' out of 5 stars');stars.textContent='★'.repeat(r.rating)+'☆'.repeat(5-r.rating);const quote=document.createElement('blockquote');quote.textContent='“'+r.quote+'”';const bottom=document.createElement('footer');const name=document.createElement('strong');name.textContent=r.name;const trader=document.createElement('span');trader.textContent=r.traderType||'Verified customer';bottom.append(name,trader);article.append(stars,quote,bottom);reviewArea.append(article)});if(ratingArea){const avg=(reviews.reduce((n,r)=>n+r.rating,0)/reviews.length).toFixed(1);ratingArea.textContent=avg+' / 5 · '+reviews.length+' verified '+(reviews.length===1?'review':'reviews');}
  }).catch(()=>{});}
  if('IntersectionObserver' in window){document.body.classList.add('js-ready');const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}})},{rootMargin:'0px 0px 10px 0px',threshold:.06});document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));}
})();