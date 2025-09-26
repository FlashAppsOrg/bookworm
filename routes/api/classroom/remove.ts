import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { removeBookFromClassroom } from "../../../utils/db-helpers.ts";

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

      const body = await req.json();
      const { bookId, teacherId } = body;

      if (!bookId) {
        return new Response(JSON.stringify({ error: "Book ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      let targetUserId = user.id;
      if (user.role === "delegate") {
        if (!teacherId) {
          return new Response(JSON.stringify({ error: "Teacher ID required for delegates" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!user.delegatedToUserIds.includes(teacherId)) {
          return new Response(JSON.stringify({ error: "Not authorized for this classroom" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
        targetUserId = teacherId;
      }

      await removeBookFromClassroom(targetUserId, bookId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Remove book error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};