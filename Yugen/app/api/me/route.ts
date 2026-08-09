import { getSessionIdentity } from "../../session-auth";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { users } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getSessionIdentity();
  if (!identity) return Response.json({ user: null });

  try {
    const db = await getDb();
    const [profile] = await db.select({
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      bannerUrl: users.bannerUrl,
      bio: users.bio,
      role: users.role,
      suspendedUntil: users.suspendedUntil,
      suspensionReason: users.suspensionReason,
    }).from(users).where(eq(users.email, identity.email.toLowerCase())).limit(1);

    return Response.json({
      user: profile ? {
        ...profile,
        displayName: profile.displayName || profile.username,
        suspended: Boolean(profile.suspendedUntil && new Date(profile.suspendedUntil).getTime() > Date.now()),
      } : {
        displayName: identity.displayName,
        email: identity.email,
        username: identity.email.split("@")[0],
        avatarUrl: null,
        bannerUrl: null,
        bio: "",
        role: "member",
        suspendedUntil: null,
        suspensionReason: null,
        suspended: false,
      },
    });
  } catch {
    return Response.json({
      user: {
        displayName: identity.displayName,
        email: identity.email,
        username: identity.email.split("@")[0],
        avatarUrl: null,
        bannerUrl: null,
        bio: "",
        role: "member",
        suspendedUntil: null,
        suspensionReason: null,
        suspended: false,
      },
    });
  }
}
