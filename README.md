# 2FA 验证码

简洁的浏览器端 TOTP 动态验证码工具，无需后端或登录。

## 功能

- Base32 密钥与 `otpauth://totp/` 链接
- 6 位 / 8 位验证码
- SHA1 / SHA256 / SHA512
- 自动刷新、倒计时、一键复制
- 密钥仅存在当前页面内存，不上传、不持久化

## 使用

将这四个文件部署到支持 HTTPS 的静态网站托管服务，例如 GitHub Pages。无需安装依赖或构建。

本地开发可运行 `python3 -m http.server 8000`，并使用 `http://localhost:8000` 访问。浏览器 Web Crypto 需要安全上下文（HTTPS 或 localhost）。

## 文件

- `index.html`：页面结构
- `theme.css`：响应式样式
- `app.js`：交互与倒计时
- `totp.js`：Base32 解码和 TOTP 计算

算法已通过 RFC 6238 中 SHA1、SHA256、SHA512 的 18 组标准测试向量。

仅用于自己或已获授权账户的验证码生成。请妥善备份原始密钥和恢复码，并保持设备时间准确。
