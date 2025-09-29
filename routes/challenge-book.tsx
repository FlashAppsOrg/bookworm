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
                  href={`/api/auth/google/login?bookId=${data.book.id}&userId=${data.book.userId}`}
                  class="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </a>
                <a
                  href={`/parent-signup?redirect=${encodeURIComponent(`/challenge-book?bookId=${data.book.id}&userId=${data.book.userId}`)}`}
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Create with Email
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