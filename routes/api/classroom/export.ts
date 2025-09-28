import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getUserBooks } from "../../../utils/db-helpers.ts";
import { getTargetTeacherId } from "../../../utils/auth-helpers.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const user = await getUserFromSession(req);

      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const url = new URL(req.url);
      const teacherId = url.searchParams.get("teacherId") || undefined;

      // Determine target teacher (handles super_admin, teacher, delegate)
      const { teacherId: targetUserId, error } = getTargetTeacherId(user, teacherId);
      if (error) {
        return new Response(JSON.stringify({ error }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const books = await getUserBooks(targetUserId);

      const csvRows = [
        ["ISBN", "Quantity", "Title", "Authors", "Publisher", "Published Date", "Date Added"].join(","),
      ];

      for (const book of books) {
        const row = [
          book.isbn,
          book.quantity || 1,
          `"${book.title.replace(/"/g, '""')}"`,
          book.authors.length > 0 ? `"${book.authors.join("; ").replace(/"/g, '""')}"` : "",
          book.publisher ? `"${book.publisher.replace(/"/g, '""')}"` : "",
          book.publishedDate || "",
          book.dateAdded,
        ].join(",");
        csvRows.push(row);
      }

      const csv = csvRows.join("\n");

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${user.username}-books.csv"`,
        },
      });
    } catch (error) {
      console.error("Export error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};