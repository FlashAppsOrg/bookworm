import { useState } from "preact/hooks";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        if (data.error && data.error.includes("verify")) {
          setShowResend(true);
        }
        return;
      }

      // Redirect based on user setup status
      if (!data.user.schoolId) {
        window.location.href = "/setup";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend email");
        return;
      }

      setResendSuccess(true);
      setShowResend(false);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {resendSuccess && (
        <div class="bg-primary/10 border-2 border-primary text-primary px-4 py-3 rounded-lg text-sm">
          Verification email sent! Please check your inbox.
        </div>
      )}

      {error && (
        <div class="bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg text-sm">
          {error}
          {showResend && (
            <button
              type="button"
              onClick={handleResend}
              class="mt-2 text-primary hover:text-primary-dark underline font-semibold block"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="teacher@wcpss.net"
          required
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          placeholder="Enter your password"
          required
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-3 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}