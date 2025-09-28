import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
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

      if (user.role !== "teacher" && user.role !== "super_admin") {
        return new Response(JSON.stringify({ error: "Only teachers and admins can revoke invitations" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { token, teacherId } = body;
      const targetTeacherId = teacherId || user.id;

      // If revoking for another teacher, must be super_admin
      if (targetTeacherId !== user.id && user.role !== "super_admin") {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      await kv.delete(["invitations", token]);
      await kv.delete(["invitations:teacher", targetTeacherId, token]);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Revoke invitation error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};