import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../../utils/session.ts";
import { getParentStudents } from "../../utils/auth-shared.ts";
import { getKv, School } from "../../utils/db.ts";
import StudentClaimForm from "../../islands/StudentClaimForm.tsx";

interface ClaimStudentsData {
  parentId: string;
  parentEmail: string;
  schools: School[];
  existingStudents: Array<{
    id: string;
    name: string;
    schoolName: string;
    grade: string;
    verified: boolean;
  }>;
}

export const handler: Handlers<ClaimStudentsData> = {
  async GET(req, ctx) {
    // Check if user is authenticated
    const user = await getUserFromSession(req);
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login?redirect=/parent/claim-students",
        },
      });
    }

    // Only parents can access this
    if (user.role !== "parent") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard",
        },
      });
    }

    // Get existing students
    const students = await getParentStudents(user.id);

    // Get all schools
    const kv = await getKv();
    const schools: School[] = [];
    const iter = kv.list<School>({ prefix: ["schools:id"] });
    for await (const entry of iter) {
      schools.push(entry.value);
    }
    schools.sort((a, b) => a.name.localeCompare(b.name));

    // Transform students for display
    const existingStudents = await Promise.all(students.map(async (student) => {
      const schoolResult = await kv.get<School>(["schools:id", student.schoolId]);
      return {
        id: student.id,
        name: student.name,
        schoolName: schoolResult.value?.name || "Unknown School",
        grade: student.grade,
        verified: student.verified,
      };
    }));

    return ctx.render({
      parentId: user.id,
      parentEmail: user.email,
      schools,
      existingStudents,
    });
  },
};

export default function ClaimStudentsPage({ data }: PageProps<ClaimStudentsData>) {
  const { parentId, parentEmail, schools, existingStudents } = data;

  return (
    <>
      <Head>
        <title>Add Your Children - BookWorm</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <nav class="space-x-4">
                <a href="/parent-dashboard" class="text-gray-600 dark:text-gray-400 hover:text-primary">
                  Dashboard
                </a>
                <a href="/logout" class="text-gray-600 dark:text-gray-400 hover:text-primary">
                  Sign Out
                </a>
              </nav>
            </div>
          </div>
        </header>

        <div class="container mx-auto p-4 py-12 max-w-3xl">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to BookWorm!
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Add your children to view their classroom libraries
            </p>
          </div>

          <StudentClaimForm
            parentId={parentId}
            parentEmail={parentEmail}
            schools={schools}
            existingStudents={existingStudents}
          />

          {existingStudents.length > 0 && (
            <div class="mt-6 text-center">
              <a
                href="/parent-dashboard"
                class="text-primary hover:underline font-semibold"
              >
                Skip and go to dashboard →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}