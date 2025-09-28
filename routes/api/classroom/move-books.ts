import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, ClassroomBook } from "../../../utils/db.ts";

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

      if (user.role !== "delegate") {
        return new Response(JSON.stringify({ error: "Only delegates can move books between classrooms" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { bookIds, fromTeacherId, toTeacherId } = body;

      if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
        return new Response(JSON.stringify({ error: "Book IDs are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!fromTeacherId || !toTeacherId) {
        return new Response(JSON.stringify({ error: "Teacher IDs are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify delegate has access to both classrooms
      const delegateToIds = user.delegatedToUserIds || [];
      if (!delegateToIds.includes(fromTeacherId) || !delegateToIds.includes(toTeacherId)) {
        return new Response(JSON.stringify({ error: "Not authorized for these classrooms" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const movedBooks: string[] = [];
      const failedBooks: string[] = [];

      for (const bookId of bookIds) {
        try {
          // Get the book from source classroom
          const bookResult = await kv.get<ClassroomBook>(["classroomBooks", fromTeacherId, bookId]);

          if (!bookResult.value) {
            failedBooks.push(bookId);
            continue;
          }

          const book = bookResult.value;

          // Verify the delegate added this book
          if (book.addedBy !== user.id) {
            failedBooks.push(bookId);
            continue;
          }

          // Move the book: update userId to new teacher, keep everything else
          const movedBook: ClassroomBook = {
            ...book,
            userId: toTeacherId,
          };

          // Write to new classroom
          await kv.set(["classroomBooks", toTeacherId, bookId], movedBook);

          // Delete from old classroom
          await kv.delete(["classroomBooks", fromTeacherId, bookId]);

          movedBooks.push(bookId);
        } catch (err) {
          console.error(`Error moving book ${bookId}:`, err);
          failedBooks.push(bookId);
        }
      }

      if (failedBooks.length > 0) {
        return new Response(JSON.stringify({
          success: true,
          movedCount: movedBooks.length,
          failedCount: failedBooks.length,
          message: `Moved ${movedBooks.length} book(s), ${failedBooks.length} failed`,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        movedCount: movedBooks.length,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Move books error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};