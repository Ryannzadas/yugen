import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { animes, collectionCollaborators, collectionItems, collections, users } from "../../../db/schema";
import { getSessionIdentity } from "../../session-auth";

export const dynamic = "force-dynamic";

type CollectionAnimePayload = {
  slug?: string;
  title?: string;
  image?: string | null;
  episodes?: number | null;
  year?: number | null;
  format?: string;
  season?: string;
  status?: string;
};

type CollectionPayload = {
  action?: "create" | "add_item";
  title?: string;
  description?: string;
  privacy?: "public" | "private" | "unlisted";
  collaboratorUsername?: string;
  collectionId?: string;
  anime?: CollectionAnimePayload;
};

async function getViewer(create = false) {
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

export async function GET() {
  try {
    const db = await getDb();
    const viewer = await getViewer(false);
    const collaboratorRows = viewer
      ? await db.select({ collectionId: collectionCollaborators.collectionId }).from(collectionCollaborators).where(eq(collectionCollaborators.userId, viewer.user.id))
      : [];
    const collaboratorIds = collaboratorRows.map((row) => row.collectionId);
    const visibility = viewer
      ? collaboratorIds.length
        ? or(eq(collections.privacy, "public"), eq(collections.ownerId, viewer.user.id), inArray(collections.id, collaboratorIds))!
        : or(eq(collections.privacy, "public"), eq(collections.ownerId, viewer.user.id))!
      : eq(collections.privacy, "public");

    const rows = await db.select({
      id: collections.id,
      ownerId: collections.ownerId,
      title: collections.title,
      description: collections.description,
      privacy: collections.privacy,
      createdAt: collections.createdAt,
      ownerUsername: users.username,
      ownerDisplayName: users.displayName,
    }).from(collections)
      .innerJoin(users, eq(collections.ownerId, users.id))
      .where(visibility)
      .orderBy(desc(collections.createdAt))
      .limit(100);

    const collectionIds = rows.map((row) => row.id);
    if (!collectionIds.length) return Response.json({ collections: [] });

    const itemRows = await db.select({
      collectionId: collectionItems.collectionId,
      position: collectionItems.position,
      slug: animes.slug,
      title: animes.title,
      image: animes.posterUrl,
      episodes: animes.episodeCount,
      year: animes.seasonYear,
      format: animes.format,
      season: animes.season,
      status: animes.airingStatus,
      rating: animes.averageRating,
    }).from(collectionItems)
      .innerJoin(animes, eq(collectionItems.animeId, animes.id))
      .where(inArray(collectionItems.collectionId, collectionIds));

    const collaboratorUsers = await db.select({
      collectionId: collectionCollaborators.collectionId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    }).from(collectionCollaborators)
      .innerJoin(users, eq(collectionCollaborators.userId, users.id))
      .where(inArray(collectionCollaborators.collectionId, collectionIds));

    return Response.json({
      collections: rows.map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        privacy: collection.privacy,
        createdAt: collection.createdAt,
        owner: { username: collection.ownerUsername, displayName: collection.ownerDisplayName },
        items: itemRows.filter((item) => item.collectionId === collection.id).sort((a, b) => a.position - b.position).map((item) => ({ slug: item.slug, title: item.title, image: item.image, episodes: item.episodes, year: item.year, format: item.format, season: item.season, status: item.status, rating: item.rating })),
        collaborators: collaboratorUsers.filter((item) => item.collectionId === collection.id).map((item) => ({ username: item.username, displayName: item.displayName, avatarUrl: item.avatarUrl })),
        canEdit: Boolean(viewer && (collection.ownerId === viewer.user.id || collaboratorIds.includes(collection.id))),
      })),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar as coleções." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getViewer(true);
    if (!context) return Response.json({ error: "Entre na sua conta para editar coleções." }, { status: 401 });
    const payload = await request.json() as CollectionPayload;
    const { db, user } = context;
    if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now()) return Response.json({ error: "Sua participação na comunidade está temporariamente suspensa." }, { status: 403 });

    if (payload.action === "create") {
      const title = payload.title?.trim() || "";
      const description = payload.description?.trim() || "";
      const privacy = payload.privacy || "public";
      if (title.length < 3 || title.length > 90) return Response.json({ error: "O título precisa ter entre 3 e 90 caracteres." }, { status: 400 });
      if (description.length > 500) return Response.json({ error: "A descrição pode ter no máximo 500 caracteres." }, { status: 400 });

      const [created] = await db.insert(collections).values({
        id: crypto.randomUUID(),
        ownerId: user.id,
        title,
        description,
        privacy,
      }).returning();

      const collaboratorUsername = payload.collaboratorUsername?.trim().replace(/^@/, "").toLowerCase();
      if (collaboratorUsername) {
        const [collaborator] = await db.select().from(users).where(sql`lower(${users.username}) = ${collaboratorUsername}`).limit(1);
        if (!collaborator) {
          await db.delete(collections).where(eq(collections.id, created.id));
          return Response.json({ error: `O usuário @${collaboratorUsername} ainda não existe no Yugen.` }, { status: 400 });
        }
        if (collaborator.id !== user.id) {
          await db.insert(collectionCollaborators).values({ collectionId: created.id, userId: collaborator.id }).onConflictDoNothing();
        }
      }

      return Response.json({ collection: { id: created.id, title: created.title } }, { status: 201 });
    }

    if (payload.action === "add_item") {
      const collectionId = payload.collectionId?.trim() || "";
      const source = payload.anime;
      const slug = source?.slug?.trim() || "";
      const title = source?.title?.trim() || "";
      if (!collectionId || !slug || !title) return Response.json({ error: "Coleção ou anime inválido." }, { status: 400 });

      const [collection] = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1);
      if (!collection) return Response.json({ error: "Coleção não encontrada." }, { status: 404 });
      const [collaboration] = await db.select().from(collectionCollaborators)
        .where(sql`${collectionCollaborators.collectionId} = ${collectionId} and ${collectionCollaborators.userId} = ${user.id}`)
        .limit(1);
      if (collection.ownerId !== user.id && !collaboration) return Response.json({ error: "Você não pode editar esta coleção." }, { status: 403 });

      await db.insert(animes).values({
        id: crypto.randomUUID(),
        slug,
        title,
        synopsis: "Sinopse não disponível.",
        format: source?.format || "TV",
        episodeCount: source?.episodes ?? null,
        season: source?.season || null,
        seasonYear: source?.year ?? null,
        airingStatus: source?.status || "unknown",
        posterUrl: source?.image || null,
      }).onConflictDoUpdate({
        target: animes.slug,
        set: { title, posterUrl: source?.image || null, updatedAt: sql`CURRENT_TIMESTAMP` },
      });
      const [anime] = await db.select().from(animes).where(eq(animes.slug, slug)).limit(1);
      const [count] = await db.select({ value: sql<number>`count(*)::int` }).from(collectionItems).where(eq(collectionItems.collectionId, collectionId));
      await db.insert(collectionItems).values({ collectionId, animeId: anime.id, position: count?.value || 0 }).onConflictDoNothing();
      return Response.json({ added: true, collectionId, animeSlug: slug });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar a coleção." }, { status: 500 });
  }
}
