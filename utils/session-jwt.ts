/**
 * JWT-based session management for BookWorm
 * Works with FlashApps Auth Service tokens
 */

import { verifyToken, refreshToken as refreshAuthToken, AUTH_SERVICE_URL } from "./auth-client.ts";
import { getKv } from "./db.ts";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  username: string;
  schoolId: string | null;
  verified: boolean;
  role: "teacher" | "parent" | "delegate" | "school_admin" | "super_admin";
  delegatedToUserIds: string[];
  googleBooksApiKey: string | null;
  googleSheetUrl: string | null;
  isPlaceholder: boolean;
  createdAt: string;
}

/**
 * Get user from JWT token (with caching)
 */
export async function getUserFromToken(req: Request): Promise<SessionUser | null> {
  // Extract token from cookies
  const cookies = req.headers.get("cookie");
  let token = "";
  let refreshToken = "";

  if (cookies) {
    const authCookie = cookies.split("; ").find((c) => c.startsWith("auth_token="));
    const refreshCookie = cookies.split("; ").find((c) => c.startsWith("refresh_token="));

    if (authCookie) {
      token = authCookie.split("=")[1];
    }
    if (refreshCookie) {
      refreshToken = refreshCookie.split("=")[1];
    }
  }

  if (!token) {
    return null;
  }

  try {
    // Try to get from cache first
    const kv = await getKv();

    // Quick cache check (avoid hitting auth service for every request)
    const cacheKey = ["auth_token_cache", token];
    const cached = await kv.get<{
      user: SessionUser;
      expiresAt: number;
    }>(cacheKey);

    if (cached.value && cached.value.expiresAt > Date.now()) {
      return cached.value.user;
    }

    // Verify token with auth service
    const result = await verifyToken(token);

    if (!result.valid || !result.user) {
      // Token is invalid or expired, try to refresh
      if (refreshToken) {
        const refreshResult = await refreshAuthToken(refreshToken);
        if (refreshResult.success && refreshResult.tokens) {
          // Re-verify with new token
          const newResult = await verifyToken(refreshResult.tokens.accessToken);
          if (newResult.valid && newResult.user) {
            // Convert to SessionUser format
            const sessionUser = convertToSessionUser(newResult.user);

            // Cache the result
            await kv.set(cacheKey, {
              user: sessionUser,
              expiresAt: Date.now() + (5 * 60 * 1000), // Cache for 5 minutes
            }, {
              expireIn: 5 * 60 * 1000,
            });

            // TODO: Update cookies with new tokens
            // This should be handled by the response, not here

            return sessionUser;
          }
        }
      }
      return null;
    }

    // Convert to SessionUser format
    const sessionUser = convertToSessionUser(result.user);

    // Cache the result
    await kv.set(cacheKey, {
      user: sessionUser,
      expiresAt: Date.now() + (5 * 60 * 1000), // Cache for 5 minutes
    }, {
      expireIn: 5 * 60 * 1000,
    });

    return sessionUser;
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
}

/**
 * Convert auth service user to SessionUser format
 */
function convertToSessionUser(authUser: {
  id: string;
  email: string;
  displayName: string;
  verified: boolean;
  platforms: Record<string, unknown>;
}): SessionUser {
  // Extract BookWorm-specific data
  const bookworm = authUser.platforms?.bookworm as any || {};

  return {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.displayName,
    username: "", // Not used in new system
    schoolId: bookworm.schoolId || null,
    verified: authUser.verified,
    role: bookworm.role || "parent",
    delegatedToUserIds: bookworm.delegatedToUserIds || [],
    googleBooksApiKey: bookworm.googleBooksApiKey || null,
    googleSheetUrl: bookworm.googleSheetUrl || null,
    isPlaceholder: bookworm.isPlaceholder || false,
    createdAt: new Date().toISOString(), // Not provided by auth service
  };
}

/**
 * Clear auth tokens (logout)
 */
export function clearAuthCookies(): Headers {
  const headers = new Headers();
  headers.append("Set-Cookie", `auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  headers.append("Set-Cookie", `refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return headers;
}

/**
 * Check if user has a specific role
 */
export function hasRole(
  user: SessionUser | null,
  roles: string[]
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user can access a school
 */
export function canAccessSchool(
  user: SessionUser | null,
  schoolId: string
): boolean {
  if (!user) return false;

  // Super admins can access any school
  if (user.role === "super_admin") return true;

  // School admins can access their school
  if (user.role === "school_admin" && user.schoolId === schoolId) return true;

  // Teachers can access their school
  if (user.role === "teacher" && user.schoolId === schoolId) return true;

  // Delegates can access schools they're delegated to
  if (user.role === "delegate" && user.schoolId === schoolId) return true;

  return false;
}

/**
 * Create a redirect to login response
 */
export function redirectToLogin(redirect?: string): Response {
  const loginUrl = new URL(`${AUTH_SERVICE_URL}/login`);
  loginUrl.searchParams.set("app", "bookworm");

  if (redirect) {
    // Use the full URL for redirect
    const baseUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
    loginUrl.searchParams.set("redirect", `${baseUrl}${redirect}`);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: loginUrl.toString() },
  });
}