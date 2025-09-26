import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv } from "../../../utils/db.ts";

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
        return new Response(JSON.stringify({ error: "Only teachers can remove delegates" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { delegateId } = body;

      if (!delegateId) {
        return new Response(JSON.stringify({ error: "Delegate ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const delegateResult = await kv.get(["users:id", delegateId]);

      if (!delegateResult.value) {
        return new Response(JSON.stringify({ error: "Delegate not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const delegate = delegateResult.value as any;

      // Support both old singular field and new array field
      let delegateToIds = delegate.delegatedToUserIds ||
        (delegate.delegatedToUserId ? [delegate.delegatedToUserId] : []);

      if (!delegateToIds.includes(user.id)) {
        return new Response(JSON.stringify({ error: "This delegate does not belong to you" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Remove this teacher from the delegate's list
      delegate.delegatedToUserIds = delegateToIds.filter((id: string) => id !== user.id);

      // If they still help other teachers, just update the record
      if (delegate.delegatedToUserIds.length > 0) {
        await kv.set(["users:id", delegateId], delegate);
        await kv.set(["users:email", delegate.email.toLowerCase()], delegate);
        await kv.delete(["users:delegates", user.id, delegateId]);

        return new Response(JSON.stringify({ success: true, message: "Removed from your classroom" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // If they have no more teachers, delete the account
      await kv.delete(["users:id", delegateId]);
      await kv.delete(["users:email", delegate.email.toLowerCase()]);
      await kv.delete(["users:delegates", user.id, delegateId]);

      return new Response(JSON.stringify({ success: true, message: "Delegate account deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Remove delegate error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};