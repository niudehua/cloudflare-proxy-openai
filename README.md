# Cloudflare Proxy OpenAI

本项目通过 Cloudflare Workers 代理 OpenAI API。

## 特性
- 代理 OpenAI API 请求，隐藏真实 API Key
- 支持自定义部署

## 安装
1. 克隆本仓库：
   ```bash
   git clone <仓库地址>
   ```
2. 安装依赖（如有）：
   ```bash
   # 本项目为 Cloudflare Workers 项目，通常无需本地依赖
   ```

## 使用
1. 配置 `wrangler.toml` 文件，填写你的 Cloudflare 账户信息。
2. 部署到 Cloudflare Workers：
   ```bash
   npx wrangler publish
   ```

## 目录结构
- `src/index.js`：主 Worker 代码
- `wrangler.toml`：Cloudflare Workers 配置文件

## 贡献
欢迎提交 issue 和 PR 改进本项目。

## License
MIT 