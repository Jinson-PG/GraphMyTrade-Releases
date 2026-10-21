import {publishedProducts,escapeHtml as h} from './catalog.mjs';

const SITE='https://graphmytrade.com';
const jsHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public,max-age=60','X-Content-Type-Options':'nosniff'};
const htmlHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'public,max-age=60','X-Content-Type-Options':'nosniff'};
let cache={source:'',until:0,products:[]};
const isPreview=url=>!['graphmytrade.com','www.graphmytrade.com'].includes(url.hostname);
const safeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
const error=(message,status=404)=>new Response(message,{status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
async function readProducts(env){
 const source=(env.SHEET_CSV_URL||'').trim();
 if(!source)return [];
 const url=new URL(source);
 if(url.protocol!=='https:'||url.hostname!=='docs.google.com'||!url.pathname.startsWith('/spreadsheets/d/')||url.username||url.password)throw Error('Invalid public sheet URL');
 if(cache.source===source&&Date.now()<cache.until)return cache.products;
 const res=await fetch(source,{headers:{Accept:'text/csv'},signal:AbortSignal.timeout(8000)});
 if(!res.ok||(res.headers.get('content-type')||'').includes('text/html'))throw Error('Sheet not published as CSV');
 const products=publishedProducts(await res.text());
 cache={source,until:Date.now()+120000,products};
 return products;
}
// Render approved products in initial HTML so search and AI crawlers do not need JavaScript.
// The browser retains the same interactive filtering and checkout behavior after hydration.
function renderShopHome(template,products,preview,checkoutEnabled=true){
 const cards=products.map(p=>{
  const url='/store/p/'+encodeURIComponent(p.slug)+'/';
  const img=p.cover?'<img src="'+h(p.cover)+'" loading="lazy" alt="'+h(p.title)+' product preview">':
   '<span class="gmt-product-initial" aria-hidden="true">'+h(p.title.slice(0,1).toUpperCase())+'</span>';
  return '<article class="gmt-product"><a class="gmt-product-image" href="'+url+'" aria-label="View '+h(p.title)+'">'+img+
   '<small>'+h(p.format)+'</small></a><div class="gmt-product-copy"><span class="gmt-product-label">'+h(p.category.replace(/-/g,' '))+'</span>'+
   '<h3><a href="'+url+'">'+h(p.title)+'</a></h3><p>'+h(p.description.slice(0,180))+'</p>'+
   '<div class="gmt-product-buy"><strong>₹'+p.priceInr+'</strong>'+(checkoutEnabled?'<a href="'+h(p.checkoutUrl)+'" target="_blank" rel="noopener noreferrer">Buy now ↗</a>':'<a href="'+url+'">View details ↗</a>')+'</div></div></article>';
 }).join('');
 const grid='<div class="gmt-product-grid" id="gmt-product-grid"'+(products.length?'':' hidden')+'>'+cards+'</div>';
 template=template.replace('<div class="gmt-product-grid" id="gmt-product-grid" hidden></div>',grid);
 if(!products.length){
  template=template.replace('<div class="gmt-empty" id="gmt-empty" data-reveal hidden>','<div class="gmt-empty" id="gmt-empty" data-reveal>');
 }
 template=template.replace('Loading the collection…',products.length?
  products.length+' approved digital product'+(products.length===1?'':'s')+' · ₹1–₹99':
  'Our first collection is being prepared');
 if(products.length){
  const schema={'@context':'https://schema.org','@type':'ItemList',
   name:'GraphMyTrade 99 Shop — Approved digital products',
   numberOfItems:products.length,
   itemListElement:products.map((p,i)=>({
    '@type':'ListItem',position:i+1,name:p.title,
    url:SITE+'/store/p/'+encodeURIComponent(p.slug)+'/'
   }))};
  template=template.replace('</head>','<script type="application/ld+json">'+safeJson(schema)+'</script></head>');
 }
 if(preview)template=template.replace(
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  '<meta name="robots" content="noindex,nofollow">');
 return template;
}
function productPage(p,preview,checkoutEnabled=true){
 const canonical=SITE+'/store/p/'+encodeURIComponent(p.slug)+'/';
 const image=p.cover?new URL(p.cover,SITE).href:SITE+'/assets/og-cover.jpg';
 const data={'@context':'https://schema.org','@graph':[
 {'@type':'Product','@id':canonical+'#product',name:p.title,description:p.description,image,category:p.category,
  brand:{'@type':'Brand',name:'GraphMyTrade'},
  ...(checkoutEnabled?{offers:{'@type':'Offer',url:canonical,price:p.priceInr,priceCurrency:'INR',availability:'https://schema.org/InStock'}}:{})},
 {'@type':'BreadcrumbList',itemListElement:[
 {'@type':'ListItem',position:1,name:'Shop',item:SITE+'/store/'},
 {'@type':'ListItem',position:2,name:p.title,item:canonical}]}]};
 const features=p.includes.length?'<ul>'+p.includes.map(x=>'<li>'+h(x)+'</li>').join('')+'</ul>':'<p>See product details for the deliverables.</p>';
 return [
 '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
 '<meta name="robots" content="',preview?'noindex,nofollow':'index,follow,max-image-preview:large','">',
 '<title>',h(p.seoTitle),'</title><meta name="description" content="',h(p.seoDescription),'">',
 '<link rel="canonical" href="',h(canonical),'"><meta property="og:type" content="product">',
 '<meta property="og:title" content="',h(p.seoTitle),'"><meta property="og:description" content="',h(p.seoDescription),'">',
 '<meta property="og:image" content="',h(image),'"><meta property="og:url" content="',h(canonical),'">',
 '<meta property="og:site_name" content="GraphMyTrade"><meta name="twitter:card" content="summary_large_image">',
 '<meta name="twitter:title" content="',h(p.seoTitle),'"><meta name="twitter:description" content="',h(p.seoDescription),'">',
 '<link rel="stylesheet" href="/assets/shop-v5.css">',
 '<script type="application/ld+json">',safeJson(data),'</script></head><body class="shop-page">',
 '<header class="shop-header"><div class="shop-container shop-header-row"><a href="/" class="shop-logo">',
 '<img src="/assets/graphmytrade-app-logo.png" width="38" height="38" alt=""><span><b>GraphMyTrade</b><small>99 SHOP</small></span></a>',
 '<nav class="shop-header-links"><a href="/store/">All products</a></nav></div></header>',
 '<main class="shop-inner-page"><div class="shop-container"><nav class="shop-breadcrumb"><a href="/">Home</a> › <a href="/store/">Store</a> › ',h(p.title),'</nav>',
 '<article class="shop-inner-card"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px;align-items:start">',
 '<div style="background:#fcf3f8;border-radius:18px;padding:20px;min-height:250px">',
 p.cover?'<img src="'+h(image)+'" alt="'+h(p.title)+' preview" style="width:100%;max-height:380px;object-fit:contain">':'<div style="font-size:60px;text-align:center;padding:60px 0" aria-hidden="true">▦</div>',
 '</div><div><div class="shop-product-meta">',h(p.category.toUpperCase()),' · ',h(p.format),'</div>',
 '<h1>',h(p.title),'</h1><p>',h(p.description),'</p><h2>₹',p.priceInr,'</h2>',
 checkoutEnabled?'<a class="shop-cta" href="'+h(p.checkoutUrl)+'" rel="noopener noreferrer" target="_blank">Buy securely on Instamojo ↗</a>':'<p><strong>Checkout is not active yet.</strong> Payments and file delivery must pass verification first.</p>',
 checkoutEnabled?'<p style="margin-top:16px">Instamojo handles checkout and is configured for digital delivery. Confirm the full payable amount and download terms at checkout.</p>':'<p style="margin-top:16px">This listing is informational until payment acceptance and buyer delivery are verified.</p>',
 '<p>Digital goods · <a href="/refund-policy/">Refund terms</a> · <a href="/store/">Explore more approved products</a></p></div></div>',
 '<section class="shop-product-info"><h2>Included</h2>',features,
 '<h2>Compatibility</h2><p>',h(p.compatibility||'Check product details before purchase.'),'</p>',
 '<h2>License</h2><p>',h(p.license||'See product terms.'),'</p></section></article></div></main></body></html>'
 ].join('');
}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/store/admin'||path.startsWith('/store/admin/')||path.startsWith('/store/media/'))return error('Not enabled in the simplified shop',403);
 if(!['GET','HEAD'].includes(request.method))return error('Method not allowed',405);
 if(/^\/store\/(?:cart|library)\/?$/.test(path))return Response.redirect(url.origin+'/store/',302);
 try{
  if(path==='/store/api/catalog'){
   const products=await readProducts(env);
   const ready=env.PAYMENT_DELIVERY_VERIFIED==='true';
   const publicProducts=products.map(p=>ready?p:((({checkoutUrl,...rest})=>rest)(p)));
   const payload={schemaVersion:3,currency:'INR',flatPriceInr:99,checkoutEnabled:ready&&products.length>0,checkoutProvider:'instamojo',products:publicProducts};
   return new Response(request.method==='HEAD'?null:JSON.stringify(payload),{headers:jsHeaders});
  }
  const match=path.match(/^\/store\/p\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if(match){
   const p=(await readProducts(env)).find(x=>x.slug===match[1]);
   if(!p)return error('Product not found');
   const preview=isPreview(url);
   return new Response(request.method==='HEAD'?null:productPage(p,preview,env.PAYMENT_DELIVERY_VERIFIED==='true'),{headers:{...htmlHeaders,...(preview?{'X-Robots-Tag':'noindex,nofollow'}:{})}});
  }
  if(path==='/sitemap.xml'){
   if(!env.ASSETS)return error('Assets unavailable',503);
   const res=await env.ASSETS.fetch(new Request(SITE+'/sitemap.xml'));
   if(!res.ok)return error('Sitemap unavailable',503);
   const entries=(await readProducts(env)).map(p=>'<url><loc>'+SITE+'/store/p/'+h(p.slug)+'/</loc></url>').join('');
   return new Response(request.method==='HEAD'?null:(await res.text()).replace('</urlset>',entries+'</urlset>'),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public,max-age=120',...(isPreview(url)?{'X-Robots-Tag':'noindex'}:{})}});
  }
  if(!env.ASSETS)return error('Assets missing',503);
  if(path==='/store/'||path==='/store/index.html'){
   const assetRequest=request.method==='HEAD'?new Request(request.url,{method:'GET'}):request;
   const [products,base]=await Promise.all([readProducts(env),env.ASSETS.fetch(assetRequest)]);
   if(!base.ok)return base;
   const preview=isPreview(url);
   const output=renderShopHome(await base.text(),products,preview,env.PAYMENT_DELIVERY_VERIFIED==='true');
   const headers=new Headers(base.headers);
   headers.set('Content-Type','text/html; charset=utf-8');
   headers.set('Cache-Control','public,max-age=60');
   headers.delete('Content-Length');headers.delete('ETag');headers.delete('Content-Encoding');
   if(preview)headers.set('X-Robots-Tag','noindex,nofollow');
   return new Response(request.method==='HEAD'?null:output,{status:base.status,headers});
  }
  const asset=await env.ASSETS.fetch(request);
  if(!isPreview(url))return asset;
  const headers=new Headers(asset.headers);headers.set('X-Robots-Tag','noindex,nofollow');
  return new Response(request.method==='HEAD'?null:asset.body,{status:asset.status,statusText:asset.statusText,headers});
 }catch{return error('Store catalog temporarily unavailable',503);}
}};
export {readProducts,productPage,renderShopHome};
