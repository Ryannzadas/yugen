import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { animes, commentLikes, comments, discussions, moderationReports, users } from "../../../db/schema";
import { getSessionIdentity } from "../../session-auth";

function readableSlug(slug: string) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

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

const commentSelection = {
  id: comments.id,
  author: users.username,
  authorAvatar: users.avatarUrl,
  body: comments.body,
  createdAt: comments.createdAt,
  likeCount: comments.likeCount,
  parentId: comments.parentId,
  animeSlug: animes.slug,
  animeTitle: animes.title,
  animePoster: animes.posterUrl,
};

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("anime")?.trim();
    const db = await getDb();
    const base = db.select(commentSelection).from(comments)
      .innerJoin(discussions, eq(comments.discussionId, discussions.id))
      .innerJoin(animes, eq(discussions.animeId, animes.id))
      .innerJoin(users, eq(comments.authorId, users.id));

    const rows = slug
      ? await base.where(and(eq(animes.slug, slug), isNull(comments.deletedAt))).orderBy(asc(comments.createdAt)).limit(200)
      : await base.where(isNull(comments.deletedAt)).orderBy(desc(comments.createdAt)).limit(100);

    return Response.json({ comments: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar as discussões." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOrCreateUser();
    if (!context) return Response.json({ error: "Entre na sua conta para participar da discussão." }, { status: 401 });

    const payload = await request.json() as { animeSlug?: string; animeTitle?: string; animePoster?: string | null; body?: string; parentId?: string | null };
    const animeSlug = payload.animeSlug?.trim() ?? "";
    const body = payload.body?.trim() ?? "";
    if (!animeSlug || !body) return Response.json({ error: "Escolha um anime e escreva uma mensagem." }, { status: 400 });
    if (body.length > 4000) return Response.json({ error: "Os comentários podem ter no máximo 4.000 caracteres." }, { status: 400 });

    const { db, user } = context;
    const animeTitle = payload.animeTitle?.trim() || readableSlug(animeSlug);
    await db.insert(animes).values({
      id: crypto.randomUUID(),
      slug: animeSlug,
      title: animeTitle,
      synopsis: "Dados sincronizados da Jikan.",
      posterUrl: payload.animePoster || null,
    }).onConflictDoUpdate({
      target: animes.slug,
      set: { title: animeTitle, posterUrl: payload.animePoster || null, updatedAt: sql`CURRENT_TIMESTAMP` },
    });
    const [anime] = await db.select().from(animes).where(eq(animes.slug, animeSlug)).limit(1);

    let [thread] = await db.select().from(discussions).where(and(eq(discussions.animeId, anime.id), eq(discussions.kind, "general"))).limit(1);
    if (!thread) {
      const [created] = await db.insert(discussions).values({ id: crypto.randomUUID(), animeId: anime.id, authorId: user.id, title: `Discussão sobre ${animeTitle}`, kind: "general" }).returning();
      thread = created;
    }

    if (payload.parentId) {
      const [parent] = await db.select({ id: comments.id, discussionId: comments.discussionId }).from(comments).where(eq(comments.id, payload.parentId)).limit(1);
      if (!parent || parent.discussionId !== thread.id) return Response.json({ error: "O comentário respondido não pertence a esta discussão." }, { status: 400 });
    }

    const [createdComment] = await db.insert(comments).values({ id: crypto.randomUUID(), discussionId: thread.id, authorId: user.id, parentId: payload.parentId ?? null, body }).returning();
    return Response.json({
      comment: {
        id: createdComment.id,
        author: user.username,
        authorAvatar: user.avatarUrl,
        body: createdComment.body,
        createdAt: createdComment.createdAt,
        likeCount: 0,
        parentId: createdComment.parentId,
        animeSlug: anime.slug,
        animeTitle: anime.title,
        animePoster: anime.posterUrl,
      },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível publicar o comentário." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getOrCreateUser();
    if (!context) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
    const payload = await request.json() as { commentId?: string; action?: "like" | "report"; reason?: string };
    const commentId = payload.commentId?.trim() || "";
    if (!commentId) return Response.json({ error: "Comentário inválido." }, { status: 400 });
    const { db, user } = context;

    if (payload.action === "like") {
      const [existing] = await db.select().from(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, user.id))).limit(1);
      if (existing) {
        await db.delete(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, user.id)));
        const [updated] = await db.update(comments).set({ likeCount: sql`GREATEST(${comments.likeCount} - 1, 0)` }).where(eq(comments.id, commentId)).returning({ likeCount: comments.likeCount });
        return Response.json({ liked: false, likeCount: updated?.likeCount ?? 0 });
      }
      await db.insert(commentLikes).values({ commentId, userId: user.id }).onConflictDoNothing();
      const [updated] = await db.update(comments).set({ likeCount: sql`${comments.likeCount} + 1` }).where(eq(comments.id, commentId)).returning({ likeCount: comments.likeCount });
      return Response.json({ liked: true, likeCount: updated?.likeCount ?? 1 });
    }

    if (payload.action === "report") {
      await db.insert(moderationReports).values({
        id: crypto.randomUUID(),
        reporterId: user.id,
        commentId,
        reason: payload.reason?.trim() || "Conteúdo denunciado pela comunidade.",
      });
      return Response.json({ reported: true });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível concluir a ação." }, { status: 500 });
  }
}
