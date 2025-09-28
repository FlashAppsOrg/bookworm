import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { updateBookQuantity } from "../../../utils/db-helpers.ts";
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
      const { bookId, quantity, teacherId } = body;

      if (!bookId || typeof quantity !== "number" || quantity < 1) {
        return new Response(JSON.stringify({ error: "Valid bookId and quantity (>= 1) are required" }), {
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

      const updatedBook = await updateBookQuantity(targetUserId, bookId, quantity);

      if (!updatedBook) {
        return new Response(JSON.stringify({ error: "Book not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, book: updatedBook }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Update quantity error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};