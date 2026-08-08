import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { animes, animeRevisions, users } from "../../../db/schema";
import { getSessionIdentity } from "../../session-auth";

export const dynamic = "force-dynamic";

type WikiChanges = Partial<{
  title: string;
  titleJapanese: string;
  synopsis: string;
  format: string;
  episodes: number | null;
  season: string;
  year: number | null;
  status: string;
}>;

type AnimeSource = WikiChanges & {
  slug?: string;
  image?: string | null;
};

function canModerate(role?: string) {
  return role === "admin" || role === "moderator";
}

function parseSnapshot(value: string) {
  try {
    const parsed = JSON.parse(value) as { changes?: WikiChanges; previous?: WikiChanges };
    return { changes: parsed.changes || {}, previous: parsed.previous || {} };
  } catch {
    return { changes: {}, previous: {} };
  }
}

function cleanChanges(value: WikiChanges) {
  const changes: WikiChanges = {};
  if (typeof value.title === "string" && value.title.trim()) changes.title = value.title.trim().slice(0, 200);
  if (typeof value.titleJapanese === "string") changes.titleJapanese = value.titleJapanese.trim().slice(0, 200);
  if (typeof value.synopsis === "string" && value.synopsis.trim()) changes.synopsis = value.synopsis.trim().slice(0, 10000);
  if (typeof value.format === "string" && value.format.trim()) changes.format = value.format.trim().slice(0, 40);
  if (value.episodes === null || Number.isFinite(Number(value.episodes))) changes.episodes = value.episodes === null ? null : Math.max(1, Math.round(Number(value.episodes)));
  if (typeof value.season === "string" && value.season.trim()) changes.season = value.season.trim().slice(0, 30);
  if (value.year === null || Number.isFinite(Number(value.year))) changes.year = value.year === null ? null : Math.max(1900, Math.min(2200, Math.round(Number(value.year))));
  if (typeof value.status === "string" && value.status.trim()) changes.status = value.status.trim().slice(0, 60);
  return changes;
}

async function currentUser(create = false) {
  const identity = await getSessionIdentity();
  if (!identity) return null;
  const db = await getDb();
  const email = identity.email.toLowerCase();
  if (create) {
    const baseUsername = email.split("@")[0].replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || "member";
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      username: `${baseUsername}-${email.length}`,
      displayName: identity.displayName,
    }).onConflictDoNothing({ target: users.email });
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ? { db, user } : null;
}

