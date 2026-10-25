import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../app/chatgpt-auth';
export async function adminIdentity(){
 const user=await getChatGPTUser();
 if(!user)return {user:null,error:'请先登录你的 ChatGPT 账号。',status:401};
 const email=(env as unknown as {BLOG_ADMIN_EMAIL?:string}).BLOG_ADMIN_EMAIL;
 if(!email)return {user:null,error:'管理员身份尚未配置。',status:503};
 if(user.email.toLowerCase()!==email.toLowerCase())return {user:null,error:'此账号没有博客管理权限，请使用博客所有者账号登录。',status:403};
 return {user,error:null,status:200};
}
export function database(){if(!env.DB)throw new Error('文章存储暂不可用，请稍后重试。');return env.DB;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function checkWrite(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'请求来源不正确，请刷新后台后重试。'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'请求格式不正确。'},415);
 if(Number(request.headers.get('content-length')||0)>500000)return json({error:'文章内容过长。'},413);
 return null;
}
export function validatePost(data:any){
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('文章格式不正确。');
 for(const key of ['title','category','excerpt','body'])if(typeof data[key]!=='string')throw new Error('请填写完整的文章内容。');
 const title=data.title.trim(),category=data.category.trim(),body=data.body.trim(),excerpt=data.excerpt.trim();
 if(!title||title.length>100)throw new Error('标题需为 1–100 个字符。');
 if(!category||category.length>20)throw new Error('分类需为 1–20 个字符。');
 if(excerpt.length>240)throw new Error('摘要不能超过 240 个字符。');
 if(!body||body.length>100000)throw new Error('正文需为 1–100000 个字符。');
 if(!['draft','published'].includes(data.status))throw new Error('文章状态不正确。');
 return {title,category,body,excerpt:excerpt||body.replace(/^#+\s*/gm,'').slice(0,120),status:data.status};
}
