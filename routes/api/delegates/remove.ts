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

      if (user.role !== "teacher" && user.role !== "super_admin") {
        return new Response(JSON.stringify({ error: "Only teachers and admins can remove delegates" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { delegateId, delegateEmail, teacherId } = body;

      console.log(`[REMOVE DELEGATE] Request - delegateId: ${delegateId}, delegateEmail: ${delegateEmail}, teacherId: ${teacherId}`);

      if (!delegateId && !delegateEmail) {
        console.error("[REMOVE DELEGATE] Missing both delegateId and delegateEmail");
        return new Response(JSON.stringify({ error: "Delegate ID or email is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      let delegateResult;
      let delegate;

      // Try to find delegate by ID first
      if (delegateId) {
        delegateResult = await kv.get(["users:id", delegateId]);
        if (delegateResult.value) {
          delegate = delegateResult.value;
          console.log(`[REMOVE DELEGATE] Found by ID: ${delegateId}`);
        }
      }

      // If not found by ID, try by email
      if (!delegate && delegateEmail) {
        const normalizedEmail = delegateEmail.toLowerCase().trim();
        delegateResult = await kv.get(["users:email", normalizedEmail]);
        if (delegateResult.value) {
          delegate = delegateResult.value;
          console.log(`[REMOVE DELEGATE] Found by email: ${normalizedEmail}`);
        }
      }

      if (!delegate) {
        console.error(`[REMOVE DELEGATE] Delegate not found - ID: ${delegateId}, Email: ${delegateEmail}`);
        return new Response(JSON.stringify({ error: "Delegate not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Ensure delegate has an ID (for old delegates that may not have one)
      const actualDelegateId = (delegate as any).id || delegateId;
      if (!actualDelegateId) {
        console.error("[REMOVE DELEGATE] Delegate has no ID field");
      }

      // Support both old singular field and new array field
      let delegateToIds = (delegate as any).delegatedToUserIds ||
        ((delegate as any).delegatedToUserId ? [(delegate as any).delegatedToUserId] : []);

      console.log(`[REMOVE DELEGATE] Current delegateToIds:`, delegateToIds);

      // Determine which teacher to remove from (support super_admin removing from other teachers)
      const targetTeacherId = (teacherId && user.role === "super_admin") ? teacherId : user.id;

      if (!delegateToIds.includes(targetTeacherId)) {
        console.error(`[REMOVE DELEGATE] Teacher ${targetTeacherId} not in delegate's list`);
        return new Response(JSON.stringify({ error: "This delegate does not belong to the specified teacher" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Remove the target teacher from the delegate's list
      (delegate as any).delegatedToUserIds = delegateToIds.filter((id: string) => id !== targetTeacherId);

      console.log(`[REMOVE DELEGATE] Updated delegateToIds:`, (delegate as any).delegatedToUserIds);

      // Always update the delegate record (never delete the user account)
      // The user might be a delegate in other classrooms we don't track properly
      // or they might want to keep their account for future use
      if (actualDelegateId) {
        await kv.set(["users:id", actualDelegateId], delegate);
      }
      await kv.set(["users:email", (delegate as any).email.toLowerCase()], delegate);

      // Remove the delegation index
      await kv.delete(["users:delegates", targetTeacherId, actualDelegateId || (delegate as any).email]);

      const remainingTeachers = (delegate as any).delegatedToUserIds.length;
      console.log(`[REMOVE DELEGATE] Removed from classroom. Delegate still has ${remainingTeachers} teacher(s) in their list`);

      return new Response(JSON.stringify({
        success: true,
        message: "Helper removed from classroom"
      }), {
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