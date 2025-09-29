import { Handlers } from "$fresh/server.ts";
import { GoogleAuthService } from "../../../utils/google-auth.ts";
import { getOrCreateGoogleUser, sharedToLegacyUser } from "../../../utils/auth-shared.ts";
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

      // Get or create user in shared database
      const sharedUser = await getOrCreateGoogleUser(googleUser);

      // Convert to legacy format for session (temporary compatibility)
      const user = sharedToLegacyUser(sharedUser);

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