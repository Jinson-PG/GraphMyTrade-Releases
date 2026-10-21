// Verify Cloudflare Access RS256 JWT with current account signing keys. No auth configuration => deny.
let jwksCache = {until:0,keys:[]};
function binaryBase64Url(value) {
  if (typeof value!== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw Error('Malformed JWT');
  const text=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
  const bytes=atob(text);return Uint8Array.from(bytes,c=>c.charCodeAt(0));
}
function jwtPart(value){const buf=binaryBase64Url(value);return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buf));}
function domain(env) {
  const input=env.ACCESS_TEAM_DOMAIN;
  if(typeof input!=='string'||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(input))throw Error('Unconfigured Access team');
  return input;
}
export async function authorize(request,env) {
  const audience=env.ACCESS_AUD, email=env.ADMIN_EMAIL;
  if(!audience||!email||!env.ACCESS_TEAM_DOMAIN)throw Error('Access is not configured');
  const token=request.headers.get('cf-access-jwt-assertion');
  if(!token||token.length>12000)throw Error('Missing Access identity');
  const parts=token.split('.');if(parts.length!==3)throw Error('Invalid Access token');
  const hdr=jwtPart(parts[0]),claim=jwtPart(parts[1]);
  if(hdr.alg!=='RS256'||typeof hdr.kid!=='string'||hdr.kid.length>180)throw Error('Unapproved JWT algorithm');
  const issuer=domain(env),now=Math.floor(Date.now()/1000);
  if(claim.iss!==issuer||!(Array.isArray(claim.aud)?claim.aud.includes(audience):claim.aud===audience)||
    !Number.isInteger(claim.exp)||claim.exp<=now||!Number.isInteger(claim.iat)||claim.iat>now+60||
    claim.nbf!==undefined&&(claim.nbf>now+60)||
    typeof claim.email!=='string'||claim.email.toLowerCase()!==String(email).toLowerCase()||!claim.sub)throw Error('Access policy rejected');
  if(Date.now()>=jwksCache.until){
    const response=await fetch(issuer+'/cdn-cgi/access/certs',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('Access signing keys unavailable');
    const body=await response.json();if(!Array.isArray(body.keys)||body.keys.length>100)throw Error('Invalid signing key list');
    jwksCache={keys:body.keys,until:Date.now()+5*60*1000};
  }
  const jwk=jwksCache.keys.find(k=>k.kid===hdr.kid&&k.kty==='RSA'&&k.alg==='RS256'&&k.use==='sig');
  if(!jwk)throw Error('Untrusted signing key');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,binaryBase64Url(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
  if(!valid)throw Error('Invalid Access signature');
  return claim.email;
}
export function sameOrigin(request){
  const origin=request.headers.get('origin');
  const target=new URL(request.url).origin;
  if(origin && origin!==target)return false;
  const site=request.headers.get('sec-fetch-site');
  if(site && site!=='same-origin'&&site!=='none')return false;
  return true;
}