const revisionSelection = {
  id: animeRevisions.id,
  animeId: animeRevisions.animeId,
  editor: users.username,
  editorDisplayName: users.displayName,
  editorAvatar: users.avatarUrl,
  summary: animeRevisions.summary,
  snapshotJson: animeRevisions.snapshotJson,
  status: animeRevisions.status,
  reviewNote: animeRevisions.reviewNote,
  reviewedAt: animeRevisions.reviewedAt,
  approvedAt: animeRevisions.approvedAt,
  createdAt: animeRevisions.createdAt,
};

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const mode = params.get("mode");
    const context = await currentUser(false);
    const db = context?.db || await getDb();

    if (mode === "moderation") {
      if (!context) return Response.json({ error: "Entre na sua conta para acessar a moderação." }, { status: 401 });
      if (!canModerate(context.user.role)) return Response.json({ error: "Apenas moderadores podem acessar esta fila." }, { status: 403 });
      const rows = await db.select({
        ...revisionSelection,
        animeSlug: animes.slug,
        animeTitle: animes.title,
        animePoster: animes.posterUrl,
      }).from(animeRevisions)
        .innerJoin(animes, eq(animeRevisions.animeId, animes.id))
        .innerJoin(users, eq(animeRevisions.editorId, users.id))
        .where(eq(animeRevisions.status, "pending"))
        .orderBy(asc(animeRevisions.createdAt))
        .limit(200);
      return Response.json({ revisions: rows.map(({ snapshotJson, ...row }) => ({ ...row, ...parseSnapshot(snapshotJson) })) });
    }

    const slug = params.get("anime")?.trim() || "";
    if (!slug) return Response.json({ error: "Anime inválido." }, { status: 400 });
    const [anime] = await db.select({ id: animes.id }).from(animes).where(eq(animes.slug, slug)).limit(1);
    if (!anime) return Response.json({ revisions: [], approvedChanges: {}, canModerate: canModerate(context?.user.role) });
    const rows = await db.select(revisionSelection).from(animeRevisions)
      .innerJoin(users, eq(animeRevisions.editorId, users.id))
      .where(eq(animeRevisions.animeId, anime.id))
      .orderBy(desc(animeRevisions.createdAt))
      .limit(100);
    const approvedChanges = rows.slice().reverse().reduce<WikiChanges>((result, row) => {
      if (row.status !== "approved") return result;
      return { ...result, ...parseSnapshot(row.snapshotJson).changes };
    }, {});
    return Response.json({
      revisions: rows.map(({ snapshotJson, ...row }) => ({ ...row, ...parseSnapshot(snapshotJson) })),
      approvedChanges,
      canModerate: canModerate(context?.user.role),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar o histórico da Wiki." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentUser(true);
    if (!context) return Response.json({ error: "Entre na sua conta para sugerir uma edição." }, { status: 401 });
    const payload = await request.json() as { anime?: AnimeSource; changes?: WikiChanges; summary?: string };
    const source = payload.anime;
    const slug = source?.slug?.trim() || "";
    const title = source?.title?.trim() || "";
    const summary = payload.summary?.trim() || "";
    const changes = cleanChanges(payload.changes || {});
    if (!slug || !title) return Response.json({ error: "Anime inválido." }, { status: 400 });
    if (summary.length < 10 || summary.length > 300) return Response.json({ error: "Explique a correção usando entre 10 e 300 caracteres." }, { status: 400 });
    if (!Object.keys(changes).length) return Response.json({ error: "Altere pelo menos um campo antes de enviar." }, { status: 400 });

    const { db, user } = context;
    await db.insert(animes).values({
      id: crypto.randomUUID(),
      slug,
      title,
      nativeTitle: source?.titleJapanese || null,
      synopsis: source?.synopsis || "Dados sincronizados da Jikan.",
      format: source?.format || "TV",
      episodeCount: source?.episodes ?? null,
      season: source?.season || null,
      seasonYear: source?.year ?? null,
      airingStatus: source?.status || "unknown",
      posterUrl: source?.image || null,
    }).onConflictDoUpdate({
      target: animes.slug,
      set: { posterUrl: source?.image || null, updatedAt: sql`CURRENT_TIMESTAMP` },
    });
    const [anime] = await db.select().from(animes).where(eq(animes.slug, slug)).limit(1);
    const previous: WikiChanges = {
      title: source?.title,
      titleJapanese: source?.titleJapanese,
      synopsis: source?.synopsis,
      format: source?.format,
      episodes: source?.episodes,
      season: source?.season,
      year: source?.year,
      status: source?.status,
    };
    const [revision] = await db.insert(animeRevisions).values({
      id: crypto.randomUUID(),
      animeId: anime.id,
      editorId: user.id,
      summary,
      snapshotJson: JSON.stringify({ changes, previous }),
    }).returning();
    return Response.json({ revision: { ...revision, editor: user.username, changes, previous } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível enviar a sugestão." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await currentUser(false);
    if (!context) return Response.json({ error: "Entre na sua conta para moderar revisões." }, { status: 401 });
    if (!canModerate(context.user.role)) return Response.json({ error: "Apenas moderadores podem revisar alterações." }, { status: 403 });
    const payload = await request.json() as { revisionId?: string; action?: "approve" | "reject"; note?: string };
    const revisionId = payload.revisionId?.trim() || "";
    if (!revisionId || (payload.action !== "approve" && payload.action !== "reject")) return Response.json({ error: "Ação de moderação inválida." }, { status: 400 });
    const { db, user } = context;
    const [revision] = await db.select().from(animeRevisions).where(eq(animeRevisions.id, revisionId)).limit(1);
    if (!revision) return Response.json({ error: "Revisão não encontrada." }, { status: 404 });
    if (revision.status !== "pending") return Response.json({ error: "Esta revisão já foi analisada." }, { status: 409 });
    const now = new Date().toISOString();

    if (payload.action === "reject") {
      await db.update(animeRevisions).set({ status: "rejected", reviewerId: user.id, reviewNote: payload.note?.trim().slice(0, 500) || "Alteração rejeitada pela moderação.", reviewedAt: now })
        .where(and(eq(animeRevisions.id, revisionId), eq(animeRevisions.status, "pending")));
      return Response.json({ status: "rejected" });
    }

    const changes = parseSnapshot(revision.snapshotJson).changes;
    const animeUpdate: Partial<typeof animes.$inferInsert> = { updatedAt: now };
    if (changes.title !== undefined) animeUpdate.title = changes.title;
    if (changes.titleJapanese !== undefined) animeUpdate.nativeTitle = changes.titleJapanese || null;
    if (changes.synopsis !== undefined) animeUpdate.synopsis = changes.synopsis;
    if (changes.format !== undefined) animeUpdate.format = changes.format;
    if (changes.episodes !== undefined) animeUpdate.episodeCount = changes.episodes;
    if (changes.season !== undefined) animeUpdate.season = changes.season;
    if (changes.year !== undefined) animeUpdate.seasonYear = changes.year;
    if (changes.status !== undefined) animeUpdate.airingStatus = changes.status;
    await db.update(animes).set(animeUpdate).where(eq(animes.id, revision.animeId));
    await db.update(animeRevisions).set({ status: "approved", reviewerId: user.id, reviewNote: payload.note?.trim().slice(0, 500) || null, reviewedAt: now, approvedAt: now })
      .where(and(eq(animeRevisions.id, revisionId), eq(animeRevisions.status, "pending")));
    return Response.json({ status: "approved", changes });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível moderar esta revisão." }, { status: 500 });
  }
}
