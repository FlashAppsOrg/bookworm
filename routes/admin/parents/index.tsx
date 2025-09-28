import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { User } from "../../../utils/db.ts";
import AdminHeader from "../../../islands/AdminHeader.tsx";
import ParentVerification from "../../../islands/ParentVerification.tsx";

interface ParentPageData {
  user: User;
}

export const handler: Handlers<ParentPageData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);
    if (!user || (!isSchoolAdmin(user) && !isSuperAdmin(user))) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard" },
      });
    }

    return ctx.render({ user });
  },
};

export default function ParentManagementPage({ data }: PageProps<ParentPageData>) {
  return (
    <>
      <Head>
        <title>Parent Management - BookWorm Admin</title>
      </Head>
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader user={data.user} />

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Parent Account Management
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Verify parent-student relationships and manage parent accounts
            </p>
          </div>

          <ParentVerification user={data.user} />
        </main>
      </div>
    </>
  );
}