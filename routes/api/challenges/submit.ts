import { Handlers } from "$fresh/server.ts";
import { getKv, BookChallenge, ClassroomBook, User, School } from "../../../utils/db.ts";
import { generateId } from "../../../utils/password.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { bookId, userId, parentName, parentEmail, studentName, reason } = body;

      if (!bookId || !userId || !parentName || !parentEmail || !reason) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(parentEmail)) {
        return new Response(JSON.stringify({ error: "Invalid email address" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const kv = await getKv();

      const bookResult = await kv.get<ClassroomBook>(["classroomBooks", userId, bookId]);
      if (!bookResult.value) {
        return new Response(JSON.stringify({ error: "Book not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const book = bookResult.value;

      const teacherResult = await kv.get<User>(["users", "id", userId]);
      if (!teacherResult.value) {
        return new Response(JSON.stringify({ error: "Teacher not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const teacher = teacherResult.value;

      if (!teacher.schoolId) {
        return new Response(JSON.stringify({ error: "Teacher not assigned to a school" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const schoolResult = await kv.get<School>(["schools", "id", teacher.schoolId]);
      if (!schoolResult.value) {
        return new Response(JSON.stringify({ error: "School not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const school = schoolResult.value;

      const challengeId = generateId();
      const challenge: BookChallenge = {
        id: challengeId,
        bookId,
        bookTitle: book.title,
        bookIsbn: book.isbn,
        teacherId: userId,
        teacherName: teacher.displayName,
        schoolId: teacher.schoolId,
        schoolName: school.name,
        parentName: parentName.trim(),
        parentEmail: parentEmail.toLowerCase().trim(),
        studentName: studentName?.trim(),
        reason: reason.trim(),
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        createdAt: new Date().toISOString(),
      };

      await kv.set(["challenges", "id", challengeId], challenge);
      await kv.set(["challenges", "school", teacher.schoolId, challengeId], true);
      await kv.set(["challenges", "status", "pending", challengeId], true);

      return new Response(JSON.stringify({
        success: true,
        message: "Your challenge has been submitted and will be reviewed by the school administration.",
        challengeId,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Challenge submission error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};