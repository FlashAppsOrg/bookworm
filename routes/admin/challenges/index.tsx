import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { User } from "../../../utils/db.ts";
import AdminHeader from "../../../islands/AdminHeader.tsx";
import ChallengeReview from "../../../islands/ChallengeReview.tsx";

interface ChallengePageData {
  user: User;
}

export const handler: Handlers<ChallengePageData> = {
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

export default function AdminChallengesPage({ data }: PageProps<ChallengePageData>) {
  return (
    <>
      <Head>
        <title>Book Challenges - BookWorm Admin</title>
      </Head>
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <AdminHeader user={data.user} />
        <main class="flex-1">
          <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Book Challenges
              </h1>
              <p class="text-gray-600 dark:text-gray-400">
                Review and manage book challenges submitted by parents
              </p>
            </div>

            <ChallengeReview isSuperAdmin={isSuperAdmin(data.user)} />
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