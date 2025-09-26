import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { addBookToClassroom, findBookByISBN } from "../../../utils/db-helpers.ts";

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
      const { isbn, title, authors, thumbnail, publisher, publishedDate, teacherId } = body;

      if (!isbn || !title) {
        return new Response(JSON.stringify({ error: "ISBN and title are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // If delegate, add to the selected teacher's classroom
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

      // Check if this ISBN already exists in this classroom
      const existingBook = await findBookByISBN(targetUserId, isbn);

      if (existingBook) {
        const currentQuantity = existingBook.quantity || 1;
        return new Response(JSON.stringify({
          duplicate: true,
          existingBook: { ...existingBook, quantity: currentQuantity },
          message: `You already have ${currentQuantity} cop${currentQuantity === 1 ? 'y' : 'ies'} of "${existingBook.title}"`
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const book = await addBookToClassroom(targetUserId, {
        isbn,
        title,
        authors: authors || [],
        thumbnail: thumbnail || null,
        publisher: publisher || null,
        publishedDate: publishedDate || null,
      });

      return new Response(JSON.stringify({ success: true, book }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Add book error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};