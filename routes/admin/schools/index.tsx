import { Handlers, PageProps } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { User } from "../../../utils/db.ts";
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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-6">
          <a
            href="/admin"
            class="text-primary hover:text-primary-dark dark:text-primary-light font-semibold"
          >
            ← Back to Admin Dashboard
          </a>
        </div>

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
    </div>
  );
}