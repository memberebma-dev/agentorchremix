import { createClient } from "@blinkdotnew/sdk";

/**
 * Verifies the caller's Blink access token server-side and returns their real
 * userId — never trust a client-supplied userId field in a request body, since
 * any client could edit it to claim someone else's account. This is the only
 * thing standing between "each user sees only their own data" and the
 * cross-account leak this was built to fix, so every route that touches
 * tenant data must call this before doing anything else.
 */
export async function requireUserId(env: Record<string, string>, authHeader: string | null): Promise<string> {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const result = await blink.auth.verifyToken(authHeader);
  if (!result.valid || !result.userId) {
    throw new Error(result.error || "Unauthorized: invalid or missing session token");
  }
  return result.userId;
}

// Affiliates/subscribers represent AgentOrch's OWN business (who refers/pays for the
// platform itself), not any tenant's pipeline data — there's no real admin-role system
// yet, so this is a placeholder gate until one exists. Keep in sync with
// isPlatformOwner in src/lib/auth.ts on the frontend.
const OWNER_EMAIL = "memberebma@gmail.com";

export async function requireOwner(env: Record<string, string>, authHeader: string | null): Promise<string> {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const result = await blink.auth.verifyToken(authHeader);
  if (!result.valid || !result.userId) {
    throw new Error(result.error || "Unauthorized: invalid or missing session token");
  }
  if ((result.email || "").toLowerCase() !== OWNER_EMAIL) {
    throw new Error("Forbidden: this data belongs to the platform owner, not your account");
  }
  return result.userId;
}
