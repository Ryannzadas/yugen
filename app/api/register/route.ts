import { hash } from "bcryptjs";
import { or, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { users } from "../../../db/schema";

type RegistrationPayload = {
  email?: string;
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json() as RegistrationPayload;
    const email = payload.email?.trim().toLowerCase() || "";
    const username = payload.username?.trim().toLowerCase() || "";
    const password = payload.password || "";

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: "Informe um email válido." }, { status: 400 });
    }
    if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
      return Response.json({ error: "O nome de usuário deve ter de 3 a 24 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado." }, { status: 400 });
    }
    if (password.length < 12) {
      return Response.json({ error: "A senha precisa ter pelo menos 12 caracteres." }, { status: 400 });
    }

    const db = await getDb();
    const [existing] = await db.select({ email: users.email, username: users.username })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);
    if (existing) {
      const field = existing.email === email ? "email" : "nome de usuário";
      return Response.json({ error: `Este ${field} já está em uso.` }, { status: 409 });
    }

    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      username,
      displayName: username,
      passwordHash: await hash(password, 12),
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível criar a conta." }, { status: 500 });
  }
}
