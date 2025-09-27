import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const prefix = url.searchParams.get("prefix") || "";

    const kv = await getKv();
    const keys: any[] = [];

    const prefixArray = prefix ? prefix.split(",") : [];
    const entries = kv.list({ prefix: prefixArray });

    for await (const entry of entries) {
      keys.push({
        key: entry.key,
        versionstamp: entry.versionstamp,
      });
    }

    return new Response(JSON.stringify({
      prefix: prefixArray,
      count: keys.length,
      keys: keys.slice(0, 100),
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};