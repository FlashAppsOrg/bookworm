import { Handlers } from "$fresh/server.ts";
import { clearAuthCookies } from "../utils/session-jwt.ts";

export const handler: Handlers = {
  GET(_req) {
    // Clear auth cookies
    const headers = clearAuthCookies();
    headers.set("Location", "/");

    return new Response(null, {
      status: 302,
      headers,
    });
  },
};