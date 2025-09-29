import { Handlers } from "$fresh/server.ts";
import { verifyToken, getBookWormPermissions } from "../../utils/auth-client.ts";
import { getKv } from "../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const refreshToken = url.searchParams.get("refresh");
    const redirect = url.searchParams.get("redirect");

    if (!token || !refreshToken) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login?error=missing_tokens",
        },
      });
    }

    try {
      // Verify the token with auth service
      const result = await verifyToken(token);

      if (!result.valid || !result.user) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/login?error=invalid_token",
          },
        });
      }

      const user = result.user;
      const bookwormPermissions = getBookWormPermissions(user);

      // Check if user has BookWorm access
      if (!bookwormPermissions.role) {
        // User doesn't have BookWorm permissions yet
        // For now, we'll grant them default permissions based on their intent
        // In production, this should trigger a proper onboarding flow

        // Default to parent role for now
        bookwormPermissions.role = "parent";
      }

      // Store user info in local KV for quick access
      // This acts as a cache to avoid calling auth service for every request
      const kv = await getKv();
      const cacheKey = ["auth_cache", user.id];
      await kv.set(cacheKey, {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          verified: user.verified,
          ...bookwormPermissions,
        },
        token,
        refreshToken,
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
      }, {
        expireIn: 15 * 60 * 1000, // Auto-expire cache
      });

      // Determine redirect based on user role
      let redirectUrl = "/dashboard";

      if (bookwormPermissions.role === "parent") {
        // Check if parent has children registered
        redirectUrl = "/parent-dashboard";
      } else if (bookwormPermissions.role === "teacher") {
        redirectUrl = "/dashboard";
      } else if (bookwormPermissions.role === "delegate") {
        redirectUrl = "/dashboard";
      }

      // Override with specific redirect if provided
      if (redirect) {
        redirectUrl = redirect;
      }

      // Set auth cookies
      const headers = new Headers({
        Location: redirectUrl,
      });

      // Store tokens in HTTP-only cookies
      headers.append(
        "Set-Cookie",
        `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900` // 15 min
      );
      headers.append(
        "Set-Cookie",
        `refresh_token=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` // 7 days
      );

      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      console.error("Auth callback error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login?error=auth_failed",
        },
      });
    }
  },
};