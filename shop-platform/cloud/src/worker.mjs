import {authorize,sameOrigin} from './auth.mjs';
const categorySlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const categoryValid=v=>typeof v==='string'&&v.length<=48&&categorySlug.test(v);
const formats=new Set(['PDF','XLSX','XLS','CSV','DOCX','PPTX','ZIP','NOTION','HTML','JS','EXE','LINK','COURSE','PINE','JSON','SVG','PNG','WEBP','BOT','OTHER']);
const statuses=new Set(['draft','review','approved','published']);
const slugRe=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const jsonHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const htmlHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'public,max-age=60','X-Content-Type-Options':'nosniff'};
const err=(message,status=400)=>new Response(JSON.stringify({error:message}),{status,headers:jsonHeaders});
const obj=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:jsonHeaders});
const text=(value,n)=>typeof value==='string'?value.trim().slice(0,n):'';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeJson=(value)=>JSON.stringify(value).replace(/</g,'\\u003c');
const checkSlug=v=>typeof v==='string'&&v.length<=80&&slugRe.test(v);
function validateProduct(v) {
  if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid product details');
  const slug=text(v.slug,81).toLowerCase(),title=text(v.title,140),description=text(v.description,2400);
  if(!checkSlug(slug)||title.length<3||description.length<12)throw Error('Product slug/title/description are required');
  if(!categoryValid(v.category)||!formats.has(v.format))throw Error('Choose a valid category and digital format');
  const price=Number(v.priceInr);
  if(!Number.isInteger(price)||price<1||price>99)throw Error('Price must be ₹1–₹99 (default ₹99)');
  const included=Array.isArray(v.includes)?v.includes.slice(0,15).map(x=>text(x,140)).filter(Boolean):[];
  const keywords=Array.isArray(v.keywords)?v.keywords.slice(0,12).map(x=>text(x,80)).filter(Boolean):[];
  const seoTitle=text(v.seoTitle,95),seoDescription=text(v.seoDescription,230);
  return {slug,title,description,category:v.category,format:v.format,price,
    compatibility:text(v.compatibility,500),license:text(v.license,400),included,seoTitle,seoDescription,keywords};
}
async function bodyJson(request) {
  const length=Number(request.headers.get('content-length')||0);
  if(length>32000)throw Error('Request too large');
  const raw=await request.text();if(raw.length>32000)throw Error('Request too large');
  return JSON.parse(raw);
}
const getById=(db,id)=>db.prepare('SELECT * FROM products WHERE id=?').bind(id).first();
async function categoriesList(db){const r=await db.prepare('SELECT slug,name,sort_order,active FROM shop_categories ORDER BY sort_order ASC,name ASC LIMIT 100').all();return r.results||[];}
async function categoryAllowed(db,slug){const r=await db.prepare('SELECT slug FROM shop_categories WHERE slug=? AND active=1').bind(slug).first();return !!r;}
async function categoriesAdmin(request,env,email,url){
 const parts=url.pathname.match(/^\/store\/admin\/api\/categories(?:\/([a-z0-9-]{1,48}))?$/);if(!parts)return err('Unknown category route',404);
 if(request.method==='GET'&&!parts[1])return obj({categories:await categoriesList(env.DB)});
 if(request.method==='POST'&&!parts[1]){
  let input;try{input=await bodyJson(request)}catch{return err('Invalid category data')}
  const slug=text(input.slug,48).toLowerCase(),name=text(input.name,64);
  if(!categoryValid(slug)||name.length<2||/[<>\u0000-\u001f]/.test(name))return err('Category name and URL slug are required');
  const count=await env.DB.prepare('SELECT COUNT(*) AS c FROM shop_categories').first();if(Number(count?.c||0)>=80)return err('Category limit reached',409);
  try{await env.DB.prepare('INSERT INTO shop_categories(slug,name,sort_order,active,created_at) VALUES(?,?,?,1,?)').bind(slug,name,500,new Date().toISOString()).run();
    await audit(env.DB,slug,'create-category',email,new Date().toISOString());return obj({ok:true,slug},201);
  }catch{return err('Category slug already exists',409)}
 }
 if(request.method==='PUT'&&parts[1]){
  const slug=parts[1];let input;try{input=await bodyJson(request)}catch{return err('Invalid category data')}
  const name=text(input.name,64);if(name.length<2||/[<>\u0000-\u001f]/.test(name))return err('Invalid category name');
  const r=await env.DB.prepare('UPDATE shop_categories SET name=? WHERE slug=?').bind(name,slug).run();
  if(!(r.meta?.changes??r.changes??0))return err('Unknown category',404);
  await audit(env.DB,slug,'rename-category',email,new Date().toISOString());return obj({ok:true});
 }
 return err('Method not allowed',405);
}

