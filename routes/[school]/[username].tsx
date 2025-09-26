import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getSchoolBySlug, getUserBooks } from "../../utils/db-helpers.ts";
import { getKv, User, ClassroomBook } from "../../utils/db.ts";
import PublicClassroom from "../../islands/PublicClassroom.tsx";

interface ClassroomData {
  teacher: User;
  books: ClassroomBook[];
  schoolName: string;
}

export const handler: Handlers<ClassroomData> = {
  async GET(req, ctx) {
    const { school, username } = ctx.params;

    const schoolRecord = await getSchoolBySlug(school);
    if (!schoolRecord) {
      return ctx.renderNotFound();
    }

    const kv = await getKv();
    const userIdResult = await kv.get<string>(["usernames", schoolRecord.id, username.toLowerCase()]);

    if (!userIdResult.value) {
      return ctx.renderNotFound();
    }

    const userResult = await kv.get<User>(["users:id", userIdResult.value]);
    if (!userResult.value) {
      return ctx.renderNotFound();
    }

    const teacher = userResult.value;
    const books = await getUserBooks(teacher.id);

    return ctx.render({
      teacher,
      books,
      schoolName: schoolRecord.name,
    });
  },
};

export default function ClassroomPage({ data }: PageProps<ClassroomData>) {
  return (
    <>
      <Head>
        <title>{data.teacher.displayName}'s Classroom - BookWorm</title>
      </Head>
      <div class="min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/20 via-white to-secondary/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <div class="flex gap-2">
                <a
                  href="/login"
                  class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  Log In
                </a>
                <a
                  href="/signup"
                  class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 container mx-auto px-4 py-8">
          <div class="max-w-6xl mx-auto">
            <PublicClassroom
              books={data.books}
              teacherName={data.teacher.displayName}
              schoolName={data.schoolName}
            />
          </div>
        </main>

        <footer class="text-center py-4">
          <div class="flex flex-col items-center">
            <div class="relative w-full max-w-xs md:max-w-md px-4">
              <div class="text-lg md:text-2xl font-bold text-primary dark:text-primary-light absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                BookWorm by
              </div>
              <img src="/flash-apps-horizontal.svg" alt="FlashApps" class="w-full" />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}