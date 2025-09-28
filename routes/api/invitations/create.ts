import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, Invitation } from "../../../utils/db.ts";
import { generateToken } from "../../../utils/password.ts";
import { sendInvitationEmail } from "../../../utils/email.ts";

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

      if (user.role !== "teacher" && user.role !== "super_admin") {
        return new Response(JSON.stringify({ error: "Only teachers and admins can create invitations" }), {
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

      const kv = await getKv();

      // Check if invitation already exists (resend case)
      const existingInvitations = await kv.list<Invitation>({ prefix: ["invitations:teacher", user.id] });
      let existingInvite: Invitation | null = null;

      for await (const entry of existingInvitations) {
        if (entry.value.email === email.toLowerCase() && !entry.value.used) {
          existingInvite = entry.value;
          break;
        }
      }

      // Rate limit check: 10 minutes between resends
      if (existingInvite) {
        const lastSent = new Date(existingInvite.lastSentAt);
        const now = new Date();
        const minutesSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60);

        if (minutesSinceLastSend < 10) {
          const minutesRemaining = Math.ceil(10 - minutesSinceLastSend);
          return new Response(JSON.stringify({
            error: `Please wait ${minutesRemaining} more minute${minutesRemaining !== 1 ? 's' : ''} before resending to this email.`
          }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      const token = existingInvite?.token || generateToken();
      const now = new Date().toISOString();

      const invitation: Invitation = {
        id: token,
        token,
        teacherId: user.id,
        teacherName: user.displayName,
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        usedBy: null,
        usedAt: null,
        createdAt: existingInvite?.createdAt || now,
        lastSentAt: now,
      };

      await kv.set(["invitations", token], invitation);
      await kv.set(["invitations:teacher", user.id, token], invitation);

      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      const inviteUrl = `${appUrl}/delegate-signup?token=${token}`;

      const emailResult = await sendInvitationEmail(email, user.displayName, inviteUrl);

      if (!emailResult.success) {
        await kv.delete(["invitations", token]);
        await kv.delete(["invitations:teacher", user.id, token]);
        return new Response(JSON.stringify({ error: emailResult.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Invitation sent to ${email}`,
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