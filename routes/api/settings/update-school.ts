import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { updateUser, getSchoolById } from "../../../utils/db-helpers.ts";
import { getKv, User } from "../../../utils/db.ts";

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
        return new Response(JSON.stringify({ error: "Only teachers and admins can change schools" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { schoolId, delegateAction } = body;

      if (!schoolId) {
        return new Response(JSON.stringify({ error: "School ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const school = await getSchoolById(schoolId);
      if (!school) {
        return new Response(JSON.stringify({ error: "School not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();

      // Get delegates for this teacher
      const delegates: User[] = [];
      const entries = kv.list<User>({ prefix: ["users:id"] });
      for await (const entry of entries) {
        const delegate = entry.value;
        if (delegate.role === "delegate") {
          // Support both old singular field and new array field
          const delegateToIds = delegate.delegatedToUserIds ||
            ((delegate as any).delegatedToUserId ? [(delegate as any).delegatedToUserId] : []);
          if (delegateToIds.includes(user.id)) {
            delegates.push(delegate);
          }
        }
      }

      console.log(`[update-school] Found ${delegates.length} delegates for user ${user.id} (${user.email})`);
      console.log(`[update-school] delegateAction: ${delegateAction}`);

      // If delegates exist and no action specified, require confirmation
      if (delegates.length > 0 && !delegateAction) {
        console.log(`[update-school] Returning requiresConfirmation for ${delegates.length} delegates`);
        return new Response(JSON.stringify({
          requiresConfirmation: true,
          delegates: delegates.map(d => ({ id: d.id, name: d.displayName, email: d.email })),
          oldSchoolId: user.schoolId,
          newSchoolId: schoolId,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Process school change
      const oldSchoolId = user.schoolId;
      user.schoolId = schoolId;
      await updateUser(user);

      if (oldSchoolId && user.username) {
        await kv.delete(["usernames", oldSchoolId, user.username.toLowerCase()]);
        await kv.set(["usernames", schoolId, user.username.toLowerCase()], user.id);
      }

      // Handle delegates based on action
      if (delegates.length > 0 && delegateAction) {
        if (delegateAction === "move") {
          // Move delegates to new school
          for (const delegate of delegates) {
            delegate.schoolId = schoolId;
            await kv.set(["users:id", delegate.id], delegate);
            await kv.set(["users:email", delegate.email.toLowerCase()], delegate);
          }
        } else if (delegateAction === "remove") {
          // Remove teacher from delegates' lists
          for (const delegate of delegates) {
            delegate.delegatedToUserIds = delegate.delegatedToUserIds.filter(id => id !== user.id);

            // If delegate has no more teachers, delete their account
            if (delegate.delegatedToUserIds.length === 0) {
              await kv.delete(["users:id", delegate.id]);
              await kv.delete(["users:email", delegate.email.toLowerCase()]);
              await kv.delete(["users:delegates", user.id, delegate.id]);
            } else {
              // Otherwise just update
              await kv.set(["users:id", delegate.id], delegate);
              await kv.set(["users:email", delegate.email.toLowerCase()], delegate);
              await kv.delete(["users:delegates", user.id, delegate.id]);
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Update school error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};