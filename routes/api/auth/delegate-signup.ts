import { Handlers } from "$fresh/server.ts";
import { createSharedUser } from "../../../utils/auth-shared.ts";
import { createSession } from "../../../utils/session.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const { email, password, displayName, schoolId } = await req.json();

      // Validate required fields
      if (!email || !password || !displayName || !schoolId) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate password length
      if (password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create delegate account (starts without any teacher assignments)
      const user = await createSharedUser(
        email,
        password,
        displayName,
        "delegate",
        "email",
        schoolId
      );

      // Create session
      const sessionCookie = await createSession({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        username: user.username,
        schoolId,
        verified: user.verified,
        role: "delegate",
        delegatedToUserIds: [],
        googleBooksApiKey: null,
        googleSheetUrl: null,
        isPlaceholder: false,
        createdAt: user.createdAt,
      });

      return new Response(JSON.stringify({
        success: true,
        userId: user.id,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `session=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
        },
      });
    } catch (error) {
      console.error("Delegate signup error:", error);

      if (error instanceof Error && error.message === "User already exists") {
        return new Response(JSON.stringify({
          error: "An account with this email already exists"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to create account" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};