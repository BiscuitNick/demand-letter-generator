import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * User session object with decoded token claims.
 */
export interface UserSession {
  uid: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
  picture: string | undefined;
  claims: Record<string, unknown>;
}

/**
 * Get the current user session from the Firebase ID token cookie.
 * Returns null if no valid session is found.
 *
 * @returns UserSession object or null
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebase-token")?.value;

    if (!token) {
      return null;
    }

    const decodedToken = await getAdminAuth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified ?? false,
      name: decodedToken.name,
      picture: decodedToken.picture,
      claims: decodedToken,
    };
  } catch (error) {
    console.error("Failed to verify user session:", error);
    return null;
  }
}

/**
 * Require authentication for a route or action.
 * Throws an error if no valid session is found.
 *
 * @returns UserSession object
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getUserSession();

  if (!session) {
    throw new Error("Unauthorized: Authentication required");
  }

  return session;
}

/**
 * Higher-order function to wrap Next.js route handlers with authentication.
 * Injects the user session into the handler context.
 *
 * Usage:
 * ```ts
 * export const GET = withUserClaims(async (req, { user }) => {
 *   // Access user.uid, user.email, etc.
 *   return NextResponse.json({ message: `Hello ${user.email}` });
 * });
 * ```
 */
export function withUserClaims<T extends unknown[]>(
  handler: (
    req: Request,
    context: { user: UserSession; params?: Record<string, string> },
    ...args: T
  ) => Promise<Response> | Response
) {
  return async (
    req: Request,
    context: { params?: Record<string, string> },
    ...args: T
  ): Promise<Response> => {
    try {
      const user = await requireAuth();
      return handler(req, { ...context, user }, ...args);
    } catch {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * Useful for API routes that receive the token as a bearer token.
 *
 * @param request - The incoming request
 * @returns DecodedIdToken or null
 */
export async function verifyAuthHeader(
  request: Request
): Promise<DecodedIdToken | null> {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    return decodedToken;
  } catch (error) {
    console.error("Failed to verify authorization header:", error);
    return null;
  }
}

/**
 * Check if a user has a specific custom claim.
 *
 * @param user - UserSession object
 * @param claim - Claim name to check
 * @param value - Optional value to match (if omitted, just checks existence)
 * @returns boolean
 */
export function hasCustomClaim(
  user: UserSession,
  claim: string,
  value?: unknown
): boolean {
  if (!(claim in user.claims)) {
    return false;
  }

  if (value !== undefined) {
    return user.claims[claim] === value;
  }

  return true;
}

/**
 * Require a specific custom claim for a route or action.
 * Throws an error if the claim is not present or doesn't match.
 *
 * @param user - UserSession object
 * @param claim - Claim name to check
 * @param value - Optional value to match
 * @throws Error if claim check fails
 */
export function requireCustomClaim(
  user: UserSession,
  claim: string,
  value?: unknown
): void {
  if (!hasCustomClaim(user, claim, value)) {
    throw new Error(`Forbidden: Required claim '${claim}' not found`);
  }
}
