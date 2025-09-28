import { Handlers } from "$fresh/server.ts";
import { getKv, Invitation } from "../../../utils/db.ts";
import { getUserById, createUser, getUserByEmail } from "../../../utils/db-helpers.ts";
import { hashPassword } from "../../../utils/password.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { token, displayName, email, password } = body;

      if (!token || !displayName || !email || !password) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();
      const invitationResult = await kv.get<Invitation>(["invitations", token]);

      if (!invitationResult.value) {
        return new Response(JSON.stringify({ error: "Invalid invitation" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const invitation = invitationResult.value;

      if (invitation.used) {
        return new Response(JSON.stringify({ error: "This invitation has already been used" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        return new Response(JSON.stringify({ error: "This invitation has expired" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (email.toLowerCase() !== invitation.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: "Email does not match invitation" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        // If they're a delegate, add this teacher to their list
        if (existingUser.role === "delegate") {
          if (!existingUser.delegatedToUserIds.includes(invitation.teacherId)) {
            existingUser.delegatedToUserIds.push(invitation.teacherId);

            const kv = await getKv();
            await kv.set(["users:id", existingUser.id], existingUser);
            await kv.set(["users:email", existingUser.email], existingUser);
            await kv.set(["users:delegates", invitation.teacherId, existingUser.id], true);

            // Mark invitation as used
            invitation.used = true;
            invitation.usedBy = existingUser.id;
            invitation.usedAt = new Date().toISOString();
            await kv.set(["invitations", token], invitation);
            await kv.set(["invitations:teacher", invitation.teacherId, token], invitation);

            return new Response(JSON.stringify({
              success: true,
              message: "Added to your classrooms",
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({ error: "You're already helping this teacher" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        } else {
          return new Response(JSON.stringify({ error: "Email already registered as teacher" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Get teacher info
      const teacher = await getUserById(invitation.teacherId);
      if (!teacher) {
        return new Response(JSON.stringify({ error: "Teacher not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create delegate account
      const passwordHash = await hashPassword(password);
      const delegate = await createUser({
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        username: "", // Delegates don't need usernames
        schoolId: teacher.schoolId, // Inherit teacher's school
        verified: true, // Auto-verified through invitation
        role: "delegate",
        delegatedToUserIds: [teacher.id],
        googleBooksApiKey: null,
        googleSheetUrl: null,
      });

      // Create delegate index for new account
      await kv.set(["users:delegates", teacher.id, delegate.id], true);

      // Mark invitation as used
      invitation.used = true;
      invitation.usedBy = delegate.id;
      invitation.usedAt = new Date().toISOString();

      await kv.set(["invitations", token], invitation);
      await kv.set(["invitations:teacher", invitation.teacherId, token], invitation);

      return new Response(JSON.stringify({
        success: true,
        message: "Account created successfully",
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Accept invitation error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};