import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { animes, userAnimeStatuses, users } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

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
  };
  status?: LibraryStatus;
  progressEpisodes?: number;
  score?: number | null;
  favorite?: boolean;
};

async function getOrCreateUser() {
  const identity = await getChatGPTUser();
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

export async function GET() {
  try {
    const context = await getOrCreateUser();
    if (!context) return Response.json({ error: "Entre na sua conta para acessar a biblioteca." }, { status: 401 });
    const { db, user } = context;
    const entries = await db.select({
      slug: animes.slug,
      title: animes.title,
      image: animes.posterUrl,
      episodes: animes.episodeCount,
      year: animes.seasonYear,
      format: animes.format,
      status: userAnimeStatuses.status,
      progressEpisodes: userAnimeStatuses.progressEpisodes,
      score: userAnimeStatuses.score,
      favorite: userAnimeStatuses.favorite,
      updatedAt: userAnimeStatuses.updatedAt,
    }).from(userAnimeStatuses)
      .innerJoin(animes, eq(userAnimeStatuses.animeId, animes.id))
      .where(eq(userAnimeStatuses.userId, user.id));
    return Response.json({ entries });
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
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
    const [anime] = await db.select().from(animes).where(eq(animes.slug, slug)).limit(1);
    const progress = Math.max(0, Math.min(payload.progressEpisodes ?? 0, source?.episodes || Number.MAX_SAFE_INTEGER));
    const score = payload.score == null ? null : Math.max(1, Math.min(10, Math.round(payload.score)));

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

    return Response.json({
      entry: {
        slug,
        title,
        image: source?.image || null,
        episodes: source?.episodes ?? null,
        year: source?.year || null,
        format: source?.format || "TV",
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
