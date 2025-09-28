import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { addBookToClassroom, findBookByISBN } from "../../../utils/db-helpers.ts";
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
      const { isbn, title, authors, thumbnail, publisher, publishedDate, description, categories, maturityRating, pageCount, language, teacherId } = body;

      if (!isbn || !title) {
        return new Response(JSON.stringify({ error: "ISBN and title are required" }), {
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

      // Check if this ISBN already exists in this classroom
      console.log(`[DUPLICATE CHECK] Checking ISBN "${isbn}" for teacher ${targetUserId}`);
      const existingBook = await findBookByISBN(targetUserId, isbn);

      if (existingBook) {
        console.log(`[DUPLICATE FOUND] Book exists: ${existingBook.title}, quantity: ${existingBook.quantity}, addedBy: ${existingBook.addedBy}`);
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

      console.log(`[NO DUPLICATE] ISBN "${isbn}" not found in classroom, adding new book`);

      const book = await addBookToClassroom(targetUserId, {
        isbn,
        title,
        authors: authors || [],
        thumbnail: thumbnail || null,
        publisher: publisher || null,
        publishedDate: publishedDate || null,
        description: description || undefined,
        categories: categories || undefined,
        maturityRating: maturityRating || undefined,
        pageCount: pageCount || undefined,
        language: language || undefined,
      }, user.id); // Track who added this book

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