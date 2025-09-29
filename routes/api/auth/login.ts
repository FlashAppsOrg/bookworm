import { Handlers } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { authClient } from "../../../utils/auth-client.ts";
import { getUserByEmail } from "../../../utils/db-helpers.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Missing email or password" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Authenticate with auth service
      const authResult = await authClient.login(email, password, "bookworm");

      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error || "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user has BookWorm access
      if (!authResult.user.platforms?.bookworm) {
        return new Response(JSON.stringify({ error: "No BookWorm access" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get or sync local user data
      let localUser = await getUserByEmail(email);
      if (!localUser) {
        // User exists in auth but not locally, sync them
        // For now just return error - full sync would be implemented later
        return new Response(JSON.stringify({ error: "User not found in BookWorm" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sessionData = {
        userId: localUser.id,
        email: localUser.email,
        role: localUser.role,
        authToken: authResult.tokens.accessToken,
        refreshToken: authResult.tokens.refreshToken,
      };

      const headers = new Headers({
        "Content-Type": "application/json",
      });

      setCookie(headers, {
        name: "session",
        value: btoa(JSON.stringify(sessionData)),
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      });

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: localUser.id,
          email: localUser.email,
          displayName: localUser.displayName,
          role: localUser.role,
          schoolId: localUser.schoolId,
        },
      }), {
        status: 200,
        headers,
      });

    } catch (error) {
      console.error("Login error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};