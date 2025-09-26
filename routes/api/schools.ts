import { Handlers } from "$fresh/server.ts";
import { getKv, School } from "../../utils/db.ts";

export const handler: Handlers = {
  async GET() {
    try {
      const kv = await getKv();
      const schools: School[] = [];

      const entries = kv.list<School>({ prefix: ["schools:id"] });
      for await (const entry of entries) {
        schools.push(entry.value);
      }

      schools.sort((a, b) => a.name.localeCompare(b.name));

      return new Response(JSON.stringify({ schools }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Failed to fetch schools:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};