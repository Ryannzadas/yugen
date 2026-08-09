import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "../../../../db";
import { animes, comments, discussions, moderationActions, moderationReports, reviews, users } from "../../../../db/schema";
import { getSessionIdentity } from "../../../session-auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const identity = await getSessionIdentity();
  if (!identity) return { error: Response.json({ error: "Entre na sua conta para acessar a administração." }, { status: 401 }) };
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, identity.email.toLowerCase())).limit(1);
  if (!user || user.role !== "admin") return { error: Response.json({ error: "Este painel é exclusivo para administradores." }, { status: 403 }) };
  return { db, user };
}

function activeSuspension(until?: string | null) {
  return Boolean(until && new Date(until).getTime() > Date.now());
}

export async function GET(request: Request) {
  try {
    const context = await requireAdmin();
    if ("error" in context) return context.error;
    const { db } = context;
    const search = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) || "";

    const reporters = alias(users, "admin_reporters");
    const commentAuthors = alias(users, "admin_comment_authors");
    const reviewAuthors = alias(users, "admin_review_authors");
    const commentAnime = alias(animes, "admin_comment_anime");
    const reviewAnime = alias(animes, "admin_review_anime");
    const actionModerators = alias(users, "admin_action_moderators");

    const [reportRows, userRows, discussionRows, actionRows, openCount, suspendedCount, lockedCount, totalUserCount] = await Promise.all([
      db.select({
        id: moderationReports.id,
        reason: moderationReports.reason,
        status: moderationReports.status,
        resolutionNote: moderationReports.resolutionNote,
        createdAt: moderationReports.createdAt,
        updatedAt: moderationReports.updatedAt,
        reporter: reporters.username,
        reporterDisplayName: reporters.displayName,
        commentId: comments.id,
        commentBody: comments.body,
        commentHiddenAt: comments.hiddenAt,
        commentDeletedAt: comments.deletedAt,
        commentAuthorId: comments.authorId,
        commentAuthor: commentAuthors.username,
        commentAuthorDisplayName: commentAuthors.displayName,
        discussionId: discussions.id,
        discussionLocked: discussions.locked,
        commentAnimeSlug: commentAnime.slug,
        commentAnimeTitle: commentAnime.title,
        reviewId: reviews.id,
        reviewTitle: reviews.title,
        reviewBody: reviews.body,
        reviewHiddenAt: reviews.hiddenAt,
        reviewDeletedAt: reviews.deletedAt,
        reviewAuthorId: reviews.authorId,
        reviewAuthor: reviewAuthors.username,
        reviewAuthorDisplayName: reviewAuthors.displayName,
        reviewAnimeSlug: reviewAnime.slug,
        reviewAnimeTitle: reviewAnime.title,
      }).from(moderationReports)
        .innerJoin(reporters, eq(moderationReports.reporterId, reporters.id))
        .leftJoin(comments, eq(moderationReports.commentId, comments.id))
        .leftJoin(commentAuthors, eq(comments.authorId, commentAuthors.id))
        .leftJoin(discussions, eq(comments.discussionId, discussions.id))
        .leftJoin(commentAnime, eq(discussions.animeId, commentAnime.id))
        .leftJoin(reviews, eq(moderationReports.reviewId, reviews.id))
        .leftJoin(reviewAuthors, eq(reviews.authorId, reviewAuthors.id))
        .leftJoin(reviewAnime, eq(reviews.animeId, reviewAnime.id))
        .orderBy(asc(sql`CASE WHEN ${moderationReports.status} = 'open' THEN 0 WHEN ${moderationReports.status} = 'reviewing' THEN 1 ELSE 2 END`), desc(moderationReports.createdAt))
        .limit(200),
      db.select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
        suspendedAt: users.suspendedAt,
        suspendedUntil: users.suspendedUntil,
        suspensionReason: users.suspensionReason,
        createdAt: users.createdAt,
        comments: sql<number>`(SELECT COUNT(*)::int FROM ${comments} WHERE ${comments.authorId} = ${users.id})`,
        reviews: sql<number>`(SELECT COUNT(*)::int FROM ${reviews} WHERE ${reviews.authorId} = ${users.id})`,
      }).from(users)
        .where(search ? or(ilike(users.username, `%${search}%`), ilike(users.displayName, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(100),
      db.select({
        id: discussions.id,
        title: discussions.title,
        kind: discussions.kind,
        episodeNumber: discussions.episodeNumber,
        locked: discussions.locked,
        pinned: discussions.pinned,
        animeSlug: animes.slug,
        animeTitle: animes.title,
        commentCount: sql<number>`COUNT(${comments.id})::int`,
        updatedAt: discussions.updatedAt,
      }).from(discussions)
        .innerJoin(animes, eq(discussions.animeId, animes.id))
        .leftJoin(comments, and(eq(comments.discussionId, discussions.id), isNull(comments.deletedAt)))
        .groupBy(discussions.id, animes.id)
        .orderBy(desc(discussions.updatedAt))
        .limit(100),
      db.select({
        id: moderationActions.id,
        moderator: actionModerators.username,
        targetType: moderationActions.targetType,
        targetId: moderationActions.targetId,
        action: moderationActions.action,
        note: moderationActions.note,
        createdAt: moderationActions.createdAt,
      }).from(moderationActions)
        .innerJoin(actionModerators, eq(moderationActions.moderatorId, actionModerators.id))
        .orderBy(desc(moderationActions.createdAt))
        .limit(30),
      db.select({ value: sql<number>`COUNT(*)::int` }).from(moderationReports).where(or(eq(moderationReports.status, "open"), eq(moderationReports.status, "reviewing"))),
      db.select({ value: sql<number>`COUNT(*)::int` }).from(users).where(and(isNotNull(users.suspendedUntil), sql`${users.suspendedUntil} > CURRENT_TIMESTAMP`)),
      db.select({ value: sql<number>`COUNT(*)::int` }).from(discussions).where(eq(discussions.locked, true)),
      db.select({ value: sql<number>`COUNT(*)::int` }).from(users),
    ]);

    return Response.json({
      stats: { openReports: openCount[0]?.value || 0, suspendedUsers: suspendedCount[0]?.value || 0, lockedDiscussions: lockedCount[0]?.value || 0, totalUsers: totalUserCount[0]?.value || 0 },
      reports: reportRows.map((row) => ({
        id: row.id,
        reason: row.reason,
        status: row.status,
        resolutionNote: row.resolutionNote,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        reporter: row.reporter,
        reporterDisplayName: row.reporterDisplayName,
        target: row.commentId ? {
          type: "comment" as const,
          id: row.commentId,
          body: row.commentBody,
          hidden: Boolean(row.commentHiddenAt),
          deleted: Boolean(row.commentDeletedAt),
          authorId: row.commentAuthorId,
          author: row.commentAuthor,
          authorDisplayName: row.commentAuthorDisplayName,
          animeSlug: row.commentAnimeSlug,
          animeTitle: row.commentAnimeTitle,
          discussionId: row.discussionId,
          discussionLocked: row.discussionLocked,
        } : {
          type: "review" as const,
          id: row.reviewId,
          title: row.reviewTitle,
          body: row.reviewBody,
          hidden: Boolean(row.reviewHiddenAt),
          deleted: Boolean(row.reviewDeletedAt),
          authorId: row.reviewAuthorId,
          author: row.reviewAuthor,
          authorDisplayName: row.reviewAuthorDisplayName,
          animeSlug: row.reviewAnimeSlug,
          animeTitle: row.reviewAnimeTitle,
        },
      })),
      users: userRows.map((row) => ({ ...row, suspended: activeSuspension(row.suspendedUntil) })),
      discussions: discussionRows,
      actions: actionRows,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar a central administrativa." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAdmin();
    if ("error" in context) return context.error;
    const { db, user } = context;
    const payload = await request.json() as {
      action?: "report_status" | "moderate_comment" | "moderate_review" | "suspend_user" | "unsuspend_user" | "lock_discussion";
      targetId?: string;
      mode?: "hide" | "delete" | "restore";
      status?: "reviewing" | "resolved" | "dismissed";
      locked?: boolean;
      durationDays?: number | null;
      note?: string;
    };
    const targetId = payload.targetId?.trim() || "";
    const note = payload.note?.trim().slice(0, 600) || null;
    if (!targetId || !payload.action) return Response.json({ error: "Ação administrativa inválida." }, { status: 400 });
    const now = new Date().toISOString();
    let auditAction: string = payload.action;
    let targetType: "report" | "comment" | "review" | "user" | "discussion" = "report";

    if (payload.action === "report_status") {
      if (!payload.status) return Response.json({ error: "Escolha o novo status da denúncia." }, { status: 400 });
      await db.update(moderationReports).set({ status: payload.status, resolvedBy: user.id, resolutionNote: note, resolvedAt: payload.status === "reviewing" ? null : now, updatedAt: now }).where(eq(moderationReports.id, targetId));
      auditAction = `report_${payload.status}`;
    } else if (payload.action === "moderate_comment") {
      targetType = "comment";
      if (!payload.mode) return Response.json({ error: "Escolha como moderar o comentário." }, { status: 400 });
      const [comment] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, targetId)).limit(1);
      if (!comment) return Response.json({ error: "Comentário não encontrado." }, { status: 404 });
      await db.update(comments).set(payload.mode === "hide"
        ? { hiddenAt: now, deletedAt: null, moderatedBy: user.id, moderationNote: note }
        : payload.mode === "delete"
          ? { deletedAt: now, hiddenAt: null, moderatedBy: user.id, moderationNote: note }
          : { deletedAt: null, hiddenAt: null, moderatedBy: user.id, moderationNote: note })
        .where(eq(comments.id, targetId));
      if (payload.mode !== "restore") await db.update(moderationReports).set({ status: "resolved", resolvedBy: user.id, resolutionNote: note || `Comentário ${payload.mode === "hide" ? "ocultado" : "excluído"}.`, resolvedAt: now, updatedAt: now }).where(eq(moderationReports.commentId, targetId));
      auditAction = `comment_${payload.mode}`;
    } else if (payload.action === "moderate_review") {
      targetType = "review";
      if (!payload.mode) return Response.json({ error: "Escolha como moderar a avaliação." }, { status: 400 });
      const [review] = await db.select({ id: reviews.id, animeId: reviews.animeId }).from(reviews).where(eq(reviews.id, targetId)).limit(1);
      if (!review) return Response.json({ error: "Avaliação não encontrada." }, { status: 404 });
      await db.update(reviews).set(payload.mode === "hide"
        ? { hiddenAt: now, deletedAt: null, moderatedBy: user.id, moderationNote: note, updatedAt: now }
        : payload.mode === "delete"
          ? { deletedAt: now, hiddenAt: null, moderatedBy: user.id, moderationNote: note, updatedAt: now }
          : { deletedAt: null, hiddenAt: null, moderatedBy: user.id, moderationNote: note, updatedAt: now })
        .where(eq(reviews.id, targetId));
      if (payload.mode !== "restore") await db.update(moderationReports).set({ status: "resolved", resolvedBy: user.id, resolutionNote: note || `Avaliação ${payload.mode === "hide" ? "ocultada" : "excluída"}.`, resolvedAt: now, updatedAt: now }).where(eq(moderationReports.reviewId, targetId));
      const [rating] = await db.select({ average: sql<number>`COALESCE(AVG(${reviews.score}), 0)::float`, count: sql<number>`COUNT(*)::int` }).from(reviews).where(and(eq(reviews.animeId, review.animeId), isNull(reviews.hiddenAt), isNull(reviews.deletedAt)));
      await db.update(animes).set({ averageRating: rating.average, ratingCount: rating.count, updatedAt: now }).where(eq(animes.id, review.animeId));
      auditAction = `review_${payload.mode}`;
    } else if (payload.action === "suspend_user") {
      targetType = "user";
      if (!note || note.length < 5) return Response.json({ error: "Informe o motivo da suspensão usando pelo menos 5 caracteres." }, { status: 400 });
      const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, targetId)).limit(1);
      if (!target) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
      if (target.id === user.id || target.role === "admin") return Response.json({ error: "Outra conta administrativa não pode ser suspensa por este painel." }, { status: 403 });
      const duration = payload.durationDays == null ? null : Math.max(1, Math.min(365, Math.round(payload.durationDays)));
      const suspendedUntil = duration ? new Date(Date.now() + duration * 86_400_000).toISOString() : "2099-12-31T23:59:59.000Z";
      await db.update(users).set({ suspendedAt: now, suspendedUntil, suspensionReason: note, suspendedBy: user.id, updatedAt: now }).where(eq(users.id, targetId));
      auditAction = `user_suspended_${duration ? `${duration}_days` : "permanent"}`;
    } else if (payload.action === "unsuspend_user") {
      targetType = "user";
      await db.update(users).set({ suspendedAt: null, suspendedUntil: null, suspensionReason: null, suspendedBy: null, updatedAt: now }).where(eq(users.id, targetId));
      auditAction = "user_unsuspended";
    } else if (payload.action === "lock_discussion") {
      targetType = "discussion";
      await db.update(discussions).set({ locked: Boolean(payload.locked), updatedAt: now }).where(eq(discussions.id, targetId));
      auditAction = payload.locked ? "discussion_locked" : "discussion_unlocked";
    }

    await db.insert(moderationActions).values({ id: crypto.randomUUID(), moderatorId: user.id, targetType, targetId, action: auditAction, note });
    return Response.json({ success: true, action: auditAction });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível concluir a ação administrativa." }, { status: 500 });
  }
}
