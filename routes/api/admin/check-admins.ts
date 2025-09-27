import { Handlers } from "$fresh/server.ts";
import { getKv, User } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(_req) {
    try {
      const kv = await getKv();

      const allUsers: User[] = [];
      const iter = kv.list<User>({ prefix: ["users", "id"] });
      for await (const entry of iter) {
        allUsers.push(entry.value);
      }

      const superAdmins = allUsers
        .filter(u => u.role === "super_admin")
        .map(u => ({
          id: u.id,
          email: u.email,
          name: u.displayName,
          verified: u.verified,
        }));

      const schoolAdmins = allUsers
        .filter(u => u.role === "school_admin")
        .map(u => ({
          id: u.id,
          email: u.email,
          name: u.displayName,
          schoolId: u.schoolId,
          verified: u.verified,
        }));

      return new Response(JSON.stringify({
        superAdmins,
        schoolAdmins,
        totalUsers: allUsers.length,
      }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Check admins error:", error);
      return new Response(JSON.stringify({
        error: "Failed to check admins",
        message: error.message,
      }, null, 2), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};