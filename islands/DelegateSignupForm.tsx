import { useState } from "preact/hooks";
import { Invitation } from "../utils/db.ts";

interface Props {
  invitation: Invitation;
}

export default function DelegateSignupForm({ invitation }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(invitation.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: invitation.token,
          displayName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // Redirect to login
      window.location.href = `/login?message=${encodeURIComponent("Account created! Please log in.")}`;
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error && (
        <div class="bg-error/10 border-2 border-error text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={displayName}
          onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
          placeholder="John Smith"
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
          required
          class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This should match the email the invitation was sent to
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
        {loading ? "Creating Account..." : "Join as Helper"}
      </button>
    </form>
  );
}