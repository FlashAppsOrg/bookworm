import { Handlers } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { getUserById } from "../../../utils/db-helpers.ts";
import { getQuotaStats, getCacheStats, getUnvalidatedBooks } from "../../../utils/quota-tracker.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const cookies = getCookies(req.headers);
      const sessionCookie = cookies.session;

      if (!sessionCookie) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sessionData = JSON.parse(atob(sessionCookie));
      const user = await getUserById(sessionData.userId);

      if (!user || user.role !== "super_admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const url = new URL(req.url);
      const includeBooks = url.searchParams.get("includeBooks") === "true";

      const quotaStats = await getQuotaStats();
      const cacheStats = await getCacheStats();

      const response: any = {
        quota: quotaStats,
        cache: cacheStats,
      };

      if (includeBooks) {
        const unvalidatedBooks = await getUnvalidatedBooks(200);
        response.unvalidatedBooks = unvalidatedBooks;
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};