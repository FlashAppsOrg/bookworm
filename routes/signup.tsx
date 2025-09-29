import { Handlers } from "$fresh/server.ts";
import { redirectToSignup } from "../utils/auth-client.ts";

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const redirect = url.searchParams.get("redirect") || "/dashboard";

    // Redirect to auth service signup
    const signupUrl = redirectToSignup(redirect);
    return new Response(null, {
      status: 302,
      headers: { Location: signupUrl },
    });
  },
};