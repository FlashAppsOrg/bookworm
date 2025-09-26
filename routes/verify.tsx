import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

interface VerifyData {
  token: string | null;
}

export const handler: Handlers<VerifyData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    return ctx.render({ token });
  },
};

export default function VerifyPage({ data }: PageProps<VerifyData>) {
  return (
    <>
      <Head>
        <title>Verify Email - BookWorm</title>
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
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors text-center">
              {data.token ? (
                <div id="verify-content">
                  <div class="text-6xl mb-4">⏳</div>
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Verifying your email...
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400">
                    Please wait while we verify your account.
                  </p>
                </div>
              ) : (
                <div>
                  <div class="text-6xl mb-4">❌</div>
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Invalid Link
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400 mb-6">
                    This verification link is invalid or missing.
                  </p>
                  <a
                    href="/signup"
                    class="inline-block px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
                  >
                    Back to Sign Up
                  </a>
                </div>
              )}
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

      {data.token && (
        <script dangerouslySetInnerHTML={{
          __html: `
            (async function() {
              try {
                const response = await fetch('/api/auth/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: '${data.token}' })
                });

                const data = await response.json();
                const content = document.getElementById('verify-content');

                if (response.ok) {
                  content.innerHTML = \`
                    <div class="text-6xl mb-4">✅</div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Email Verified!
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                      Your account has been verified. You can now log in.
                    </p>
                    <a href="/login" class="inline-block px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all">
                      Go to Login
                    </a>
                  \`;
                } else {
                  content.innerHTML = \`
                    <div class="text-6xl mb-4">❌</div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Verification Failed
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                      \${data.error || 'Could not verify your email'}
                    </p>
                    <a href="/signup" class="inline-block px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all">
                      Back to Sign Up
                    </a>
                  \`;
                }
              } catch (error) {
                console.error('Verification error:', error);
                const content = document.getElementById('verify-content');
                content.innerHTML = \`
                  <div class="text-6xl mb-4">⚠️</div>
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Something Went Wrong
                  </h1>
                  <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Please try again or contact support.
                  </p>
                \`;
              }
            })();
          `
        }} />
      )}
    </>
  );
}