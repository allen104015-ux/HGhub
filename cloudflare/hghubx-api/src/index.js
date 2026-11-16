/**
 * HGhubX Web API - Cloudflare Worker scaffold
 *
 * This is intentionally a secure bootstrap, not a functioning HGhubX backend yet.
 * Do not add an arbitrary URL proxy here. Upstream command adapters and media
 * rewriting must be ported and tested before enabling playback.
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  const configured = (env.ALLOWED_ORIGIN || "").trim();
  if (!origin || !configured || origin !== configured) return null;
  return origin;
}

const READ_ONLY_COMMANDS = new Set([
  "app_boot",
  "api_feed",
  "api_topics",
  "api_topic",
  "api_tags",
  "api_tag_videos",
  "api_post_tag",
  "api_category",
  "api_original_videos",
  "api_rank",
  "api_search",
  "api_search_hot",
  "api_posts",
  "api_post",
  "api_post_playback",
  "api_post_comments",
  "api_post_categories",
  "api_post_category",
  "api_related",
  "api_video",
  "api_play",
  "api_comments",
  "api_user",
  "api_user_stats",
  "api_user_videos",
]);

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        ok: true,
        service: "hghubx-web-api",
        stage: "bootstrap",
        note: "API adapters and media proxy are not implemented yet.",
      });
    }

    if (!origin) {
      return json({ ok: false, error: { code: "ORIGIN_DENIED", message: "Origin not allowed" } }, 403);
    }

    const headers = corsHeaders(origin);

    if (url.pathname.startsWith("/v1/command/") && request.method === "POST") {
      const name = decodeURIComponent(url.pathname.slice("/v1/command/".length));
      if (!READ_ONLY_COMMANDS.has(name)) {
        return json({ ok: false, error: { code: "COMMAND_NOT_ALLOWED", message: "Command is not enabled" } }, 403, headers);
      }
      // Deliberately fail closed until the upstream HGhubX API adapter is ported.
      return json({
        ok: false,
        error: {
          code: "NOT_IMPLEMENTED",
          message: "This command adapter has not been ported from the native backend yet.",
          command: name,
        },
      }, 501, headers);
    }

    if (url.pathname.startsWith("/v1/media/")) {
      return json({
        ok: false,
        error: {
          code: "MEDIA_NOT_IMPLEMENTED",
          message: "Media URL validation, HLS rewriting, byte-range handling, and upstream allowlists are not implemented yet.",
        },
      }, 501, headers);
    }

    return json({ ok: false, error: { code: "NOT_FOUND", message: "Route not found" } }, 404, headers);
  },
};
