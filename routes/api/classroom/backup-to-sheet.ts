import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getUserBooks } from "../../../utils/db-helpers.ts";
import { getAccessToken, extractSheetId, writeToSheet } from "../../../utils/google-sheets.ts";

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

      if (user.role !== "teacher") {
        return new Response(JSON.stringify({ error: "Only teachers can backup to sheets" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!user.googleSheetUrl) {
        return new Response(JSON.stringify({ error: "No Google Sheet URL configured. Please add one in Settings." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sheetId = extractSheetId(user.googleSheetUrl);
      if (!sheetId) {
        return new Response(JSON.stringify({ error: "Invalid Google Sheet URL" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const books = await getUserBooks(user.id);

      const rows: string[][] = [
        ["ISBN", "Quantity", "Title", "Authors", "Publisher", "Published Date", "Date Added"],
      ];

      for (const book of books) {
        rows.push([
          book.isbn || "",
          String(book.quantity || 1),
          book.title,
          book.authors.join(", "),
          book.publisher || "",
          book.publishedDate || "",
          new Date(book.dateAdded).toLocaleDateString(),
        ]);
      }

      const accessToken = await getAccessToken();
      await writeToSheet(sheetId, { values: rows }, accessToken);

      return new Response(JSON.stringify({
        success: true,
        message: `Backed up ${books.length} books to Google Sheet`,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Backup to sheet error:", error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};