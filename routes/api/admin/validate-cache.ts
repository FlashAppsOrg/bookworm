import { Handlers } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { getUserById } from "../../../utils/db-helpers.ts";
import { getQuotaStats, getUnvalidatedBooks } from "../../../utils/quota-tracker.ts";
import { getKv, CachedBook } from "../../../utils/db.ts";
import { incrementQuotaCounter } from "../../../utils/quota-tracker.ts";
import { normalizeISBN } from "../../../utils/isbn.ts";

const DEFAULT_API_KEY = Deno.env.get("GOOGLE_BOOKS_API_KEY") || "";

async function validateBook(isbn: string): Promise<boolean> {
  if (!DEFAULT_API_KEY) {
    console.error(`[VALIDATION] No Google Books API key available - check GOOGLE_BOOKS_API_KEY env var`);
    return false;
  }

  console.log(`[VALIDATION] Validating ISBN: ${isbn}`);

  try {
    // Try to normalize the ISBN first
    const normalizedISBN = normalizeISBN(isbn);
    const searchISBN = normalizedISBN || isbn;

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${searchISBN}&key=${DEFAULT_API_KEY}`;
    console.log(`[VALIDATION] API URL: ${apiUrl.replace(DEFAULT_API_KEY, '***')}`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[VALIDATION] Failed to validate ISBN ${isbn}: ${response.status} - ${errorText}`);
      return false;
    }

    await incrementQuotaCounter();

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`[VALIDATION] No Google Books results for ISBN ${isbn}`);
      // Try with the original ISBN if we normalized it
      if (normalizedISBN && normalizedISBN !== isbn) {
        console.log(`[VALIDATION] Retrying with original ISBN: ${isbn}`);
        const retryUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${DEFAULT_API_KEY}`;
        const retryResponse = await fetch(retryUrl);

        if (retryResponse.ok) {
          await incrementQuotaCounter();
          const retryData = await retryResponse.json();
          if (retryData.items && retryData.items.length > 0) {
            const book = retryData.items[0];
            const volumeInfo = book.volumeInfo;

            // Update cache with validated data
            const kv = await getKv();
            const result = await kv.get<CachedBook>(["books:isbn", isbn]);

            if (result.value) {
              const updated: CachedBook = {
                ...result.value,
                data: {
                  isbn: normalizedISBN || isbn,
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
                  industryIdentifiers: volumeInfo.industryIdentifiers || result.value.data.industryIdentifiers,
                  infoLink: volumeInfo.infoLink || result.value.data.infoLink,
                },
                validated: true,
                source: "google_api",
              };

              await kv.set(["books:isbn", isbn], updated);
              console.log(`[VALIDATION] Validated and updated ISBN ${isbn} (on retry)`);
              return true;
            }
          }
        }
      }
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
          isbn: normalizedISBN || isbn,
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
          industryIdentifiers: volumeInfo.industryIdentifiers || result.value.data.industryIdentifiers,
          infoLink: volumeInfo.infoLink || result.value.data.infoLink,
        },
        validated: true,
        source: "google_api",
      };

      await kv.set(["books:isbn", isbn], updated);
      console.log(`[VALIDATION] Validated and updated ISBN ${isbn}`);
      return true;
    } else {
      console.error(`[VALIDATION] ISBN ${isbn} not found in cache`);
    }

    return false;
  } catch (error) {
    console.error(`[VALIDATION] Error validating ISBN ${isbn}:`, error);
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

      // Check if API key is available
      if (!DEFAULT_API_KEY) {
        console.error(`[VALIDATION] No Google Books API key configured`);
        return new Response(JSON.stringify({
          error: "Google Books API key not configured. Please set GOOGLE_BOOKS_API_KEY environment variable.",
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check remaining quota
      const quotaStats = await getQuotaStats();

      console.log(`[VALIDATION] Quota stats - Used: ${quotaStats.used}, Remaining: ${quotaStats.remaining}`);

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

      console.log(`[VALIDATION] Found ${unvalidatedBooks.length} unvalidated books`);

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
      const failedISBNs: string[] = [];

      console.log(`[VALIDATION] Starting validation of ${unvalidatedBooks.length} books`);

      for (const book of unvalidatedBooks) {
        const success = await validateBook(book.isbn);
        if (success) {
          validatedCount++;
        } else {
          failedCount++;
          failedISBNs.push(book.isbn);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`[VALIDATION] Complete - Validated: ${validatedCount}, Failed: ${failedCount}`);
      if (failedISBNs.length > 0) {
        console.log(`[VALIDATION] Failed ISBNs: ${failedISBNs.join(', ')}`);
      }

      return new Response(JSON.stringify({
        message: "Validation complete",
        validated: validatedCount,
        failed: failedCount,
        processed: unvalidatedBooks.length,
        failedISBNs: failedISBNs.slice(0, 5), // Include first 5 failed ISBNs for debugging
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