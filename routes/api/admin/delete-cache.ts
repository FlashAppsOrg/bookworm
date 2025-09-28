import { Handlers } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { getUserById } from "../../../utils/db-helpers.ts";
import { getKv, CachedBook } from "../../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
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

      const body = await req.json();
      const { isbn, clearAllUnvalidated } = body;

      const kv = await getKv();

      if (clearAllUnvalidated) {
        // Clear all unvalidated books
        console.log("[DELETE CACHE] Clearing all unvalidated books");
        let deletedCount = 0;
        const entries = kv.list<CachedBook>({ prefix: ["books:isbn"] });

        for await (const entry of entries) {
          if (!entry.value.validated) {
            await kv.delete(entry.key);
            deletedCount++;
            const deletedIsbn = entry.key[1] || "unknown";
            console.log(`[DELETE CACHE] Deleted unvalidated book: ${deletedIsbn}`);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Cleared ${deletedCount} unvalidated books`,
          deletedCount,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle both empty string and null/undefined ISBNs
      if (isbn === undefined || isbn === null) {
        console.error("[DELETE CACHE] ISBN is required");
        return new Response(JSON.stringify({ error: "ISBN is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delete specific book (including those with empty string ISBNs)
      console.log(`[DELETE CACHE] Deleting cached book with ISBN: "${isbn}"`);

      const result = await kv.get<CachedBook>(["books:isbn", isbn]);

      if (!result.value) {
        // Try with empty string if isbn was falsy but not null/undefined
        if (!isbn) {
          const emptyResult = await kv.get<CachedBook>(["books:isbn", ""]);
          if (emptyResult.value) {
            await kv.delete(["books:isbn", ""]);
            console.log(`[DELETE CACHE] Successfully deleted book with empty ISBN`);
            return new Response(JSON.stringify({
              success: true,
              message: `Deleted cached book with empty ISBN`,
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        console.error(`[DELETE CACHE] Book not found with ISBN: "${isbn}"`);
        return new Response(JSON.stringify({ error: "Book not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      await kv.delete(["books:isbn", isbn]);
      console.log(`[DELETE CACHE] Successfully deleted ISBN: ${isbn}`);

      return new Response(JSON.stringify({
        success: true,
        message: `Deleted cached book with ISBN: ${isbn}`,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[DELETE CACHE] Error:", error);
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