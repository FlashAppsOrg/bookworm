import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv, User, School } from "../../../utils/db.ts";
import { createUser, getUserByEmail } from "../../../utils/db-helpers.ts";
import { hashPassword } from "../../../utils/password.ts";
import { validateEmail } from "../../../utils/auth.ts";

export const handler: Handlers = {
  async GET(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const users: Array<User & { schoolName?: string }> = [];

    const schoolMap = new Map<string, string>();
    const schoolEntries = kv.list<School>({ prefix: ["schools:id"] });
    for await (const entry of schoolEntries) {
      schoolMap.set(entry.value.id, entry.value.name);
    }

    const userEntries = kv.list<User>({ prefix: ["users:id"] });
    for await (const entry of userEntries) {
      const u = entry.value;
      const userWithSchool = {
        ...u,
        passwordHash: undefined,
        schoolName: u.schoolId ? schoolMap.get(u.schoolId) : undefined,
      };
      users.push(userWithSchool);
    }

    users.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  async PATCH(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId, updates } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const userResult = await kv.get<User>(["users:id", userId]);

    if (!userResult.value) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetUser = userResult.value;

    if (updates.role !== undefined) {
      if (!["teacher", "delegate", "school_admin", "super_admin"].includes(updates.role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      targetUser.role = updates.role;
    }

    if (updates.schoolId !== undefined) {
      if (updates.schoolId === null) {
        targetUser.schoolId = null;
      } else {
        const schoolResult = await kv.get(["schools:id", updates.schoolId]);
        if (!schoolResult.value) {
          return new Response(JSON.stringify({ error: "School not found" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        targetUser.schoolId = updates.schoolId;
      }
    }

    await kv.set(["users:id", userId], targetUser);
    await kv.set(["users:email", targetUser.email], targetUser);

    return new Response(JSON.stringify({ success: true, user: targetUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  async POST(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, displayName, role, schoolId, username, sendEmail } = await req.json();

    if (!email || !displayName || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return new Response(JSON.stringify({ error: emailError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["teacher", "delegate", "school_admin", "super_admin"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already registered" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (schoolId) {
      const kv = await getKv();
      const schoolResult = await kv.get(["schools:id", schoolId]);
      if (!schoolResult.value) {
        return new Response(JSON.stringify({ error: "School not found" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Create user without password (they'll set it via verification email)
    const placeholderHash = await hashPassword(crypto.randomUUID());
    const newUser = await createUser({
      email: email.toLowerCase(),
      passwordHash: placeholderHash,
      displayName,
      username: username || "",
      schoolId: schoolId || null,
      verified: false,
      role,
      delegatedToUserIds: [],
      googleBooksApiKey: null,
      googleSheetUrl: null,
      isPlaceholder: false,
    });

    // Send verification email if requested
    if (sendEmail) {
      const { sendVerificationEmail } = await import("../../../utils/email.ts");
      const kv = await getKv();
      const verificationCode = crypto.randomUUID();
      await kv.set(["verifications", verificationCode], newUser.id, {
        expireIn: 24 * 60 * 60 * 1000,
      });

      const emailResult = await sendVerificationEmail(newUser.email, verificationCode);
      if (!emailResult.success) {
        return new Response(JSON.stringify({
          error: emailResult.error || "Failed to send invitation email"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, user: newUser }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  },

  async DELETE(req) {
    const user = await getUserFromSession(req);
    if (!user || !isSuperAdmin(user)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (userId === user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    const userResult = await kv.get<User>(["users:id", userId]);

    if (!userResult.value) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetUser = userResult.value;

    await kv.delete(["users:id", userId]);
    await kv.delete(["users:email", targetUser.email]);
    if (targetUser.schoolId && targetUser.username) {
      await kv.delete(["users:username", targetUser.schoolId, targetUser.username]);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};