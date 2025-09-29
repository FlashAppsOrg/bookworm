import { Handlers, PageProps } from "$fresh/server.ts";
import { getKv, ClassroomBook, User, School } from "../utils/db.ts";
import { getUserFromSession } from "../utils/session.ts";
import MultipleChallengeForm from "../islands/MultipleChallengeForm.tsx";
import { Head } from "$fresh/runtime.ts";

interface BookWithTeacher extends ClassroomBook {
  teacherName: string;
  teacherId: string;
}

interface MultipleChallengePageData {
  books: BookWithTeacher[];
  school: School;
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

    // Check if parent is logged in
    const parent = await getUserFromSession(req);

    // Check if authentication is required and parent is not logged in
    const needsAuth = !parent && registered !== "true";

    return ctx.render({
      books,
      school,
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
                  href={`/parent-signup?redirect=${encodeURIComponent(`/challenge-books?${books.map(b => `bookId=${b.id}&userId=${b.teacherId}`).join('&')}`)}`}
                  class="block w-full text-center py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                >
                  Create Parent Account
                </a>
                <a
                  href={`/login?redirect=${encodeURIComponent(`/challenge-books?${books.map(b => `bookId=${b.id}&userId=${b.teacherId}`).join('&')}`)}`}
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