import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getKv, School } from "../utils/db.ts";
import TeacherSignupForm from "../islands/TeacherSignupForm.tsx";

interface TeacherSignupData {
  schools: School[];
  redirect: string;
}

export const handler: Handlers<TeacherSignupData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const redirect = url.searchParams.get("redirect") || "/dashboard";

    // Get all schools for dropdown
    const kv = await getKv();
    const schools: School[] = [];

    const iter = kv.list<School>({ prefix: ["schools:id"] });
    for await (const entry of iter) {
      schools.push(entry.value);
    }

    // Sort schools by name
    schools.sort((a, b) => a.name.localeCompare(b.name));

    return ctx.render({
      schools,
      redirect,
    });
  },
};

export default function TeacherSignupPage({ data }: PageProps<TeacherSignupData>) {
  const { schools, redirect } = data;

  return (
    <>
      <Head>
        <title>Teacher Sign Up - BookWorm</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <nav class="space-x-4">
                <a href="/signup" class="text-gray-600 dark:text-gray-400 hover:text-primary">
                  Back to Signup
                </a>
                <a href="/login" class="text-gray-600 dark:text-gray-400 hover:text-primary">
                  Log In
                </a>
              </nav>
            </div>
          </div>
        </header>

        <div class="container mx-auto p-4 py-12 max-w-2xl">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div class="text-center mb-6">
              <div class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-10 h-10 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Teacher Registration
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                Create your teacher account to manage your classroom library
              </p>
            </div>

            <TeacherSignupForm schools={schools} redirect={redirect} />
          </div>

          <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              What you'll be able to do:
            </h3>
            <ul class="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Catalog and organize your classroom books
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Share your library with parents
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Invite helpers to assist with organization
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Review and respond to book challenges
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Import books from CSV or scan barcodes
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}