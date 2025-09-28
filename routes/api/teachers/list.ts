import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, User } from "../../../utils/db.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";

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

      if (!isSuperAdmin(user)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const teachers: Array<{ id: string; name: string; email: string; schoolId: string | null }> = [];

      const userEntries = kv.list<User>({ prefix: ["users:id"] });
      for await (const entry of userEntries) {
        const u = entry.value;
        if (u.role === "teacher" || u.role === "super_admin") {
          teachers.push({
            id: u.id,
            name: u.displayName,
            email: u.email,
            schoolId: u.schoolId,
          });
        }
      }

      // Sort by name
      teachers.sort((a, b) => a.name.localeCompare(b.name));

      return new Response(JSON.stringify({ teachers }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};