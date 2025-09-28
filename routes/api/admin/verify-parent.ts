import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv, ParentStudent } from "../../../utils/db.ts";

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

      // Check if user is school admin or super admin
      if (!isSchoolAdmin(user) && !isSuperAdmin(user)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { associationId, action, reason } = body;

      if (!associationId || !action) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (action !== "verify" && action !== "reject") {
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();

      // Get the association
      const assocResult = await kv.get<ParentStudent>(["parent_students", associationId]);
      if (!assocResult.value) {
        return new Response(JSON.stringify({ error: "Association not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const association = assocResult.value;

      // Check that the admin has authority over this school
      if (user.schoolId && association.schoolId !== user.schoolId && !isSuperAdmin(user)) {
        return new Response(JSON.stringify({ error: "Not authorized for this school" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Update the association
      if (action === "verify") {
        association.status = "verified";
        association.verifiedAt = new Date().toISOString();
        association.verifiedBy = user.id;
        association.rejectionReason = null;
      } else {
        association.status = "rejected";
        association.rejectionReason = reason || "No reason provided";
        association.verifiedAt = null;
        association.verifiedBy = user.id;
      }

      // Save the updated association
      await kv.set(["parent_students", associationId], association);
      await kv.set(["parent_students:parent", association.parentId, associationId], association);
      await kv.set(["parent_students:teacher", association.teacherId, associationId], association);

      // TODO: Send email notification to parent about the status change

      return new Response(
        JSON.stringify({
          success: true,
          message: action === "verify"
            ? "Parent association verified successfully"
            : "Parent association rejected",
          association,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error verifying parent:", error);
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