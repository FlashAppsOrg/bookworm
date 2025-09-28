import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getUserBooks, getUserById, getSchoolById } from "../utils/db-helpers.ts";
import { User, ClassroomBook } from "../utils/db.ts";
import DashboardContent from "../islands/DashboardContent.tsx";

interface DashboardData {
  user: User;
  books: ClassroomBook[];
  teacherName?: string;
  schoolName?: string;
  availableTeachers?: Array<{ id: string; name: string }>;
  selectedTeacherId?: string;
  selectedTeacher?: User;
}

export const handler: Handlers<DashboardData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    if (!user.verified) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/verify" },
      });
    }

    if (!user.schoolId && user.role !== "super_admin") {
      return new Response(null, {
        status: 302,
        headers: { Location: "/setup" },
      });
    }

    // For delegates with multiple classrooms, check for selected teacher
    // For super_admin, allow selecting any teacher
    let selectedTeacherId: string | undefined;
    let availableTeachers: Array<{ id: string; name: string }> | undefined;
    let teacherName: string | undefined;

    if (user.role === "super_admin") {
      // Super admin can manage any classroom
      const url = new URL(req.url);
      selectedTeacherId = url.searchParams.get("teacherId") || user.id; // Default to their own

      // Get all teachers
      const { getKv } = await import("../utils/db.ts");
      const kv = await getKv();
      availableTeachers = [];

      const userEntries = kv.list<User>({ prefix: ["users:id"] });
      for await (const entry of userEntries) {
        const u = entry.value;
        if (u.role === "teacher" || u.role === "super_admin") {
          availableTeachers.push({ id: u.id, name: u.displayName });
        }
      }

      // Sort by name
      availableTeachers.sort((a, b) => a.name.localeCompare(b.name));

      if (selectedTeacherId) {
        const teacher = await getUserById(selectedTeacherId);
        teacherName = teacher?.displayName;
      }
    } else if (user.role === "delegate") {
      // Support both old singular field and new array field
      const delegateToIds = user.delegatedToUserIds ||
        ((user as any).delegatedToUserId ? [(user as any).delegatedToUserId] : []);

      // If multiple classrooms, need to pick one
      if (delegateToIds.length > 1) {
        const url = new URL(req.url);
        selectedTeacherId = url.searchParams.get("teacherId") || delegateToIds[0]; // Default to first teacher

        // Verify they have access to this teacher
        if (!delegateToIds.includes(selectedTeacherId)) {
          // If invalid teacher selected, default to first
          selectedTeacherId = delegateToIds[0];
        }
      } else if (delegateToIds.length === 1) {
        selectedTeacherId = delegateToIds[0];
      }

      // Get list of teachers for switcher
      availableTeachers = [];
      for (const teacherId of delegateToIds) {
        const teacher = await getUserById(teacherId);
        if (teacher) {
          availableTeachers.push({ id: teacher.id, name: teacher.displayName });
        }
      }

      if (selectedTeacherId) {
        const teacher = await getUserById(selectedTeacherId);
        teacherName = teacher?.displayName;
      }
    }

    const booksUserId = selectedTeacherId || user.id;
    const books = await getUserBooks(booksUserId);

    // Get full teacher object for delegates/super_admin
    let selectedTeacher: User | undefined;
    if (selectedTeacherId && selectedTeacherId !== user.id) {
      selectedTeacher = await getUserById(selectedTeacherId) || undefined;
    }

    // Get school name from selected teacher or current user
    let schoolName: string | undefined;
    const schoolId = selectedTeacher?.schoolId || user.schoolId;
    if (schoolId) {
      const school = await getSchoolById(schoolId);
      schoolName = school?.name;
    }

    return ctx.render({ user, books, teacherName, schoolName, availableTeachers, selectedTeacherId, selectedTeacher });
  },
};

export default function DashboardPage({ data }: PageProps<DashboardData>) {
  return (
    <>
      <Head>
        <title>Dashboard - BookWorm</title>
      </Head>
      <DashboardContent
        user={data.user}
        initialBooks={data.books}
        teacherName={data.teacherName}
        schoolName={data.schoolName}
        availableTeachers={data.availableTeachers}
        selectedTeacherId={data.selectedTeacherId}
        selectedTeacher={data.selectedTeacher}
      />
    </>
  );
}