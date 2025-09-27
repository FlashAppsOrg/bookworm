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

    const kv = await getKv();

    const allUsers: User[] = [];
    const iter = kv.list<User>({ prefix: ["users:id"] });
    for await (const entry of iter) {
      allUsers.push(entry.value);
    }

    const superAdmins = allUsers.filter(u => u.role === "super_admin");

    if (superAdmins.length > 0) {
      return new Response(JSON.stringify({
        error: "Super admins already exist. Contact an existing super admin.",
        superAdmins: superAdmins.map(u => ({ email: u.email, name: u.displayName }))
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedUser: User = {
      ...user,
      role: "super_admin",
    };

    await kv.set(["users:id", user.id], updatedUser);
    await kv.set(["users:email", user.email], updatedUser);
    if (user.username && user.schoolId) {
      await kv.set(["users:username", user.schoolId, user.username], user.id);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Promoted ${user.displayName} to super admin`,
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