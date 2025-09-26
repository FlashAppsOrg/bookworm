import { Head } from "$fresh/runtime.ts";

export default function ForgotPasswordPage() {
  return (
    <>
      <Head>
        <title>Forgot Password - BookWorm</title>
      </Head>
      <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-white to-secondary/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-primary mb-2">BookWorm</h1>
            <p class="text-gray-600 dark:text-gray-400">Reset your password</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
            <form id="forgot-password-form" class="space-y-6">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div id="message" class="hidden text-sm"></div>

              <button
                type="submit"
                class="w-full px-4 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Reset Link
              </button>

              <div class="text-center">
                <a href="/login" class="text-sm text-primary hover:text-primary-dark font-medium">
                  ← Back to Login
                </a>
              </div>
            </form>
          </div>
        </div>

        <footer class="mt-8">
          <div class="flex flex-col items-center">
            <div class="relative w-64">
              <div class="text-sm font-bold text-primary dark:text-primary-light absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                BookWorm by
              </div>
              <img src="/flash-apps-horizontal.svg" alt="FlashApps" class="w-full" />
            </div>
          </div>
        </footer>
      </div>

      <script type="module" dangerouslySetInnerHTML={{
        __html: `
          const form = document.getElementById('forgot-password-form');
          const messageDiv = document.getElementById('message');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            messageDiv.classList.add('hidden');

            const formData = new FormData(form);
            const email = formData.get('email');

            try {
              const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });

              const data = await response.json();

              messageDiv.classList.remove('hidden');
              if (response.ok) {
                messageDiv.className = 'text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded';
                messageDiv.textContent = data.message;
                form.reset();
              } else {
                messageDiv.className = 'text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded';
                messageDiv.textContent = data.error || 'Failed to send reset link';
              }
            } catch (error) {
              messageDiv.classList.remove('hidden');
              messageDiv.className = 'text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded';
              messageDiv.textContent = 'Network error. Please try again.';
            } finally {
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }
          });
        `
      }} />
    </>
  );
}