import { Handlers, PageProps } from "$fresh/server.ts";
import { getKv, ClassroomBook, User, School } from "../utils/db.ts";
import ChallengeForm from "../islands/ChallengeForm.tsx";

interface ChallengePageData {
  book: ClassroomBook;
  teacher: User;
  school: School;
}

export const handler: Handlers<ChallengePageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");
    const userId = url.searchParams.get("userId");

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

    return ctx.render({
      book: bookResult.value,
      teacher: teacherResult.value,
      school: schoolResult.value,
    });
  },
};

export default function ChallengePage({ data }: PageProps<ChallengePageData>) {
  return (
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

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ChallengeForm
            bookId={data.book.id}
            userId={data.book.userId}
            bookTitle={data.book.title}
            teacherName={data.teacher.displayName}
            schoolName={data.school.name}
          />
        </div>
      </div>
    </div>
  );
}