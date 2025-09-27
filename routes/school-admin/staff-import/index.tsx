import { Handlers, PageProps } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { User } from "../../../utils/db.ts";
import StaffImport from "../../../islands/StaffImport.tsx";

interface StaffImportPageData {
  user: User;
}

export const handler: Handlers<StaffImportPageData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user || (!isSchoolAdmin(user) && !isSuperAdmin(user))) {
      return new Response("Unauthorized", {
        status: 302,
        headers: { Location: "/" },
      });
    }

    if (isSchoolAdmin(user) && !user.schoolId) {
      return new Response("School admin must be assigned to a school", {
        status: 302,
        headers: { Location: "/dashboard" },
      });
    }

    return ctx.render({ user });
  },
};

export default function StaffImportPage({ data }: PageProps<StaffImportPageData>) {
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Import Teaching Staff
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Create placeholder accounts for teachers in your school
          </p>
        </div>

        <StaffImport schoolId={data.user.schoolId || undefined} />

        <div class="mt-6">
          <a
            href="/dashboard"
            class="text-primary hover:text-primary-dark dark:text-primary-light font-semibold"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}