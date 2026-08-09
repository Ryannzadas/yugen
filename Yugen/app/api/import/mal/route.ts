import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { animeGenres, animes, episodeHistory, genres, libraryImports, libraryPreferences, studios, userAnimeStatuses, users } from "../../../../db/schema";
import { getSessionIdentity } from "../../../session-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type MalListItem = {
  entry?: {
    mal_id?: number;
    title?: string;
    images?: { jpg?: { large_image_url?: string; image_url?: string } };
    type?: string | null;
    episodes?: number | null;
    year?: number | null;
    season?: string | null;
    status?: string | null;
    genres?: Array<{ name?: string }>;
    studios?: Array<{ name?: string }>;
  };
  list_status?: { status?: string; score?: number; episodes_watched?: number };
};

type JikanPage = { data?: MalListItem[]; pagination?: { has_next_page?: boolean; current_page?: number; last_visible_page?: number } };

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function mappedStatus(value?: string): "watching" | "to_watch" | "watched" {
  if (value === "completed") return "watched";
  if (value === "watching" || value === "on_hold") return "watching";
  return "to_watch";
}

async function jikanPage(username: string, page: number) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/animelist?page=${page}`, { headers: { accept: "application/json" }, cache: "no-store" });
    if (response.ok) return response.json() as Promise<JikanPage>;
    if (response.status === 404) throw new Error("Usuário do MyAnimeList não encontrado ou lista privada.");
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }
  throw new Error("Não foi possível concluir a importação agora. Tente novamente em alguns minutos.");
}

export async function POST(request: Request) {
  const identity = await getSessionIdentity();
  if (!identity) return Response.json({ error: "Entre na sua conta para importar sua lista." }, { status: 401 });
  const payload = await request.json() as { username?: string };
  const username = payload.username?.trim() || "";
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(username)) return Response.json({ error: "Informe um nome de usuário válido do MyAnimeList." }, { status: 400 });

  const db = await getDb();
  const email = identity.email.toLowerCase();
  const baseUsername = email.split("@")[0].replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || "member";
  await db.insert(users).values({ id: crypto.randomUUID(), email, username: `${baseUsername}-${email.length}`, displayName: identity.displayName }).onConflictDoNothing({ target: users.email });
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const importId = crypto.randomUUID();
  await db.insert(libraryImports).values({ id: importId, userId: user.id, externalUsername: username });

  try {
    const items: MalListItem[] = [];
    for (let page = 1; page <= 40; page += 1) {
      const result = await jikanPage(username, page);
      items.push(...(result.data || []));
      if (!result.pagination?.has_next_page || items.length >= 1000) break;
      await new Promise((resolve) => setTimeout(resolve, 360));
    }
    if (!items.length) throw new Error("A lista pública não possui animes para importar.");

    let importedCount = 0;
    for (const item of items) {
      const entry = item.entry;
      const malId = Number(entry?.mal_id);
      const title = entry?.title?.trim() || "";
      if (!malId || !title) continue;
      const slug = `mal-${malId}`;
      const studioName = entry?.studios?.[0]?.name?.trim();
      let studioId: string | null = null;
      if (studioName) {
        const studioSlug = slugify(studioName);
        await db.insert(studios).values({ id: crypto.randomUUID(), name: studioName, slug: studioSlug }).onConflictDoNothing({ target: studios.slug });
        const [studio] = await db.select({ id: studios.id }).from(studios).where(eq(studios.slug, studioSlug)).limit(1);
        studioId = studio?.id || null;
      }
      await db.insert(animes).values({
        id: crypto.randomUUID(), slug, title, synopsis: "Importado do MyAnimeList.", format: entry?.type || "TV", episodeCount: entry?.episodes ?? null,
        season: entry?.season || null, seasonYear: entry?.year ?? null, airingStatus: entry?.status || "unknown",
        posterUrl: entry?.images?.jpg?.large_image_url || entry?.images?.jpg?.image_url || null, studioId,
      }).onConflictDoUpdate({ target: animes.slug, set: {
        title, format: entry?.type || "TV", episodeCount: entry?.episodes ?? null, season: entry?.season || null, seasonYear: entry?.year ?? null,
        airingStatus: entry?.status || "unknown", posterUrl: entry?.images?.jpg?.large_image_url || entry?.images?.jpg?.image_url || null,
        studioId: studioId || undefined, updatedAt: sql`CURRENT_TIMESTAMP`,
      } });
      const [anime] = await db.select({ id: animes.id }).from(animes).where(eq(animes.slug, slug)).limit(1);
      const genreNames = (entry?.genres || []).map((genre) => genre.name?.trim()).filter((name): name is string => Boolean(name));
      for (const name of genreNames) {
        const genreSlug = slugify(name);
        await db.insert(genres).values({ id: crypto.randomUUID(), name, slug: genreSlug }).onConflictDoNothing({ target: genres.slug });
      }
      if (genreNames.length) {
        const savedGenres = await db.select({ id: genres.id }).from(genres).where(inArray(genres.slug, genreNames.map(slugify)));
        await db.insert(animeGenres).values(savedGenres.map((genre) => ({ animeId: anime.id, genreId: genre.id }))).onConflictDoNothing();
      }
      const progress = Math.max(0, Number(item.list_status?.episodes_watched) || 0);
      const score = Number(item.list_status?.score) || null;
      const [existing] = await db.select({ progress: userAnimeStatuses.progressEpisodes }).from(userAnimeStatuses)
        .where(and(eq(userAnimeStatuses.userId, user.id), eq(userAnimeStatuses.animeId, anime.id))).limit(1);
      await db.insert(userAnimeStatuses).values({ userId: user.id, animeId: anime.id, status: mappedStatus(item.list_status?.status), progressEpisodes: progress, score, favorite: false })
        .onConflictDoUpdate({ target: [userAnimeStatuses.userId, userAnimeStatuses.animeId], set: { status: mappedStatus(item.list_status?.status), progressEpisodes: progress, score, updatedAt: sql`CURRENT_TIMESTAMP` } });
      if ((existing?.progress ?? 0) !== progress) await db.insert(episodeHistory).values({ id: crypto.randomUUID(), userId: user.id, animeId: anime.id, previousProgress: existing?.progress ?? 0, newProgress: progress, source: "mal_import" });
      importedCount += 1;
    }

    const completedAt = new Date().toISOString();
    await db.insert(libraryPreferences).values({ userId: user.id, malUsername: username, lastImportedAt: completedAt })
      .onConflictDoUpdate({ target: libraryPreferences.userId, set: { malUsername: username, lastImportedAt: completedAt, updatedAt: sql`CURRENT_TIMESTAMP` } });
    await db.update(libraryImports).set({ status: "completed", importedCount, completedAt }).where(eq(libraryImports.id, importId));
    return Response.json({ importedCount, username });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível importar a lista.";
    await db.update(libraryImports).set({ status: "failed", errorMessage: message, completedAt: new Date().toISOString() }).where(eq(libraryImports.id, importId));
    return Response.json({ error: message }, { status: 502 });
  }
}
