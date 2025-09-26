import { Handlers } from "$fresh/server.ts";
import { getUserByEmail } from "../../../utils/db-helpers.ts";
import { getKv, PasswordResetToken } from "../../../utils/db.ts";
import { hashPassword } from "../../../utils/password.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { token, password } = body;

      if (!token || !password) {
        return new Response(
          JSON.stringify({ error: "Token and password are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const kv = await getKv();
      const resetTokenResult = await kv.get<PasswordResetToken>([
        "passwordResetTokens",
        token,
      ]);

      if (!resetTokenResult.value) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired reset token" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const resetToken = resetTokenResult.value;

      if (resetToken.used) {
        return new Response(
          JSON.stringify({ error: "This reset token has already been used" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (new Date(resetToken.expiresAt) < new Date()) {
        return new Response(
          JSON.stringify({ error: "This reset token has expired" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const user = await getUserByEmail(resetToken.email);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const passwordHash = await hashPassword(password);
      user.passwordHash = passwordHash;

      await kv.set(["users", "id", user.id], user);
      await kv.set(["users", "email", user.email], user);

      resetToken.used = true;
      await kv.set(["passwordResetTokens", token], resetToken);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password reset successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Reset password error:", error);
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