const audit=(db,id,action,email,now)=>db.prepare('INSERT INTO admin_audit(id,product_id,action,admin_email,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,action,email,now).run();
const transformed=p=>({id:p.id,slug:p.slug,title:p.title,description:p.description,category:p.category,format:p.format,
  priceInr:p.price_inr,status:p.status,cover:p.cover_key?`/store/media/${encodeURIComponent(p.id)}`:'',
  includes:JSON.parse(p.includes_json||'[]'),compatibility:p.compatibility,license:p.license_text,
  seoTitle:p.seo_title,seoDescription:p.seo_description,keywords:JSON.parse(p.keywords_json||'[]'),
  hasFile:!!p.digital_file_key,filename:p.filename||'',addedAt:(p.published_at||p.created_at).slice(0,10),updatedAt:p.updated_at});
async function listing(db,status='published'){
  const result=await db.prepare('SELECT * FROM products WHERE status=? ORDER BY published_at DESC,updated_at DESC LIMIT 300').bind(status).all();return (result.results||[]).map(transformed);
}
function productPage(p,base) {
 const origin=base.origin,canonical=origin+'/store/p/'+encodeURIComponent(p.slug)+'/',cover=p.cover||origin+'/assets/og-cover.jpg';
 const seoTitle=p.seoTitle||`${p.title} | GraphMyTrade Store`,desc=p.seoDescription||p.description.slice(0,155);
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':canonical+'#webpage','url':canonical,'name':p.title,'description':p.description},
  {'@type':'Product','name':p.title,'description':p.description,'image':cover.startsWith('/')?origin+cover:cover,'category':p.category,'brand':{'@type':'Brand','name':'GraphMyTrade'}},
  {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Store','item':origin+'/store/'},{'@type':'ListItem','position':2,'name':p.title,'item':canonical}]}
 ]};
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#fbf8fa"><meta name="robots" content="index,follow,max-image-preview:large"><title>${h(seoTitle)}</title><meta name="description" content="${h(desc)}"><link rel="canonical" href="${h(canonical)}"><meta property="og:type" content="product"><meta property="og:title" content="${h(seoTitle)}"><meta property="og:description" content="${h(desc)}"><meta property="og:url" content="${h(canonical)}"><meta property="og:image" content="${h(cover)}"><link rel="stylesheet" href="/assets/store-v3.css"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${safeJson(schema)}</script></head><body class="shop-page"><header class="shop-header"><div class="shop-container shop-header-row"><a href="/" class="shop-logo"><img src="/assets/graphmytrade-app-logo.png" width="38" height="38" alt=""><span><b>GraphMyTrade</b><small>DIGITAL SHOP</small></span></a><nav class="shop-header-links"><a href="/store/">Shop all</a><a href="/store/cart/">Cart</a></nav></div></header><main class="shop-inner-page"><div class="shop-container"><nav class="shop-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/store/">Store</a> › ${h(p.title)}</nav><article class="shop-inner-card"><div class="shop-product-seo" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px;align-items:start"><div style="border-radius:18px;background:#fcf3f8;min-height:240px;display:grid;place-items:center">${p.cover?`<img style="width:100%;max-height:380px;object-fit:contain" src="${h(p.cover)}" alt="Cover of ${h(p.title)}">`:'<span aria-hidden="true" style="font-size:88px;color:#86405c">▦</span>'}</div><div><div class="shop-product-meta">${h(p.category.toUpperCase())} · ${h(p.format)}</div><h1 style="font-size:clamp(28px,4vw,46px);line-height:1.12">${h(p.title)}</h1><div style="font-size:30px;font-weight:800;color:#783453;margin:14px 0">₹${p.priceInr}</div><p>${h(p.description)}</p><p style="border-left:3px solid #ad7193;padding:10px;background:#fff5fa">Online purchase and instant download will be activated after verified payment integration. No payment is currently accepted.</p><a class="shop-cta" href="/store/">← More products</a></div></div><div class="shop-product-info" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:18px;margin:24px 0"><section><h2>What's included</h2><ul>${p.includes.map(i=>`<li>${h(i)}</li>`).join('')||'<li>Detailed deliverables will be confirmed before launch.</li>'}</ul></section><section><h2>Compatibility &amp; license</h2><p>${h(p.compatibility||'Compatibility details on request')}</p><p>${h(p.license||'License terms will be confirmed before sales start')}</p></section></div></article></div></main></body></html>`;
}
function mimeOk(mime,kind) {
  if(kind==='cover')return ['image/jpeg','image/png','image/webp'].includes(mime);
  return ['application/pdf','application/zip','application/x-zip-compressed','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','text/html','application/javascript','text/javascript','application/x-msdownload','application/octet-stream','text/csv','application/json','image/svg+xml','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mime);
}
function typeMagic(body,mime,kind){
  const b=new Uint8Array(body.slice(0,16));
  if(kind==='cover'){
   const png=b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71;
   const jpg=b[0]===255&&b[1]===216&&b[2]===255;
   const webp=String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
   return (mime==='image/png'&&png)||(mime==='image/jpeg'&&jpg)||(mime==='image/webp'&&webp);
  }
  if(mime==='application/pdf')return b[0]===37&&b[1]===80&&b[2]===68&&b[3]===70;
  if(mime.includes('zip')||mime.includes('spreadsheet'))return b[0]===80&&b[1]===75;
  return true;
}
async function privateUpload(request,env,id,kind,email){
 if(!env.PRIVATE_ASSETS)return err('File storage not enabled yet. R2 activation is postponed. No payment or file delivery is available.',503);
 const row=await getById(env.DB,id);if(!row)return err('Product missing',404);
 if(row.status==='published')return err('Unpublish before editing files',409);
 const bytes=Number(request.headers.get('content-length'));
 const cap=kind==='cover'?3*1024*1024:24*1024*1024;
 if(!Number.isFinite(bytes)||bytes<=0||bytes>cap)return err('Upload exceeds allowed size or size missing',413);
 const mime=(request.headers.get('content-type')||'').split(';')[0].toLowerCase();
 if(!mimeOk(mime,kind))return err('Unsupported file format',415);
 const content=await request.arrayBuffer();if(content.byteLength!==bytes||content.byteLength>cap||!typeMagic(content,mime,kind))return err('Invalid file contents',422);
 const ext=kind==='cover'?{ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime]:'bin';
 const key=`${kind}/${id}/${crypto.randomUUID()}.${ext}`;
 await env.PRIVATE_ASSETS.put(key,content,{httpMetadata:{contentType:mime}});
 const now=new Date().toISOString(),column=kind==='cover'?'cover_key':'digital_file_key',prev=kind==='cover'?row.cover_key:row.digital_file_key;
 const filename=kind==='file'?text(request.headers.get('x-file-name'),160)||'download':'',qry=`UPDATE products SET ${column}=?,updated_at=?${kind==='file'?',filename=?':''} WHERE id=?`;
 try{await env.DB.prepare(qry).bind(...(kind==='file'?[key,now,filename,id]:[key,now,id])).run();await audit(env.DB,id,kind+'-replace',email,now);}
 catch(e){await env.PRIVATE_ASSETS.delete(key);throw e;}
 if(prev)await env.PRIVATE_ASSETS.delete(prev);
 return obj({ok:true,hasFile:true,cover:kind==='cover'?`/store/admin/api/products/${id}/cover`:undefined});
}
function seoFallback(input) {
 const title=text(input.title,140),kind=text(input.format,12)||'Digital',category=text(input.category,20)||'digital';
 if(title.length<3)throw Error('Add product title before requesting SEO suggestions');
 return {seoTitle:(title+' | '+kind+' Digital Product | GraphMyTrade').slice(0,65),
  seoDescription:(text(input.description,2400)||('Explore '+title+', a useful '+category+' product from GraphMyTrade.')).slice(0,156),
  keywords:[title.toLowerCase(),category+' digital product',kind.toLowerCase()+' template'],mode:'rules'};
}
async function seoSuggest(input,env){
 const fallback=seoFallback(input);
 if(!env.AI)return fallback;
 try{
  const system='You write clear, truthful English search snippets for small digital tools. Return ONLY JSON with strings seoTitle (max 65 characters), seoDescription (max 160 characters), and keywords (array of 3-5 search phrases, max 70 characters each). Use only facts stated in the input. Do not invent product features, ratings, customer reviews, returns, payments or guaranteed trading profits. Avoid investment advice.';
  const payload={title:text(input.title,140),description:text(input.description,1000),category:text(input.category,20),format:text(input.format,12)};
  const response=await env.AI.run(env.AI_MODEL||'@cf/meta/llama-3.1-8b-instruct-fp8',{messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}],max_tokens:260,temperature:0.25});
  const raw=String(response?.response||'');const start=raw.indexOf('{'),end=raw.lastIndexOf('}');if(start<0||end<=start)throw Error('AI returned no JSON');
  const output=JSON.parse(raw.slice(start,end+1));
  if(typeof output.seoTitle!=='string'||typeof output.seoDescription!=='string'||!Array.isArray(output.keywords))throw Error('AI response has missing fields');
  const seoTitle=text(output.seoTitle,65),seoDescription=text(output.seoDescription,160);
  const keywords=output.keywords.slice(0,5).map(k=>text(k,70)).filter(Boolean);
  if(seoTitle.length<12||seoDescription.length<30||keywords.length<2)throw Error('AI suggestions incomplete');
  return{seoTitle,seoDescription,keywords,mode:'ai'};
 }catch{return fallback;} // Honest free-quota fallback, never claim AI was used.
}
async function admin(request,env,url,email){
 const route=url.pathname;
 if(request.method!=='GET'&&request.method!=='HEAD'&&!sameOrigin(request))return err('Cross-origin changes forbidden',403);
 if(route==='/store/admin/api/status'&&request.method==='GET')return obj({databaseReady:true,storageReady:!!env.PRIVATE_ASSETS,checkoutEnabled:false,canPublish:!!env.PRIVATE_ASSETS,mode:env.PRIVATE_ASSETS?'private-files-enabled':'catalog-only'});
 if(route.startsWith('/store/admin/api/categories'))return categoriesAdmin(request,env,email,url);
 if(route==='/store/admin/api/seo-suggest'&&request.method==='POST'){try{return obj(await seoSuggest(await bodyJson(request),env))}catch(e){return err(e.message)}}
 if(route==='/store/admin/api/products'&&request.method==='GET'){
  const r=await env.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC LIMIT 300').all();return obj({products:(r.results||[]).map(transformed)});
 }
 if(route==='/store/admin/api/products'&&request.method==='POST'){
  let p;try{p=validateProduct(await bodyJson(request))}catch(e){return err(e.message)}
  if(!await categoryAllowed(env.DB,p.category))return err('Select an existing active category',422);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  try{
   await env.DB.prepare(`INSERT INTO products(id,slug,title,description,category,format,price_inr,status,compatibility,license_text,includes_json,seo_title,seo_description,keywords_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'draft',?,?,?,?,?,?,?,?)`)
    .bind(id,p.slug,p.title,p.description,p.category,p.format,p.price,p.compatibility,p.license,JSON.stringify(p.included),p.seoTitle,p.seoDescription,JSON.stringify(p.keywords),now,now).run();
   await audit(env.DB,id,'create-draft',email,now);return obj({ok:true,id},201);
  }catch(e){return err('Duplicate slug or database error',409)}
 }
 const match=route.match(/^\/store\/admin\/api\/products\/([0-9a-f-]{36})(?:\/(cover|file|action))?$/);
 if(!match)return err('Unknown admin API route',404);
 const [,id,suffix]=match,row=await getById(env.DB,id);if(!row)return err('Product not found',404);
 if((suffix==='cover'||suffix==='file')&&request.method==='PUT')return privateUpload(request,env,id,suffix,email);
 if((suffix==='cover'||suffix==='file')&&request.method==='GET'){
  const key=suffix==='cover'?row.cover_key:row.digital_file_key;
  if(!key)return err('No file uploaded',404);
  if(!env.PRIVATE_ASSETS)return err('Private file storage is not enabled',503);
  const blob=await env.PRIVATE_ASSETS.get(key);if(!blob)return err('Private file unavailable',404);
  return new Response(blob.body,{headers:{...noStore,'Content-Type':blob.httpMetadata?.contentType||'application/octet-stream','Content-Disposition':suffix==='file'?`attachment; filename="${encodeURIComponent(row.filename||'file')}"`:'inline'}});
 }
 if(!suffix&&request.method==='PUT'){
  if(row.status==='published')return err('Unpublish before editing a live product',409);
  let p;try{p=validateProduct(await bodyJson(request))}catch(e){return err(e.message)}
  if(!await categoryAllowed(env.DB,p.category))return err('Select an existing active category',422);
  try{
   await env.DB.prepare(`UPDATE products SET slug=?,title=?,description=?,category=?,format=?,price_inr=?,status='draft',compatibility=?,license_text=?,includes_json=?,seo_title=?,seo_description=?,keywords_json=?,updated_at=? WHERE id=?`).bind(p.slug,p.title,p.description,p.category,p.format,p.price,p.compatibility,p.license,JSON.stringify(p.included),p.seoTitle,p.seoDescription,JSON.stringify(p.keywords),new Date().toISOString(),id).run();
   await audit(env.DB,id,'edit-to-draft',email,new Date().toISOString());return obj({ok:true});
  }catch{return err('Duplicate slug or save failed',409)}
 }
 if(suffix==='action'&&request.method==='POST'){
  let action;try{action=(await bodyJson(request)).action}catch{return err('Invalid action')}
  const next=({draft:{submit:'review'},review:{approve:'approved',reject:'draft'},approved:{publish:'published',reject:'draft'},published:{unpublish:'draft'}})[row.status]?.[action];
  if(!next||!statuses.has(next))return err('Invalid approval transition',409);
  if(action==='publish'&&!env.PRIVATE_ASSETS)return err('R2 is postponed. You can approve drafts, but public publishing is disabled until private delivery is ready.',409);
  if(action==='publish'&&(!row.seo_title||!row.seo_description||!row.cover_key||!row.digital_file_key))return err('Before publishing: complete SEO, cover and private deliverable file',409);
  const now=new Date().toISOString();
  await env.DB.prepare(`UPDATE products SET status=?,updated_at=?,reviewed_at=CASE WHEN ?='review' THEN ? ELSE reviewed_at END,approved_at=CASE WHEN ?='approved' THEN ? ELSE approved_at END,published_at=CASE WHEN ?='published' THEN ? ELSE CASE WHEN ?='draft' THEN NULL ELSE published_at END END WHERE id=?`)
  .bind(next,now,next,now,next,now,next,now,next,id).run();
  await audit(env.DB,id,action,email,now);return obj({ok:true,status:next});
 }
 return err('Method not allowed',405);
}
export default {
 async fetch(request,env) {
  const url=new URL(request.url),path=url.pathname;
  try{
   if(!env.ASSETS||!env.DB)return err('Store assets/database bindings are not configured',503);
   if(path==='/store/admin'||path.startsWith('/store/admin/')){
    let email;try{email=await authorize(request,env)}catch{return new Response('Admin access denied. Configure Cloudflare Access and owner email.',{status:403,headers:noStore})}
    if(path.startsWith('/store/admin/api/'))return admin(request,env,url,email);
    // Admin HTML, CSS and JS are bundled assets; ALL admin routes are Access-verified first.
    const out=await env.ASSETS.fetch(request);const headers=new Headers(out.headers);headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex,nofollow');return new Response(out.body,{status:out.status,headers});
   }
   if(path==='/store/api/catalog'&&request.method==='GET')return obj({schemaVersion:3,currency:'INR',flatPriceInr:99,checkoutEnabled:false,categories:await categoriesList(env.DB),products:await listing(env.DB)});
   const image=path.match(/^\/store\/media\/([0-9a-f-]{36})$/);
   if(image&&request.method==='GET'){
    const p=await getById(env.DB,image[1]);if(!p||p.status!=='published'||!p.cover_key)return new Response('Not found',{status:404});
    if(!env.PRIVATE_ASSETS)return new Response('Not found',{status:404});
    const file=await env.PRIVATE_ASSETS.get(p.cover_key);if(!file)return new Response('Not found',{status:404});
    return new Response(file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'image/webp','Cache-Control':'public,max-age=180','X-Content-Type-Options':'nosniff'}});
   }
   const product=path.match(/^\/store\/p\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
   if(product&&request.method==='GET'){
    const p=await env.DB.prepare('SELECT * FROM products WHERE slug=? AND status=?').bind(product[1],'published').first();
    if(!p)return new Response('Product not found',{status:404});
    return new Response(productPage(transformed(p),url),{headers:htmlHeaders});
   }
   if(path==='/sitemap.xml'&&request.method==='GET'){
    const base=await env.ASSETS.fetch(request),xml=await base.text();
    const products=await listing(env.DB),items=products.map(p=>`<url><loc>${h(url.origin+'/store/p/'+p.slug+'/')}</loc><lastmod>${h(p.updatedAt.slice(0,10))}</lastmod></url>`).join('');
    return new Response(xml.replace('</urlset>',items+'</urlset>'),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public,max-age=300'}});
   }
   if(path.startsWith('/store/')&&request.method==='GET')return env.ASSETS.fetch(request);
   return env.ASSETS.fetch(request);
  }catch(e){return err('Store temporarily unavailable. Existing customer data is preserved.',503)}
 }
};
export {validateProduct,transformed,productPage};
// Named exports for isolated offline unit tests; HTTP routes still require verified Access.
export {admin,seoSuggest};