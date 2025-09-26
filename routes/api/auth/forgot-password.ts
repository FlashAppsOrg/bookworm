import { Handlers } from "$fresh/server.ts";
import { getUserByEmail } from "../../../utils/db-helpers.ts";
import { getKv, PasswordResetToken } from "../../../utils/db.ts";
import { generateToken } from "../../../utils/password.ts";
import { sendPasswordResetEmail } from "../../../utils/email.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { email } = body;

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const user = await getUserByEmail(email.toLowerCase());

      // Always return success to avoid email enumeration
      if (!user) {
        return new Response(JSON.stringify({
          success: true,
          message: "If an account exists with that email, a password reset link has been sent.",
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const token = generateToken();
      const resetToken: PasswordResetToken = {
        token,
        email: user.email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        used: false,
      };

      const kv = await getKv();
      await kv.set(["passwordResetTokens", token], resetToken);

      const emailResult = await sendPasswordResetEmail(user.email, token);

      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
        return new Response(JSON.stringify({
          error: "Failed to send reset email. Please try again later.",
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Forgot password error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};