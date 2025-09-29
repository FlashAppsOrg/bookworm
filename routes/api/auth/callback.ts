import { Handlers } from "$fresh/server.ts";
import { GoogleAuthService } from "../../../utils/google-auth.ts";
import { getKv, User } from "../../../utils/db.ts";
import { createSession } from "../../../utils/session.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state");

    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/parent-signup?error=auth_denied",
        },
      });
    }

    if (!code) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/parent-signup?error=no_code",
        },
      });
    }

    try {
      const authService = new GoogleAuthService(req.url);

      // Exchange code for tokens
      const { accessToken } = await authService.exchangeCodeForTokens(code);

      // Get user info from Google
      const googleUser = await authService.getUserInfo(accessToken);

      const kv = await getKv();

      // Check if user already exists
      let existingUser = await kv.get<User>(["users:email", googleUser.email.toLowerCase()]);
      let user: User;

      if (existingUser.value) {
        user = existingUser.value;

        // Update user info from Google if needed
        if (user.displayName !== googleUser.name) {
          user.displayName = googleUser.name;
          await kv.set(["users:id", user.id], user);
          await kv.set(["users:email", user.email], user);
        }
      } else {
        // Create new parent user
        const userId = crypto.randomUUID();
        user = {
          id: userId,
          email: googleUser.email.toLowerCase(),
          passwordHash: "", // No password for Google Auth users
          displayName: googleUser.name,
          username: "", // Parents don't need usernames
          schoolId: "", // Will be set during student verification
          verified: true, // Google email is already verified
          role: "parent",
          delegatedToUserIds: [],
          googleBooksApiKey: null,
          googleSheetUrl: null,
          isPlaceholder: false,
          createdAt: new Date().toISOString(),
        };

        // Save new user
        await kv.set(["users:id", userId], user);
        await kv.set(["users:email", googleUser.email.toLowerCase()], user);
      }

      // Create session
      const sessionCookie = await createSession(user);

      // Parse state to get redirect info
      let redirectUrl = "/parent-signup?step=student";
      if (state) {
        try {
          const stateData = JSON.parse(atob(state));
          if (stateData.redirect) {
            redirectUrl = stateData.redirect;
          } else if (stateData.bookId && stateData.userId) {
            redirectUrl = `/challenge-book?bookId=${stateData.bookId}&userId=${stateData.userId}&registered=true`;
          } else if (stateData.schoolId) {
            redirectUrl = `/parent-signup?step=student&schoolId=${stateData.schoolId}`;
          }
        } catch {
          // If state parsing fails, use default
        }
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
          "Set-Cookie": `session=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
        },
      });
    } catch (error) {
      console.error("Google auth callback error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/parent-signup?error=auth_failed",
        },
      });
    }
  },
};