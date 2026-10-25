import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '../chatgpt-auth';
import {adminIdentity} from '../../lib/admin';
import Editor from './Editor';
export const dynamic='force-dynamic';
export default async function Admin(){
 const user=await getChatGPTUser();
 if(!user)return <main className="auth-card"><a className="back" href="/">← 返回博客</a><span className="kicker">一页之间 · 写作后台</span><h1>给今天，写下一页。</h1><p>使用博客所有者的 ChatGPT 账号登录，即可管理文章与草稿。访客阅读博客无需登录。</p><a className="button primary" href={chatGPTSignInPath('/admin')} target="_top">使用 ChatGPT 登录</a></main>;
 const auth=await adminIdentity();if(!auth.user)return <main className="auth-card"><a className="back" href="/">← 返回博客</a><h1>仅博客所有者可管理</h1><p>{auth.error}</p><a className="button" href={chatGPTSignOutPath('/admin')} target="_top">退出并切换账号</a></main>;
 return <Editor signOutPath={chatGPTSignOutPath('/admin')}/>;
}
