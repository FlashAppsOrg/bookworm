import { Handlers } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { getKv, CachedBook } from "../../utils/db.ts";
import { getUserById } from "../../utils/db-helpers.ts";

export interface BookInfo {
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnail?: string;
  industryIdentifiers?: Array<{ type: string; identifier: string }>;
}

const DEFAULT_API_KEY = ""; // Set in environment variable or config

async function getCachedBook(isbn: string): Promise<BookInfo | null> {
  const kv = await getKv();
  const result = await kv.get<CachedBook>(["books:isbn", isbn]);

  if (result.value) {
    console.log(`Cache hit for ISBN: ${isbn}`);
    return result.value.data;
  }

  return null;
}

async function cacheBook(isbn: string, bookInfo: BookInfo): Promise<void> {
  const kv = await getKv();
  const cached: CachedBook = {
    isbn,
    data: bookInfo,
    cachedAt: new Date().toISOString(),
  };

  await kv.set(["books:isbn", isbn], cached);
  console.log(`Cached book with ISBN: ${isbn}`);
}

async function getUserApiKey(req: Request): Promise<string> {
  try {
    const cookies = getCookies(req.headers);
    const sessionCookie = cookies.session;

    if (!sessionCookie) {
      return DEFAULT_API_KEY;
    }

    const sessionData = JSON.parse(atob(sessionCookie));
    const user = await getUserById(sessionData.userId);

    if (user?.googleBooksApiKey) {
      console.log(`Using user's API key for: ${user.email}`);
      return user.googleBooksApiKey;
    }
  } catch (error) {
    console.error("Error getting user API key:", error);
  }

  return DEFAULT_API_KEY;
}

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const isbn = url.searchParams.get("isbn");

    if (!isbn) {
      return new Response(JSON.stringify({ error: "ISBN is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Check cache first
      const cachedBook = await getCachedBook(isbn);
      if (cachedBook) {
        return new Response(JSON.stringify(cachedBook), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get API key (user's or default)
      const apiKey = await getUserApiKey(req);
      const apiUrl = apiKey
        ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
        : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return new Response(JSON.stringify({ error: "Book not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const book = data.items[0];
      const volumeInfo = book.volumeInfo;

      const bookInfo: BookInfo = {
        isbn,
        title: volumeInfo.title || "Unknown Title",
        authors: volumeInfo.authors || ["Unknown Author"],
        publisher: volumeInfo.publisher,
        publishedDate: volumeInfo.publishedDate,
        description: volumeInfo.description,
        thumbnail: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        industryIdentifiers: volumeInfo.industryIdentifiers,
      };

      // Cache the result
      await cacheBook(isbn, bookInfo);

      return new Response(JSON.stringify(bookInfo), {
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