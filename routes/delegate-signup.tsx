import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getKv, Invitation } from "../utils/db.ts";
import DelegateSignupForm from "../islands/DelegateSignupForm.tsx";

interface DelegateSignupData {
  invitation: Invitation | null;
  error?: string;
}

export const handler: Handlers<DelegateSignupData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return ctx.render({ invitation: null, error: "Missing invitation token" });
    }

    const kv = await getKv();
    const result = await kv.get<Invitation>(["invitations", token]);

    if (!result.value) {
      return ctx.render({ invitation: null, error: "Invalid invitation" });
    }

    const invitation = result.value;

    if (invitation.used) {
      return ctx.render({ invitation: null, error: "This invitation has already been used" });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return ctx.render({ invitation: null, error: "This invitation has expired" });
    }

    return ctx.render({ invitation });
  },
};

export default function DelegateSignupPage({ data }: PageProps<DelegateSignupData>) {
  return (
    <>
      <Head>
        <title>Join as Delegate - BookWorm</title>
      </Head>
      <div class="min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/20 via-white to-secondary/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header class="bg-white dark:bg-gray-800 shadow-md transition-colors">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-center h-16">
              <a href="/" class="text-2xl font-bold text-primary">BookWorm</a>
            </div>
          </div>
        </header>

        <main class="flex-1 flex items-center justify-center px-4 py-8">
          <div class="w-full max-w-md">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
              {data.error ? (
                <div>
                  <div class="text-6xl mb-4 text-center">❌</div>
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                    Invalid Invitation
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
                    {data.error}
                  </p>
                  <a
                    href="/"
                    class="block w-full text-center px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
                  >
                    Go to Home
                  </a>
                </div>
              ) : data.invitation ? (
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                    Join as Helper
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
                    {data.invitation.teacherName} has invited you to help catalog their classroom books
                  </p>
                  <DelegateSignupForm invitation={data.invitation} />
                </div>
              ) : null}
            </div>
          </div>
        </main>

        <footer class="text-center py-4">
          <div class="flex flex-col items-center">
            <div class="relative w-full max-w-xs md:max-w-md px-4">
              <div class="text-lg md:text-2xl font-bold text-primary dark:text-primary-light absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
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