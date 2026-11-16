# HGhubX Cloudflare Worker bootstrap

This Worker is a secure deployment scaffold only. It is **not yet a working HGhubX backend**.

## Deploy

1. In Cloudflare Dashboard, open Workers & Pages and select the Worker created for this project.
2. Use the Git integration or Wrangler to deploy this directory.
3. Set `ALLOWED_ORIGIN` to the exact GitHub Pages origin (origin only, no path).
4. Verify `/health` returns JSON with `stage: "bootstrap"`.

## Current behavior

- `GET /health`: health/status endpoint.
- `POST /v1/command/:name`: allowlisted read-only command names return HTTP 501 until their adapters are ported.
- `/v1/media/*`: returns HTTP 501 until secure image/HLS/segment handling is implemented.
- Unknown commands are rejected. There is no arbitrary URL proxy.

## Required before real use

- Port the HGhubX Rust API/network/session behavior into a browser-compatible service.
- Implement strict upstream host allowlists, DNS/IP and redirect SSRF checks, bounded response sizes/timeouts, and safe HLS URL rewriting.
- Implement image decryption and HLS segment/key/range support.
- Validate iOS Safari native HLS playback end to end.
- Keep login, registration, likes, follows, and account history disabled until per-user session isolation and CSRF protections exist.

Do not place upstream credentials or secrets in frontend Vite variables. Configure secrets only as Worker secrets when a reviewed backend implementation actually needs them.
