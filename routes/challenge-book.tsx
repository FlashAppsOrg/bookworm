import { Handlers, PageProps } from "$fresh/server.ts";
import { getKv, ClassroomBook, User, School } from "../utils/db.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getTeachersBySchoolId } from "../utils/db-helpers.ts";
import ChallengeForm from "../islands/ChallengeForm.tsx";
import { Head } from "$fresh/runtime.ts";

interface ChallengePageData {
  book: ClassroomBook;
  teacher: User;
  school: School;
  schoolTeachers: Array<{id: string; name: string;}>;
  parent: User | null;
  needsAuth: boolean;
}

export const handler: Handlers<ChallengePageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");
    const userId = url.searchParams.get("userId");
    const registered = url.searchParams.get("registered");

    if (!bookId || !userId) {
      return new Response("Missing required parameters", { status: 400 });
    }

    const kv = await getKv();

    const bookResult = await kv.get<ClassroomBook>(["classroomBooks", userId, bookId]);
    if (!bookResult.value) {
      return new Response("Book not found", { status: 404 });
    }

    const teacherResult = await kv.get<User>(["users:id", userId]);
    if (!teacherResult.value) {
      return new Response("Teacher not found", { status: 404 });
    }

    const teacher = teacherResult.value;

    if (!teacher.schoolId) {
      return new Response("Teacher not assigned to a school", { status: 400 });
    }

    const schoolResult = await kv.get<School>(["schools:id", teacher.schoolId]);
    if (!schoolResult.value) {
      return new Response("School not found", { status: 404 });
    }

    // Get all teachers from this school for the dropdown
    const teachers = await getTeachersBySchoolId(teacher.schoolId);
    const schoolTeachers = teachers.map(t => ({
      id: t.id,
      name: t.displayName
    }));

    // Check if parent is logged in
    const parent = await getUserFromSession(req);

    // For now, allow anonymous challenges but show a message encouraging registration
    // In the future, we can make authentication required
    const needsAuth = !parent && !registered;

    return ctx.render({
      book: bookResult.value,
      teacher: teacherResult.value,
      school: schoolResult.value,
      schoolTeachers,
      parent,
      needsAuth,
    });
  },
};

export default function ChallengePage({ data }: PageProps<ChallengePageData>) {
  return (
    <>
      <Head>
        <title>Challenge Book - {data.book.title}</title>
      </Head>
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-3xl mx-auto px-4 py-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Challenge Book
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Submit a formal challenge for review by school administration
            </p>
          </div>

          {data.needsAuth && (
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
                Create a Parent Account for Better Service
              </h2>
              <p class="text-blue-800 dark:text-blue-400 mb-4">
                While you can submit challenges anonymously, creating a parent account provides:
              </p>
              <ul class="list-disc list-inside text-blue-800 dark:text-blue-400 mb-4 space-y-1">
                <li>Track the status of your challenges</li>
                <li>Receive email updates on review progress</li>
                <li>Access your child's full classroom book list</li>
                <li>Faster processing with verified parent status</li>
              </ul>
              <div class="flex flex-wrap gap-3">
                <a
                  href={`/parent-signup?bookId=${data.book.id}&userId=${data.book.userId}&schoolId=${data.school.id}`}
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Create Parent Account
                </a>
                <a
                  href="/login"
                  class="px-6 py-2 bg-white dark:bg-gray-800 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Sign In
                </a>
              </div>
            </div>
          )}

          {data.parent && data.parent.role === "parent" && (
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p class="text-green-800 dark:text-green-400">
                ✓ Logged in as: <strong>{data.parent.displayName}</strong>
              </p>
            </div>
          )}

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <ChallengeForm
              bookId={data.book.id}
              userId={data.book.userId}
              bookTitle={data.book.title}
              teacherName={data.teacher.displayName}
              schoolName={data.school.name}
              schoolTeachers={data.schoolTeachers}
              parentId={data.parent?.id}
              parentName={data.parent?.displayName}
              parentEmail={data.parent?.email}
            />
          </div>
        </div>
      </div>
    </>
  );
}