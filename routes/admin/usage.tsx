import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../../utils/session.ts";
import UsageStats from "../../islands/UsageStats.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    const adminEmails = Deno.env.get("ADMIN_EMAILS")?.split(",").map(e => e.trim().toLowerCase()) || [];
    const isAdmin = adminEmails.includes(user.email.toLowerCase());

    if (!isAdmin) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard" },
      });
    }

    return ctx.render();
  },
};

export default function AdminUsagePage() {
  return (
    <>
      <Head>
        <title>System Usage - BookWorm Admin</title>
      </Head>
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm Admin</a>
              <div class="flex gap-4">
                <a
                  href="/dashboard"
                  class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/settings"
                  class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  Settings
                </a>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 container mx-auto px-4 py-8">
          <div class="max-w-6xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              System Usage Dashboard
            </h1>

            <UsageStats />
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