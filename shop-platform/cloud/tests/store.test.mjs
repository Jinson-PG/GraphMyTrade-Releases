import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker,{admin,seoSuggest,validateProduct,productPage} from '../src/worker.mjs';
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){const stmt=db.prepare(sql);const make=(args)=>({async all(){return{results:stmt.all(...args)}},async first(){return stmt.get(...args)||null},async run(){return stmt.run(...args)}});return{...make([]),bind(...args){return make(args)}}}};
 const r2=new Map();const PRIVATE_ASSETS={async put(k,body,{httpMetadata}={}){r2.set(k,{array:new Uint8Array(body),httpMetadata})},async get(k){const b=r2.get(k);if(!b)return null;return{body:b.array,httpMetadata:b.httpMetadata}},async delete(k){r2.delete(k)}};
 const ASSETS={async fetch(req){let path=new URL(typeof req==='string'?req:req.url).pathname;return new Response(path==='/sitemap.xml'?'<?xml version="1.0"?><urlset></urlset>':'<p>asset</p>',{status:200})}};
 return{DB,PRIVATE_ASSETS,ASSETS};
}
const base='https://graphmytrade.com';const noAuth={headers:{}};
const product={slug:'risk-calculator-template',title:'Risk Calculator Template',description:'Spreadsheet showing position sizing and stop-loss risk with editable inputs.',category:'excel',format:'XLSX',priceInr:49,includes:['Spreadsheet','Instructions'],seoTitle:'Risk Calculator Excel Sheet | GraphMyTrade',seoDescription:'Risk Calculator Excel template for manual trading risk review.'};
const req=(url,method='GET',data=null,headers={})=>new Request(base+url,{method,headers:{...(data&&typeof data==='object'&&! (data instanceof Uint8Array)?{'content-type':'application/json'}:{}),...headers},body:data&&(data instanceof Uint8Array?data:JSON.stringify(data)),duplex:'half'});
test('validation bounds, HTML escaping, honest product metadata',()=>{
 assert.equal(validateProduct(product).price,49);
 assert.throws(()=>validateProduct({...product,priceInr:100}),/Price must/);
 assert.throws(()=>validateProduct({...product,slug:'javascript:bad'}),/required/);
 let html=productPage({...product,cover:'',seoDescription:'<script>alert(1)</script>',includes:['<svg onload=alert(1)>']},new URL(base));
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('"offers"'));
});
test('admin rejects unsigned access; public catalog defaults empty and no checkout',async()=>{
 const env=fixture();let r=await worker.fetch(req('/store/admin/api/products'),env);assert.equal(r.status,403);
 r=await worker.fetch(req('/store/api/catalog'),env);const j=await r.json();assert.equal(j.checkoutEnabled,false);assert.deepEqual(j.products,[]);
 r=await worker.fetch(req('/store/admin/'),env);assert.equal(r.status,403);
});
test('admin draft, price edit, private uploads, staged approval, live SEO, unpublish',async()=>{
 const env=fixture(),owner='test-owner@example.com';
 const invoke=async(route,method='GET',data=null,headers={})=>admin(req(route,method,data,headers),env,new URL(base+route),owner);
 let r=await invoke('/store/admin/api/products','POST',product);assert.equal(r.status,201);const {id}=await r.json();
 let state=(await (await invoke('/store/admin/api/products')).json()).products[0];assert.equal(state.priceInr,49);assert.equal(state.status,'draft');
 r=await invoke('/store/admin/api/products/'+id+'/action','POST',{action:'publish'});assert.equal(r.status,409);
 r=await invoke('/store/admin/api/products/'+id,'PUT',{...product,priceInr:99});assert.equal(r.status,200);
 let png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
 r=await invoke('/store/admin/api/products/'+id+'/cover','PUT',png,{'content-type':'image/png','content-length':String(png.byteLength)});assert.equal(r.status,200);
 const pdf=new TextEncoder().encode('%PDF-1.7\n test document');
 r=await invoke('/store/admin/api/products/'+id+'/file','PUT',pdf,{'content-type':'application/pdf','content-length':String(pdf.byteLength),'x-file-name':'sample.pdf'});assert.equal(r.status,200);
 for(const [action,expected] of [['submit','review'],['approve','approved'],['publish','published']]){
  r=await invoke('/store/admin/api/products/'+id+'/action','POST',{action});assert.equal(r.status,200);assert.equal((await r.json()).status,expected);
 }
 r=await worker.fetch(req('/store/api/catalog'),env);let cat=await r.json();assert.equal(cat.products.length,1);assert.equal(cat.products[0].priceInr,99);assert.equal(cat.products[0].hasFile,true);
 r=await worker.fetch(req('/store/p/risk-calculator-template/'),env);assert.equal(r.status,200);const html=await r.text();assert.match(html,/<title>Risk Calculator Excel Sheet/);assert.match(html,/application\/ld\+json/);assert.match(html,/₹99/);
 r=await worker.fetch(req('/store/media/'+id),env);assert.equal(r.status,200);
 r=await worker.fetch(req('/store/admin/api/products/'+id+'/file'),env);assert.equal(r.status,403);
 r=await invoke('/store/admin/api/products/'+id,'PUT',{...product,priceInr:33});assert.equal(r.status,409);
 r=await invoke('/store/admin/api/products/'+id+'/action','POST',{action:'unpublish'});assert.equal(r.status,200);
 r=await worker.fetch(req('/store/api/catalog'),env);cat=await r.json();assert.equal(cat.products.length,0);
 r=await worker.fetch(req('/store/media/'+id),env);assert.equal(r.status,404);
 r=await worker.fetch(req('/store/p/risk-calculator-template/'),env);assert.equal(r.status,404);
 r=await invoke('/store/admin/api/products/'+id,'PUT',{...product,priceInr:33});assert.equal(r.status,200);
 assert.equal((await (await invoke('/store/admin/api/products')).json()).products[0].priceInr,33);
});
test('cross-site POST rejects even with authenticated admin',async()=>{
 const env=fixture();const request=req('/store/admin/api/products','POST',product,{'origin':'https://evil.example'});const r=await admin(request,env,new URL(request.url),'test@example.com');assert.equal(r.status,403);
});

