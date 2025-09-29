import { Handlers } from "$fresh/server.ts";
import { createOrClaimStudent } from "../../../utils/auth-shared.ts";
import { getUserFromSession } from "../../../utils/session.ts";

export const handler: Handlers = {
  async POST(req) {
    // Check if user is authenticated
    const user = await getUserFromSession(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only parents can claim students
    if (user.role !== "parent") {
      return new Response(JSON.stringify({ error: "Only parents can claim students" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const { studentName, studentId, schoolId, grade, teacherId } = await req.json();

      if (!studentName || !schoolId || !grade) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create or claim the student
      const student = await createOrClaimStudent(
        user.id,
        studentName,
        schoolId,
        grade,
        teacherId,
        studentId
      );

      // TODO: Send notification to teacher for verification

      return new Response(JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          schoolId: student.schoolId,
          grade: student.grade,
          verified: student.verified,
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Failed to claim student:", error);
      return new Response(JSON.stringify({ error: "Failed to claim student" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};