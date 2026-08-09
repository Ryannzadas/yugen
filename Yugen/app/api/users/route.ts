import { asc, ilike, or, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { users } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 60) || "";
    if (query.length < 2) return Response.json({ profiles: [] });
    const escaped = query.replace(/[\\%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    const db = await getDb();
    const profiles = await db.select({
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    }).from(users).where(or(
      ilike(users.username, pattern),
      ilike(users.displayName, pattern),
    )).orderBy(
      sql`CASE WHEN lower(${users.username}) = lower(${query}) THEN 0 WHEN lower(${users.username}) LIKE lower(${`${escaped}%`}) THEN 1 ELSE 2 END`,
      asc(users.username),
    ).limit(8);
    return Response.json({ profiles }, { headers: { "cache-control": "private, max-age=20" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível pesquisar perfis." }, { status: 500 });
  }
}
