import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, User } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const user = await getUserFromSession(req);

      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (user.role !== "teacher") {
        return new Response(JSON.stringify({ error: "Only teachers can list delegates" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const delegates: User[] = [];

      const entries = kv.list<User>({ prefix: ["users:id"] });
      for await (const entry of entries) {
        if (entry.value.role === "delegate" && entry.value.delegatedToUserIds.includes(user.id)) {
          delegates.push(entry.value);
        }
      }

      return new Response(JSON.stringify({ delegates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("List delegates error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};