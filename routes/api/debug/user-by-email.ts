import { Handlers } from "$fresh/server.ts";
import { getKv, User } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();

    const byEmail = await kv.get<User>(["users", "email", email.toLowerCase()]);

    let byId = null;
    if (byEmail.value) {
      byId = await kv.get<User>(["users", "id", byEmail.value.id]);
    }

    return new Response(JSON.stringify({
      email: email,
      fromEmailKey: byEmail.value ? {
        id: byEmail.value.id,
        email: byEmail.value.email,
        name: byEmail.value.displayName,
        role: byEmail.value.role,
      } : null,
      fromIdKey: byId?.value ? {
        id: byId.value.id,
        email: byId.value.email,
        name: byId.value.displayName,
        role: byId.value.role,
      } : null,
      keysMatch: byEmail.value?.role === byId?.value?.role,
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};