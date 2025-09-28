import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserFromSession } from "../utils/session.ts";
import { getSchoolById, listSchools } from "../utils/db-helpers.ts";
import { User, School } from "../utils/db.ts";
import SettingsPanel from "../islands/SettingsPanel.tsx";
import { getAppUrl } from "../utils/url-helpers.ts";

interface SettingsData {
  user: User;
  currentSchool: School | null;
  schools: School[];
  serviceAccountEmail: string;
  publicUrl: string;
}

export const handler: Handlers<SettingsData> = {
  async GET(req, ctx) {
    const user = await getUserFromSession(req);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    const currentSchool = user.schoolId ? await getSchoolById(user.schoolId) : null;
    const schools = await listSchools();
    const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") || "bookworm-backup@flashapps-463612.iam.gserviceaccount.com";

    const appUrl = getAppUrl(req);
    const publicUrl = currentSchool && user.username
      ? `${appUrl}/${currentSchool.slug}/${user.username}`
      : "";

    return ctx.render({ user, currentSchool, schools, serviceAccountEmail, publicUrl });
  },
};

export default function SettingsPage({ data }: PageProps<SettingsData>) {
  return (
    <>
      <Head>
        <title>Settings - BookWorm</title>
      </Head>
      <div class="min-h-screen flex flex-col">
        <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
              <a
                href="/dashboard"
                class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </header>

        <main class="flex-1 container mx-auto px-4 py-8">
          <div class="max-w-4xl mx-auto space-y-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>

            <SettingsPanel
              user={data.user}
              currentSchool={data.currentSchool}
              schools={data.schools}
              serviceAccountEmail={data.serviceAccountEmail}
              publicUrl={data.publicUrl}
            />
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