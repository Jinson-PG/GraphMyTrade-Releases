'use strict';
// Shop only: no login, no browser cart, no simulated payments. Approved products come from the read-only public catalog.
(()=>{
  const names={career:'Career & resumes',excel:'Excel & Sheets',notion:'Notion templates',guides:'E-books & PDFs',education:'Study resources',bundles:'Digital bundles',courses:'Courses',strategies:'Trading strategies',calculators:'Calculators',checklists:'Checklists',bots:'Telegram tools',extensions:'Extensions',software:'Software',scripts:'Scripts',indicators:'Indicators',business:'Business tools',finance:'Personal finance',design:'Design assets',planners:'Planners',services:'Digital services'};
  const formats=new Set(['PDF','XLSX','XLS','CSV','DOCX','PPTX','ZIP','NOTION','HTML','JS','EXE','LINK','COURSE','PINE','JSON','SVG','PNG','WEBP','BOT','OTHER']);
  const byId=id=>document.getElementById(id);
  const grid=byId('ed-products'),search=byId('ed-search'),select=byId('ed-category'),result=byId('ed-results');
  if(!grid||!search||!select||!result)return;
  const empty=byId('ed-empty'),missing=byId('ed-no-results'),error=byId('ed-error'),chips=[...document.querySelectorAll('[data-filter]')];
  const url=new URL(location.href);
  let active=Object.hasOwn(names,url.searchParams.get('category'))?url.searchParams.get('category'):'all';
  let products=[];
  search.value=(url.searchParams.get('q')||'').slice(0,120);
  const tag=(type,className,value)=>{const x=document.createElement(type);if(className)x.className=className;if(value!==undefined)x.textContent=value;return x;};
  const safeCheckout=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&['instamojo.com','www.instamojo.com','imjo.in'].includes(u.hostname)&&u.pathname.length>=3;}catch{return false;}};
  const safeCover=value=>{if(!value)return true;if(/^\/assets\/[a-z0-9/_-]+\.(png|webp|jpe?g)$/i.test(value))return true;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
  const valid=p=>p&&typeof p==='object'&&!Array.isArray(p)&&p.status==='published'&&typeof p.slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)&&p.slug.length<=80&&typeof p.title==='string'&&p.title.length>=3&&p.title.length<=140&&typeof p.description==='string'&&p.description.length>=12&&p.description.length<=2400&&Object.hasOwn(names,p.category)&&formats.has(p.format)&&Number.isInteger(p.priceInr)&&p.priceInr>=1&&p.priceInr<=99&&safeCheckout(p.checkoutUrl)&&safeCover(p.cover||'');
  function productCard(p){
    const card=tag('article','ed-product');
    const cover=tag('a','ed-product-cover');cover.href='/store/p/'+encodeURIComponent(p.slug)+'/';cover.setAttribute('aria-label','View details for '+p.title);
    if(p.cover){const img=tag('img');img.src=p.cover;img.loading='lazy';img.alt='Cover for '+p.title;cover.append(img);}else cover.append(tag('span',null,(p.title[0]||'G').toUpperCase()));
    cover.append(tag('small',null,p.format));
    const body=tag('div','ed-product-body');
    body.append(tag('span','ed-product-category',names[p.category]||p.category),tag('h3',null,p.title),tag('p',null,p.description));
    const bottom=tag('div','ed-product-bottom'),detail=tag('a',null,'View details ↗');
    detail.href=cover.href;
    bottom.append(tag('strong',null,'₹'+p.priceInr),detail);
    body.append(bottom);card.append(cover,body);return card;
  }
  const sync=()=>{
    chips.forEach(c=>{const yes=c.dataset.filter===active;c.classList.toggle('is-active',yes);c.setAttribute('aria-pressed',String(yes));});
    select.value=active==='all'||chips.some(c=>c.dataset.filter===active)?'':active;
    const next=new URL(location.href);
    active==='all'?next.searchParams.delete('category'):next.searchParams.set('category',active);
    search.value.trim()?next.searchParams.set('q',search.value.trim().slice(0,120)):next.searchParams.delete('q');
    if(next.href!==location.href)history.replaceState(null,'',next.pathname+next.search+next.hash);
  };
  const draw=()=>{
    const term=search.value.trim().toLowerCase().slice(0,120);
    const shown=products.filter(p=>(active==='all'||p.category===active)&&(!term||[p.title,p.description,names[p.category],p.format].join(' ').toLowerCase().includes(term)));
    grid.replaceChildren(...shown.map(productCard));
    grid.hidden=shown.length===0;
    empty.hidden=products.length!==0;
    missing.hidden=products.length===0||shown.length!==0;
    error.hidden=true;
    result.textContent=products.length===0?'The first collection is in preparation':shown.length+' of '+products.length+' approved products';
    sync();
  };
  chips.forEach(chip=>chip.addEventListener('click',()=>{active=chip.dataset.filter;draw();}));
  select.addEventListener('change',()=>{active=select.value||'all';draw();});
  search.addEventListener('input',draw);
  byId('ed-clear')?.addEventListener('click',()=>{active='all';search.value='';draw();});
  document.querySelectorAll('[data-category-tile]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();active=a.dataset.categoryTile;draw();byId('collection')?.scrollIntoView({behavior:'smooth'});}));
  const seen=new Set();
  fetch('/store/api/catalog',{cache:'no-store'})
    .then(async r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json();})
    .then(data=>{
      if(data.schemaVersion!==3||data.currency!=='INR'||!Array.isArray(data.products)||data.products.length>300)throw Error('Invalid catalog');
      products=data.products.filter(p=>{if(!valid(p)||seen.has(p.slug))return false;seen.add(p.slug);return true;});
      draw();
    })
    .catch(()=>{grid.hidden=true;empty.hidden=true;missing.hidden=true;error.hidden=false;result.textContent='Catalog temporarily unavailable';});
  sync();
})();
