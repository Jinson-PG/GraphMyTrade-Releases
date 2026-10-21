'use strict';
/* GraphMyTrade 99 Shop v5 — catalog UI; no cart, private data or invented listings */
(()=>{
 const names={career:"Career & resumes",excel:"Excel & Sheets",notion:"Notion templates",guides:"E-books & PDFs",education:"Study resources",bundles:"Digital bundles",courses:"Courses",strategies:"Strategies",calculators:"Calculators",checklists:"Checklists",bots:"Telegram tools",extensions:"Extensions",software:"Software tools",scripts:"Scripts",indicators:"Indicators",business:"Business tools",finance:"Personal finance",design:"Design assets",planners:"Planners",services:"Digital services"};
 const formats=new Set(['PDF','XLSX','XLS','CSV','DOCX','PPTX','ZIP','NOTION','HTML','JS','EXE','LINK','COURSE','PINE','JSON','SVG','PNG','WEBP','BOT','OTHER']);
 const $=id=>document.getElementById(id),grid=$('gmt-product-grid'),results=$('gmt-results'),input=$('gmt-search'),empty=$('gmt-empty'),noResults=$('gmt-no-results'),failure=$('gmt-error');
 if(!grid||!results||!input||!empty||!noResults||!failure)return;
 const buttons=[...document.querySelectorAll('[data-filter]')];
 const q=new URL(location.href);
 let active=Object.hasOwn(names,q.searchParams.get('category'))?q.searchParams.get('category'):'all';
 let catalog=[];
 input.value=(q.searchParams.get('q')||'').slice(0,120);
 const node=(tag,cls,text)=>{let x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
 const safeCheckout=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&['imjo.in','instamojo.com','www.instamojo.com'].includes(u.hostname)&&u.pathname.length>2;}catch{return false;}};
 const safeCover=value=>{if(!value)return true;if(/^\/assets\/[a-z0-9/_-]+\.(png|webp|jpe?g)$/i.test(value))return true;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
 const valid=p=>p&&typeof p==='object'&&!Array.isArray(p)&&p.status==='published'&&typeof p.slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)&&p.slug.length<=80&&typeof p.title==='string'&&p.title.trim().length>=3&&p.title.length<=140&&typeof p.description==='string'&&p.description.trim().length>=12&&p.description.length<=2400&&typeof p.category==='string'&&Object.hasOwn(names,p.category)&&formats.has(p.format)&&Number.isInteger(p.priceInr)&&p.priceInr>=1&&p.priceInr<=99&&typeof p.checkoutUrl==='string'&&safeCheckout(p.checkoutUrl)&&(!p.cover||typeof p.cover==='string'&&safeCover(p.cover));
 const prod=p=>{
   const card=node('article','gmt-product'),link=node('a','gmt-product-image');link.href='/store/p/'+encodeURIComponent(p.slug)+'/';link.setAttribute('aria-label','View '+p.title);
   if(p.cover){const img=node('img');img.src=p.cover;img.alt=p.title+' cover';img.loading='lazy';link.append(img);}
   else link.append(node('span','gmt-product-initial',(p.title[0]||'G').toUpperCase()));
   link.append(node('small',null,p.format));
   const body=node('div','gmt-product-copy');
   body.append(node('span','gmt-product-label',names[p.category]),node('h3',null,p.title),node('p',null,p.description));
   const action=node('div','gmt-product-buy');
   const buy=node('a',null,'Buy now ↗');buy.href=p.checkoutUrl;buy.target='_blank';buy.rel='noopener noreferrer';buy.setAttribute('aria-label','Buy '+p.title+' on Instamojo');
   action.append(node('strong',null,'₹'+p.priceInr),buy);
   body.append(action);card.append(link,body);return card;
 };
 const sync=()=>{
   buttons.forEach(b=>{const on=b.dataset.filter===active;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
   const next=new URL(location.href);
   if(active==='all')next.searchParams.delete('category');else next.searchParams.set('category',active);
   if(input.value.trim())next.searchParams.set('q',input.value.trim().slice(0,120));else next.searchParams.delete('q');
   if(next.href!==location.href)history.replaceState(null,'',next.pathname+next.search+next.hash);
 };
 const draw=()=>{
   const term=input.value.trim().toLowerCase().slice(0,120);
   const shown=catalog.filter(p=>(active==='all'||p.category===active)&&(!term||[p.title,p.description,names[p.category],p.format].join(' ').toLowerCase().includes(term)));
   grid.replaceChildren(...shown.map(prod));
   grid.hidden=shown.length===0;
   empty.hidden=catalog.length!==0;
   noResults.hidden=catalog.length===0||shown.length!==0;
   failure.hidden=true;
   results.textContent=catalog.length===0?'Our first collection is being prepared':shown.length+' product'+(shown.length===1?'':'s')+' · all priced ₹1–₹99';
   sync();
 };
 buttons.forEach(b=>b.addEventListener('click',()=>{active=b.dataset.filter;draw();}));
 document.querySelectorAll('[data-category-tile]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();active=a.dataset.categoryTile;draw();$('collection')?.scrollIntoView({behavior:'smooth'});}));
 input.addEventListener('input',draw);
 $('gmt-reset')?.addEventListener('click',()=>{active='all';input.value='';draw();});
 const seen=new Set();
 fetch('/store/api/catalog',{cache:'no-store'})
   .then(async r=>{if(!r.ok)throw Error('Catalog HTTP error');return r.json();})
   .then(data=>{
     if(data.schemaVersion!==3||data.currency!=='INR'||!Array.isArray(data.products)||data.products.length>300||typeof data.checkoutEnabled!=='boolean')throw Error('Invalid catalog');
     catalog=data.checkoutEnabled?data.products.filter(p=>{if(!valid(p)||seen.has(p.slug))return false;seen.add(p.slug);return true;}):[];
     draw();
   })
   .catch(()=>{grid.hidden=empty.hidden=noResults.hidden=true;failure.hidden=false;results.textContent='Catalog temporarily unavailable';});
 sync();
 // Optional desktop-only parallax; not used for any functional content.
 if(window.matchMedia?.('(prefers-reduced-motion: no-preference) and (hover:hover) and (pointer:fine)').matches){
   const hero=document.querySelector('.gmt-hero-stage');
   if(hero&&window.requestAnimationFrame){
     let raf=0,px=0,py=0;
     hero.addEventListener('pointermove',e=>{
       const r=hero.getBoundingClientRect();px=((e.clientX-r.left)/r.width-.5)*20;py=((e.clientY-r.top)/r.height-.5)*12;
       if(!raf)raf=requestAnimationFrame(()=>{hero.style.setProperty('--mx',px.toFixed(1)+'px');hero.style.setProperty('--my',py.toFixed(1)+'px');raf=0});
     },{passive:true});
     hero.addEventListener('pointerleave',()=>{if(raf)cancelAnimationFrame(raf);raf=0;hero.style.setProperty('--mx','0px');hero.style.setProperty('--my','0px')},{passive:true});
   }
 }
})();
