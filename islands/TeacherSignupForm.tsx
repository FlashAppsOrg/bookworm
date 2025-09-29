import { useState } from "preact/hooks";
import { School } from "../utils/db.ts";

interface Props {
  schools: School[];
  redirect: string;
}

export default function TeacherSignupForm({ schools, redirect }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [schoolId, setSchoolId] = useState(schools[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Validate school email domain if school has a domain
    const selectedSchool = schools.find(s => s.id === schoolId);
    if (selectedSchool?.domain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain !== selectedSchool.domain) {
        setError(`Please use your school email address ending in @${selectedSchool.domain}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/teacher-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          schoolId,
          redirect,
        }),
      });

      if (res.ok) {
        // Redirect to dashboard after successful signup
        window.location.href = redirect || "/dashboard";
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Name <span class="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
          required
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="e.g., Mrs. Smith"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          School <span class="text-red-600">*</span>
        </label>
        <select
          value={schoolId}
          onChange={(e) => setSchoolId((e.target as HTMLSelectElement).value)}
          required
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        >
          {schools.map(school => (
            <option key={school.id} value={school.id}>
              {school.name}
              {school.domain && ` (@${school.domain})`}
            </option>
          ))}
        </select>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Don't see your school? Contact your administrator to add it.
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          School Email Address <span class="text-red-600">*</span>
        </label>
        <input
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          required
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="teacher@school.edu"
        />
        {schools.find(s => s.id === schoolId)?.domain && (
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Must be your @{schools.find(s => s.id === schoolId)?.domain} email address
          </p>
        )}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password <span class="text-red-600">*</span>
        </label>
        <input
          type="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          required
          minLength={8}
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          At least 8 characters
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password <span class="text-red-600">*</span>
        </label>
        <input
          type="password"
          value={confirmPassword}
          onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
          required
          minLength={8}
          class="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div class="pt-4">
        <button
          type="submit"
          disabled={submitting}
          class="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating Account..." : "Create Teacher Account"}
        </button>
      </div>

      <p class="text-center text-sm text-gray-600 dark:text-gray-400">
        By creating an account, you agree to our{" "}
        <a href="/terms" class="text-primary hover:underline">Terms of Service</a>
        {" and "}
        <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>
      </p>
    </form>
  );
}