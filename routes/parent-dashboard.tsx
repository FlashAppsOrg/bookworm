import { Handlers, PageProps } from "$fresh/server.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getKv, BookChallenge, User } from "../utils/db.ts";
import { Head } from "$fresh/runtime.ts";
import ParentDashboard from "../islands/ParentDashboard.tsx";

interface ParentDashboardData {
  user: User;
  challenges: BookChallenge[];
}

export const handler: Handlers<ParentDashboardData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response("", {
        status: 302,
        headers: { Location: "/login?redirect=/parent-dashboard" },
      });
    }

    if (user.role !== "parent") {
      return new Response("Access denied", { status: 403 });
    }

    const kv = await getKv();
    const challenges: BookChallenge[] = [];

    // Get all challenges submitted by this parent
    const challengeEntries = kv.list<BookChallenge>({ prefix: ["challenges", "id"] });

    for await (const entry of challengeEntries) {
      const challenge = entry.value;
      if (challenge.parentId === user.id || challenge.parentEmail === user.email.toLowerCase()) {
        challenges.push(challenge);
      }
    }

    // Sort by creation date, newest first
    challenges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ctx.render({
      user,
      challenges,
    });
  },
};

export default function ParentDashboardPage({ data }: PageProps<ParentDashboardData>) {
  const { user, challenges } = data;

  return (
    <>
      <Head>
        <title>Parent Dashboard - BookWorm</title>
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div class="container mx-auto p-4 py-8 max-w-6xl">
          <ParentDashboard
            user={user}
            challenges={challenges}
          />
        </div>
      </div>
    </>
  );
}