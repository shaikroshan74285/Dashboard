function corsHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "cache-control": "no-store",
  };
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const symbols = (url.searchParams.get("symbols") || "").trim();
  if (!symbols) {
    return new Response(JSON.stringify({ error: "Missing symbols query param" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const upstreamUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; MarketPulseBot/1.0)" },
      cf: { cacheTtl: 0 },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Upstream HTTP ${upstream.status}` }), {
        status: 502,
        headers: corsHeaders(),
      });
    }

    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Quote proxy failure" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
