import { Handlers } from "$fresh/server.ts";

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
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );

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