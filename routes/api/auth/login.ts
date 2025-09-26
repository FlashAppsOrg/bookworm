import { Handlers } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { getUserByEmail } from "../../../utils/db-helpers.ts";
import { verifyPassword } from "../../../utils/password.ts";

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

      const user = await getUserByEmail(email);
      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!user.verified) {
        return new Response(JSON.stringify({ error: "Please verify your email first" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
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
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          schoolId: user.schoolId,
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