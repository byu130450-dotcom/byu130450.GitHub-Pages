import {database,json} from '../../../lib/admin';
import {EXAMPLES} from '../../../content/examples';
export const dynamic='force-dynamic';
export async function GET(){try{
 const db=database();const count=await db.prepare('SELECT COUNT(*) AS n FROM blog_posts').first<{n:number}>();
 if(!count?.n)return json({posts:EXAMPLES.map(p=>({...p,example:true}))});
 const {results}=await db.prepare("SELECT id,title,category,excerpt,body,published_at FROM blog_posts WHERE status='published' ORDER BY published_at DESC,id DESC").all<any>();
 return json({posts:results.map(p=>({id:p.id,title:p.title,category:p.category,excerpt:p.excerpt,body:p.body.split(/\n\s*\n/).filter(Boolean),date:new Date(p.published_at).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}),minutes:Math.max(1,Math.ceil(p.body.length/400)),kind:'paper',example:false}))});
 }catch{return json({error:'文章暂时无法加载，请稍后重试。'},503);}}
