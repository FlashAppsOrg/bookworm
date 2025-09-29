import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getBookwormKv } from "../utils/db-shared.ts";
import { School } from "../utils/db.ts";
import DelegateRequestForm from "../islands/DelegateRequestForm.tsx";

interface DelegateRequestData {
  schools: School[];
}

export const handler: Handlers<DelegateRequestData> = {
  async GET(req, ctx) {
    // Get all schools for selection
    const kv = await getBookwormKv();
    const schools: School[] = [];

    const iter = kv.list<School>({ prefix: ["schools:id"] });
    for await (const entry of iter) {
      schools.push(entry.value);
    }

    schools.sort((a, b) => a.name.localeCompare(b.name));

    return ctx.render({ schools });
  },
};

export default function DelegateRequestPage({ data }: PageProps<DelegateRequestData>) {
  const { schools } = data;

  return (
    <>
      <Head>
        <title>Request Delegate Access - BookWorm</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              <div class="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-10 h-10 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Become a Delegate Helper
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                Request access to help a teacher organize their classroom library
              </p>
            </div>

            <DelegateRequestForm schools={schools} />
          </div>

          <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              What happens next?
            </h3>
            <ol class="space-y-2 text-sm text-blue-800 dark:text-blue-400 list-decimal list-inside">
              <li>You create your account and select the teacher you want to help</li>
              <li>The teacher receives a notification about your request</li>
              <li>Once approved, you can help add and organize books</li>
              <li>You can be a delegate for multiple teachers</li>
            </ol>
          </div>

          <div class="mt-4 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Have an invitation link from a teacher?{" "}
              <a href="/delegate-signup" class="text-primary hover:underline">
                Use invitation instead
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}