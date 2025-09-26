import { Head } from "$fresh/runtime.ts";
import SettingsPanel from "../islands/SettingsPanel.tsx";

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Settings - BookWorm</title>
      </Head>
      <div class="min-h-screen flex flex-col">
        <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <a
                href="/"
                class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                ← Back
              </a>
            </div>
          </div>
        </header>

        <main class="flex-1 container mx-auto px-4 py-8">
          <div class="max-w-2xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Settings
            </h1>
            <SettingsPanel />
          </div>
        </main>

        <footer class="text-center py-8">
          <div class="flex flex-col items-center">
            <div class="relative w-full max-w-md px-4">
              <div class="text-2xl font-bold text-primary dark:text-primary-light absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
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