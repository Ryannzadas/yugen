import { put } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { getSessionIdentity } from "../../../session-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxFileSize = 5 * 1024 * 1024;

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "image";
}

export async function POST(request: Request) {
  try {
    const identity = await getSessionIdentity();
    if (!identity) return Response.json({ error: "Entre na sua conta para alterar o perfil." }, { status: 401 });

    const form = await request.formData();
    const type = form.get("type");
    const file = form.get("file");
    if (type !== "avatar" && type !== "banner") return Response.json({ error: "Tipo de imagem inválido." }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Escolha uma imagem." }, { status: 400 });
    if (!acceptedTypes.has(file.type)) return Response.json({ error: "Use uma imagem JPG, PNG, WebP ou GIF." }, { status: 400 });
    if (file.size > maxFileSize) return Response.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 400 });

    const db = await getDb();
    const email = identity.email.toLowerCase();
    const baseUsername = email.split("@")[0].replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || "member";
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      username: `${baseUsername}-${email.length}`,
      displayName: identity.displayName,
    }).onConflictDoNothing({ target: users.email });

    const blob = await put(
      `profiles/${encodeURIComponent(email)}/${type}-${Date.now()}-${safeFileName(file.name)}`,
      file,
      { access: "public", addRandomSuffix: true },
    );

    if (type === "avatar") {
      await db.update(users).set({ avatarUrl: blob.url, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(users.email, email));
    } else {
      await db.update(users).set({ bannerUrl: blob.url, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(users.email, email));
    }

    return Response.json({ type, url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar a imagem.";
    if (/BLOB_READ_WRITE_TOKEN|No token found/i.test(message)) {
      return Response.json({ error: "O armazenamento de imagens ainda não foi conectado ao projeto no Vercel." }, { status: 503 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
