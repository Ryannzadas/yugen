import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { apiCache } from "../../../db/schema";

export const dynamic = "force-dynamic";

type CoverItem = { id: number; title: string; year?: number };
type PosterImage = { original?: string; large?: string; medium?: string; small?: string };
type KitsuAnime = {
  attributes?: {
    titles?: Record<string, string | null>;
    canonicalTitle?: string | null;
    startDate?: string | null;
    posterImage?: PosterImage | null;
  };
};

function normalizeTitle(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchScore(item: CoverItem, candidate: KitsuAnime) {
  const wanted = normalizeTitle(item.title);
  const titles = [candidate.attributes?.canonicalTitle, ...Object.values(candidate.attributes?.titles || {})]
    .filter((title): title is string => Boolean(title))
    .map(normalizeTitle);
  const wantedTokens = new Set(wanted.split(" ").filter((token) => token.length > 1));
  let score = 0;
  for (const title of titles) {
    if (title === wanted) score = Math.max(score, 100);
    else if (title.includes(wanted) || wanted.includes(title)) score = Math.max(score, 72);
    else {
      const tokens = new Set(title.split(" ").filter((token) => token.length > 1));
      const shared = [...wantedTokens].filter((token) => tokens.has(token)).length;
      score = Math.max(score, wantedTokens.size ? (shared / wantedTokens.size) * 60 : 0);
    }
  }
  const candidateYear = Number(candidate.attributes?.startDate?.slice(0, 4)) || 0;
  if (item.year && candidateYear === item.year) score += 24;
  else if (item.year && candidateYear && Math.abs(candidateYear - item.year) === 1) score += 8;
  return score;
}

async function findKitsuCover(item: CoverItem) {
  const params = new URLSearchParams({
    "filter[text]": item.title,
    "page[limit]": "5",
    "fields[anime]": "canonicalTitle,titles,startDate,posterImage",
  });
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`https://kitsu.io/api/edge/anime?${params.toString()}`, {
        cache: "no-store",
        headers: { accept: "application/vnd.api+json", "user-agent": "Yugen-Anime-Wiki/1.0" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Kitsu respondeu com status ${response.status}.`);
      const payload = await response.json() as { data?: KitsuAnime[] };
      const best = (payload.data || [])
        .map((candidate) => ({ candidate, score: matchScore(item, candidate) }))
        .sort((left, right) => right.score - left.score)[0];
      if (!best || best.score < 36) return [];
      const poster = best.candidate.attributes?.posterImage;
      return [...new Set([poster?.original, poster?.large, poster?.medium, poster?.small]
        .filter((url): url is string => Boolean(url)))];
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Kitsu está indisponível.");
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

async function writeCache(key: string, payload: string) {
  try {
    const now = new Date();
    const db = await getDb();
    await db.insert(apiCache).values({
      key,
      provider: "kitsu",
      payload,
      statusCode: 200,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      staleUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    }).onConflictDoUpdate({
      target: apiCache.key,
      set: {
        provider: "kitsu",
        payload,
        statusCode: 200,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        staleUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
    });
  } catch {
    // Covers still load when the database cache is unavailable.
  }
}

async function mapWithConcurrency(items: CoverItem[], concurrency = 6) {
  const covers: Record<string, string[]> = {};
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        const urls = await findKitsuCover(item);
        if (urls.length) covers[String(item.id)] = urls;
      } catch {
        // A missing cover must not prevent the remaining anime from loading.
      }
    }
  });
  await Promise.all(workers);
  return covers;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { items?: CoverItem[] } | null;
  const items = (body?.items || [])
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && typeof item.title === "string" && item.title.trim())
    .slice(0, 25)
    .map((item) => ({ id: item.id, title: item.title.trim().slice(0, 180), year: item.year || undefined }))
    .sort((left, right) => left.id - right.id);
  if (!items.length) return Response.json({ error: "Nenhum anime válido foi informado." }, { status: 400 });

  const digest = createHash("sha256").update(JSON.stringify(items), "utf8").digest("hex");
  const key = `kitsu:covers:${digest}`;
  const cached = await readCache(key);
  const now = new Date();
  if (cached && new Date(cached.expiresAt) > now) {
    return new Response(cached.payload, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, s-maxage=86400", "x-yugen-cache": "HIT" } });
  }

  const covers = await mapWithConcurrency(items);
  if (!Object.keys(covers).length && cached && new Date(cached.staleUntil) > now) {
    return new Response(cached.payload, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, s-maxage=300", "x-yugen-cache": "STALE" } });
  }
  const payload = JSON.stringify({ covers });
  await writeCache(key, payload);
  return new Response(payload, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, s-maxage=86400", "x-yugen-cache": "MISS" } });
}
