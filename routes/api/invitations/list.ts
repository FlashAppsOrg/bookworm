import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, Invitation } from "../../../utils/db.ts";

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
        return new Response(JSON.stringify({ error: "Only teachers and admins can list invitations" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const invitations: Invitation[] = [];

      const entries = kv.list<Invitation>({ prefix: ["invitations:teacher", user.id] });
      for await (const entry of entries) {
        invitations.push(entry.value);
      }

      invitations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return new Response(JSON.stringify({ invitations }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("List invitations error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};