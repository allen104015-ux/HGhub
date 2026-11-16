# HGhubX Web API and Media Inventory

> Status: engineering inventory only. This document does not claim that a browser build or a working website exists.
>
> Upstream reviewed: https://github.com/zxsos/HGhubX (branch `main`, version `2.1.2` at the time of review).
> Required upstream notice: Copyright (c) 2026 HGhubX contributors (https://github.com/zxsos/HGhubX).
> Upstream license: PolyForm Noncommercial 1.0.0. This port is intended only for personal, non-commercial use. Preserve the full license and required notice in any redistributed derivative.

## 1. Current runtime boundary

The React UI is not currently a standalone web application. `src/api.ts` imports `invoke` from `@tauri-apps/api/core`; the API facade dispatches named commands into Rust. `src/main.tsx` also invokes native diagnostics and startup routines. The Rust `lib.rs` registers the command handlers and registers the `hg://localhost` media protocol.

A GitHub Pages build cannot execute these Rust handlers or register a custom URI scheme. Replacing `invoke()` with browser `fetch()` alone is insufficient because the native side also owns account-session persistence, request routing, line selection, redirect validation, image decryption, HLS rewriting, segment/key fetching, caching, and iOS media bridging.

## 2. Business API transport

The Rust network layer uses the configured HTTPS origin (default currently `https://huangguoai.com`) and posts a JSON envelope to `/api/edge/request`:

- `method`: upstream HTTP method
- `path`: upstream API path
- `body`: base64-encoded JSON body (empty when no body)
- `content_type`: `application/json` or empty

The envelope request carries the upstream `Referer` and, for authenticated calls, a Bearer token. Redirects are followed with explicit target validation and a maximum of five hops. The browser port must preserve the upstream protocol; it must not expose a generic arbitrary-URL proxy.

### Command groups identified in `src-tauri/src/lib.rs`

| Group | Commands / responsibilities |
|---|---|
| Startup and security | `app_boot`, `security_set`, `debug_log`, `net_diag` |
| Lines and connectivity | `line_state`, `line_set`, `line_custom_set`, `line_reset`, `line_cancel`, `line_mirrors`, `line_probe`, `line_auto`, `line_try_main`, `line_health` |
| Proxy and updates | `proxy_state`, `proxy_set`, `proxy_test`, `check_update`, `open_url` |
| Device integration | `set_orientation`, `set_text_interaction`, `media_http_origin` |
| Account | `api_login`, `api_register`, `api_logout`, `api_me`, `api_account_history`, `api_account_history_record`, `api_account_history_delete` |
| Discovery | `api_feed`, `api_original_videos`, `api_topics`, `api_topic`, `api_tags`, `api_tag_videos`, `api_post_tag`, `api_category`, `api_rank`, `api_search`, `api_search_hot` |
| Posts and playback | `api_posts`, `api_post`, `api_post_playback`, `api_video`, `api_play`, `api_related` |
| Social | `api_comments`, `api_comment_send`, `api_like`, `api_collect`, `api_follow`, `api_post_like`, `api_post_collect`, `api_post_comments`, `api_post_categories`, `api_post_category`, `api_following`, `api_user`, `api_user_stats`, `api_user_videos` |
| Local cache and diagnostics | `cache_clear`, playback-log status/set/write/read |

The complete command signatures and validation rules remain in the upstream Rust handlers; this table is a planning index, not a replacement for those contracts.

## 3. Media pipeline

The frontend currently constructs local media URLs:

- cover image: `<LOCAL>/img?u=<encoded-source-url>`
- playlist: `<LOCAL>/hls?u=<encoded-playlist-url>`
- segment or encryption key: `<LOCAL>/seg?u=<encoded-resource-url>`

The Rust media layer performs AES-128-CBC cover decryption, HLS playlist parsing and URI rewriting, segment/key fetching, byte-range handling, and caching. iOS additionally has a native HTTP bridge because AVFoundation media loading does not use WKWebView's custom scheme handler in the same way.

A web implementation must replace these local routes with same-origin HTTPS routes and verify all of the following:

1. Only HTTPS source URLs are accepted.
2. Destination hosts are validated against an explicit, reviewed allowlist; private, loopback, link-local, and reserved IP ranges are denied after DNS resolution and on every redirect.
3. Redirects are manually checked, capped, and never allowed to downgrade to HTTP.
4. Request methods, headers, byte ranges, response sizes, and timeouts are bounded.
5. The worker is not an open proxy; it does not accept arbitrary hostnames or arbitrary methods.
6. Playlist rewriting covers variant playlists, segments, keys, and supported URI-bearing tags.
7. iOS Safari native HLS and hls.js/MSE fallback are tested separately.
8. Authentication tokens are never embedded in static assets, URLs, logs, or client-visible build variables.

## 4. Proposed split

- **GitHub Pages**: static React/Vite assets only. No secrets and no Rust runtime.
- **Same-origin API/media service**: authenticated command endpoints plus narrowly scoped media routes. This requires a separate deployable runtime; GitHub Pages cannot host it.
- **Browser transport adapter**: maps the existing frontend command facade to the service contract. Native-only commands must be replaced with web-safe implementations or explicit unsupported capabilities.
- **Browser storage**: use secure, origin-scoped storage for personal preferences. Account-token persistence requires a deliberate threat-model decision; do not silently copy the desktop session storage behavior.
- **iPhone UI**: installable PWA metadata, safe-area handling, Safari playback tests, and no assumptions that the browser can change device orientation or access native file paths.

## 5. Blocking implementation decisions

Before a usable deployment can be claimed, the project needs:

- a backend hosting target and deployment credentials (Cloudflare Workers, a private server, or another HTTPS runtime);
- a verified list of upstream media/CDN hostnames and the upstream's current authorization/CORS behavior;
- a browser-compatible session design;
- an end-to-end test against the actual upstream, including an iPhone Safari playback test.

Until these exist, only static UI scaffolding can be tested. Do not publish a public demo that asks for upstream passwords or accepts arbitrary proxy URLs.
