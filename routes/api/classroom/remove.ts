import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { removeBookFromClassroom, getBookById } from "../../../utils/db-helpers.ts";
import { getTargetTeacherId } from "../../../utils/auth-helpers.ts";

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

      // Determine target teacher (handles super_admin, teacher, delegate)
      const { teacherId: targetUserId, error } = getTargetTeacherId(user, teacherId);
      if (error) {
        return new Response(JSON.stringify({ error }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get the book to check permissions
      const book = await getBookById(targetUserId, bookId);
      if (!book) {
        return new Response(JSON.stringify({ error: "Book not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delegates can only delete books they added
      if (user.role === "delegate") {
        if (book.addedBy !== user.id) {
          return new Response(JSON.stringify({ error: "You can only delete books you added" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
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