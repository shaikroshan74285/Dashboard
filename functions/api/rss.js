function corsHeaders(contentType = "application/json") {
  return {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "cache-control": "no-store",
  };
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get("url") || "";
  if (!isValidUrl(target)) {
    return new Response(JSON.stringify({ error: "Invalid or missing url query param" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; MarketPulseBot/1.0)",
        accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      cf: { cacheTtl: 0 },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Upstream HTTP ${upstream.status}` }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    const text = await upstream.text();
    return new Response(text, {
      status: 200,
      headers: corsHeaders("application/xml; charset=utf-8"),
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "RSS proxy failure" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
