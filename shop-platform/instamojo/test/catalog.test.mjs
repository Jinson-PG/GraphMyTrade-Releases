import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,publishedProducts,safeInstamojoUrl,escapeHtml} from '../src/catalog.mjs';
import worker,{productPage,renderShopHome} from '../src/worker.mjs';
import {readFileSync} from 'node:fs';
const header='slug,title,description,category,format,priceInr,status,instamojoUrl,cover,seoTitle,seoDescription,keywords,includes,compatibility,license,addedAt';
const row=(slug,status='published',url='https://imjo.in/test123',price=99)=>
 [slug,'Digital Sample','Detailed, useful product description','excel','XLSX',price,status,url,'','','','','','','','2026-10-21'].map(s=>String(s).includes(',')?'"'+String(s).replace(/"/g,'""')+'"':s).join(',');
test('quoted spreadsheet values and CRLF parse correctly',()=>{
 const rows=parseCsv('\uFEFFname,details\r\n"A ""quoted"" title","two, values"\r\n');
 assert.deepEqual(rows,[['name','details'],['A "quoted" title','two, values']]);
});
test('unclosed quotes and large source rejected',()=>{
 assert.throws(()=>parseCsv('a\n"broken'),/Unclosed/);
 assert.throws(()=>parseCsv('x'.repeat(1048577)),/large/);
});
test('only approved published products with legitimate Instamojo links appear',()=>{
 const result=publishedProducts([header,row('sample-one'),row('unapproved','draft'),row('fake-link','published','https://evil.test/buy'),row('too-high','published','https://imjo.in/abc',150)].join('\n'));
 assert.equal(result.length,1);assert.equal(result[0].slug,'sample-one');assert.equal(result[0].priceInr,99);
});
test('invalid or javascript redirect URLs are never accepted',()=>{
 for(const url of ['javascript:alert(1)','http://imjo.in/test','https://imjo.in.evil.net/pay','https://www.instamojo.com/','https://evil.com/x','https://name:password@imjo.in/pay'])assert.equal(safeInstamojoUrl(url),'');
 assert.equal(safeInstamojoUrl('https://imjo.in/real-product'),'https://imjo.in/real-product');
});
test('duplicates not listed twice',()=>{
 assert.equal(publishedProducts([header,row('duplicate'),row('duplicate')].join('\n')).length,1);
});
test('HTML is escaped and product SEO page has secure outbound link',()=>{
 const p=publishedProducts([header,row('secure-product')].join('\n'))[0];
 p.title='<script>alert(1)</script>';
 const html=productPage(p,true);
 assert.equal(html.includes('<script>alert(1)</script>'),false);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/rel="noopener noreferrer"/);
 assert.match(html,/instamojo/);
});


const storeHtml=readFileSync(new URL('../../public/store/index.html',import.meta.url),'utf8');
test('only our actual Instamojo storefront host is allowed as a merchant link',()=>{
 assert.equal(safeInstamojoUrl('https://graphmytrade99shop.myinstamojo.com/product/resume-kit'),
  'https://graphmytrade99shop.myinstamojo.com/product/resume-kit');
 for(const url of ['https://another.myinstamojo.com/product/x','https://graphmytrade99shop.myinstamojo.com.evil.org/x',
   'https://graphmytrade99shop.myinstamojo.com/','http://graphmytrade99shop.myinstamojo.com/product/x']){
   assert.equal(safeInstamojoUrl(url),'',url);
 }
});
test('initial HTML server renders only approved products and crawlable product links',()=>{
 const allowed=publishedProducts([header,row('real-product'),row('private-product','draft'),row('bad-product','published','https://fake-shop.tld/pay')].join('\n'));
 const html=renderShopHome(storeHtml,allowed,false);
 assert.match(html,/<a class="gmt-product-image" href="\/store\/p\/real-product\/"/);
 assert.match(html,/<h3><a href="\/store\/p\/real-product\/">Digital Sample<\/a><\/h3>/);
 assert.match(html,/"@type":"ItemList"/);
 assert.match(html,/"numberOfItems":1/);
 assert.doesNotMatch(html,/private-product|bad-product/);
 assert.doesNotMatch(html,/id="gmt-product-grid" hidden/);
});
test('unpublished store has no Product/ItemList markup or dummy product links',()=>{
 const html=renderShopHome(storeHtml,[],true);
 assert.match(html,/content="noindex,nofollow"/);
 assert.match(html,/id="gmt-empty" data-reveal>/);
 assert.doesNotMatch(html,/"@type":"ItemList"/);
 assert.doesNotMatch(html,/\/store\/p\/[a-z0-9-]+\//);
});
test('worker returns noindex preview HTML, index-ready production HTML, and correct HEAD',async()=>{
 const headers={'Content-Type':'text/html; charset=utf-8'};
 const env={SHEET_CSV_URL:'',ASSETS:{fetch:async()=>new Response(storeHtml,{headers})}};
 const preview=await worker.fetch(new Request('https://graphmytrade-99-shop-preview.example.workers.dev/store/'),env);
 assert.equal(preview.status,200);
 assert.equal(preview.headers.get('X-Robots-Tag'),'noindex,nofollow');
 assert.match(await preview.text(),/content="noindex,nofollow"/);
 const production=await worker.fetch(new Request('https://graphmytrade.com/store/'),env);
 assert.equal(production.status,200);
 assert.equal(production.headers.get('X-Robots-Tag'),null);
 assert.match(await production.text(),/content="index,follow,max-image-preview:large"/);
 const head=await worker.fetch(new Request('https://graphmytrade.com/store/',{method:'HEAD'}),env);
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
});
test('product SEO includes canonical, open graph URL, price and visible compatibility',()=>{
 const p=publishedProducts([header,row('career-kit')].join('\n'))[0];
 p.compatibility='Excel desktop';
 p.license='Personal use';
 const html=productPage(p,false);
 assert.match(html,/property="og:url" content="https:\/\/graphmytrade.com\/store\/p\/career-kit\/"/);
 assert.match(html,/name="twitter:card" content="summary_large_image"/);
 assert.match(html,/"priceCurrency":"INR"/);
 assert.match(html,/Excel desktop/);
 assert.match(html,/Personal use/);
 assert.doesNotMatch(html,/aggregateRating|reviewCount/);
});


test('payment verification gate hides checkout while leaving approved SEO pages discoverable',()=>{
 const p=publishedProducts([header,row('seo-ready-product')].join('\n'))[0];
 const home=renderShopHome(storeHtml,[p],false,false);
 assert.match(home,/\/store\/p\/seo-ready-product\//);
 assert.match(home,/View details ↗/);
 assert.doesNotMatch(home,/Buy now ↗/);
 const detail=productPage(p,false,false);
 assert.match(detail,/Checkout is not active yet/);
 assert.doesNotMatch(detail,/Buy securely on Instamojo/);
 assert.doesNotMatch(detail,/"@type":"Offer"/);
});
test('checkout switch defaults to disabled; API exposes no checkout URL until verified',async()=>{
 const env={SHEET_CSV_URL:'',PAYMENT_DELIVERY_VERIFIED:'false'};
 const response=await worker.fetch(new Request('https://graphmytrade.com/store/api/catalog'),env);
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.checkoutEnabled,false);
 assert.deepEqual(payload.products,[]);
});
