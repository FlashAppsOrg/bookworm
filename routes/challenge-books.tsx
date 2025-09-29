import { Handlers, PageProps } from "$fresh/server.ts";
import { getKv, ClassroomBook, User, School } from "../utils/db.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getTeachersBySchoolId } from "../utils/db-helpers.ts";
import MultipleChallengeForm from "../islands/MultipleChallengeForm.tsx";
import { Head } from "$fresh/runtime.ts";

interface BookWithTeacher extends ClassroomBook {
  teacherName: string;
  teacherId: string;
}

interface MultipleChallengePageData {
  books: BookWithTeacher[];
  school: School;
  schoolTeachers: Array<{id: string; name: string;}>;
  parent: User | null;
  needsAuth: boolean;
}

export const handler: Handlers<MultipleChallengePageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const bookIds = url.searchParams.getAll("bookId");
    const userIds = url.searchParams.getAll("userId");
    const registered = url.searchParams.get("registered");

    console.log("Challenge-books: bookIds:", bookIds, "userIds:", userIds);

    if (bookIds.length === 0 || userIds.length === 0 || bookIds.length !== userIds.length) {
      return new Response("Invalid parameters", { status: 400 });
    }

    const kv = await getKv();
    const books: BookWithTeacher[] = [];
    let school: School | null = null;

    // Fetch all books and their teachers
    for (let i = 0; i < bookIds.length; i++) {
      const bookId = bookIds[i];
      const userId = userIds[i];

      console.log(`Looking up book: ["classroomBooks", "${userId}", "${bookId}"]`);
      const bookResult = await kv.get<ClassroomBook>(["classroomBooks", userId, bookId]);
      if (!bookResult.value) {
        console.log(`Book not found for userId: ${userId}, bookId: ${bookId}`);
        continue;
      }

      const teacherResult = await kv.get<User>(["users:id", userId]);
      if (!teacherResult.value) {
        console.log(`Teacher not found for userId: ${userId}`);
        continue;
      }

      const teacher = teacherResult.value;

      // Get school from first teacher
      if (!school && teacher.schoolId) {
        const schoolResult = await kv.get<School>(["schools:id", teacher.schoolId]);
        if (schoolResult.value) {
          school = schoolResult.value;
        }
      }

      books.push({
        ...bookResult.value,
        teacherName: teacher.displayName,
        teacherId: teacher.id,
      });
    }

    if (books.length === 0) {
      return new Response("No valid books found", { status: 404 });
    }

    if (!school) {
      return new Response("School not found", { status: 404 });
    }

    // Get all teachers from this school for the dropdown
    const teachers = await getTeachersBySchoolId(school.id);
    const schoolTeachers = teachers.map(t => ({
      id: t.id,
      name: t.displayName
    }));

    // Check if parent is logged in
    const parent = await getUserFromSession(req);

    // Check if authentication is required and parent is not logged in
    const needsAuth = !parent && registered !== "true";

    return ctx.render({
      books,
      school,
      schoolTeachers,
      parent,
      needsAuth,
    });
  },
};

export default function MultipleChallengeBooks({ data }: PageProps<MultipleChallengePageData>) {
  const { books, school, parent, needsAuth } = data;

  return (
    <>
      <Head>
        <title>Challenge Multiple Books - BookWorm</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div class="container mx-auto p-4 py-8 max-w-4xl">
          {needsAuth ? (
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Parent Authentication Required
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                To challenge books in your child's classroom, you need to either:
              </p>
              <div class="space-y-4">
                <a
                  href={`/api/auth/google/login?${books.map(b => `bookId=${b.id}&userId=${b.userId}`).join('&')}`}
                  class="flex items-center justify-center gap-3 w-full py-3 px-6 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </a>
                <a
                  href={`/parent-signup?redirect=${encodeURIComponent(`/challenge-books?${books.map(b => `bookId=${b.id}&userId=${b.userId}`).join('&')}`)}`}
                  class="block w-full text-center py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Create with Email
                </a>
                <a
                  href={`/login?redirect=${encodeURIComponent(`/challenge-books?${books.map(b => `bookId=${b.id}&userId=${b.userId}`).join('&')}`)}`}
                  class="block w-full text-center py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Sign In to Existing Account
                </a>
              </div>
            </div>
          ) : (
            <MultipleChallengeForm
              books={books}
              schoolName={school.name}
              schoolTeachers={schoolTeachers}
              parentId={parent?.id}
              parentName={parent?.displayName}
              parentEmail={parent?.email}
            />
          )}
        </div>
      </div>
    </>
  );
}