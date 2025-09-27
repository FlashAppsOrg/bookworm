import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, User, ClassroomBook } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const user = await getUserFromSession(req);
    if (!user || !user.schoolId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const placeholders: Array<{ id: string; name: string; username: string; bookCount: number }> = [];

    const userEntries = kv.list<User>({ prefix: ["users:id"] });
    for await (const entry of userEntries) {
      const u = entry.value;
      if (u.schoolId === user.schoolId && u.isPlaceholder && u.role === "teacher") {
        const bookEntries = kv.list<ClassroomBook>({ prefix: ["classroomBooks", u.id] });
        let bookCount = 0;
        for await (const _ of bookEntries) {
          bookCount++;
        }

        placeholders.push({
          id: u.id,
          name: u.displayName,
          username: u.username,
          bookCount,
        });
      }
    }

    placeholders.sort((a, b) => a.name.localeCompare(b.name));

    return new Response(JSON.stringify({ placeholders }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user || !user.schoolId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const { placeholderId } = await req.json();

      if (!placeholderId) {
        return new Response(JSON.stringify({ error: "Placeholder ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();

      const placeholderResult = await kv.get<User>(["users:id", placeholderId]);
      if (!placeholderResult.value) {
        return new Response(JSON.stringify({ error: "Placeholder account not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const placeholder = placeholderResult.value;

      if (!placeholder.isPlaceholder) {
        return new Response(JSON.stringify({ error: "This is not a placeholder account" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (placeholder.schoolId !== user.schoolId) {
        return new Response(JSON.stringify({ error: "Placeholder is from a different school" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const bookEntries = kv.list<ClassroomBook>({ prefix: ["classroomBooks", placeholderId] });
      const booksToMove: ClassroomBook[] = [];
      for await (const entry of bookEntries) {
        booksToMove.push(entry.value);
      }

      for (const book of booksToMove) {
        await kv.delete(["classroomBooks", placeholderId, book.id]);

        const movedBook: ClassroomBook = {
          ...book,
          userId: user.id,
          imported: true,
        };
        await kv.set(["classroomBooks", user.id, book.id], movedBook);
      }

      await kv.delete(["users:id", placeholderId]);
      await kv.delete(["users:email", placeholder.email]);
      if (placeholder.username) {
        await kv.delete(["users:username", placeholder.schoolId!, placeholder.username]);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully claimed ${placeholder.displayName}'s classroom with ${booksToMove.length} book(s)`,
        booksMoved: booksToMove.length,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Claim classroom error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};