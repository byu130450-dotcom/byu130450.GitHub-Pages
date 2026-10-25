import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'blog-tests-'));
try{
 await fs.writeFile(path.join(tmp,'mock.mjs'),`import {DatabaseSync} from 'node:sqlite';
const sqlite=new DatabaseSync(':memory:');export function migrate(sql){sqlite.exec(sql);}
function prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}
export const env={DB:{prepare},BLOG_ADMIN_EMAIL:'owner@example.test'};
let identity=null;export function setUser(user){identity=user}export async function getChatGPTUser(){return identity}
`);
 async function compile(source,target,replacements){let code=await fs.readFile(source,'utf8');for(const [a,b] of replacements)code=code.replace(a,b);await fs.writeFile(path.join(tmp,target),ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
 await compile('lib/admin.ts','admin.mjs',[["'cloudflare:workers'","'./mock.mjs'"],["'../app/chatgpt-auth'","'./mock.mjs'"]]);
 await compile('content/examples.ts','examples.mjs',[]);
 await compile('app/api/posts/route.ts','public.mjs',[["'../../../lib/admin'","'./admin.mjs'"],["'../../../content/examples'","'./examples.mjs'"]]);
 await compile('app/api/admin/posts/route.ts','private.mjs',[["'../../../../lib/admin'","'./admin.mjs'"]]);
 const mock=await import(pathToFileURL(path.join(tmp,'mock.mjs')));mock.migrate(await fs.readFile('drizzle/0000_rich_fixer.sql','utf8'));
 const pub=await import(pathToFileURL(path.join(tmp,'public.mjs'))),admin=await import(pathToFileURL(path.join(tmp,'private.mjs')));
 const origin='https://blog.example.test';const request=(body,from=origin)=>new Request(origin+'/api/admin/posts',{method:'POST',headers:{'content-type':'application/json',origin:from},body:JSON.stringify(body)});
 let r=await admin.GET();assert.equal(r.status,401);assert.equal((await admin.POST(request({}))).status,401);
 mock.setUser({userId:'stranger',email:'stranger@example.test'});assert.equal((await admin.GET()).status,403);assert.equal((await admin.POST(request({}))).status,403);
 assert.equal((await (await pub.GET()).json()).posts.length,3);
 mock.setUser({userId:'owner-site-id',email:'owner@example.test'});
 const data={title:'自己的文章',category:'日常',excerpt:'',body:'今天的感受。\n\n## 一点发现\n\n<script>unsafe()</script>',status:'draft'};
 assert.equal((await admin.POST(request(data,'https://other.example.test'))).status,403);
 assert.equal((await admin.POST(request({...data,title:''}))).status,400);
 r=await admin.POST(request(data));assert.equal(r.status,200);let post=(await r.json()).post;assert.equal(post.revision,1);assert.equal(post.owner_id,'owner-site-id');
 assert.deepEqual((await (await pub.GET()).json()).posts,[],'Draft must not leak to public');
 assert.equal((await (await admin.GET()).json()).posts[0].body,data.body,'Draft persists');
 r=await admin.POST(request({...data,id:post.id,revision:post.revision,status:'published'}));assert.equal(r.status,200);post=(await r.json()).post;assert.equal(post.revision,2);
 let publicPosts=(await (await pub.GET()).json()).posts;assert.equal(publicPosts.length,1);assert.equal(publicPosts[0].title,data.title);assert.equal(publicPosts[0].example,false);assert.ok(publicPosts[0].body.includes('<script>unsafe()</script>'));
 assert.equal((await admin.POST(request({...data,id:post.id,revision:1}))).status,409,'Reject stale updates');
 mock.setUser({userId:'other-site-id',email:'owner@example.test'});assert.equal((await admin.POST(request({...data,id:post.id,revision:2}))).status,404,'Enforce record ownership');
 mock.setUser({userId:'owner-site-id',email:'owner@example.test'});
 r=await admin.POST(request({...data,id:post.id,revision:2,status:'draft'}));assert.equal(r.status,200);assert.deepEqual((await (await pub.GET()).json()).posts,[],'Withdrawal removes public article');
 mock.setUser(null);assert.equal((await admin.GET()).status,401);
 console.log('Passed: owner-only access, anonymous read, input validation, CSRF, draft persistence/privacy, publish, withdrawal, per-record ownership, revision conflicts.');
}finally{await fs.rm(tmp,{recursive:true,force:true});}
