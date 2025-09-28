import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv, User } from "../../../utils/db.ts";
import { sendVerificationEmail } from "../../../utils/email.ts";

export const handler: Handlers = {
  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const userResult = await kv.get<User>(["users:id", userId]);

    if (!userResult.value) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetUser = userResult.value;

    if (targetUser.verified) {
      return new Response(JSON.stringify({ error: "User is already verified" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const verificationCode = crypto.randomUUID();
    await kv.set(["verifications", verificationCode], targetUser.id, {
      expireIn: 24 * 60 * 60 * 1000,
    });

    const emailResult = await sendVerificationEmail(targetUser.email, verificationCode);

    if (!emailResult.success) {
      return new Response(JSON.stringify({
        error: emailResult.error || "Failed to send invitation email"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};