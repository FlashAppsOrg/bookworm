import { Handlers } from "$fresh/server.ts";
import { GoogleAuthService } from "../../../../utils/google-auth.ts";

export const handler: Handlers = {
  GET(req) {
    try {
      const url = new URL(req.url);
      const redirect = url.searchParams.get("redirect");
      const bookId = url.searchParams.get("bookId");
      const userId = url.searchParams.get("userId");
      const schoolId = url.searchParams.get("schoolId");

      const authService = new GoogleAuthService(req.url);

      // Encode state with redirect info for after auth
      const state = btoa(JSON.stringify({
        redirect,
        bookId,
        userId,
        schoolId,
      }));

      const authUrl = authService.getAuthUrl(state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl,
        },
      });
    } catch (error) {
      console.error("Google auth login error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};