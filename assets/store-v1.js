'use strict';
(() => {
  const menu = document.querySelector('.store-menu-btn');
  const mobile = document.querySelector('#store-mobile-menu');
  if (menu && mobile) {
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      mobile.hidden = !open;
      menu.textContent = open ? '×' : '☰';
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobile.hidden = true; menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open navigation'); menu.textContent = '☰';
    }));
  }
  const categories = new Set(['guides', 'workbooks', 'checklists', 'templates']);
  const slugRx = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const label = {guides:'Trading guides',workbooks:'Workbooks',checklists:'Checklists',templates:'Templates'};
  const validProduct = p => p && typeof p === 'object' && !Array.isArray(p) &&
    p.status === 'published' && typeof p.slug === 'string' && slugRx.test(p.slug) && p.slug.length <= 80 &&
    typeof p.title === 'string' && p.title.trim().length > 0 && p.title.length <= 140 &&
    categories.has(p.category) && typeof p.description === 'string' && p.description.length <= 1000 &&
    Number.isFinite(p.priceInr) && p.priceInr >= 0 && p.priceInr < 100 &&
    ['PDF','XLSX','ZIP'].includes(p.format) &&
    (p.cover === undefined || (typeof p.cover === 'string' && /^\/assets\/[a-z0-9/_-]+\.(?:webp|png|jpg|jpeg)$/i.test(p.cover))) &&
    (p.addedAt === undefined || (typeof p.addedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.addedAt)));
  const el = (tag,cls,txt) => { const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n; };
  const currency = value => '₹' + value.toLocaleString('en-IN',{maximumFractionDigits:2,minimumFractionDigits:0});
  const preview = p => {
    const art=el('div','store-product-preview');
    if(p.cover){const img=el('img');img.loading='lazy';img.src=p.cover;img.alt=p.title+' product cover';art.append(img);}
    else art.append(el('span',null,'✳'));
    return art;
  };
  const showProduct = p => {
    const a=el('a','store-product-card');a.href='/store/item/?slug='+encodeURIComponent(p.slug);
    a.append(preview(p));
    const body=el('div','store-product-body');body.append(el('span','kind',label[p.category]+' / '+p.format));
    body.append(el('h3',null,p.title),el('p',null,p.description));
    const foot=el('div','store-product-foot');foot.append(el('strong',null,currency(p.priceInr)),el('span',null,'View details ↗'));
    body.append(foot);a.append(body);return a;
  };
  const fetchProducts = async () => {
    const res=await fetch('/store/catalog.json',{cache:'no-store'});
    if(!res.ok)throw new Error('Catalog unavailable');
    const data=await res.json();
    if(!data || data.schemaVersion!==1 || !Array.isArray(data.products) || data.products.length>400)throw new Error('Invalid catalog');
    const unique=new Set();
    return data.products.filter(p=>{if(!validProduct(p)||unique.has(p.slug))return false;unique.add(p.slug);return true;});
  };
  const grid=document.getElementById('product-grid');
  const itemRoot=document.getElementById('item-root');
  const renderStore = products => {
    if(!products.length)return; // Empty prelaunch page is intentional; no fake products.
    const controls=document.querySelector('#catalog-tools');const empty=document.querySelector('#catalog-empty');
    const count=document.querySelector('#product-count');const none=document.querySelector('#catalog-no-matches');
    const search=document.querySelector('#product-search');const category=document.querySelector('#product-category');const sort=document.querySelector('#product-sort');
    controls.hidden=false;empty.hidden=true;grid.hidden=false;
    const update=()=>{
      const term=search.value.trim().toLowerCase().slice(0,120);
      let data=products.filter(p=>(category.value==='all'||p.category===category.value)&&
        (!term || (p.title+' '+p.description+' '+label[p.category]).toLowerCase().includes(term)));
      data=data.slice().sort((a,b)=>sort.value==='price-low'?a.priceInr-b.priceInr:sort.value==='price-high'?b.priceInr-a.priceInr:String(b.addedAt||'').localeCompare(String(a.addedAt||'')));
      grid.replaceChildren(...data.map(showProduct));grid.hidden=!data.length;none.hidden=!!data.length;
      count.textContent=data.length+' '+(data.length===1?'item':'items')+' available to explore';
    };
    [search,category,sort].forEach(x=>x.addEventListener(x===search?'input':'change',update));update();
  };
  const renderItem = products => {
    const slug=new URLSearchParams(location.search).get('slug');
    const product=products.find(p=>p.slug===slug);if(!product)return;
    itemRoot.replaceChildren();
    const kicker=el('p','store-kicker',label[product.category]+' / '+product.format);
    const title=el('h1',null,product.title);
    const desc=el('p',null,product.description);
    const price=el('strong','store-item-price',currency(product.priceInr));
    const status=el('p',null,'This is an advance product preview. Payments and secure downloads are not available yet.');
    const back=el('a','store-btn store-btn-primary','Back to digital store ↗');back.href='/store/';
    itemRoot.append(kicker,title,desc,price,status,back);
    document.title=product.title+' | GraphMyTrade Digital Store';
  };
  if(grid || itemRoot){fetchProducts().then(products=>{if(grid)renderStore(products);if(itemRoot)renderItem(products);}).catch(()=>{
    if(grid){const count=document.querySelector('#product-count');if(count)count.textContent='Collection unavailable';}
    // Template retains its safe 'Product not available' state.
  });}
})();