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

      if (user.role !== "teacher" && user.role !== "super_admin") {
        return new Response(JSON.stringify({ error: "Only teachers and admins can list delegates" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const delegates: User[] = [];

      const entries = kv.list<User>({ prefix: ["users:id"] });
      for await (const entry of entries) {
        const delegate = entry.value;
        if (delegate.role === "delegate") {
          // Support both old singular field and new array field
          const delegateToIds = delegate.delegatedToUserIds ||
            ((delegate as any).delegatedToUserId ? [(delegate as any).delegatedToUserId] : []);

          if (delegateToIds.includes(user.id)) {
            delegates.push(delegate);
          }
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