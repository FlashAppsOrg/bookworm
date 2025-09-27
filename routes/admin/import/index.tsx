import { Handlers, PageProps } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { User } from "../../../utils/db.ts";
import BulkImport from "../../../islands/BulkImport.tsx";

interface ImportPageData {
  user: User;
}

export const handler: Handlers<ImportPageData> = {
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

export default function ImportPage({ data }: PageProps<ImportPageData>) {
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bulk Data Import
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Import schools, teachers, and classroom books from CSV files
          </p>
        </div>

        <BulkImport />

        <div class="mt-6">
          <a
            href="/admin"
            class="text-primary hover:text-primary-dark dark:text-primary-light font-semibold"
          >
            ← Back to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}