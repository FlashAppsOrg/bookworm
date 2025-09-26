import { Handlers } from "$fresh/server.ts";
import { deleteCookie } from "$std/http/cookie.ts";

export const handler: Handlers = {
  POST(req) {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    deleteCookie(headers, "session", { path: "/" });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  },
};