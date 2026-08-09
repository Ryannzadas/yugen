import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { animeGenres, animes, episodeHistory, genres, studios, userAnimeStatuses, users } from "../../../db/schema";
import { getSessionIdentity } from "../../session-auth";

export const dynamic = "force-dynamic";

type LibraryStatus = "watching" | "to_watch" | "watched";

type LibraryPayload = {
  anime?: {
    slug?: string;
    title?: string;
    image?: string;
    episodes?: number | null;
    year?: number;
    format?: string;
    season?: string;
    status?: string;
    genres?: string[];
    studio?: string;
    broadcastDay?: string;
    broadcastTime?: string;
  };
  status?: LibraryStatus;
  progressEpisodes?: number;
  score?: number | null;
  favorite?: boolean;
};

async function getOrCreateUser() {
  const identity = await getSessionIdentity();
  if (!identity) return null;
  const db = await getDb();
  const email = identity.email.toLowerCase();
  const baseUsername = email.split("@")[0].replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || "member";
  await db.insert(users).values({
    id: crypto.randomUUID(),
    email,
    username: `${baseUsername}-${email.length}`,
    displayName: identity.displayName,
  }).onConflictDoNothing({ target: users.email });
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return { db, user };
}

function genreSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function GET() {
  try {
    const context = await getOrCreateUser();
    if (!context) return Response.json({ error: "Entre na sua conta para acessar a biblioteca." }, { status: 401 });
    const { db, user } = context;
    const entries = await db.select({
      animeId: animes.id,
      slug: animes.slug,
      title: animes.title,
      image: animes.posterUrl,
      episodes: animes.episodeCount,
      year: animes.seasonYear,
      format: animes.format,
      season: animes.season,
      airingStatus: animes.airingStatus,
      studio: studios.name,
      broadcastDay: animes.broadcastDay,
      broadcastTime: animes.broadcastTime,
      status: userAnimeStatuses.status,
      progressEpisodes: userAnimeStatuses.progressEpisodes,
      score: userAnimeStatuses.score,
      favorite: userAnimeStatuses.favorite,
      updatedAt: userAnimeStatuses.updatedAt,
    }).from(userAnimeStatuses)
      .innerJoin(animes, eq(userAnimeStatuses.animeId, animes.id))
      .leftJoin(studios, eq(animes.studioId, studios.id))
      .where(eq(userAnimeStatuses.userId, user.id));
    const animeIds = entries.map((entry) => entry.animeId);
    const genreRows = animeIds.length ? await db.select({ animeId: animeGenres.animeId, name: genres.name })
      .from(animeGenres)
      .innerJoin(genres, eq(animeGenres.genreId, genres.id))
      .where(inArray(animeGenres.animeId, animeIds)) : [];
    const genreMap = new Map<string, string[]>();
    genreRows.forEach((row) => genreMap.set(row.animeId, [...(genreMap.get(row.animeId) || []), row.name]));
    return Response.json({ entries: entries.map(({ animeId, ...entry }) => ({ ...entry, genres: genreMap.get(animeId) || [] })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar a biblioteca." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOrCreateUser();
    if (!context) return Response.json({ error: "Entre na sua conta para salvar seu progresso." }, { status: 401 });
    const payload = await request.json() as LibraryPayload;
    const source = payload.anime;
    const slug = source?.slug?.trim() || "";
    const title = source?.title?.trim() || "";
    if (!slug || !title) return Response.json({ error: "Anime inválido." }, { status: 400 });

    const { db, user } = context;
    const studioName = source?.studio?.trim() || "";
    let studioId: string | null = null;
    if (studioName) {
      const studioSlug = genreSlug(studioName);
      await db.insert(studios).values({ id: crypto.randomUUID(), name: studioName, slug: studioSlug }).onConflictDoNothing({ target: studios.slug });
      const [savedStudio] = await db.select({ id: studios.id }).from(studios).where(eq(studios.slug, studioSlug)).limit(1);
      studioId = savedStudio?.id || null;
    }
    await db.insert(animes).values({
      id: crypto.randomUUID(),
      slug,
      title,
      synopsis: "Dados sincronizados da Jikan.",
      format: source?.format || "TV",
      episodeCount: source?.episodes ?? null,
      season: source?.season || null,
      seasonYear: source?.year || null,
      airingStatus: source?.status || "unknown",
      posterUrl: source?.image || null,
      studioId,
      broadcastDay: source?.broadcastDay || null,
      broadcastTime: source?.broadcastTime || null,
    }).onConflictDoUpdate({
      target: animes.slug,
      set: {
        title,
        format: source?.format || "TV",
        episodeCount: source?.episodes ?? null,
        season: source?.season || null,
        seasonYear: source?.year || null,
        airingStatus: source?.status || "unknown",
        posterUrl: source?.image || null,
        studioId,
        broadcastDay: source?.broadcastDay || null,
        broadcastTime: source?.broadcastTime || null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
    const [anime] = await db.select().from(animes).where(eq(animes.slug, slug)).limit(1);
    if (Array.isArray(source?.genres)) {
      const normalizedGenres = [...new Map(source.genres.map((name) => name.trim()).filter(Boolean).map((name) => [genreSlug(name), name])).entries()]
        .filter(([genreSlugValue]) => genreSlugValue)
        .map(([genreSlugValue, name]) => ({ slug: genreSlugValue, name }));
      for (const genre of normalizedGenres) {
        await db.insert(genres).values({ id: crypto.randomUUID(), name: genre.name, slug: genre.slug }).onConflictDoNothing({ target: genres.slug });
      }
      await db.delete(animeGenres).where(eq(animeGenres.animeId, anime.id));
      if (normalizedGenres.length) {
        const savedGenres = await db.select({ id: genres.id }).from(genres).where(inArray(genres.slug, normalizedGenres.map((genre) => genre.slug)));
        if (savedGenres.length) await db.insert(animeGenres).values(savedGenres.map((genre) => ({ animeId: anime.id, genreId: genre.id }))).onConflictDoNothing();
      }
    }
    const progress = Math.max(0, Math.min(payload.progressEpisodes ?? 0, source?.episodes || Number.MAX_SAFE_INTEGER));
    const score = payload.score == null ? null : Math.max(1, Math.min(10, Math.round(payload.score)));
    const [previous] = await db.select({ progressEpisodes: userAnimeStatuses.progressEpisodes }).from(userAnimeStatuses)
      .where(sql`${userAnimeStatuses.userId} = ${user.id} AND ${userAnimeStatuses.animeId} = ${anime.id}`).limit(1);

    await db.insert(userAnimeStatuses).values({
      userId: user.id,
      animeId: anime.id,
      status: payload.status || "to_watch",
      progressEpisodes: progress,
      score,
      favorite: Boolean(payload.favorite),
    }).onConflictDoUpdate({
      target: [userAnimeStatuses.userId, userAnimeStatuses.animeId],
      set: {
        status: payload.status || "to_watch",
        progressEpisodes: progress,
        score,
        favorite: Boolean(payload.favorite),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });

    if ((previous?.progressEpisodes ?? 0) !== progress) {
      await db.insert(episodeHistory).values({
        id: crypto.randomUUID(),
        userId: user.id,
        animeId: anime.id,
        previousProgress: previous?.progressEpisodes ?? 0,
        newProgress: progress,
        source: "manual",
      });
    }

    return Response.json({
      entry: {
        slug,
        title,
        image: source?.image || null,
        episodes: source?.episodes ?? null,
        year: source?.year || null,
        format: source?.format || "TV",
        season: source?.season || null,
        airingStatus: source?.status || "unknown",
        studio: studioName || null,
        broadcastDay: source?.broadcastDay || null,
        broadcastTime: source?.broadcastTime || null,
        genres: source?.genres || [],
        status: payload.status || "to_watch",
        progressEpisodes: progress,
        score,
        favorite: Boolean(payload.favorite),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível salvar a biblioteca." }, { status: 500 });
  }
}
