export const MEMORY_KEY='authenticator.last-key.v1';
export function readRemembered(storage){
 const raw=storage.getItem(MEMORY_KEY);if(!raw)return null;
 try{const value=JSON.parse(raw);if(value.version!==1||typeof value.secret!=='string'||!value.secret.trim()||value.secret.length>8192||!['SHA1','SHA256','SHA512'].includes(value.algorithm)||![6,8].includes(value.digits)||!Number.isInteger(value.period)||value.period<1||value.period>300)throw new Error('Invalid saved key');return value;}
 catch{storage.removeItem(MEMORY_KEY);return null;}
}
export function saveRemembered(storage,{secret,algorithm,digits,period}){
 storage.setItem(MEMORY_KEY,JSON.stringify({version:1,secret:secret.trim(),algorithm,digits,period}));
}
export function clearRemembered(storage){storage.removeItem(MEMORY_KEY);}
export const PREFERENCE_KEY='authenticator.remember-key.v1';
export function readPreference(storage){return storage.getItem(PREFERENCE_KEY)!=='off';}
export function setPreference(storage,enabled){storage.setItem(PREFERENCE_KEY,enabled?'on':'off');}
