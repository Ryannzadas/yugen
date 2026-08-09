import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { animeGenres, animeReminders, animes, episodeHistory, genres, libraryImports, libraryPreferences, studios, userAnimeStatuses, users } from "../../../../db/schema";
import { getSessionIdentity } from "../../../session-auth";

export const dynamic = "force-dynamic";

async function getUser() {
  const identity = await getSessionIdentity();
  if (!identity) return null;
  const db = await getDb();
  const email = identity.email.toLowerCase();
  const baseUsername = email.split("@")[0].replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || "member";
  await db.insert(users).values({ id: crypto.randomUUID(), email, username: `${baseUsername}-${email.length}`, displayName: identity.displayName }).onConflictDoNothing({ target: users.email });
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return { db, user };
}

function startOfWeek() {
  const date = new Date();
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function GET(request: Request) {
  try {
    const context = await getUser();
    if (!context) return Response.json({ error: "Entre na sua conta para acessar a biblioteca avançada." }, { status: 401 });
    const { db, user } = context;
    const requestedAnime = new URL(request.url).searchParams.get("anime")?.trim();
    if (requestedAnime) {
      const [reminder] = await db.select({ enabled: animeReminders.enabled }).from(animeReminders)
        .innerJoin(animes, eq(animeReminders.animeId, animes.id))
        .where(and(eq(animeReminders.userId, user.id), eq(animes.slug, requestedAnime))).limit(1);
      return Response.json({ reminderEnabled: Boolean(reminder?.enabled) });
    }

    await db.insert(libraryPreferences).values({ userId: user.id }).onConflictDoNothing();
    const [preferences, history, weekly, genreStats, studioStats, scoreStats, statusStats, reminders, imports] = await Promise.all([
      db.select().from(libraryPreferences).where(eq(libraryPreferences.userId, user.id)).limit(1),
      db.select({
        id: episodeHistory.id,
        slug: animes.slug,
        title: animes.title,
        image: animes.posterUrl,
        previousProgress: episodeHistory.previousProgress,
        newProgress: episodeHistory.newProgress,
        source: episodeHistory.source,
        createdAt: episodeHistory.createdAt,
      }).from(episodeHistory).innerJoin(animes, eq(episodeHistory.animeId, animes.id))
        .where(eq(episodeHistory.userId, user.id)).orderBy(desc(episodeHistory.createdAt)).limit(100),
      db.select({ episodes: sql<number>`COALESCE(SUM(GREATEST(${episodeHistory.newProgress} - ${episodeHistory.previousProgress}, 0)), 0)::int` })
        .from(episodeHistory).where(and(eq(episodeHistory.userId, user.id), eq(episodeHistory.source, "manual"), gte(episodeHistory.createdAt, startOfWeek()))),
      db.select({ name: genres.name, count: sql<number>`COUNT(DISTINCT ${userAnimeStatuses.animeId})::int` })
        .from(userAnimeStatuses).innerJoin(animeGenres, eq(userAnimeStatuses.animeId, animeGenres.animeId)).innerJoin(genres, eq(animeGenres.genreId, genres.id))
        .where(eq(userAnimeStatuses.userId, user.id)).groupBy(genres.name).orderBy(desc(sql`COUNT(DISTINCT ${userAnimeStatuses.animeId})`)).limit(10),
      db.select({ name: studios.name, count: sql<number>`COUNT(*)::int` })
        .from(userAnimeStatuses).innerJoin(animes, eq(userAnimeStatuses.animeId, animes.id)).innerJoin(studios, eq(animes.studioId, studios.id))
        .where(eq(userAnimeStatuses.userId, user.id)).groupBy(studios.name).orderBy(desc(sql`COUNT(*)`)).limit(10),
      db.select({ score: userAnimeStatuses.score, count: sql<number>`COUNT(*)::int` }).from(userAnimeStatuses)
        .where(eq(userAnimeStatuses.userId, user.id)).groupBy(userAnimeStatuses.score).orderBy(userAnimeStatuses.score),
      db.select({ status: userAnimeStatuses.status, count: sql<number>`COUNT(*)::int` }).from(userAnimeStatuses)
        .where(eq(userAnimeStatuses.userId, user.id)).groupBy(userAnimeStatuses.status),
      db.select({
        slug: animes.slug,
        title: animes.title,
        image: animes.posterUrl,
        broadcastDay: animes.broadcastDay,
        broadcastTime: animes.broadcastTime,
        enabled: animeReminders.enabled,
      }).from(animeReminders).innerJoin(animes, eq(animeReminders.animeId, animes.id))
        .where(and(eq(animeReminders.userId, user.id), eq(animeReminders.enabled, true))).orderBy(animes.broadcastDay),
      db.select().from(libraryImports).where(eq(libraryImports.userId, user.id)).orderBy(desc(libraryImports.createdAt)).limit(5),
    ]);

    return Response.json({
      preferences: preferences[0],
      weeklyEpisodes: weekly[0]?.episodes ?? 0,
      history,
      stats: { genres: genreStats, studios: studioStats, scores: scoreStats, statuses: statusStats },
      reminders,
      imports,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar a biblioteca avançada." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getUser();
    if (!context) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
    const payload = await request.json() as {
      action?: "settings" | "reminder";
      weeklyEpisodeGoal?: number;
      remindersEnabled?: boolean;
      anime?: { slug?: string; title?: string; image?: string | null; episodes?: number | null; year?: number | null; format?: string; season?: string; status?: string; broadcastDay?: string; broadcastTime?: string };
      enabled?: boolean;
    };
    const { db, user } = context;

    if (payload.action === "settings") {
      const goal = Math.max(1, Math.min(100, Math.round(Number(payload.weeklyEpisodeGoal) || 5)));
      await db.insert(libraryPreferences).values({ userId: user.id, weeklyEpisodeGoal: goal, remindersEnabled: payload.remindersEnabled ?? true })
        .onConflictDoUpdate({ target: libraryPreferences.userId, set: { weeklyEpisodeGoal: goal, remindersEnabled: payload.remindersEnabled ?? true, updatedAt: sql`CURRENT_TIMESTAMP` } });
      return Response.json({ weeklyEpisodeGoal: goal, remindersEnabled: payload.remindersEnabled ?? true });
    }

    if (payload.action === "reminder") {
      const source = payload.anime;
      const slug = source?.slug?.trim() || "";
      const title = source?.title?.trim() || "";
      if (!slug || !title) return Response.json({ error: "Anime inválido." }, { status: 400 });
      await db.insert(animes).values({
        id: crypto.randomUUID(), slug, title, synopsis: "Sinopse não disponível.", posterUrl: source?.image || null,
        episodeCount: source?.episodes ?? null, seasonYear: source?.year ?? null, format: source?.format || "TV", season: source?.season || null,
        airingStatus: source?.status || "unknown", broadcastDay: source?.broadcastDay || null, broadcastTime: source?.broadcastTime || null,
      }).onConflictDoUpdate({ target: animes.slug, set: { title, posterUrl: source?.image || undefined, broadcastDay: source?.broadcastDay || undefined, broadcastTime: source?.broadcastTime || undefined, updatedAt: sql`CURRENT_TIMESTAMP` } });
      const [anime] = await db.select({ id: animes.id }).from(animes).where(eq(animes.slug, slug)).limit(1);
      const enabled = payload.enabled !== false;
      await db.insert(animeReminders).values({ userId: user.id, animeId: anime.id, enabled })
        .onConflictDoUpdate({ target: [animeReminders.userId, animeReminders.animeId], set: { enabled, updatedAt: sql`CURRENT_TIMESTAMP` } });
      return Response.json({ reminderEnabled: enabled });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível salvar as configurações da biblioteca." }, { status: 500 });
  }
}
