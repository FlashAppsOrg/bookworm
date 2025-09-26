import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { addBookToClassroom } from "../../../utils/db-helpers.ts";

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
      const { isbn, title, authors, thumbnail, publisher, publishedDate } = body;

      if (!isbn || !title) {
        return new Response(JSON.stringify({ error: "ISBN and title are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const book = await addBookToClassroom(user.id, {
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