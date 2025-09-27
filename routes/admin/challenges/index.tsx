import { Handlers, PageProps } from "$fresh/server.ts";
import { getUserFromSession } from "../../../utils/session.ts";
import { isSchoolAdmin, isSuperAdmin } from "../../../utils/auth-helpers.ts";
import { User } from "../../../utils/db.ts";
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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
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
    </div>
  );
}