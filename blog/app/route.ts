import html from '../content/blog-html';
export const dynamic='force-dynamic';
export function GET(){return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});}
