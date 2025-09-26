import { Head } from "$fresh/runtime.ts";
import LoginForm from "../islands/LoginForm.tsx";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Log In - BookWorm</title>
      </Head>
      <div class="min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/20 via-white to-secondary/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <a
                href="/signup"
                class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                Sign Up
              </a>
            </div>
          </div>
        </header>

        <main class="flex-1 flex items-center justify-center px-4 py-8">
          <div class="w-full max-w-md">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Welcome Back
              </h1>
              <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
                Log in to manage your classroom books
              </p>
              <LoginForm />
            </div>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Don't have an account?{" "}
              <a href="/signup" class="text-primary hover:text-primary-dark font-semibold">
                Sign up
              </a>
            </p>
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