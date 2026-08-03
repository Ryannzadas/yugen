import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "../../../db";
import { animes, commentLikes, comments, discussions, follows, users } from "../../../db/schema";
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

    const [replyRows, likeRows, followRows] = await Promise.all([
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
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);

    return Response.json({ notifications });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar as notificações." }, { status: 500 });
  }
}
