import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import LoginForm from "../islands/LoginForm.tsx";

export default function LoginPage(props: PageProps) {
  const url = new URL(props.url);
  const redirect = url.searchParams.get("redirect") || "/";

  return (
    <>
      <Head>
        <title>Sign In - BookWorm</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <a href="/signup" class="text-gray-600 dark:text-gray-400 hover:text-primary">
                Sign Up
              </a>
            </div>
          </div>
        </header>

        <div class="container mx-auto p-4 py-12 max-w-5xl">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome Back to BookWorm
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Sign in to manage your classroom library
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-6">
            {/* School Sign In - Primary */}
            <div class="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <div class="text-center mb-6">
                <div class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg class="w-10 h-10 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  School Sign In
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                  For teachers, delegates, and administrators
                </p>
              </div>

              <LoginForm redirectUrl={redirect} showTitle={false} />

              <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p class="text-center text-gray-600 dark:text-gray-400 mb-4">
                  New to BookWorm?
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <a
                    href="/teacher-signup"
                    class="text-center py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Teacher Sign Up
                  </a>
                  <a
                    href="/delegate-request"
                    class="text-center py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Become a Helper
                  </a>
                </div>
              </div>
            </div>

            {/* Parent Sign In - Secondary */}
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div class="text-center mb-4">
                <div class="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg class="w-7 h-7 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Parent Access
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  View your child's classroom
                </p>
              </div>

              <div class="space-y-3">
                <a
                  href={`/api/auth/google/login?redirect=${encodeURIComponent(redirect)}`}
                  class="flex items-center justify-center gap-2 w-full py-2 px-3 bg-white border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with Google
                </a>

                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-200 dark:border-gray-600"></div>
                  </div>
                  <div class="relative flex justify-center text-xs">
                    <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const form = document.getElementById('parent-email-form') as HTMLElement;
                    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
                  }}
                  class="w-full text-center py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign In with Email
                </button>

                <div id="parent-email-form" style="display: none;" class="mt-3">
                  <LoginForm redirectUrl="/parent-dashboard" showTitle={false} />
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p class="text-xs text-center text-gray-600 dark:text-gray-400">
                  New parent?{" "}
                  <a href="/parent-signup" class="text-blue-600 hover:underline">
                    Create account
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div class="mt-8 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Having trouble signing in?{" "}
              <a href="/forgot-password" class="text-primary hover:underline">
                Reset your password
              </a>
              {" or "}
              <a href="/contact" class="text-primary hover:underline">
                contact support
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