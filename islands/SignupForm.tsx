import { useState } from "preact/hooks";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        if (data.error === "Email already registered") {
          setShowResend(true);
        }
        return;
      }

      setSuccess(true);
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

      setSuccess(true);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div class="text-center space-y-4">
        <div class="text-6xl">✉️</div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Check Your Email!
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          We've sent a verification link to <strong>{email}</strong>
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Click the link in the email to verify your account and get started.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error && (
        <div class="bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg text-sm">
          {error}
          {showResend && (
            <button
              type="button"
              onClick={handleResend}
              class="mt-2 text-primary hover:text-primary-dark underline font-semibold"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
          placeholder="Ms. Davis"
          required
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="teacher@school.edu"
          required
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          If your school uses BookWorm, you'll be automatically assigned to it
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-3 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating Account..." : "Sign Up"}
      </button>
    </form>
  );
}