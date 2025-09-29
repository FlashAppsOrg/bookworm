import { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import ParentSignupForm from "../islands/ParentSignupForm.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const bookId = url.searchParams.get("bookId");
    const userId = url.searchParams.get("userId");
    const schoolId = url.searchParams.get("schoolId");
    const step = url.searchParams.get("step");

    return ctx.render({ bookId, userId, schoolId, step });
  },
};

export default function ParentSignupPage({ data }: { data: { bookId?: string; userId?: string; schoolId?: string; step?: string } }) {
  return (
    <>
      <Head>
        <title>Parent/Guardian Sign Up - BookWorm</title>
        <meta name="description" content="Create a parent account to review and challenge books in your child's classroom" />
      </Head>
      <div class="min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/20 via-white to-secondary/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <a href="/login" class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Already have an account? Log in
              </a>
            </div>
          </div>
        </header>

        <main class="flex-1 flex items-center justify-center p-4">
          <div class="w-full max-w-2xl">
            <div class="text-center mb-8">
              <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Parent/Guardian Registration
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                Create an account to review books in your child's classroom
              </p>
            </div>

            <ParentSignupForm
              bookId={data.bookId}
              userId={data.userId}
              schoolId={data.schoolId}
              step={data.step}
            />
          </div>
        </main>

        <footer class="text-center py-6">
          <p class="text-gray-600 dark:text-gray-400">
            Need help? Contact your school administrator
          </p>
        </footer>
      </div>
    </>
  );
}