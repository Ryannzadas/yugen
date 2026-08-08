import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { follows, users } from "../../../db/schema";
import { getSessionIdentity } from "../../session-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const identity = await getSessionIdentity();
    if (!identity) return Response.json({ error: "Entre na sua conta para seguir pessoas." }, { status: 401 });
    const username = ((await request.json()) as { username?: string }).username?.trim().replace(/^@/, "") || "";
    if (!username) return Response.json({ error: "Usuário inválido." }, { status: 400 });
    const db = await getDb();
    const [current] = await db.select().from(users).where(eq(users.email, identity.email.toLowerCase())).limit(1);
    const [target] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!current) return Response.json({ error: "Perfil da conta não encontrado." }, { status: 404 });
    if (!target) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (current.id === target.id) return Response.json({ error: "Você não pode seguir o próprio perfil." }, { status: 400 });
    const condition = and(eq(follows.followerId, current.id), eq(follows.followingId, target.id));
    const [existing] = await db.select().from(follows).where(condition).limit(1);
    if (existing) await db.delete(follows).where(condition);
    else await db.insert(follows).values({ followerId: current.id, followingId: target.id }).onConflictDoNothing();
    const [count] = await db.select({ value: sql<number>`COUNT(*)::int` }).from(follows).where(eq(follows.followingId, target.id));
    return Response.json({ following: !existing, followerCount: count.value });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar essa relação." }, { status: 500 });
  }
}
