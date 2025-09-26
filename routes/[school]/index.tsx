import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getSchoolBySlug, getSchoolBooksWithTeachers, SchoolBookWithTeacher } from "../../utils/db-helpers.ts";
import SchoolCatalog from "../../islands/SchoolCatalog.tsx";

interface SchoolCatalogData {
  school: { id: string; name: string; slug: string; };
  books: SchoolBookWithTeacher[];
  teacherCount: number;
}

export const handler: Handlers<SchoolCatalogData> = {
  async GET(req, ctx) {
    const { school } = ctx.params;

    const schoolRecord = await getSchoolBySlug(school);
    if (!schoolRecord) {
      return ctx.renderNotFound();
    }

    const books = await getSchoolBooksWithTeachers(schoolRecord.id);
    const uniqueTeachers = new Set(books.map(b => b.teacherUsername));

    return ctx.render({
      school: schoolRecord,
      books,
      teacherCount: uniqueTeachers.size,
    });
  },
};

export default function SchoolCatalogPage({ data }: PageProps<SchoolCatalogData>) {
  return (
    <>
      <Head>
        <title>{data.school.name} - BookWorm School Catalog</title>
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
          <div class="max-w-7xl mx-auto">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6 transition-colors">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {data.school.name} Book Catalog
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                {data.books.length} book{data.books.length !== 1 ? "s" : ""} across {data.teacherCount} classroom{data.teacherCount !== 1 ? "s" : ""}
              </p>
            </div>

            {data.books.length > 0 ? (
              <SchoolCatalog books={data.books} schoolSlug={data.school.slug} />
            ) : (
              <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                <div class="text-6xl mb-4">📚</div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No books yet
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  This school's catalog is still being built
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