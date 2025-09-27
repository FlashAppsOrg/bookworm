import { Handlers } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { getKv, User, School, ClassroomBook } from "../../../utils/db.ts";

export interface ClassroomBookWithDetails extends ClassroomBook {
  teacherName: string;
  teacherEmail: string;
  teacherUsername: string;
  schoolName: string;
  schoolSlug: string;
  isPlaceholder: boolean;
}

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

    const schoolMap = new Map<string, School>();
    const schoolEntries = kv.list<School>({ prefix: ["schools", "id"] });
    for await (const entry of schoolEntries) {
      schoolMap.set(entry.value.id, entry.value);
    }

    const userMap = new Map<string, User>();
    const userEntries = kv.list<User>({ prefix: ["users", "id"] });
    for await (const entry of userEntries) {
      userMap.set(entry.value.id, entry.value);
    }

    const allBooks: ClassroomBookWithDetails[] = [];
    const bookEntries = kv.list<ClassroomBook>({ prefix: ["classroomBooks"] });

    for await (const entry of bookEntries) {
      const book = entry.value;
      const teacher = userMap.get(book.userId);

      if (!teacher) continue;

      const school = teacher.schoolId ? schoolMap.get(teacher.schoolId) : null;

      allBooks.push({
        ...book,
        teacherName: teacher.displayName,
        teacherEmail: teacher.email,
        teacherUsername: teacher.username,
        schoolName: school?.name || "Unknown",
        schoolSlug: school?.slug || "",
        isPlaceholder: teacher.isPlaceholder,
      });
    }

    allBooks.sort((a, b) => {
      const schoolCompare = a.schoolName.localeCompare(b.schoolName);
      if (schoolCompare !== 0) return schoolCompare;

      const teacherCompare = a.teacherName.localeCompare(b.teacherName);
      if (teacherCompare !== 0) return teacherCompare;

      return a.title.localeCompare(b.title);
    });

    return new Response(JSON.stringify(allBooks), {
      status: 200,
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
    const bookId = url.searchParams.get("bookId");
    const userId = url.searchParams.get("userId");

    if (!bookId || !userId) {
      return new Response(JSON.stringify({ error: "Book ID and User ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kv = await getKv();
    await kv.delete(["classroomBooks", userId, bookId]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};