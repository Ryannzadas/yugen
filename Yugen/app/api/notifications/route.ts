import { and, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "../../../db";
import { animeReminders, animes, animeRevisions, commentLikes, comments, discussions, follows, users } from "../../../db/schema";
import { getSessionIdentity } from "../../session-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getSessionIdentity();
  if (!identity) return Response.json({ notifications: [] });

  try {
    const db = await getDb();
    const [currentUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, identity.email.toLowerCase())).limit(1);
    if (!currentUser) return Response.json({ notifications: [] });

    const parentComments = alias(comments, "notification_parent_comments");
    const replyAuthors = alias(users, "notification_reply_authors");
    const likedComments = alias(comments, "notification_liked_comments");
    const likeAuthors = alias(users, "notification_like_authors");
    const followerUsers = alias(users, "notification_follower_users");

    const today = `${new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "America/Recife" }).format(new Date())}s`;
    const [replyRows, likeRows, followRows, revisionRows, reminderRows] = await Promise.all([
      db.select({
        id: comments.id,
        actor: replyAuthors.username,
        actorAvatar: replyAuthors.avatarUrl,
        body: comments.body,
        createdAt: comments.createdAt,
        animeSlug: animes.slug,
        animeTitle: animes.title,
      }).from(comments)
        .innerJoin(parentComments, eq(comments.parentId, parentComments.id))
        .innerJoin(replyAuthors, eq(comments.authorId, replyAuthors.id))
        .innerJoin(discussions, eq(comments.discussionId, discussions.id))
        .innerJoin(animes, eq(discussions.animeId, animes.id))
        .where(and(eq(parentComments.authorId, currentUser.id), ne(comments.authorId, currentUser.id), isNull(comments.deletedAt)))
        .orderBy(desc(comments.createdAt))
        .limit(50),
      db.select({
        commentId: commentLikes.commentId,
        actorId: commentLikes.userId,
        actor: likeAuthors.username,
        actorAvatar: likeAuthors.avatarUrl,
        body: likedComments.body,
        createdAt: commentLikes.createdAt,
        animeSlug: animes.slug,
        animeTitle: animes.title,
      }).from(commentLikes)
        .innerJoin(likedComments, eq(commentLikes.commentId, likedComments.id))
        .innerJoin(likeAuthors, eq(commentLikes.userId, likeAuthors.id))
        .innerJoin(discussions, eq(likedComments.discussionId, discussions.id))
        .innerJoin(animes, eq(discussions.animeId, animes.id))
        .where(and(eq(likedComments.authorId, currentUser.id), ne(commentLikes.userId, currentUser.id), isNull(likedComments.deletedAt)))
        .orderBy(desc(commentLikes.createdAt))
        .limit(50),
      db.select({
        actorId: follows.followerId,
        actor: followerUsers.username,
        actorAvatar: followerUsers.avatarUrl,
        createdAt: follows.createdAt,
      }).from(follows)
        .innerJoin(followerUsers, eq(follows.followerId, followerUsers.id))
        .where(and(eq(follows.followingId, currentUser.id), ne(follows.followerId, currentUser.id)))
        .orderBy(desc(follows.createdAt))
        .limit(50),
      db.select({
        id: animeRevisions.id,
        status: animeRevisions.status,
        reviewNote: animeRevisions.reviewNote,
        createdAt: animeRevisions.reviewedAt,
        animeSlug: animes.slug,
        animeTitle: animes.title,
      }).from(animeRevisions)
        .innerJoin(animes, eq(animeRevisions.animeId, animes.id))
        .where(and(eq(animeRevisions.editorId, currentUser.id), ne(animeRevisions.status, "pending"), isNotNull(animeRevisions.reviewedAt)))
        .orderBy(desc(animeRevisions.reviewedAt))
        .limit(50),
      db.select({
        animeId: animes.id,
        animeSlug: animes.slug,
        animeTitle: animes.title,
        broadcastTime: animes.broadcastTime,
      }).from(animeReminders)
        .innerJoin(animes, eq(animeReminders.animeId, animes.id))
        .where(and(eq(animeReminders.userId, currentUser.id), eq(animeReminders.enabled, true), eq(animes.broadcastDay, today)))
        .limit(30),
    ]);

    const notifications = [
      ...replyRows.map((row) => ({
        id: `reply-${row.id}`,
        type: "reply" as const,
        actor: row.actor,
        actorAvatar: row.actorAvatar,
        title: `@${row.actor} respondeu sua publicação`,
        description: row.body,
        createdAt: row.createdAt,
        animeSlug: row.animeSlug,
        animeTitle: row.animeTitle,
      })),
      ...likeRows.map((row) => ({
        id: `like-${row.commentId}-${row.actorId}`,
        type: "like" as const,
        actor: row.actor,
        actorAvatar: row.actorAvatar,
        title: `@${row.actor} curtiu sua publicação`,
        description: row.body,
        createdAt: row.createdAt,
        animeSlug: row.animeSlug,
        animeTitle: row.animeTitle,
      })),
      ...followRows.map((row) => ({
        id: `follow-${row.actorId}`,
        type: "follow" as const,
        actor: row.actor,
        actorAvatar: row.actorAvatar,
        title: `@${row.actor} começou a seguir você`,
        description: "Um novo membro acompanha suas publicações no Yugen.",
        createdAt: row.createdAt,
        animeSlug: null,
        animeTitle: null,
      })),
      ...revisionRows.map((row) => ({
        id: `wiki-${row.id}`,
        type: "wiki" as const,
        actor: "Yugen Wiki",
        actorAvatar: null,
        title: row.status === "approved" ? `Sua edição de ${row.animeTitle} foi aprovada` : `Sua edição de ${row.animeTitle} foi rejeitada`,
        description: row.reviewNote || (row.status === "approved" ? "A correção já está publicada para toda a comunidade." : "Consulte o histórico da Wiki para revisar a decisão."),
        createdAt: row.createdAt!,
        animeSlug: row.animeSlug,
        animeTitle: row.animeTitle,
      })),
      ...reminderRows.map((row) => ({
        id: `reminder-${row.animeId}-${new Date().toISOString().slice(0, 10)}`,
        type: "reminder" as const,
        actor: "Yugen Calendário",
        actorAvatar: null,
        title: `Novo episódio de ${row.animeTitle} é exibido hoje`,
        description: row.broadcastTime ? `Horário informado pela Jikan: ${row.broadcastTime}.` : "O horário ainda não foi informado pela Jikan.",
        createdAt: new Date().toISOString(),
        animeSlug: row.animeSlug,
        animeTitle: row.animeTitle,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);

    return Response.json({ notifications });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar as notificações." }, { status: 500 });
  }
}
