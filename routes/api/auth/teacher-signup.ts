import { Handlers } from "$fresh/server.ts";
import { createSharedUser } from "../../../utils/auth-shared.ts";
import { getKv, School } from "../../../utils/db.ts";
import { createSession } from "../../../utils/session.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const { email, password, displayName, schoolId, redirect } = await req.json();

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

      // Validate school exists and check domain if applicable
      const kv = await getKv();
      const schoolResult = await kv.get<School>(["schools:id", schoolId]);

      if (!schoolResult.value) {
        return new Response(JSON.stringify({ error: "Invalid school selected" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const school = schoolResult.value;

      // If school has a domain, validate email matches
      if (school.domain) {
        const emailDomain = email.split("@")[1];
        if (emailDomain !== school.domain) {
          return new Response(JSON.stringify({
            error: `Please use your school email address ending in @${school.domain}`
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Create teacher account
      const user = await createSharedUser(
        email,
        password,
        displayName,
        "teacher",
        "email",
        schoolId
      );

      // TODO: Send verification email

      // For now, auto-verify teachers (in production, require email verification)
      // Create session
      const sessionCookie = await createSession({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        username: user.username,
        schoolId,
        verified: user.verified,
        role: "teacher",
        delegatedToUserIds: [],
        googleBooksApiKey: null,
        googleSheetUrl: null,
        isPlaceholder: false,
        createdAt: user.createdAt,
      });

      return new Response(JSON.stringify({
        success: true,
        redirect: redirect || "/dashboard",
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `session=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
        },
      });
    } catch (error) {
      console.error("Teacher signup error:", error);

      // Check if user already exists
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