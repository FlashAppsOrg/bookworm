import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv, ParentStudent, User } from "../../../utils/db.ts";

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

      // Check if user is school admin or super admin
      if (!isSchoolAdmin(user) && !isSuperAdmin(user)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const url = new URL(req.url);
      const filter = url.searchParams.get("filter") || "all";
      const kv = await getKv();

      // Get all parent-student associations for the school
      const associations: Array<ParentStudent & { parentEmail?: string }> = [];

      // For super admin, get associations for their school if they have one
      const schoolId = user.schoolId;

      if (!schoolId && !isSuperAdmin(user)) {
        return new Response(JSON.stringify({ error: "No school assigned" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const entries = kv.list<ParentStudent>({ prefix: ["parent_students"] });

      for await (const entry of entries) {
        const assoc = entry.value;

        // Filter by school if not super admin without school
        if (schoolId && assoc.schoolId !== schoolId) {
          continue;
        }

        // Apply status filter
        if (filter !== "all" && assoc.status !== filter) {
          continue;
        }

        // Get parent email for display
        const parentResult = await kv.get<User>(["users:id", assoc.parentId]);
        if (parentResult.value) {
          associations.push({
            ...assoc,
            parentEmail: parentResult.value.email,
          });
        } else {
          associations.push(assoc);
        }
      }

      // Sort by creation date, newest first
      associations.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return new Response(
        JSON.stringify({ associations }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error fetching parent associations:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};