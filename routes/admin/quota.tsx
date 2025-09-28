import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../../utils/session.ts";
import { User } from "../../utils/db.ts";
import AdminHeader from "../../islands/AdminHeader.tsx";
import QuotaMonitor from "../../islands/QuotaMonitor.tsx";

interface QuotaPageData {
  user: User;
}

export const handler: Handlers<QuotaPageData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    if (user.role !== "super_admin") {
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard" },
      });
    }

    return ctx.render({ user });
  },
};

export default function AdminQuotaPage({ data }: PageProps<QuotaPageData>) {
  return (
    <>
      <Head>
        <title>API Quota Monitor - BookWorm Admin</title>
      </Head>
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <AdminHeader user={data.user} />

        <main class="flex-1 container mx-auto px-4 py-8">
          <div class="max-w-6xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Google Books API Quota Monitor
            </h1>

            <QuotaMonitor />
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