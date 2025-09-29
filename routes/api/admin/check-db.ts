import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req) {
    // Temporarily disable auth to diagnose the issue
    // TODO: Re-enable this after debugging
    // const token = req.headers.get("X-Migration-Token");
    // const expectedToken = Deno.env.get("MIGRATION_TOKEN");

    // if (!expectedToken || token !== expectedToken) {
    //   return new Response("Unauthorized", { status: 401 });
    // }

    const kv = await Deno.openKv();

    // Count users by ID
    const usersByIdIterator = kv.list({ prefix: ["users:id"] });
    let userCount = 0;
    const users = [];

    for await (const entry of usersByIdIterator) {
      userCount++;
      const user = entry.value as any;
      users.push({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      });
    }

    // Count users by email
    const usersByEmailIterator = kv.list({ prefix: ["users:email"] });
    let emailCount = 0;
    const emails = [];

    for await (const entry of usersByEmailIterator) {
      emailCount++;
      emails.push(entry.key[1]);
    }

    // Count schools
    const schoolsIterator = kv.list({ prefix: ["schools:id"] });
    let schoolCount = 0;

    for await (const _entry of schoolsIterator) {
      schoolCount++;
    }

    // Count books
    const booksIterator = kv.list({ prefix: ["books:isbn"] });
    let bookCount = 0;

    for await (const _entry of booksIterator) {
      bookCount++;
    }

    const result = {
      database: "Production Deno Deploy KV",
      stats: {
        usersByIdCount: userCount,
        usersByEmailCount: emailCount,
        schoolCount,
        bookCount
      },
      users: users.slice(0, 10), // First 10 users
      emails: emails.slice(0, 10), // First 10 email indexes
      mismatch: userCount !== emailCount ? `WARNING: ${userCount} users but ${emailCount} email indexes!` : null
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }
};