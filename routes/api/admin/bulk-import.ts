import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { parseCSV, processBulkImport } from "../../../utils/bulk-import.ts";

export const handler: Handlers = {
  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { csvData } = body;

      if (!csvData || typeof csvData !== "string") {
        return new Response(JSON.stringify({ error: "CSV data is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const rows = parseCSV(csvData);

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: "No valid rows found in CSV" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await processBulkImport(rows);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 207,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
        errors: [],
        stats: {
          schoolsCreated: 0,
          teachersCreated: 0,
          booksCreated: 0,
          rowsProcessed: 0,
        },
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};