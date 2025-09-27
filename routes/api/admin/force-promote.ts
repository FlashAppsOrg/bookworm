import { Handlers } from "$fresh/server.ts";
import { getKv, User } from "../../../utils/db.ts";
import { getUserFromSession } from "../../../utils/session.ts";

export const handler: Handlers = {
  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const confirmEmail = body.confirmEmail;

    if (!confirmEmail || confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      return new Response(JSON.stringify({
        error: "Email confirmation required. Send { confirmEmail: 'your@email.com' }"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();

    const updatedUser: User = {
      ...user,
      role: "super_admin",
    };

    await kv.set(["users:id", user.id], updatedUser);
    await kv.set(["users:email", user.email.toLowerCase()], updatedUser);
    if (user.username && user.schoolId) {
      await kv.set(["users:username", user.schoolId, user.username], user.id);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Force promoted ${user.displayName} (${user.email}) to super admin`,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: updatedUser.role,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};