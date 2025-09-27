import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv } from "../../../utils/db.ts";
import { hashPassword, verifyPassword } from "../../../utils/password.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const user = await getUserFromSession(req);

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return new Response(
          JSON.stringify({ error: "Current and new password are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (newPassword.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const isCurrentPasswordValid = await verifyPassword(
        currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return new Response(
          JSON.stringify({ error: "Current password is incorrect" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const newPasswordHash = await hashPassword(newPassword);
      user.passwordHash = newPasswordHash;

      const kv = await getKv();
      await kv.set(["users:id", user.id], user);
      await kv.set(["users:email", user.email], user);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password updated successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Update password error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};