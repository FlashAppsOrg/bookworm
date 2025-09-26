import { Handlers } from "$fresh/server.ts";
import { getKv, VerificationToken } from "../../../utils/db.ts";
import { getUserByEmail, updateUser } from "../../../utils/db-helpers.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { token } = body;

      if (!token) {
        return new Response(JSON.stringify({ error: "Missing verification token" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const tokenResult = await kv.get<VerificationToken>(["verificationTokens", token]);

      if (!tokenResult.value) {
        return new Response(JSON.stringify({ error: "Invalid or expired verification token" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const verificationToken = tokenResult.value;
      const now = new Date();
      const expiresAt = new Date(verificationToken.expiresAt);

      if (now > expiresAt) {
        await kv.delete(["verificationTokens", token]);
        return new Response(JSON.stringify({ error: "Verification token has expired" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const user = await getUserByEmail(verificationToken.email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (user.verified) {
        return new Response(JSON.stringify({ error: "Email already verified" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      user.verified = true;
      await updateUser(user);
      await kv.delete(["verificationTokens", token]);

      return new Response(JSON.stringify({
        success: true,
        message: "Email verified successfully! You can now log in.",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Verify error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};