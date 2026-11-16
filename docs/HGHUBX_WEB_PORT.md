# HGhubX Web 版迁移审计（个人非商业用途）

> 本分支用于评估并逐步实现 HGhubX 的 iPhone Safari Web/PWA 版本。上游项目：<https://github.com/zxsos/HGhubX>。
>
> 上游许可证：PolyForm Noncommercial 1.0.0。保留上游版权声明及许可证全文；仅限个人学习、研究、自用等非商业用途。不得加入广告、会员、付费解锁或收费服务。
>
> 上游 README 另有中国大陆下载与传播限制。使用者必须遵守上游该项限制及所在地法律法规。

## 审计结论

HGhubX v2.1.2 不是可直接部署的纯静态网站。它的 React/Vite 前端与 Tauri/Rust 宿主紧密耦合。

已确认的关键依赖：

- `src/main.tsx` 直接调用 Tauri `invoke("debug_log")`。
- `src/api.ts` 将业务请求封装为 Tauri IPC 命令（如 `app_boot`、`api_feed`、`api_search`、`api_play`），并使用 `hg://localhost` 或 `http://hg.localhost` 作为本地媒体协议。
- `src-tauri/src/lib.rs` 注册了大量 IPC 命令，并实现 `hg://` 媒体协议处理。
- `src-tauri/src/media.rs`、`net.rs`、`session.rs` 等负责媒体代理、上游 HTTP 请求、线路/代理和登录会话。
- 仅把 Vite 的 `dist` 上传到 GitHub Pages 会导致这些 Tauri IPC 调用不可用；封面解密、HLS 播放列表改写、分片/密钥代理也不会自动工作。

## 迁移原则

1. 不修改或覆盖上游仓库；本项目只在个人仓库独立分支开发。
2. 不伪造“可播放”状态；未完成浏览器网络与媒体链路前，不发布为可用版。
3. 保留上游 Required Notice、LICENSE、商标/来源说明和非商业限制。
4. 不在前端暴露上游凭据、用户令牌或私有代理凭据。
5. 不把任意 URL 代理做成开放代理；服务端必须有严格目标主机白名单、协议限制、重定向校验、速率限制及响应大小限制。

## 必须完成的工程工作

### A. 浏览器运行时适配

- 为 Tauri IPC 建立明确的 Web adapter 接口。
- 将日志、启动配置、线路、代理、缓存、方向锁定等原生能力拆分；Web 不支持的功能应隐藏或显示说明。
- 将 `src/api.ts` 的业务调用改为可注入 transport，避免浏览器直接 import Tauri-only APIs。

### B. 网络与账号服务

- 评估上游 API 的 CORS、鉴权、Cookie/Token 和线路策略。
- 若浏览器不能直连，需开发受控的同源 API 服务；GitHub Pages 本身不能运行 Rust 后端。
- 账号令牌必须采用安全存储策略；不得把密钥写进静态前端或仓库。
- 对所有代理请求执行 SSRF 防护、目标白名单、重定向限制和访问频控。

### C. 媒体播放

- 替换 `hg://localhost/img`、`/hls`、`/seg` 本地协议。
- 验证 iOS Safari 对 HLS、Range、跨域、Referer、加密分片和媒体格式的支持。
- 使用 Safari 原生 HLS 优先；hls.js 仅在 MediaSource 支持且测试通过时启用。
- 在真实 iPhone Safari 上验证播放、拖动进度、切集、后台/前台恢复。

### D. PWA 与部署

- 增加 manifest、iOS 主屏幕图标和安全的 Service Worker 缓存策略。
- 配置 GitHub Pages 的 SPA 路由回退和 HTTPS。
- 在上述 API 与播放链路通过测试前，不启用“正式可用”部署。

## 当前状态

- [x] 已建立个人仓库独立分支 `hghubx-web`。
- [x] 已审计上游 v2.1.2 的 React/Vite、Tauri IPC、Rust 网络及媒体依赖。
- [ ] 完成 Web transport 抽象。
- [ ] 完成受控 API 服务与安全审查。
- [ ] 完成 iOS Safari HLS 播放链路。
- [ ] 完成 PWA 与 GitHub Pages 部署。
- [ ] 在真实 iPhone 上完成端到端验收。

## 当前不可承诺的功能

在 Web transport 与媒体代理完成前，不能声称登录、首页数据、搜索、插件相关能力或视频播放已可用。GitHub Pages 只负责静态文件托管，不是后端运行环境。
