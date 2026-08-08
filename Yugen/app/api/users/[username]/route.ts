import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { animes, comments, discussions, follows, reviews, userAnimeStatuses, users } from "../../../../db/schema";
import { getSessionIdentity } from "../../../session-auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username: encodedUsername } = await params;
    const username = decodeURIComponent(encodedUsername).replace(/^@/, "");
    const db = await getDb();
    const [profile] = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bannerUrl: users.bannerUrl,
      bio: users.bio,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.username, username)).limit(1);
    if (!profile) return Response.json({ error: "Perfil não encontrado." }, { status: 404 });

    const identity = await getSessionIdentity();
    const [viewer] = identity
      ? await db.select({ id: users.id }).from(users).where(eq(users.email, identity.email.toLowerCase())).limit(1)
      : [];
    const [followerCount, followingCount, followingState, library, recentReviews, recentPosts] = await Promise.all([
      db.select({ value: sql<number>`COUNT(*)::int` }).from(follows).where(eq(follows.followingId, profile.id)),
      db.select({ value: sql<number>`COUNT(*)::int` }).from(follows).where(eq(follows.followerId, profile.id)),
      viewer && viewer.id !== profile.id
        ? db.select({ followerId: follows.followerId }).from(follows).where(and(eq(follows.followerId, viewer.id), eq(follows.followingId, profile.id))).limit(1)
        : Promise.resolve([]),
      db.select({
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
      }).from(userAnimeStatuses).innerJoin(animes, eq(userAnimeStatuses.animeId, animes.id))
        .where(eq(userAnimeStatuses.userId, profile.id)).orderBy(desc(userAnimeStatuses.updatedAt)).limit(60),
      db.select({
        id: reviews.id,
        animeSlug: animes.slug,
        animeTitle: animes.title,
        title: reviews.title,
        body: reviews.body,
        score: reviews.score,
        spoiler: reviews.spoiler,
        helpfulCount: reviews.helpfulCount,
        createdAt: reviews.createdAt,
      }).from(reviews).innerJoin(animes, eq(reviews.animeId, animes.id))
        .where(eq(reviews.authorId, profile.id)).orderBy(desc(reviews.createdAt)).limit(10),
      db.select({
        id: comments.id,
        body: comments.body,
        createdAt: comments.createdAt,
        likeCount: comments.likeCount,
        animeSlug: animes.slug,
        animeTitle: animes.title,
        episodeNumber: discussions.episodeNumber,
      }).from(comments).innerJoin(discussions, eq(comments.discussionId, discussions.id)).innerJoin(animes, eq(discussions.animeId, animes.id))
        .where(and(eq(comments.authorId, profile.id), isNull(comments.parentId), isNull(comments.deletedAt)))
        .orderBy(desc(comments.createdAt)).limit(10),
    ]);

    const { id, ...publicProfile } = profile;
    return Response.json({
      profile: publicProfile,
      followerCount: followerCount[0]?.value ?? 0,
      followingCount: followingCount[0]?.value ?? 0,
      isFollowing: followingState.length > 0,
      isSelf: viewer?.id === id,
      library,
      reviews: recentReviews,
      posts: recentPosts,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar o perfil." }, { status: 500 });
  }
}
