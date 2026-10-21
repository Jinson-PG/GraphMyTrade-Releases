// Public catalog only. No customer emails, Google Drive URLs or payment secrets belong in this sheet.
export const allowedCategories = new Set([
  'courses','strategies','notion','excel','calculators','guides','checklists',
  'bundles','bots','extensions','software','scripts','indicators','education',
  'career','business','finance','design','planners','services'
]);
export const allowedFormats = new Set([
  'PDF','XLSX','XLS','CSV','DOCX','PPTX','ZIP','NOTION','HTML','JS',
  'EXE','LINK','COURSE','PINE','JSON','SVG','PNG','WEBP','BOT','OTHER'
]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const s = (v,max=300) => String(v??'').trim().slice(0,max);

export function safeInstamojoUrl(input) {
  try {
    const url=new URL(s(input,700));
    if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash) return '';
    if(!['www.instamojo.com','instamojo.com','imjo.in','graphmytrade99shop.myinstamojo.com'].includes(url.hostname.toLowerCase())) return '';
    if(url.pathname.length<3||url.pathname==='/'||url.pathname.includes('//')) return '';
    return url.href;
  } catch {return '';}
}
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseCsv(csv){
  if(typeof csv!=='string'||csv.length>1048576)throw Error('Sheet too large');
  const rows=[];let row=[],field='',quoted=false;
  csv=csv.replace(/^\uFEFF/,'');
  for(let i=0;i<csv.length;i++){
    const c=csv[i];
    if(c==='"'){
      if(quoted&&csv[i+1]==='"'){field+='"';i++;}
      else if(!quoted&&field==='')quoted=true;
      else if(quoted)quoted=false;
      else throw Error('Malformed CSV quote');
    }else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&csv[i+1]==='\n')i++;
      row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';
    }else{field+=c;}
  }
  if(quoted)throw Error('Unclosed CSV quote');
  row.push(field);if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length>301)throw Error('Too many sheet rows');
  return rows;
}
export function publishedProducts(csv){
  const rows=parseCsv(csv);
  if(!rows.length)return [];
  const headers=rows[0].map(h=>s(h,64).toLowerCase());
  const required=['slug','title','description','category','format','priceinr','status','instamojourl'];
  if(!required.every(name=>headers.includes(name)))throw Error('Sheet headers are incomplete');
  const all=[],seen=new Set();
  for(const cells of rows.slice(1)){
    const row=Object.fromEntries(headers.map((name,i)=>[name,s(cells[i],2500)]));
    if(row.status?.toLowerCase()!=='published')continue;
    const slug=s(row.slug,81).toLowerCase(),title=s(row.title,140),description=s(row.description,2400);
    const category=s(row.category,48).toLowerCase(),format=s(row.format,24).toUpperCase();
    const price=Number(row.priceinr),checkoutUrl=safeInstamojoUrl(row.instamojourl);
    if(!slugPattern.test(slug)||slug.length>80||seen.has(slug)||title.length<3||description.length<12||
       !allowedCategories.has(category)||!allowedFormats.has(format)||!Number.isInteger(price)||price<1||price>99||!checkoutUrl)continue;
    const cover=s(row.cover,600);
    // Only public HTTPS images or our own /assets images. No private Drive file URLs.
    const safeCover=/^\/assets\/[a-z0-9/_-]+\.(png|webp|jpe?g)$/i.test(cover) ? cover
      : (()=>{try{const u=new URL(cover);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}})();
    const includes=s(row.includes,1400).split('|').map(i=>s(i,140)).filter(Boolean).slice(0,15);
    const seoTitle=s(row.seotitle,95)||title+' | GraphMyTrade 99 Shop';
    const seoDescription=s(row.seodescription,230)||description.slice(0,158);
    const keywords=s(row.keywords,750).split('|').map(i=>s(i,80)).filter(Boolean).slice(0,12);
    seen.add(slug);
    all.push({id:slug,slug,title,description,category,format,priceInr:price,status:'published',
      checkoutUrl,cover:safeCover,seoTitle,seoDescription,keywords,includes,
      compatibility:s(row.compatibility,500),license:s(row.license,400),
      addedAt:/^\d{4}-\d\d-\d\d$/.test(row.addedat||'')?row.addedat:'2026-10-21'});
  }
  return all;
}
