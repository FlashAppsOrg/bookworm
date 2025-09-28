import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getKv, Invitation } from "../utils/db.ts";
import { getUserById } from "../utils/db-helpers.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/?error=missing_token" },
      });
    }

    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: `/login?invitation=${token}` },
      });
    }

    const kv = await getKv();
    const invitationResult = await kv.get<Invitation>(["invitations", token]);

    if (!invitationResult.value) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/?error=invalid_invitation" },
      });
    }

    const invitation = invitationResult.value;

    if (invitation.used) {
      return new Response(null, {
        status: 302,
        headers: { Location: `/dashboard?teacherId=${invitation.teacherId}` },
      });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/?error=invitation_expired" },
      });
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/?error=email_mismatch" },
      });
    }

    if (user.role !== "delegate") {
      return new Response(null, {
        status: 302,
        headers: { Location: "/?error=not_delegate" },
      });
    }

    if (!user.delegatedToUserIds.includes(invitation.teacherId)) {
      user.delegatedToUserIds.push(invitation.teacherId);

      await kv.set(["users:id", user.id], user);
      await kv.set(["users:email", user.email], user);
      await kv.set(["users:delegates", invitation.teacherId, user.id], true);

      invitation.used = true;
      invitation.usedBy = user.id;
      invitation.usedAt = new Date().toISOString();
      await kv.set(["invitations", token], invitation);
      await kv.set(["invitations:teacher", invitation.teacherId, token], invitation);
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `/dashboard?teacherId=${invitation.teacherId}` },
    });
  },
};