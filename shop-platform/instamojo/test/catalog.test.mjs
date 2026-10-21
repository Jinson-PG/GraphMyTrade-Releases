import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,publishedProducts,safeInstamojoUrl,escapeHtml} from '../src/catalog.mjs';
import {productPage} from '../src/worker.mjs';
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
