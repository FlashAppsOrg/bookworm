import { Handlers } from "$fresh/server.ts";
import { getKv, User, ParentStudent } from "../../../utils/db.ts";
import { hashPassword } from "../../../utils/password.ts";
import { createSession } from "../../../utils/session.ts";
import { sendVerificationEmail } from "../../../utils/email.ts";
import { getUserById, getSchoolById } from "../../../utils/db-helpers.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { email, password, displayName, schoolId, studentInfo } = body;

      if (!email || !password || !displayName || !schoolId || !studentInfo) {
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

      // Check if email already exists
      const existingUser = await kv.get(["users:email", email.toLowerCase()]);
      if (existingUser.value) {
        return new Response(JSON.stringify({ error: "Email already registered" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify school exists
      const school = await getSchoolById(schoolId);
      if (!school) {
        return new Response(JSON.stringify({ error: "Invalid school" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify teacher exists
      const teacher = await getUserById(studentInfo.teacherId);
      if (!teacher) {
        return new Response(JSON.stringify({ error: "Invalid teacher" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create parent user
      const passwordHash = await hashPassword(password);
      const userId = crypto.randomUUID();
      const user: User = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        username: "", // Parents don't need usernames
        schoolId,
        verified: false, // Will need email verification
        role: "parent",
        delegatedToUserIds: [],
        googleBooksApiKey: null,
        googleSheetUrl: null,
        isPlaceholder: false,
        createdAt: new Date().toISOString(),
      };

      // Create parent-student association
      const parentStudentId = crypto.randomUUID();
      const parentStudent: ParentStudent = {
        id: parentStudentId,
        parentId: userId,
        parentName: displayName,
        studentName: studentInfo.studentName,
        studentId: studentInfo.studentId,
        teacherId: studentInfo.teacherId,
        teacherName: teacher.displayName,
        schoolId,
        grade: studentInfo.grade,
        status: "pending", // Teacher needs to verify
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
        createdAt: new Date().toISOString(),
      };

      // Save to database
      await kv.set(["users:id", userId], user);
      await kv.set(["users:email", email.toLowerCase()], user);
      await kv.set(["parent_students", parentStudentId], parentStudent);
      await kv.set(["parent_students:parent", userId, parentStudentId], parentStudent);
      await kv.set(["parent_students:teacher", teacher.id, parentStudentId], parentStudent);

      // Send verification email
      const verificationToken = crypto.randomUUID();
      await kv.set(
        ["verificationTokens", verificationToken],
        {
          token: verificationToken,
          email: email.toLowerCase(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
        { expireIn: 24 * 60 * 60 * 1000 }
      );

      try {
        await sendVerificationEmail(email, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue anyway - user can request resend
      }

      // Create session
      const sessionCookie = await createSession(user);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Account created successfully. Please check your email to verify your account.",
          userId,
          parentStudentId,
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `session=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
          },
        }
      );
    } catch (error) {
      console.error("Parent signup error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};