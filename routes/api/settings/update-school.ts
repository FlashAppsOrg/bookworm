import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { updateUser, getSchoolById } from "../../../utils/db-helpers.ts";
import { getKv } from "../../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const user = await getUserFromSession(req);

      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (user.role !== "teacher") {
        return new Response(JSON.stringify({ error: "Only teachers can change schools" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { schoolId } = body;

      if (!schoolId) {
        return new Response(JSON.stringify({ error: "School ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const school = await getSchoolById(schoolId);
      if (!school) {
        return new Response(JSON.stringify({ error: "School not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const oldSchoolId = user.schoolId;
      user.schoolId = schoolId;
      await updateUser(user);

      if (oldSchoolId && user.username) {
        const kv = await getKv();
        await kv.delete(["usernames", oldSchoolId, user.username.toLowerCase()]);
        await kv.set(["usernames", schoolId, user.username.toLowerCase()], user.id);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Update school error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};