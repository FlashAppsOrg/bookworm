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
      const columnsParam = url.searchParams.get("columns");

      // Parse columns parameter or use all columns by default
      const selectedColumns = columnsParam ? JSON.parse(columnsParam) : {
        isbn: true,
        quantity: true,
        title: true,
        authors: true,
        publisher: true,
        publishedDate: true,
        dateAdded: true,
      };

      // Determine target teacher (handles super_admin, teacher, delegate)
      const { teacherId: targetUserId, error } = getTargetTeacherId(user, teacherId);
      if (error) {
        return new Response(JSON.stringify({ error }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const books = await getUserBooks(targetUserId);

      // Build headers based on selected columns
      const headers = [];
      if (selectedColumns.isbn) headers.push("ISBN");
      if (selectedColumns.quantity) headers.push("Quantity");
      if (selectedColumns.title) headers.push("Title");
      if (selectedColumns.authors) headers.push("Authors");
      if (selectedColumns.publisher) headers.push("Publisher");
      if (selectedColumns.publishedDate) headers.push("Published Date");
      if (selectedColumns.dateAdded) headers.push("Date Added");

      const csvRows = [headers.join(",")];

      for (const book of books) {
        const row = [];
        if (selectedColumns.isbn) row.push(book.isbn);
        if (selectedColumns.quantity) row.push(book.quantity || 1);
        if (selectedColumns.title) row.push(`"${book.title.replace(/"/g, '""')}"`);
        if (selectedColumns.authors) {
          row.push(book.authors.length > 0 ? `"${book.authors.join("; ").replace(/"/g, '""')}"` : "");
        }
        if (selectedColumns.publisher) {
          row.push(book.publisher ? `"${book.publisher.replace(/"/g, '""')}"` : "");
        }
        if (selectedColumns.publishedDate) row.push(book.publishedDate || "");
        if (selectedColumns.dateAdded) row.push(book.dateAdded);

        csvRows.push(row.join(","));
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