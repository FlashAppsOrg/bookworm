import { Handlers } from "$fresh/server.ts";
import { getKv, User } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    // Check for migration token (same one used everywhere)
    const token = req.headers.get("X-Migration-Token");
    const MIGRATION_TOKEN = Deno.env.get("MIGRATION_TOKEN");

    if (!MIGRATION_TOKEN || token !== MIGRATION_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const AUTH_SERVICE_URL = "https://auth.flashapps.org";

      // Get all BookWorm users from the database
      const kv = await getKv();
      const userEntries = kv.list<User>({ prefix: ["users:id"] });
      const users = [];

      for await (const entry of userEntries) {
        const user = entry.value;
        users.push(user);
      }

      console.log(`Found ${users.length} users to migrate`);

      if (users.length === 0) {
        return new Response(JSON.stringify({
          message: "No users to migrate"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Send users to auth service migration endpoint
      const response = await fetch(`${AUTH_SERVICE_URL}/api/migrate/bookworm-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Migration-Token": MIGRATION_TOKEN,
        },
        body: JSON.stringify({ users }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Migration failed: ${response.status} - ${error}`);
      }

      const result = await response.json();

      return new Response(JSON.stringify({
        success: true,
        totalUsers: users.length,
        migrated: result.migrated,
        updated: result.skipped,
        failed: result.failed,
        errors: result.errors,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Migration error:", error);
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};