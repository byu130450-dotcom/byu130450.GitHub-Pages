declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare {interface Env {BLOG_ADMIN_EMAIL?:string;}}
