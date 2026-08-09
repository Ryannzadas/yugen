import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { apiCache } from "@/db/schema";

type Provider = "jikan" | "shikimori";

export const dynamic = "force-dynamic";

const providers: Record<Provider, { baseUrl: string; label: string }> = {
  jikan: { baseUrl: "https://api.jikan.moe/v4", label: "Jikan" },
  shikimori: { baseUrl: "https://shikimori.one/api", label: "Shikimori" },
};

function cacheLifetime(provider: Provider, path: string) {
  if (/\/(full|characters|staff)$/.test(path) || /^characters\//.test(path)) return 24 * 60 * 60;
  if (provider === "shikimori" && /^animes\/\d+$/.test(path)) return 24 * 60 * 60;
  if (/^(top\/anime|seasons\/now|animes)/.test(path)) return 15 * 60;
  return 30 * 60;
}

function responseHeaders(cacheState: "HIT" | "MISS" | "STALE", maxAge: number) {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": `public, max-age=60, s-maxage=${maxAge}, stale-while-revalidate=${7 * 24 * 60 * 60}`,
    "x-yugen-cache": cacheState,
  };
}

async function readCache(key: string) {
  try {
    const db = await getDb();
    const [entry] = await db.select().from(apiCache).where(eq(apiCache.key, key)).limit(1);
    return entry;
  } catch {
    return undefined;
  }
}

async function writeCache(input: {
  key: string;
  provider: Provider;
  payload: string;
  statusCode: number;
  expiresAt: string;
  staleUntil: string;
}) {
  try {
    const db = await getDb();
    await db.insert(apiCache).values({ ...input, updatedAt: new Date().toISOString() }).onConflictDoUpdate({
      target: apiCache.key,
      set: {
        provider: input.provider,
        payload: input.payload,
        statusCode: input.statusCode,
        expiresAt: input.expiresAt,
        staleUntil: input.staleUntil,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch {
    // The proxy still works before the cache migration or DATABASE_URL is available.
  }
}

async function fetchUpstream(url: string, label: string) {
  let lastStatus = 0;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          accept: "application/json",
          "user-agent": "Yugen-Anime-Wiki/1.0",
        },
        signal: AbortSignal.timeout(12_000),
      });
      lastStatus = response.status;
      const body = await response.text();
      if (response.ok) return { body, status: response.status };
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`${label} respondeu com status ${response.status}.`);
      }
      lastError = new Error(`${label} respondeu com status ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(lastStatus ? `${label} respondeu com status ${lastStatus}.` : `${label} está indisponível.`);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string; path: string[] }> },
) {
  const route = await params;
  if (!(route.provider in providers)) return Response.json({ error: "Provedor inválido." }, { status: 404 });
  const provider = route.provider as Provider;
  const path = route.path.join("/");
  if (!path || route.path.some((segment) => !segment || segment === "." || segment === ".." || !/^[\w.-]+$/.test(segment))) {
    return Response.json({ error: "Caminho inválido." }, { status: 400 });
  }

  const sourceUrl = new URL(`${providers[provider].baseUrl}/${path}`);
  const incomingUrl = new URL(request.url);
  [...incomingUrl.searchParams.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => sourceUrl.searchParams.append(key, value));

  const key = `${provider}:${path}?${sourceUrl.searchParams.toString()}`;
  const maxAge = cacheLifetime(provider, path);
  const now = new Date();
  const cached = await readCache(key);
  if (cached && new Date(cached.expiresAt) > now) {
    return new Response(cached.payload, { status: cached.statusCode, headers: responseHeaders("HIT", maxAge) });
  }

  try {
    const upstream = await fetchUpstream(sourceUrl.toString(), providers[provider].label);
    const expiresAt = new Date(now.getTime() + maxAge * 1000).toISOString();
    const staleUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await writeCache({ key, provider, payload: upstream.body, statusCode: upstream.status, expiresAt, staleUntil });
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders("MISS", maxAge) });
  } catch (error) {
    if (cached && new Date(cached.staleUntil) > now) {
      return new Response(cached.payload, { status: cached.statusCode, headers: responseHeaders("STALE", 60) });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "A API de animes está indisponível." },
      { status: 502, headers: { "cache-control": "no-store", "x-yugen-cache": "ERROR" } },
    );
  }
}
