import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { updateBookQuantity } from "../../../utils/db-helpers.ts";

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

      // If delegate, update in the selected teacher's classroom
      let targetUserId = user.id;
      if (user.role === "delegate") {
        // Support both old singular field and new array field
        const delegateToIds = user.delegatedToUserIds ||
          ((user as any).delegatedToUserId ? [(user as any).delegatedToUserId] : []);

        if (!teacherId) {
          return new Response(JSON.stringify({ error: "Teacher ID required for delegates" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!delegateToIds.includes(teacherId)) {
          return new Response(JSON.stringify({ error: "Not authorized for this classroom" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
        targetUserId = teacherId;
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