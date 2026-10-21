'use strict';
(() => {
  const menu = document.querySelector('.store-menu-btn');
  const mobile = document.getElementById('store-mobile-menu');
  if(menu && mobile){
    menu.addEventListener('click', () => {
      const isOpen = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded',String(isOpen));
      menu.setAttribute('aria-label',isOpen?'Close navigation':'Open navigation');
      mobile.hidden = !isOpen;
      menu.textContent = isOpen?'×':'☰';
    });
    mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      mobile.hidden = true;menu.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-label','Open navigation');menu.textContent='☰';
    }));
  }
  // Store is prelaunch. Nothing on static pages collects payments or unlocks files.
  const cats = Object.freeze({courses:'Course PDFs',strategies:'Strategies',notion:'Notion templates',excel:'Excel & Sheets',calculators:'Digital calculators',guides:'E-books & guides',checklists:'Checklists',bundles:'Value bundles'});
  const kinds = new Set(Object.keys(cats));
  const renderEl=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const validProduct=p=>!!p&&typeof p==='object'&&!Array.isArray(p)&&p.status==='published'&&
    typeof p.slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)&&p.slug.length<=80&&
    typeof p.title==='string'&&p.title.length<=140&&p.title.trim().length>=3&&
    typeof p.description==='string'&&p.description.length<=1200&&p.description.trim().length>=12&&
    kinds.has(p.category)&&p.priceInr===99&&['PDF','XLSX','ZIP','NOTION','HTML'].includes(p.format)&&
    (p.cover===undefined||(typeof p.cover==='string'&&/^\/assets\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(p.cover)))&&
    (p.addedAt===undefined||(typeof p.addedAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.addedAt)));
  const getProducts=async()=>{
    const r=await fetch('/store/catalog.json',{cache:'no-store'});
    if(!r.ok) throw Error('Catalog unavailable');
    const c=await r.json();
    if(c.schemaVersion!==2||c.currency!=='INR'||c.flatPriceInr!==99||c.checkoutEnabled!==false||!Array.isArray(c.products)||c.products.length>300)throw Error('Invalid catalog');
    const seen=new Set();return c.products.filter(p=>{if(!validProduct(p)||seen.has(p.slug))return false;seen.add(p.slug);return true;});
  };
  const grid=document.getElementById('mk-product-grid');
  const itemRoot=document.getElementById('mk-item-root');
  if(!grid && !itemRoot)return;
  if(itemRoot && !grid){
    getProducts().then(products=>{
      const slug = new URLSearchParams(window.location.search).get('slug');
      const product = products.find(p=>p.slug===slug);
      if(!product)return;
      itemRoot.replaceChildren(
        renderEl('p','mk-kicker',cats[product.category]+' / '+product.format),
        renderEl('h1',null,product.title),
        renderEl('p',null,product.description),
        renderEl('p','mk-item-notice','Planned price: ₹99 · Purchases are not yet available. No payment details are collected.'),
      );
      const back=renderEl('a','mk-button mk-button-dark','Back to the store ↗');back.href='/store/';itemRoot.append(back);
      document.title=product.title+' | GraphMyTrade Digital Store';
    }).catch(()=>{});
    return;
  }
  const q=document.getElementById('mk-search'),select=document.getElementById('mk-filter-category'),sort=document.getElementById('mk-sort');
  const status=document.getElementById('mk-results-status'),empty=document.getElementById('mk-empty'),none=document.getElementById('mk-no-results');
  const chips=[...document.querySelectorAll('.mk-chip')];
  let category='all',products=[];
  const setCategory=id=>{category=kinds.has(id)?id:'all';select.value=category;chips.forEach(ch=>{const on=ch.dataset.filter===category;ch.classList.toggle('active',on);ch.setAttribute('aria-pressed',String(on));});draw();};
  const productNode=p=>{
    const a=renderEl('a','mk-product');a.href='/store/item/?slug='+encodeURIComponent(p.slug);
    const art=renderEl('div','mk-product-art');
    if(p.cover){const im=renderEl('img');im.loading='lazy';im.src=p.cover;im.alt=p.title+' cover';art.append(im)}
    else art.append(renderEl('span',null,'✳'));
    const body=renderEl('div','mk-product-body');body.append(renderEl('span',null,cats[p.category]+' / '+p.format),renderEl('h3',null,p.title),renderEl('p',null,p.description));
    const foot=renderEl('div','mk-product-foot');foot.append(renderEl('strong',null,'₹99'),renderEl('small',null,'Preview · checkout not live'));body.append(foot);a.append(art,body);return a;
  };
  const draw=()=>{
    const term=q.value.trim().toLowerCase().slice(0,140);
    let filtered=products.filter(p=>(category==='all'||p.category===category)&&(!term||(p.title+' '+p.description+' '+cats[p.category]).toLowerCase().includes(term)));
    filtered=filtered.slice().sort((a,b)=>sort.value==='title'?a.title.localeCompare(b.title):sort.value==='category'?a.category.localeCompare(b.category):(b.addedAt||'').localeCompare(a.addedAt||''));
    grid.replaceChildren(...filtered.map(productNode));
    grid.hidden=!filtered.length;empty.hidden=!!products.length;none.hidden=!!filtered.length||!products.length;
    status.textContent=products.length?`${filtered.length} product${filtered.length===1?'':'s'} found`:'First collection in preparation';
  };
  q.addEventListener('input',draw);select.addEventListener('change',()=>setCategory(select.value));sort.addEventListener('change',draw);
  chips.forEach(ch=>ch.addEventListener('click',()=>setCategory(ch.dataset.filter)));
  document.querySelectorAll('[data-category-link]').forEach(link=>link.addEventListener('click',()=>setCategory(link.dataset.categoryLink)));
  document.getElementById('mk-filter-reset')?.addEventListener('click',()=>{q.value='';sort.value='latest';setCategory('all')});
  getProducts().then(all=>{products=all;draw();}).catch(()=>{status.textContent='Product catalog temporarily unavailable';empty.querySelector('.mk-empty-copy p:not(.mk-kicker)').textContent='The store catalog is unavailable right now. No payments are being taken. Please try again later.'});
})();