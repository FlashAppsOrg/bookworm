import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { parseStaffCSV, processStaffImport } from "../../../utils/staff-import.ts";

export const handler: Handlers = {
  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user || (!isSchoolAdmin(user) && !isSuperAdmin(user))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isSchoolAdmin(user) && !user.schoolId) {
      return new Response(JSON.stringify({ error: "School admin must be assigned to a school" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { csvData, schoolId } = body;

      if (!csvData || typeof csvData !== "string") {
        return new Response(JSON.stringify({ error: "CSV data is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const targetSchoolId = isSuperAdmin(user) ? schoolId : user.schoolId;

      if (!targetSchoolId) {
        return new Response(JSON.stringify({ error: "School ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const rows = parseStaffCSV(csvData);

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: "No valid rows found in CSV" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await processStaffImport(rows, targetSchoolId);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 207,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Staff import error:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
        errors: [],
        stats: {
          staffCreated: 0,
          rowsProcessed: 0,
        },
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};