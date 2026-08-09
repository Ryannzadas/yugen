const allowedImageHosts = new Set([
  "cdn.myanimelist.net",
  "shikimori.one",
  "shikimori.io",
  "media.kitsu.app",
  "media.kitsu.io",
]);

function isAllowedHost(hostname: string) {
  return allowedImageHosts.has(hostname.toLowerCase());
}

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("url");
  if (!value) return Response.json({ error: "Imagem não informada." }, { status: 400 });

  let source: URL;
  try {
    source = new URL(value);
  } catch {
    return Response.json({ error: "Endereço de imagem inválido." }, { status: 400 });
  }

  if (source.protocol !== "https:" || !isAllowedHost(source.hostname)) {
    return Response.json({ error: "Origem de imagem não permitida." }, { status: 403 });
  }

  try {
    const upstream = await fetch(source, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": "Yugen-Anime-Wiki/1.0",
      },
      next: { revalidate: 7 * 24 * 60 * 60 },
      signal: AbortSignal.timeout(8_000),
    });
    const contentType = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !contentType.toLowerCase().startsWith("image/")) {
      return Response.json({ error: "Imagem indisponível." }, { status: 404 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "content-disposition": "inline",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Imagem temporariamente indisponível." }, { status: 504 });
  }
}
