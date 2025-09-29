import { Handlers } from "$fresh/server.ts";
import { getKv, ParentStudent } from "../../../utils/db.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { getUserById, getSchoolById } from "../../../utils/db-helpers.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { studentName, studentId, grade, teacherId, schoolId } = body;

      if (!studentName || !teacherId || !schoolId || !grade) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get current user from session
      const user = await getUserFromSession(req);
      if (!user || user.role !== "parent") {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();

      // Verify school exists
      const school = await getSchoolById(schoolId);
      if (!school) {
        return new Response(JSON.stringify({ error: "Invalid school" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify teacher exists
      const teacher = await getUserById(teacherId);
      if (!teacher) {
        return new Response(JSON.stringify({ error: "Invalid teacher" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Update user's schoolId
      const updatedUser = { ...user, schoolId };
      await kv.set(["users:id", user.id], updatedUser);
      await kv.set(["users:email", user.email], updatedUser);

      // Create parent-student association
      const parentStudentId = crypto.randomUUID();
      const parentStudent: ParentStudent = {
        id: parentStudentId,
        parentId: user.id,
        parentName: user.displayName,
        studentName: studentName.trim(),
        studentId: studentId?.trim() || null,
        teacherId,
        teacherName: teacher.displayName,
        schoolId,
        grade: grade.trim(),
        status: "pending", // Teacher needs to verify
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
        createdAt: new Date().toISOString(),
      };

      // Save parent-student association
      await kv.set(["parent_students", parentStudentId], parentStudent);
      await kv.set(["parent_students:parent", user.id, parentStudentId], parentStudent);
      await kv.set(["parent_students:teacher", teacher.id, parentStudentId], parentStudent);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Student information submitted for verification.",
          parentStudentId,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Parent student verification error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};