import { Handlers } from "$fresh/server.ts";
import { redirectToLogin } from "../utils/auth-client.ts";

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const redirect = url.searchParams.get("redirect") || "/dashboard";
    const error = url.searchParams.get("error");

    // If there's an error, show a page with the error
    if (error) {
      // For now, just redirect to auth service
      // In production, you might want to show an error page
      const loginUrl = redirectToLogin(redirect);
      return new Response(null, {
        status: 302,
        headers: { Location: loginUrl },
      });
    }

    // Redirect to auth service login
    const loginUrl = redirectToLogin(redirect);
    return new Response(null, {
      status: 302,
      headers: { Location: loginUrl },
    });
  },
};