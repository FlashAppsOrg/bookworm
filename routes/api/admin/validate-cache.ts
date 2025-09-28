import { Handlers } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { getUserById } from "../../../utils/db-helpers.ts";
import { getQuotaStats, getUnvalidatedBooks } from "../../../utils/quota-tracker.ts";
import { getKv, CachedBook } from "../../../utils/db.ts";
import { incrementQuotaCounter } from "../../../utils/quota-tracker.ts";

const DEFAULT_API_KEY = Deno.env.get("GOOGLE_BOOKS_API_KEY") || "";

async function validateBook(isbn: string): Promise<boolean> {
  if (!DEFAULT_API_KEY) {
    console.error("No API key available for validation");
    return false;
  }

  try {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${DEFAULT_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`Failed to validate ISBN ${isbn}: ${response.status}`);
      return false;
    }

    await incrementQuotaCounter();

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`No results for ISBN ${isbn}`);
      return false;
    }

    const book = data.items[0];
    const volumeInfo = book.volumeInfo;

    // Update the cache entry with validated Google data
    const kv = await getKv();
    const result = await kv.get<CachedBook>(["books:isbn", isbn]);

    if (result.value) {
      const updated: CachedBook = {
        ...result.value,
        data: {
          isbn,
          title: volumeInfo.title || result.value.data.title,
          authors: volumeInfo.authors || result.value.data.authors || ["Unknown Author"],
          publisher: volumeInfo.publisher || result.value.data.publisher,
          publishedDate: volumeInfo.publishedDate || result.value.data.publishedDate,
          description: volumeInfo.description || result.value.data.description,
          thumbnail: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || result.value.data.thumbnail,
          categories: volumeInfo.categories || result.value.data.categories || [],
          maturityRating: volumeInfo.maturityRating || result.value.data.maturityRating,
          pageCount: volumeInfo.pageCount || result.value.data.pageCount,
          language: volumeInfo.language || result.value.data.language,
        },
        validated: true,
        source: "google_api",
      };

      await kv.set(["books:isbn", isbn], updated);
      console.log(`Validated and updated ISBN ${isbn}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error validating ISBN ${isbn}:`, error);
    return false;
  }
}

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

      // Check remaining quota
      const quotaStats = await getQuotaStats();

      if (quotaStats.remaining < 10) {
        return new Response(JSON.stringify({
          error: "Insufficient quota remaining",
          remaining: quotaStats.remaining,
        }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get unvalidated books (limit to half of remaining quota to be safe)
      const limit = Math.min(Math.floor(quotaStats.remaining / 2), 100);
      const unvalidatedBooks = await getUnvalidatedBooks(limit);

      if (unvalidatedBooks.length === 0) {
        return new Response(JSON.stringify({
          message: "No unvalidated books to process",
          validated: 0,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate books
      let validatedCount = 0;
      let failedCount = 0;

      for (const book of unvalidatedBooks) {
        const success = await validateBook(book.isbn);
        if (success) {
          validatedCount++;
        } else {
          failedCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(JSON.stringify({
        message: "Validation complete",
        validated: validatedCount,
        failed: failedCount,
        processed: unvalidatedBooks.length,
      }), {
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