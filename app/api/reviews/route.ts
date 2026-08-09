import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { animes, moderationReports, reviewHelpfulVotes, reviews, users } from "../../../db/schema";
import { getSessionIdentity } from "../../session-auth";

export const dynamic = "force-dynamic";

type AnimePayload = {
  slug?: string;
  title?: string;
  image?: string | null;
  episodes?: number | null;
  year?: number | null;
  format?: string;
  season?: string;
  status?: string;
};

async function getCurrentUser(create = false) {
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

const reviewSelection = {
  id: reviews.id,
  author: users.username,
  authorDisplayName: users.displayName,
  authorAvatar: users.avatarUrl,
  title: reviews.title,
  body: reviews.body,
  score: reviews.score,
  spoiler: reviews.spoiler,
  helpfulCount: reviews.helpfulCount,
  createdAt: reviews.createdAt,
  updatedAt: reviews.updatedAt,
};

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("anime")?.trim() || "";
    if (!slug) return Response.json({ error: "Anime inválido." }, { status: 400 });
    const db = await getDb();
    const rows = await db.select(reviewSelection).from(reviews)
      .innerJoin(animes, eq(reviews.animeId, animes.id))
      .innerJoin(users, eq(reviews.authorId, users.id))
      .where(and(eq(animes.slug, slug), isNull(reviews.hiddenAt), isNull(reviews.deletedAt)))
      .orderBy(desc(reviews.helpfulCount), desc(reviews.createdAt))
      .limit(100);

    const current = await getCurrentUser(false);
    const helpfulIds = current && rows.length
      ? (await current.db.select({ reviewId: reviewHelpfulVotes.reviewId }).from(reviewHelpfulVotes)
          .where(and(eq(reviewHelpfulVotes.userId, current.user.id), inArray(reviewHelpfulVotes.reviewId, rows.map((row) => row.id)))))
          .map((row) => row.reviewId)
      : [];
    const helpfulSet = new Set(helpfulIds);
    return Response.json({ reviews: rows.map((row) => ({ ...row, helpfulByViewer: helpfulSet.has(row.id) })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar as avaliações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentUser(true);
    if (!context) return Response.json({ error: "Entre na sua conta para publicar uma avaliação." }, { status: 401 });
    const payload = await request.json() as { anime?: AnimePayload; title?: string; body?: string; score?: number; spoiler?: boolean };
    const source = payload.anime;
    const slug = source?.slug?.trim() || "";
    const animeTitle = source?.title?.trim() || "";
    const body = payload.body?.trim() || "";
    const title = payload.title?.trim() || `Minha avaliação de ${animeTitle}`;
    const score = Math.round(Number(payload.score));
    if (!slug || !animeTitle) return Response.json({ error: "Anime inválido." }, { status: 400 });
    if (body.length < 20 || body.length > 4000) return Response.json({ error: "A avaliação deve ter entre 20 e 4.000 caracteres." }, { status: 400 });
    if (title.length < 3 || title.length > 120) return Response.json({ error: "O título deve ter entre 3 e 120 caracteres." }, { status: 400 });
    if (!Number.isFinite(score) || score < 1 || score > 10) return Response.json({ error: "Escolha uma nota de 1 a 10." }, { status: 400 });

    const { db, user } = context;
    if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now()) {
      return Response.json({ error: `Sua participação na comunidade está suspensa até ${new Date(user.suspendedUntil).toLocaleString("pt-BR")}. Motivo: ${user.suspensionReason || "decisão da moderação"}.` }, { status: 403 });
    }
    await db.insert(animes).values({
      id: crypto.randomUUID(),
      slug,
      title: animeTitle,
      synopsis: "Sinopse não disponível.",
      format: source?.format || "TV",
      episodeCount: source?.episodes ?? null,
      season: source?.season || null,
      seasonYear: source?.year ?? null,
      airingStatus: source?.status || "unknown",
      posterUrl: source?.image || null,
    }).onConflictDoUpdate({
      target: animes.slug,
      set: {
        title: animeTitle,
        format: source?.format || "TV",
        episodeCount: source?.episodes ?? null,
        season: source?.season || null,
        seasonYear: source?.year ?? null,
        airingStatus: source?.status || "unknown",
        posterUrl: source?.image || null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
    const [anime] = await db.select().from(animes).where(eq(animes.slug, slug)).limit(1);
    const [saved] = await db.insert(reviews).values({
      id: crypto.randomUUID(),
      animeId: anime.id,
      authorId: user.id,
      title,
      body,
      score,
      spoiler: Boolean(payload.spoiler),
    }).onConflictDoUpdate({
      target: [reviews.authorId, reviews.animeId],
      set: { title, body, score, spoiler: Boolean(payload.spoiler), updatedAt: sql`CURRENT_TIMESTAMP` },
    }).returning();

    const [rating] = await db.select({ average: sql<number>`COALESCE(AVG(${reviews.score}), 0)::float`, count: sql<number>`COUNT(*)::int` })
      .from(reviews).where(and(eq(reviews.animeId, anime.id), isNull(reviews.hiddenAt), isNull(reviews.deletedAt)));
    await db.update(animes).set({ averageRating: rating.average, ratingCount: rating.count, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(animes.id, anime.id));

    return Response.json({ review: { ...saved, author: user.username, authorDisplayName: user.displayName, authorAvatar: user.avatarUrl, helpfulByViewer: false } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível publicar a avaliação." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getCurrentUser(true);
    if (!context) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
    const payload = await request.json() as { reviewId?: string; action?: "helpful" | "report"; reason?: string };
    const reviewId = payload.reviewId?.trim() || "";
    if (!reviewId) return Response.json({ error: "Avaliação inválida." }, { status: 400 });
    const { db, user } = context;
    const [review] = await db.select({ id: reviews.id, authorId: reviews.authorId }).from(reviews).where(eq(reviews.id, reviewId)).limit(1);
    if (!review) return Response.json({ error: "Avaliação não encontrada." }, { status: 404 });

    if (payload.action === "helpful") {
      if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now()) return Response.json({ error: "Sua participação na comunidade está temporariamente suspensa." }, { status: 403 });
      if (review.authorId === user.id) return Response.json({ error: "Você não pode votar na própria avaliação." }, { status: 400 });
      const [existing] = await db.select().from(reviewHelpfulVotes).where(and(eq(reviewHelpfulVotes.reviewId, reviewId), eq(reviewHelpfulVotes.userId, user.id))).limit(1);
      if (existing) {
        await db.delete(reviewHelpfulVotes).where(and(eq(reviewHelpfulVotes.reviewId, reviewId), eq(reviewHelpfulVotes.userId, user.id)));
        const [updated] = await db.update(reviews).set({ helpfulCount: sql`GREATEST(${reviews.helpfulCount} - 1, 0)` }).where(eq(reviews.id, reviewId)).returning({ helpfulCount: reviews.helpfulCount });
        return Response.json({ helpful: false, helpfulCount: updated?.helpfulCount ?? 0 });
      }
      await db.insert(reviewHelpfulVotes).values({ reviewId, userId: user.id }).onConflictDoNothing();
      const [updated] = await db.update(reviews).set({ helpfulCount: sql`${reviews.helpfulCount} + 1` }).where(eq(reviews.id, reviewId)).returning({ helpfulCount: reviews.helpfulCount });
      return Response.json({ helpful: true, helpfulCount: updated?.helpfulCount ?? 1 });
    }

    if (payload.action === "report") {
      const [existingReport] = await db.select({ id: moderationReports.id }).from(moderationReports)
        .where(and(eq(moderationReports.reporterId, user.id), eq(moderationReports.reviewId, reviewId), inArray(moderationReports.status, ["open", "reviewing"]))).limit(1);
      if (existingReport) return Response.json({ reported: true, existing: true });
      await db.insert(moderationReports).values({
        id: crypto.randomUUID(),
        reporterId: user.id,
        reviewId,
        reason: payload.reason?.trim() || "Avaliação denunciada pela comunidade.",
      });
      return Response.json({ reported: true });
    }
    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível concluir a ação." }, { status: 500 });
  }
}
