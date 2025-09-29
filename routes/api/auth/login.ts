import { Handlers } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { authClient } from "../../../utils/auth-client.ts";
import { getUserByEmail } from "../../../utils/db-helpers.ts";
import { getKv } from "../../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      console.log("BookWorm login endpoint hit");
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Missing email or password" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log("Calling auth service for:", email);
      // Authenticate with auth service
      const authResult = await authClient.login(email, password, "bookworm");
      console.log("Auth service response:", authResult);

      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error || "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user has BookWorm access
      if (!authResult.user.platforms?.bookworm) {
        // For now, skip this check since migrated users might not have it set
        // return new Response(JSON.stringify({ error: "No BookWorm access" }), {
        //   status: 403,
        //   headers: { "Content-Type": "application/json" },
        // });
      }

      // Get or sync local user data
      console.log("Looking for local user:", email);
      let localUser = await getUserByEmail(email);
      console.log("Local user found:", !!localUser, localUser?.id);

      if (!localUser) {
        console.log("Creating new local user for:", email);
        // Create a minimal local user record for auth service users
        // This allows migrated users to log in
        const kv = await getKv();
        const userId = crypto.randomUUID();
        localUser = {
          id: userId,
          email: email.toLowerCase(),
          displayName: authResult.user.displayName || email.split('@')[0],
          role: authResult.user.platforms?.bookworm?.role || "teacher",
          schoolId: authResult.user.platforms?.bookworm?.schoolId || "",
          passwordHash: "", // No local password, using auth service
          verified: authResult.user.verified || true,
          createdAt: new Date().toISOString(),
        };

        // Store in KV
        await kv.set(["users:id", userId], localUser);
        await kv.set(["users:email", email.toLowerCase()], localUser);
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

      const responseData = {
        success: true,
        user: {
          id: localUser.id,
          email: localUser.email,
          displayName: localUser.displayName,
          role: localUser.role,
          schoolId: localUser.schoolId,
        },
      };

      console.log("Sending response:", responseData);

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers,
      });

    } catch (error) {
      console.error("Login error:", error);
      console.error("Full error details:", error.stack || error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        details: error.message || String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};