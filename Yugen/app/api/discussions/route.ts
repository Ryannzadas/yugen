import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { animes, comments, discussions, users } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function readableSlug(slug: string) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("anime")?.trim();
    if (!slug) return Response.json({ error: "anime is required" }, { status: 400 });

    const db = await getDb();
    const rows = await db.select({
      id: comments.id,
      author: users.username,
      body: comments.body,
      createdAt: comments.createdAt,
      likeCount: comments.likeCount,
      parentId: comments.parentId,
    }).from(comments)
      .innerJoin(discussions, eq(comments.discussionId, discussions.id))
      .innerJoin(animes, eq(discussions.animeId, animes.id))
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(and(eq(animes.slug, slug), isNull(comments.deletedAt)))
      .orderBy(asc(comments.createdAt))
      .limit(100);

    return Response.json({ comments: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load discussion" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getChatGPTUser();
    if (!identity) return Response.json({ error: "Sign in with ChatGPT to join the discussion." }, { status: 401 });

    const payload = await request.json() as { animeSlug?: string; body?: string; parentId?: string | null };
    const animeSlug = payload.animeSlug?.trim() ?? "";
    const body = payload.body?.trim() ?? "";
    if (!animeSlug || !body) return Response.json({ error: "animeSlug and body are required" }, { status: 400 });
    if (body.length > 4000) return Response.json({ error: "Comments are limited to 4,000 characters." }, { status: 400 });

    const db = await getDb();
    const email = identity.email.toLowerCase();
    const baseUsername = email.split("@")[0].replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || "member";
    await db.insert(users).values({ id: crypto.randomUUID(), email, username: `${baseUsername}-${email.length}`, displayName: identity.displayName }).onConflictDoNothing({ target: users.email });
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    await db.insert(animes).values({ id: crypto.randomUUID(), slug: animeSlug, title: readableSlug(animeSlug), synopsis: "Community indexed anime." }).onConflictDoNothing({ target: animes.slug });
    const [anime] = await db.select().from(animes).where(eq(animes.slug, animeSlug)).limit(1);

    let [thread] = await db.select().from(discussions).where(and(eq(discussions.animeId, anime.id), eq(discussions.kind, "general"))).limit(1);
    if (!thread) {
      const [created] = await db.insert(discussions).values({ id: crypto.randomUUID(), animeId: anime.id, authorId: user.id, title: "General discussion", kind: "general" }).returning();
      thread = created;
    }

    const [createdComment] = await db.insert(comments).values({ id: crypto.randomUUID(), discussionId: thread.id, authorId: user.id, parentId: payload.parentId ?? null, body }).returning();
    return Response.json({ comment: { id: createdComment.id, author: user.username, body: createdComment.body, createdAt: "just now", likeCount: 0, parentId: createdComment.parentId } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to post comment" }, { status: 500 });
  }
}
