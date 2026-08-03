import { getSessionIdentity } from "../../session-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionIdentity();
  return Response.json({
    user: user ? { displayName: user.displayName, email: user.email } : null,
  });
}
