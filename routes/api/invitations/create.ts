import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, Invitation } from "../../../utils/db.ts";
import { generateToken } from "../../../utils/password.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const user = await getUserFromSession(req);

      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (user.role !== "teacher") {
        return new Response(JSON.stringify({ error: "Only teachers can create invitations" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { email } = body;

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const token = generateToken();
      const invitation: Invitation = {
        id: token,
        token,
        teacherId: user.id,
        teacherName: user.displayName,
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        used: false,
        usedBy: null,
        usedAt: null,
        createdAt: new Date().toISOString(),
      };

      const kv = await getKv();
      await kv.set(["invitations", token], invitation);
      await kv.set(["invitations:teacher", user.id, token], invitation);

      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      const inviteUrl = `${appUrl}/delegate-signup?token=${token}`;

      return new Response(JSON.stringify({
        success: true,
        invitation,
        inviteUrl,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Create invitation error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};