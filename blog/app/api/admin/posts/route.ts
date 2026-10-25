import {adminIdentity,database,json,checkWrite,validatePost} from '../../../../lib/admin';
export const dynamic='force-dynamic';
export async function GET(){const auth=await adminIdentity();if(!auth.user)return json({error:auth.error},auth.status);try{
 const {results}=await database().prepare('SELECT * FROM blog_posts WHERE owner_id=? ORDER BY updated_at DESC').bind(auth.user.userId).all();return json({posts:results});
 }catch{return json({error:'文章加载失败，请稍后重试。'},503);}}
export async function POST(request:Request){const auth=await adminIdentity();if(!auth.user)return json({error:auth.error},auth.status);const rejected=checkWrite(request);if(rejected)return rejected;
 let raw:any;try{const text=await request.text();if(text.length>150000)return json({error:'文章内容过长。'},413);raw=JSON.parse(text);}catch{return json({error:'文章格式不正确。'},400);}
 let post;try{post=validatePost(raw);}catch(e){return json({error:e instanceof Error?e.message:'文章格式不正确。'},400);}
 try{
 const db=database(),now=new Date().toISOString();let id=raw.id;
 if(id!=null){
 if(typeof id!=='string'||id.length>100||!Number.isInteger(raw.revision)||raw.revision<1)return json({error:'文章版本不正确，请重新加载。'},400);
 const existing=await db.prepare('SELECT id,published_at FROM blog_posts WHERE id=? AND owner_id=?').bind(id,auth.user.userId).first<any>();
 if(!existing)return json({error:'文章不存在或你无权编辑。'},404);
 const publishedAt=post.status==='published'?(existing.published_at||now):existing.published_at;
 const result=await db.prepare('UPDATE blog_posts SET title=?,category=?,excerpt=?,body=?,status=?,updated_at=?,published_at=?,revision=revision+1 WHERE id=? AND owner_id=? AND revision=?').bind(post.title,post.category,post.excerpt,post.body,post.status,now,publishedAt,id,auth.user.userId,raw.revision).run();
 if(!result.meta.changes)return json({error:'此文章已在其他窗口更新。请先复制当前正文，再重新载入文章。'},409);
 }else{id=crypto.randomUUID();await db.prepare('INSERT INTO blog_posts (id,owner_id,title,category,excerpt,body,status,created_at,updated_at,published_at,revision) VALUES (?,?,?,?,?,?,?,?,?,?,1)').bind(id,auth.user.userId,post.title,post.category,post.excerpt,post.body,post.status,now,now,post.status==='published'?now:null).run();}
 const saved=await db.prepare('SELECT * FROM blog_posts WHERE id=? AND owner_id=?').bind(id,auth.user.userId).first();return json({post:saved});
 }catch{return json({error:'保存失败，内容仍保留在编辑框中，请稍后重试。'},503);}}
