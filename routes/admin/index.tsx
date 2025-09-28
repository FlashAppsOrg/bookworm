import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../../utils/session.ts";
import { isSuperAdmin } from "../../utils/auth-helpers.ts";
import { getKv, School, User } from "../../utils/db.ts";
import AdminHeader from "../../islands/AdminHeader.tsx";

interface AdminDashboardData {
  user: User;
  stats: {
    totalSchools: number;
    totalTeachers: number;
    totalDelegates: number;
    totalAdmins: number;
  };
}

export const handler: Handlers<AdminDashboardData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user || !isSuperAdmin(user)) {
      return new Response("Unauthorized", {
        status: 302,
        headers: { Location: "/" },
      });
    }

    const kv = await getKv();

    let totalSchools = 0;
    let totalTeachers = 0;
    let totalDelegates = 0;
    let totalAdmins = 0;

    const schoolEntries = kv.list<School>({ prefix: ["schools:id"] });
    for await (const _entry of schoolEntries) {
      totalSchools++;
    }

    const userEntries = kv.list<User>({ prefix: ["users:id"] });
    for await (const entry of userEntries) {
      const u = entry.value;
      if (u.role === "teacher") totalTeachers++;
      else if (u.role === "delegate") totalDelegates++;
      else if (u.role === "school_admin" || u.role === "super_admin") totalAdmins++;
    }

    return ctx.render({
      user,
      stats: {
        totalSchools,
        totalTeachers,
        totalDelegates,
        totalAdmins,
      },
    });
  },
};

export default function AdminDashboard({ data }: PageProps<AdminDashboardData>) {
  const { user, stats } = data;

  return (
    <>
      <Head>
        <title>Super Admin Dashboard - BookWorm</title>
      </Head>
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <AdminHeader user={user} />

        <main class="flex-1">
          <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Super Admin Dashboard
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Welcome back, {user.displayName}
          </p>
        </div>

        <div class="grid md:grid-cols-4 gap-6 mb-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="text-3xl mb-2">🏫</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalSchools}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Schools</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="text-3xl mb-2">👨‍🏫</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalTeachers}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Teachers</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="text-3xl mb-2">🤝</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalDelegates}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Delegates</div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="text-3xl mb-2">⚙️</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalAdmins}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Admins</div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a
            href="/admin/schools"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block"
          >
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Manage Schools
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  Create, edit, and delete schools
                </p>
              </div>
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <a
            href="/admin/users"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block"
          >
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Manage Users
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  View and manage all users
                </p>
              </div>
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <a
            href="/admin/classrooms"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block"
          >
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Browse Classrooms
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  View all books across all schools
                </p>
              </div>
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <a
            href="/admin/import"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block"
          >
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Bulk Import
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  Import schools, teachers, and books
                </p>
              </div>
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <a
            href="/admin/quota"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block"
          >
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  API Quota Monitor
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  Track Google Books API usage
                </p>
              </div>
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
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