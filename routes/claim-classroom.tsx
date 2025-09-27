import { Handlers, PageProps } from "$fresh/server.ts";
import { getUserFromSession } from "../utils/session.ts";
import { User } from "../utils/db.ts";
import ClaimClassroom from "../islands/ClaimClassroom.tsx";

interface ClaimPageData {
  user: User;
}

export const handler: Handlers<ClaimPageData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    if (!user.verified) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/verify" },
      });
    }

    if (!user.schoolId) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/setup" },
      });
    }

    if (user.role !== "teacher") {
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard" },
      });
    }

    return ctx.render({ user });
  },
};

export default function ClaimPage({ data }: PageProps<ClaimPageData>) {
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Claim Your Classroom
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Find and claim your imported classroom account
          </p>
        </div>

        <ClaimClassroom />

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