import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function SignupPage(props: PageProps) {
  const url = new URL(props.url);
  const redirect = url.searchParams.get("redirect") || "/";

  return (
    <>
      <Head>
        <title>Sign Up - BookWorm</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <a href="/login" class="text-gray-600 dark:text-gray-400 hover:text-primary">
                Log In
              </a>
            </div>
          </div>
        </header>

        <div class="container mx-auto p-4 py-12 max-w-6xl">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Join BookWorm
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Choose how you'd like to use BookWorm
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-6 mb-8">
            {/* Parent Signup */}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-transparent hover:border-primary transition-colors">
              <div class="text-center mb-4">
                <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg class="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  I'm a Parent
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  View your child's classroom library and challenge books if needed
                </p>
              </div>

              <div class="space-y-3">
                <a
                  href={`/api/auth/google/login?redirect=${encodeURIComponent(redirect)}`}
                  class="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </a>

                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                  </div>
                </div>

                <a
                  href={`/parent-signup?redirect=${encodeURIComponent(redirect)}`}
                  class="block text-center w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign Up with Email
                </a>
              </div>
            </div>

            {/* Teacher Signup */}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-transparent hover:border-primary transition-colors">
              <div class="text-center mb-4">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg class="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  I'm a Teacher
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  Manage your classroom library and share books with parents
                </p>
              </div>

              <div class="space-y-3">
                <a
                  href="/teacher-signup"
                  class="block text-center w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Create Teacher Account
                </a>
                <p class="text-xs text-center text-gray-500 dark:text-gray-400">
                  You'll need your school email address
                </p>
              </div>
            </div>

            {/* Delegate/Helper Signup */}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-transparent hover:border-primary transition-colors">
              <div class="text-center mb-4">
                <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg class="w-8 h-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  I'm a Helper
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  Help teachers organize their classroom libraries as a delegate
                </p>
              </div>

              <div class="space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  You'll need an invitation from a teacher to become a delegate
                </p>
                <a
                  href="/delegate-signup"
                  class="block text-center w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Join as Delegate
                </a>
                <p class="text-xs text-center text-gray-500 dark:text-gray-400">
                  Ask your teacher for an invitation link
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 mb-8">
            <h3 class="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              About BookWorm Roles
            </h3>
            <div class="grid md:grid-cols-3 gap-4 text-sm text-yellow-800 dark:text-yellow-400">
              <div>
                <strong>Parents</strong> can view classroom libraries, challenge books under NC HB 805, and track their children across multiple classrooms.
              </div>
              <div>
                <strong>Teachers</strong> manage their classroom book catalogs, review parent challenges, and can invite helpers to assist with organization.
              </div>
              <div>
                <strong>Delegates</strong> are helpers (spouses, assistants, parent volunteers) who can help teachers add and organize books in their catalogs.
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div class="text-center">
            <p class="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <a href={`/login?redirect=${encodeURIComponent(redirect)}`} class="text-primary hover:underline font-semibold">
                Sign In
              </a>
            </p>
          </div>
        </div>

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