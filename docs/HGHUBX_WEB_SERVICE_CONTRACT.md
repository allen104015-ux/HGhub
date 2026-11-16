# HGhubX Browser Service Contract (Draft)

> This is an implementation contract, not a deployed service. It deliberately does not expose an arbitrary URL-fetch endpoint.

## Deployment model

The browser app is hosted as static assets. A separate HTTPS service is configured at build/deploy time as `VITE_HGHUBX_SERVICE_ORIGIN`. The service is private to this personal deployment and must enforce origin checks, request limits, and the route allowlist below. Do not place upstream account credentials or reusable server secrets in Vite environment variables.

## Browser-to-service routes

### `POST /v1/command/:name`

Request:
```json
{
  "args": {}
}
```

Response:
```json
{
  "ok": true,
  "data": {}
}
```

Errors:
```json
{
  "ok": false,
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Request could not be completed"
  }
}
```

The service must reject unknown command names and validate every argument. The first implementation should cover read-only commands only (boot, feed, category, rank, search, video detail, playback info, comments). Login, registration, account history, likes, follows, and other mutations remain disabled until session isolation and CSRF protections are implemented.

### `GET /v1/media/image?u=<encoded-url>`

Returns the decoded cover image. Accept only approved HTTPS upstream/CDN hosts; cap response size; set a correct image content type; cache only non-personal public assets.

### `GET /v1/media/hls?u=<encoded-url>`

Returns a rewritten HLS playlist. Every nested playlist, segment, and key URL must be rewritten to the service's own `/v1/media/segment` route. Preserve relevant playlist tags and query strings.

### `GET /v1/media/segment?u=<encoded-url>`

Returns a segment or key, with bounded byte-range support. Validate the destination host and redirect chain for every request. Never forward arbitrary caller-supplied headers.

## Security requirements

- Require HTTPS in production.
- Validate `Origin` against the single configured Pages origin; reject missing or unexpected origins for state-changing requests.
- Use a strict command allowlist; no generic `/proxy?url=` endpoint.
- Parse destination URLs; reject credentials, non-HTTPS schemes, IP literals, localhost, private, link-local, multicast, and reserved ranges.
- Resolve DNS and re-check every redirect target to prevent DNS rebinding and SSRF.
- Cap redirects (maximum 5), response bytes, concurrency, request rate, and upstream timeouts.
- Strip authorization headers and sensitive query parameters from logs.
- Never return upstream tokens or internal error traces to the browser.
- Do not persist passwords. Account token storage requires a separate design and must be scoped to one user's private deployment.

## Compatibility and acceptance

1. Safari iOS can load the app over HTTPS and retain layout around notches/home indicators.
2. Guest home feed, category, rank, search, detail, episode list, and comments work against the real upstream.
3. Cover decryption produces valid images.
4. HLS playlists, nested playlists, AES keys, segments, seeking, and byte ranges work in iOS Safari.
5. The player handles native HLS and hls.js fallback without assuming desktop MSE support.
6. Browser refresh does not leak another account's session.
7. Security tests reject unapproved hosts, HTTP downgrade, redirect-to-private-IP, malformed URLs, oversized responses, and unknown commands.
8. Only after all acceptance checks pass may the Pages URL be described as usable.

## Current blocker

No backend hosting target or deployment credential has been connected. GitHub Pages cannot run this service. The browser contract can be implemented and tested locally, but a real end-to-end deployment requires an HTTPS backend runtime.
