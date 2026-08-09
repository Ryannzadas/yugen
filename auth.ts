import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getDb } from "./db";
import { users } from "./db/schema";

function oauthUsername(email: string) {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 20) || "membro";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email e senha",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials) {
      const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const db = await getDb();
      const [account] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!account?.passwordHash || !(await compare(password, account.passwordHash))) return null;

      return {
        id: account.id,
        email: account.email,
        name: account.displayName || account.username,
        image: account.avatarUrl,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) providers.push(Apple);

export const authConfig: NextAuthConfig = {
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      if (account?.provider === "credentials") return true;

      const db = await getDb();
      const email = user.email.toLowerCase();
      await db.insert(users).values({
        id: crypto.randomUUID(),
        email,
        username: oauthUsername(email),
        displayName: user.name || email.split("@")[0],
        avatarUrl: user.image,
      }).onConflictDoNothing({ target: users.email });
      const [accountUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!accountUser) return false;
      user.id = accountUser.id;
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.userId === "string") session.user.id = token.userId;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
