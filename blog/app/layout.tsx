import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'一页之间 · 写作后台',description:'管理你的博客文章与草稿'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
