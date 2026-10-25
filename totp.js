export function decodeSecret(value) {
 const s=value.toUpperCase().replace(/[\s-]/g,'').replace(/=+$/,'');
 if(!s || !/^[A-Z2-7]+$/.test(s)) throw new Error('密钥格式不正确，请输入 Base32 密钥（字母 A–Z 和数字 2–7）。');
 let bits=0, acc=0; const out=[];
 for(const ch of s){acc=(acc<<5)|'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(ch);bits+=5;if(bits>=8){bits-=8;out.push((acc>>>bits)&255);}}
 if(!out.length || (bits && (acc&((1<<bits)-1)))) throw new Error('密钥不完整，请检查是否复制了完整密钥。');
 return new Uint8Array(out);
}
export function parseInput(raw, options) {
 let secret=raw.trim(); let config={...options}; let label='';
 if(/^otpauth:/i.test(secret)){
  let u;try{u=new URL(secret);}catch{throw new Error('认证链接格式不正确。');}
  if(u.protocol!=='otpauth:'||u.hostname!=='totp')throw new Error('仅支持基于时间的 TOTP 认证链接。');
  secret=u.searchParams.get('secret')||'';
  config.algorithm=(u.searchParams.get('algorithm')||'SHA1').toUpperCase();
  config.digits=Number(u.searchParams.get('digits')||6);config.period=Number(u.searchParams.get('period')||30);
  try{label=decodeURIComponent(u.pathname.slice(1));}catch{label=u.pathname.slice(1);}
 }
 if(!['SHA1','SHA256','SHA512'].includes(config.algorithm))throw new Error('支持 SHA1、SHA256 和 SHA512 算法。');
 if(![6,8].includes(config.digits))throw new Error('支持 6 位或 8 位验证码。');
 if(!Number.isInteger(config.period)||config.period<1||config.period>300)throw new Error('刷新周期须为 1–300 秒。');
 return {...config,key:decodeSecret(secret),label};
}
export async function generateCode(key,{algorithm='SHA1',digits=6,period=30},time=Date.now()){
 const counter=BigInt(Math.floor(time/1000/period));const data=new Uint8Array(8);let n=counter;
 for(let i=7;i>=0;i--){data[i]=Number(n&255n);n>>=8n;}
 const hash={SHA1:'SHA-1',SHA256:'SHA-256',SHA512:'SHA-512'}[algorithm];
 const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash},false,['sign']);
 const h=new Uint8Array(await crypto.subtle.sign('HMAC',k,data));const o=h[h.length-1]&15;
 const v=((h[o]&127)*16777216)+(h[o+1]<<16)+(h[o+2]<<8)+h[o+3];
 return String(v%(10**digits)).padStart(digits,'0');
}
