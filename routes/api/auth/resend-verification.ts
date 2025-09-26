import { Handlers } from "$fresh/server.ts";
import { getUserByEmail } from "../../../utils/db-helpers.ts";
import { generateToken } from "../../../utils/password.ts";
import { getKv, VerificationToken } from "../../../utils/db.ts";
import { sendVerificationEmail } from "../../../utils/email.ts";

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
      if (!user) {
        return new Response(JSON.stringify({ error: "No account found with this email" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (user.verified) {
        return new Response(JSON.stringify({ error: "This account is already verified" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const token = generateToken();
      const verificationToken: VerificationToken = {
        token,
        email: user.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const kv = await getKv();
      await kv.set(["verificationTokens", token], verificationToken);

      const emailResult = await sendVerificationEmail(user.email, token);

      if (!emailResult.success) {
        console.error("Failed to resend verification email:", emailResult.error);
        return new Response(JSON.stringify({
          error: emailResult.error || "Failed to send verification email. Please try again later.",
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Verification email sent! Please check your inbox.",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Resend verification error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};