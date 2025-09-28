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

      // Allow super_admin to view any teacher's delegates via query param
      const url = new URL(req.url);
      const teacherId = url.searchParams.get("teacherId");
      const targetTeacherId = teacherId || user.id;

      // If viewing another teacher's delegates, must be super_admin
      if (targetTeacherId !== user.id && user.role !== "super_admin") {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
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

          if (delegateToIds.includes(targetTeacherId)) {
            delegates.push(delegate);

            // Backwards compatibility: ensure delegate index exists
            const indexCheck = await kv.get(["users:delegates", targetTeacherId, delegate.id]);
            if (indexCheck.value === null) {
              await kv.set(["users:delegates", targetTeacherId, delegate.id], true);
            }
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