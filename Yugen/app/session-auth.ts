import { redirect } from "next/navigation";
import { auth } from "../auth";

export type SessionIdentity = {
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getSessionIdentity(): Promise<SessionIdentity | null> {
  const session = await auth();
  const email = session?.user?.email?.trim();
  if (!email) return null;
  const fullName = session?.user.name?.trim() || null;
  return {
    displayName: fullName || email,
    email,
    fullName,
  };
}

export async function requireSessionIdentity(returnTo: string): Promise<SessionIdentity> {
  const user = await getSessionIdentity();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `/api/auth/signin?callbackUrl=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function signOutPath(returnTo = "/"): string {
  return `/api/auth/signout?callbackUrl=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
