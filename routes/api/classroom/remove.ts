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

      if (user.role === "delegate") {
        return new Response(JSON.stringify({ error: "Delegates cannot remove books" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { bookId } = body;

      if (!bookId) {
        return new Response(JSON.stringify({ error: "Book ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await removeBookFromClassroom(user.id, bookId);

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