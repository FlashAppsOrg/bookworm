import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getSchoolBySlug, getUserBooks } from "../../utils/db-helpers.ts";
import { getKv, User, ClassroomBook } from "../../utils/db.ts";

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
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6 transition-colors">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {data.teacher.displayName}'s Classroom
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                {data.schoolName} • {data.books.length} book{data.books.length !== 1 ? "s" : ""}
              </p>
            </div>

            {data.books.length > 0 ? (
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.books.map((book) => (
                  <div
                    key={book.id}
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-colors"
                  >
                    {book.thumbnail && (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        class="w-full h-48 object-contain mb-3"
                      />
                    )}
                    <h3 class="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {book.title}
                    </h3>
                    {book.authors && book.authors.length > 0 && (
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        by {book.authors.join(", ")}
                      </p>
                    )}
                    {book.publisher && (
                      <p class="text-xs text-gray-500 dark:text-gray-500">
                        {book.publisher}
                      </p>
                    )}
                    {book.publishedDate && (
                      <p class="text-xs text-gray-500 dark:text-gray-500">
                        {book.publishedDate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                <div class="text-6xl mb-4">📚</div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No books yet
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  This classroom's library is still being built
                </p>
              </div>
            )}
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