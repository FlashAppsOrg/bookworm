import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getKv, User } from "../../../utils/db.ts";
import { getUserById, getSchoolById } from "../../../utils/db-helpers.ts";
import { validateEmail } from "../../../utils/auth.ts";
import { sendVerificationEmail } from "../../../utils/email.ts";

export const handler: Handlers = {
  async POST(req) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { teacherId, email } = await req.json();

    if (!teacherId || !email) {
      return new Response(JSON.stringify({ error: "Teacher ID and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return new Response(JSON.stringify({ error: emailError }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();

    // Get the teacher
    const teacher = await getUserById(teacherId);
    if (!teacher) {
      return new Response(JSON.stringify({ error: "Teacher not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions
    if (user.role === "delegate") {
      const delegateToIds = user.delegatedToUserIds || [];
      if (!delegateToIds.includes(teacherId)) {
        return new Response(JSON.stringify({ error: "Not authorized to invite this teacher" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else if (user.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Only delegates and super admins can invite teachers" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If teacher has a school, validate email domain matches school domain
    if (teacher.schoolId) {
      const school = await getSchoolById(teacher.schoolId);
      if (school && school.domain) {
        const emailDomain = email.split("@")[1]?.toLowerCase();
        if (emailDomain !== school.domain.toLowerCase()) {
          return new Response(JSON.stringify({
            error: `Email domain must match school domain: ${school.domain}`
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    // Check if email already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUserResult = await kv.get<User>(["users:email", normalizedEmail]);
    if (existingUserResult.value && existingUserResult.value.id !== teacherId) {
      return new Response(JSON.stringify({ error: "Email already registered to another user" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update teacher with new email
    const oldEmail = teacher.email;
    teacher.email = normalizedEmail;
    teacher.isPlaceholder = false;
    teacher.verified = false;

    // Create verification code
    const verificationCode = crypto.randomUUID();
    await kv.set(["verifications", verificationCode], teacher.id, {
      expireIn: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send invitation email
    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode);
    if (!emailResult.success) {
      return new Response(JSON.stringify({
        error: emailResult.error || "Failed to send invitation email"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save teacher with updated email
    await kv.set(["users:id", teacher.id], teacher);

    // Update email index
    if (oldEmail !== normalizedEmail) {
      await kv.delete(["users:email", oldEmail.toLowerCase()]);
    }
    await kv.set(["users:email", normalizedEmail], teacher);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};