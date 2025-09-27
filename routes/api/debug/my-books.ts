import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getUserBooks } from "../../../utils/db-helpers.ts";

export const handler: Handlers = {
  async GET(req) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(JSON.stringify({
        authenticated: false,
        message: "Not logged in"
      }, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const books = await getUserBooks(user.id);

    return new Response(JSON.stringify({
      authenticated: true,
      userId: user.id,
      schoolId: user.schoolId,
      bookCount: books.length,
      books: books.slice(0, 5),
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};