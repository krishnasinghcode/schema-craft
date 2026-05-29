import { cookies } from "next/headers";
import { verifyJwt, AUTH_COOKIE, type JwtPayload } from "@/lib/auth";

/**
 * Call this at the top of any API route that needs authentication.
 * Returns the user payload if logged in, or null if not.
 *
 * Usage:
 *   const user = await getCurrentUser();
 *   if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
 */
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) return null;

  return verifyJwt(token);
}
