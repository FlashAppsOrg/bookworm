import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { User } from "../../../utils/db.ts";
import AdminHeader from "../../../islands/AdminHeader.tsx";
import SchoolManagement from "../../../islands/SchoolManagement.tsx";

interface SchoolsPageData {
  user: User;
}

export const handler: Handlers<SchoolsPageData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user || !isSuperAdmin(user)) {
      return new Response("Unauthorized", {
        status: 302,
        headers: { Location: "/" },
      });
    }

    return ctx.render({ user });
  },
};

export default function SchoolsPage({ data }: PageProps<SchoolsPageData>) {
  return (
    <>
      <Head>
        <title>School Management - BookWorm Admin</title>
      </Head>
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <AdminHeader user={data.user} />
        <main class="flex-1">
          <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                School Management
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                Create and manage schools in the system
              </p>
            </div>

            <SchoolManagement />
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