test('missing AI is labeled rule-based; protected admin assets never bypass JWT',async()=>{
 const env=fixture();const s=await seoSuggest({title:'Trading Planner',description:'A digital trading planner to organize entries and exits.',format:'PDF',category:'guides'},env);
 assert.equal(s.mode,'rules');assert.ok(s.seoTitle.length>12);
 for(const path of ['/store/admin/','/store/admin','/store/admin/admin.js','/store/admin/admin.css','/store/admin/api/seo-suggest']){
  const r=await worker.fetch(req(path),env);assert.equal(r.status,403,path);
 }
});

test('owner creates a non-trading department, publishes a verified listing and public category data is dynamic',async()=>{
 const env=fixture(),owner='owner@example.com';
 const invoke=async(path,method='GET',data=null,headers={})=>admin(req(path,method,data,headers),env,new URL(base+path),owner);
 let r=await invoke('/store/admin/api/categories');assert.equal(r.status,200);
 let categories=(await r.json()).categories;assert.ok(categories.some(x=>x.slug==='career'));
 const name='Kerala Career Kits',slug='kerala-career-kits';
 r=await invoke('/store/admin/api/categories','POST',{name,slug});assert.equal(r.status,201);
 r=await invoke('/store/admin/api/categories','POST',{name,slug});assert.equal(r.status,409);
 r=await invoke('/store/admin/api/categories/'+slug,'PUT',{name:'Kerala Resume & Career'});assert.equal(r.status,200);
 const input={...product,slug:'kerala-ats-resume-kit',title:'Kerala ATS Resume Kit',category:slug,priceInr:79};
 r=await invoke('/store/admin/api/products','POST',input);assert.equal(r.status,201);
 const {id}=await r.json();
 let png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
 r=await invoke('/store/admin/api/products/'+id+'/cover','PUT',png,{'content-type':'image/png','content-length':String(png.byteLength)});assert.equal(r.status,200);
 r=await invoke('/store/admin/api/products/'+id+'/action','POST',{action:'submit'});assert.equal(r.status,200);
 r=await invoke('/store/admin/api/products/'+id+'/action','POST',{action:'approve'});assert.equal(r.status,200);
 // A private deliverable must exist before anything can be published.
 r=await invoke('/store/admin/api/products/'+id+'/action','POST',{action:'publish'});assert.equal(r.status,409);
 const pdf=new TextEncoder().encode('%PDF-1.7\nplaceholder fixture');
 r=await invoke('/store/admin/api/products/'+id+'/file','PUT',pdf,{'content-type':'application/pdf','content-length':String(pdf.byteLength)});assert.equal(r.status,200);
 r=await invoke('/store/admin/api/products/'+id+'/action','POST',{action:'publish'});assert.equal(r.status,200);
 r=await worker.fetch(req('/store/api/catalog'),env);const publicJson=await r.json();
 assert.ok(publicJson.categories.some(x=>x.slug===slug&&x.name==='Kerala Resume & Career'));
 assert.ok(publicJson.products.some(x=>x.slug===input.slug&&x.priceInr===79));
 assert.equal(publicJson.checkoutEnabled,false);
 r=await worker.fetch(req('/store/p/kerala-ats-resume-kit/'),env);assert.equal(r.status,200);
 r=await worker.fetch(req('/sitemap.xml'),env);const xml=await r.text();assert.ok(xml.includes('/store/p/kerala-ats-resume-kit/'));
});
test('categories require owner identity and custom category must exist in D1 before creating a product',async()=>{
 const env=fixture();let r=await worker.fetch(req('/store/admin/api/categories'),env);assert.equal(r.status,403);
 r=await admin(req('/store/admin/api/products','POST',{...product,category:'made-up'}),env,new URL(base+'/store/admin/api/products'),'owner@example.com');assert.equal(r.status,422);
 r=await admin(req('/store/admin/api/categories','POST',{name:'Bad',slug:'../escape'}),env,new URL(base+'/store/admin/api/categories'),'owner@example.com');assert.equal(r.status,400);
});